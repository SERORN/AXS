# QR Code Generation Service
# Handles QR code creation, validation, and token management

import qrcode
import jwt
import base64
import io
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import uuid
import redis
import json

from ..core.config import settings
from ..database import get_redis

# QR Code configuration
QR_CODE_CONFIG = {
    "version": 1,
    "error_correction": qrcode.constants.ERROR_CORRECT_L,
    "box_size": 10,
    "border": 4,
    "fill_color": "black",
    "back_color": "white"
}

async def generate_access_qr(
    business_id: str,
    visitor_id: str,
    vehicle_id: Optional[str] = None,
    valid_until: Optional[datetime] = None,
    access_type: str = "single_use",
    visit_purpose: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate QR code for business access
    Returns QR image and access token
    """
    
    # Set default validity (4 hours from now)
    if not valid_until:
        valid_until = datetime.utcnow() + timedelta(hours=4)
    
    # Create access token
    access_token = str(uuid.uuid4())
    
    # Token payload
    token_payload = {
        "access_token": access_token,
        "business_id": business_id,
        "visitor_id": visitor_id,
        "vehicle_id": vehicle_id,
        "access_type": access_type,
        "visit_purpose": visit_purpose,
        "issued_at": datetime.utcnow().isoformat(),
        "expires_at": valid_until.isoformat()
    }
    
    # Create JWT token for QR data
    jwt_token = jwt.encode(
        token_payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    
    # QR data URL
    qr_data = f"{settings.APP_URL}/access/verify/{access_token}"
    
    # Generate QR code image
    qr = qrcode.QRCode(**QR_CODE_CONFIG)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create QR image
    qr_image = qr.make_image(
        fill_color=QR_CODE_CONFIG["fill_color"],
        back_color=QR_CODE_CONFIG["back_color"]
    )
    
    # Convert to base64
    img_buffer = io.BytesIO()
    qr_image.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    
    # Store token in Redis for quick validation
    redis_client = get_redis()
    token_data = {
        "business_id": business_id,
        "visitor_id": visitor_id,
        "vehicle_id": vehicle_id,
        "access_type": access_type,
        "visit_purpose": visit_purpose,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": valid_until.isoformat(),
        "is_used": False,
        "use_count": 0
    }
    
    # Store with expiration
    expire_seconds = int((valid_until - datetime.utcnow()).total_seconds())
    await redis_client.setex(
        f"qr_token:{access_token}",
        expire_seconds,
        json.dumps(token_data)
    )
    
    return {
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "qr_data": qr_data,
        "access_token": access_token,
        "jwt_token": jwt_token,
        "valid_until": valid_until,
        "expires_in_seconds": expire_seconds
    }

async def validate_qr_token(access_token: str) -> Optional[Dict[str, Any]]:
    """
    Validate QR access token
    Returns token data if valid, None if invalid/expired
    """
    
    redis_client = get_redis()
    
    # Get token from Redis
    token_key = f"qr_token:{access_token}"
    token_data_str = await redis_client.get(token_key)
    
    if not token_data_str:
        return None
    
    try:
        token_data = json.loads(token_data_str)
        
        # Check expiration
        expires_at = datetime.fromisoformat(token_data["expires_at"])
        if datetime.utcnow() > expires_at:
            # Token expired, remove from Redis
            await redis_client.delete(token_key)
            return None
        
        # Check if single-use token already used
        if token_data["access_type"] == "single_use" and token_data["is_used"]:
            return None
        
        return token_data
        
    except (json.JSONDecodeError, KeyError, ValueError):
        return None

async def mark_token_used(access_token: str) -> bool:
    """
    Mark QR token as used
    Returns True if successful, False if token invalid
    """
    
    redis_client = get_redis()
    token_key = f"qr_token:{access_token}"
    
    token_data_str = await redis_client.get(token_key)
    if not token_data_str:
        return False
    
    try:
        token_data = json.loads(token_data_str)
        token_data["is_used"] = True
        token_data["use_count"] += 1
        token_data["last_used"] = datetime.utcnow().isoformat()
        
        # Update in Redis
        await redis_client.set(token_key, json.dumps(token_data))
        return True
        
    except (json.JSONDecodeError, KeyError):
        return False

async def generate_business_qr(business_id: str) -> Dict[str, Any]:
    """
    Generate QR code for business registration/info
    Used for quick business access setup
    """
    
    # Business QR data
    qr_data = f"{settings.APP_URL}/business/{business_id}/info"
    
    # Generate QR code
    qr = qrcode.QRCode(**QR_CODE_CONFIG)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    qr_image = qr.make_image(
        fill_color="#2563eb",  # Blue color for business QR
        back_color="white"
    )
    
    # Convert to base64
    img_buffer = io.BytesIO()
    qr_image.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    
    return {
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "qr_url": qr_data,
        "business_id": business_id,
        "expires_at": None  # Business QR codes don't expire
    }

async def verify_jwt_token(jwt_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token from QR code
    Returns payload if valid, None if invalid
    """
    
    try:
        payload = jwt.decode(
            jwt_token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        
        # Check expiration
        expires_at = datetime.fromisoformat(payload["expires_at"])
        if datetime.utcnow() > expires_at:
            return None
        
        return payload
        
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None

async def generate_checkout_qr(
    business_id: str,
    visitor_id: str,
    checkin_log_id: str
) -> Dict[str, Any]:
    """
    Generate checkout QR for visitors who checked in
    Allows easy checkout process
    """
    
    # Checkout valid for 24 hours
    valid_until = datetime.utcnow() + timedelta(hours=24)
    
    checkout_token = str(uuid.uuid4())
    
    # Checkout token payload
    token_payload = {
        "checkout_token": checkout_token,
        "business_id": business_id,
        "visitor_id": visitor_id,
        "checkin_log_id": checkin_log_id,
        "access_type": "checkout_only",
        "issued_at": datetime.utcnow().isoformat(),
        "expires_at": valid_until.isoformat()
    }
    
    # Generate JWT
    jwt_token = jwt.encode(
        token_payload,
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    
    # QR data
    qr_data = f"{settings.APP_URL}/access/checkout/{checkout_token}"
    
    # Generate QR image
    qr = qrcode.QRCode(**QR_CODE_CONFIG)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    qr_image = qr.make_image(
        fill_color="#dc2626",  # Red color for checkout
        back_color="white"
    )
    
    # Convert to base64
    img_buffer = io.BytesIO()
    qr_image.save(img_buffer, format="PNG")
    img_buffer.seek(0)
    qr_base64 = base64.b64encode(img_buffer.getvalue()).decode()
    
    # Store in Redis
    redis_client = get_redis()
    expire_seconds = int((valid_until - datetime.utcnow()).total_seconds())
    
    await redis_client.setex(
        f"checkout_token:{checkout_token}",
        expire_seconds,
        json.dumps(token_payload)
    )
    
    return {
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "qr_data": qr_data,
        "checkout_token": checkout_token,
        "jwt_token": jwt_token,
        "valid_until": valid_until
    }

async def get_qr_analytics(business_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Get QR code usage analytics for a business
    """
    
    redis_client = get_redis()
    
    # Get all QR tokens for business (from last 30 days)
    pattern = f"qr_token:*"
    keys = await redis_client.keys(pattern)
    
    total_generated = 0
    total_used = 0
    usage_by_day = {}
    
    for key in keys:
        token_data_str = await redis_client.get(key)
        if token_data_str:
            try:
                token_data = json.loads(token_data_str)
                if token_data.get("business_id") == business_id:
                    total_generated += 1
                    if token_data.get("is_used"):
                        total_used += 1
                    
                    # Count by day
                    created_date = datetime.fromisoformat(token_data["created_at"]).date()
                    day_str = created_date.isoformat()
                    usage_by_day[day_str] = usage_by_day.get(day_str, 0) + 1
                    
            except (json.JSONDecodeError, KeyError):
                continue
    
    usage_rate = (total_used / total_generated * 100) if total_generated > 0 else 0
    
    return {
        "total_qr_generated": total_generated,
        "total_qr_used": total_used,
        "usage_rate_percentage": round(usage_rate, 2),
        "daily_usage": usage_by_day,
        "period_days": days
    }
