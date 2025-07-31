"""
User model for AXS360 API
Handles user accounts, authentication, and profile management
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    STAFF = "staff"
    ADMIN = "admin"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    profile_image = Column(String(255), nullable=True)
    
    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    phone_verified = Column(Boolean, default=False, nullable=False)
    
    # User Role and Permissions
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)
    permissions = Column(JSON, default=list, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Security and Preferences
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    notification_preferences = Column(JSON, default=dict, nullable=True)
    privacy_settings = Column(JSON, default=dict, nullable=True)
    
    # Verification Tokens
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Business Information (for premium users)
    company_name = Column(String(255), nullable=True)
    tax_id = Column(String(50), nullable=True)
    billing_address = Column(Text, nullable=True)
    
    # Subscription and Billing
    subscription_status = Column(String(50), default="free", nullable=False)
    subscription_expires = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    
    # Analytics and Tracking
    login_count = Column(Integer, default=0, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    last_failed_login = Column(DateTime, nullable=True)
    account_locked_until = Column(DateTime, nullable=True)
    
    # Referral System
    referral_code = Column(String(20), unique=True, nullable=True)
    referred_by = Column(Integer, nullable=True)
    referral_earnings = Column(Integer, default=0, nullable=False)  # in cents
    
    # Terms and Compliance
    terms_accepted_at = Column(DateTime, nullable=True)
    privacy_policy_accepted_at = Column(DateTime, nullable=True)
    marketing_consent = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    passes = relationship("Pass", back_populates="user", cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    qr_codes = relationship("QRCode", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"

    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == UserRole.ADMIN

    @property
    def is_staff(self):
        """Check if user is staff or admin"""
        return self.role in [UserRole.STAFF, UserRole.ADMIN]

    @property
    def is_premium(self):
        """Check if user has premium subscription"""
        return self.subscription_status in ["premium", "enterprise"]

    @property
    def is_account_locked(self):
        """Check if account is locked"""
        if not self.account_locked_until:
            return False
        from datetime import datetime
        return datetime.utcnow() < self.account_locked_until

    def can_access_resource(self, resource: str) -> bool:
        """Check if user can access a specific resource"""
        if self.is_admin:
            return True
        
        if not self.permissions:
            return False
        
        return resource in self.permissions

    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        if self.is_admin:
            return True
        
        if not self.permissions:
            return False
        
        return permission in self.permissions

    def dict(self, exclude_sensitive=True):
        """Convert user to dictionary, optionally excluding sensitive fields"""
        user_dict = {
            "id": self.id,
            "email": self.email,
            "phone": self.phone,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "profile_image": self.profile_image,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "email_verified": self.email_verified,
            "phone_verified": self.phone_verified,
            "role": self.role.value if self.role else None,
            "status": self.status.value if self.status else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "subscription_status": self.subscription_status,
            "company_name": self.company_name,
            "referral_code": self.referral_code,
        }
        
        if not exclude_sensitive:
            user_dict.update({
                "permissions": self.permissions,
                "notification_preferences": self.notification_preferences,
                "privacy_settings": self.privacy_settings,
                "two_factor_enabled": self.two_factor_enabled,
                "stripe_customer_id": self.stripe_customer_id,
                "terms_accepted_at": self.terms_accepted_at.isoformat() if self.terms_accepted_at else None,
                "privacy_policy_accepted_at": self.privacy_policy_accepted_at.isoformat() if self.privacy_policy_accepted_at else None,
                "marketing_consent": self.marketing_consent,
            })
        
        return user_dict
