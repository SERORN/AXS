"""
AXS360 Production Backend - Main Application Entry Point
FastAPI + PostgreSQL + Redis + Comprehensive Production Features
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import logging
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, create_db_and_tables
from app.core.redis_client import redis_client
from app.api.v1.api import api_router
from app.core.security import get_current_user
from app.core.exceptions import (
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    NotFoundException,
    RateLimitException
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting AXS360 API Server...")
    
    # Initialize database
    await create_db_and_tables()
    logger.info("Database initialized successfully")
    
    # Test Redis connection
    try:
        await redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
    
    logger.info("AXS360 API Server started successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down AXS360 API Server...")
    await redis_client.close()
    logger.info("AXS360 API Server shut down successfully")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AXS360 - Premium Vehicle Access Management Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else ["axs360.com", "*.axs360.com", "localhost"]
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Rate Limiting Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        try:
            current = await redis_client.get(key)
            if current is None:
                await redis_client.setex(key, 60, 1)
            else:
                current_count = int(current)
                if current_count >= settings.RATE_LIMIT_PER_MINUTE:
                    raise RateLimitException("Rate limit exceeded")
                await redis_client.incr(key)
        except Exception as e:
            if isinstance(e, RateLimitException):
                raise
            logger.warning(f"Rate limiting error: {e}")
    
    return await call_next(request)

# Exception Handlers
@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation Error",
            "message": str(exc),
            "details": exc.details if hasattr(exc, 'details') else None
        }
    )

@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    return JSONResponse(
        status_code=401,
        content={
            "error": "Authentication Error",
            "message": str(exc)
        }
    )

@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    return JSONResponse(
        status_code=403,
        content={
            "error": "Authorization Error",
            "message": str(exc)
        }
    )

@app.exception_handler(NotFoundException)
async def not_found_exception_handler(request: Request, exc: NotFoundException):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": str(exc)
        }
    )

@app.exception_handler(RateLimitException)
async def rate_limit_exception_handler(request: Request, exc: RateLimitException):
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate Limit Exceeded",
            "message": str(exc)
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }
    )

# Static files for uploaded content
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API Routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring"""
    try:
        # Check database
        from app.core.database import async_session
        async with async_session() as session:
            await session.execute("SELECT 1")
        
        # Check Redis
        await redis_client.ping()
        
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "version": "1.0.0",
            "services": {
                "database": "healthy",
                "redis": "healthy"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": time.time(),
                "error": str(e)
            }
        )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to AXS360 API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4
    )
