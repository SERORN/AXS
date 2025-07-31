"""
Security utilities for AXS360 API
JWT token handling, password hashing, and authentication
"""

from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
import string

from app.core.config import settings
from app.core.redis_client import redis_client

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token security
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def generate_secure_token(length: int = 32) -> str:
    """Generate cryptographically secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

async def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify refresh token and check if blacklisted"""
    payload = verify_token(token, "refresh")
    if not payload:
        return None
    
    # Check if token is blacklisted
    token_id = payload.get("jti")
    if token_id:
        is_blacklisted = await redis_client.exists(f"blacklist:{token_id}")
        if is_blacklisted:
            return None
    
    return payload

async def blacklist_token(token: str):
    """Add token to blacklist"""
    payload = verify_token(token)
    if payload:
        token_id = payload.get("jti", token)
        exp = payload.get("exp")
        if exp:
            # Calculate remaining TTL
            current_time = datetime.utcnow().timestamp()
            ttl = max(0, int(exp - current_time))
            await redis_client.setex(f"blacklist:{token_id}", ttl, "1")

class AuthenticationException(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class AuthorizationException(HTTPException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise AuthenticationException()
    
    # Check if token is blacklisted
    token_id = payload.get("jti")
    if token_id:
        is_blacklisted = await redis_client.exists(f"blacklist:{token_id}")
        if is_blacklisted:
            raise AuthenticationException("Token has been revoked")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException()
    
    # Get user from database
    from app.crud.user import get_user_by_id
    from app.core.database import get_async_session
    
    async with get_async_session() as session:
        user = await get_user_by_id(session, int(user_id))
        if not user:
            raise AuthenticationException("User not found")
        
        if not user.is_active:
            raise AuthenticationException("User account is disabled")
        
        return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """Dependency to get current active user"""
    if not current_user.is_active:
        raise AuthenticationException("User account is disabled")
    return current_user

async def get_current_admin_user(current_user = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.role != "admin":
        raise AuthorizationException("Admin access required")
    return current_user

async def get_current_staff_user(current_user = Depends(get_current_user)):
    """Dependency to require staff or admin role"""
    if current_user.role not in ["admin", "staff"]:
        raise AuthorizationException("Staff access required")
    return current_user

def require_permissions(*permissions: str):
    """Decorator to require specific permissions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise AuthenticationException()
            
            user_permissions = current_user.permissions or []
            if not all(perm in user_permissions for perm in permissions):
                raise AuthorizationException(
                    f"Required permissions: {', '.join(permissions)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Rate limiting utilities
async def check_rate_limit(key: str, limit: int, window: int) -> bool:
    """Check if rate limit is exceeded"""
    current = await redis_client.get(key)
    if current is None:
        await redis_client.setex(key, window, 1)
        return True
    
    current_count = int(current)
    if current_count >= limit:
        return False
    
    await redis_client.incr(key)
    return True

async def get_rate_limit_info(key: str) -> dict:
    """Get rate limit information"""
    current = await redis_client.get(key)
    ttl = await redis_client.ttl(key) if current else 0
    
    return {
        "current": int(current) if current else 0,
        "ttl": ttl
    }

# OTP utilities
async def generate_otp_code(phone: str) -> str:
    """Generate and store OTP code"""
    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    key = f"otp:{phone}"
    
    # Store OTP for 5 minutes
    await redis_client.setex(key, 300, code)
    
    return code

async def verify_otp_code(phone: str, code: str) -> bool:
    """Verify OTP code"""
    key = f"otp:{phone}"
    stored_code = await redis_client.get(key)
    
    if not stored_code or stored_code != code:
        return False
    
    # Delete OTP after successful verification
    await redis_client.delete(key)
    return True

async def check_otp_attempts(phone: str) -> bool:
    """Check OTP attempt rate limiting"""
    key = f"otp_attempts:{phone}"
    return await check_rate_limit(key, 5, 3600)  # 5 attempts per hour
