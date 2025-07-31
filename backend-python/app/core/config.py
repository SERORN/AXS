"""
Core configuration module for AXS360 API
Handles environment variables and application settings
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    # Database Configuration
    DATABASE_URL: str = "postgresql://axs_user:password@localhost:5432/axs360_db"
    TEST_DATABASE_URL: str = "postgresql://axs_user:password@localhost:5432/axs360_test"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key-256-bits-long-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AXS360 API"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://axs360.vercel.app"
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = "sk_test_your_stripe_secret_key"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_your_stripe_publishable_key"
    STRIPE_WEBHOOK_SECRET: str = "whsec_your_webhook_secret"
    
    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = "your_twilio_account_sid"
    TWILIO_AUTH_TOKEN: str = "your_twilio_auth_token"
    TWILIO_PHONE_NUMBER: str = "+1234567890"
    
    # SendGrid Configuration
    SENDGRID_API_KEY: str = "your_sendgrid_api_key"
    FROM_EMAIL: str = "noreply@axs360.com"
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10485760  # 10MB
    UPLOAD_FOLDER: str = "uploads/"
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "pdf"]
    
    # Celery Configuration
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Application Settings
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Mobile App Configuration
    MOBILE_APP_VERSION: str = "1.0.0"
    FORCE_UPDATE_VERSION: str = "1.0.0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Production Security
    SECURE_COOKIES: bool = False
    HTTPS_ONLY: bool = False
    
    @validator("DEBUG", pre=True)
    def set_debug_mode(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
