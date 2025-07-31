"""
Pass model for AXS360 API
Handles access passes and permissions
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta

from app.core.database import Base


class PassType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ANNUAL = "annual"
    UNLIMITED = "unlimited"
    CUSTOM = "custom"


class PassStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    PENDING = "pending"


class AccessLevel(str, enum.Enum):
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    VIP = "vip"
    EXECUTIVE = "executive"


class Pass(Base):
    __tablename__ = "passes"

    id = Column(Integer, primary_key=True, index=True)
    
    # User and Vehicle relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    
    # Pass Information
    pass_number = Column(String(50), unique=True, index=True, nullable=False)
    pass_type = Column(Enum(PassType), nullable=False)
    access_level = Column(Enum(AccessLevel), default=AccessLevel.STANDARD, nullable=False)
    
    # Status and Validity
    status = Column(Enum(PassStatus), default=PassStatus.PENDING, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Time Validity
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    activated_at = Column(DateTime, nullable=True)
    
    # Usage Limits
    max_uses = Column(Integer, nullable=True)  # None for unlimited
    current_uses = Column(Integer, default=0, nullable=False)
    daily_limit = Column(Integer, nullable=True)
    
    # Access Zones and Permissions
    allowed_zones = Column(JSON, default=list, nullable=True)  # List of zone IDs
    restricted_zones = Column(JSON, default=list, nullable=True)  # List of restricted zone IDs
    allowed_times = Column(JSON, default=dict, nullable=True)  # Time restrictions
    
    # Pricing and Payment
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    currency = Column(String(3), default="USD", nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    
    # QR Code and Security
    qr_code_id = Column(Integer, ForeignKey("qr_codes.id"), nullable=True)
    security_code = Column(String(20), nullable=True)
    
    # Location and Facility Access
    facility_access = Column(JSON, default=dict, nullable=True)  # Specific facility permissions
    parking_preferences = Column(JSON, default=dict, nullable=True)
    
    # Discount and Promotion
    discount_code = Column(String(50), nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    promotional_pass = Column(Boolean, default=False, nullable=False)
    
    # Auto-renewal
    auto_renewal = Column(Boolean, default=False, nullable=False)
    renewal_payment_method = Column(String(50), nullable=True)
    next_renewal_date = Column(DateTime, nullable=True)
    
    # Guest Access
    guest_passes_included = Column(Integer, default=0, nullable=False)
    guest_passes_used = Column(Integer, default=0, nullable=False)
    
    # Emergency and Special Access
    emergency_contact = Column(JSON, default=dict, nullable=True)
    special_instructions = Column(Text, nullable=True)
    accessibility_requirements = Column(JSON, default=list, nullable=True)
    
    # Audit and Compliance
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Staff member who issued
    approval_required = Column(Boolean, default=False, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Usage Analytics
    first_use = Column(DateTime, nullable=True)
    last_use = Column(DateTime, nullable=True)
    average_daily_uses = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    # Mobile App Integration
    mobile_pass_enabled = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    
    # Terms and Conditions
    terms_version = Column(String(10), nullable=True)
    terms_accepted_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="passes", foreign_keys=[user_id])
    vehicle = relationship("Vehicle", back_populates="passes")
    plan = relationship("Plan", back_populates="passes")
    payment = relationship("Payment", back_populates="pass", uselist=False)
    qr_code = relationship("QRCode", back_populates="pass", uselist=False)
    issued_by_user = relationship("User", foreign_keys=[issued_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<Pass(id={self.id}, pass_number='{self.pass_number}', type='{self.pass_type}', status='{self.status}')>"

    @property
    def is_valid(self):
        """Check if pass is currently valid"""
        now = datetime.utcnow()
        return (
            self.status == PassStatus.ACTIVE and
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            (self.max_uses is None or self.current_uses < self.max_uses)
        )

    @property
    def is_expired(self):
        """Check if pass is expired"""
        return datetime.utcnow() > self.valid_until

    @property
    def days_until_expiry(self):
        """Get days until pass expires"""
        if self.is_expired:
            return 0
        delta = self.valid_until - datetime.utcnow()
        return delta.days

    @property
    def usage_percentage(self):
        """Get usage percentage if max_uses is set"""
        if self.max_uses is None:
            return 0
        if self.max_uses == 0:
            return 100
        return (self.current_uses / self.max_uses) * 100

    @property
    def remaining_uses(self):
        """Get remaining uses"""
        if self.max_uses is None:
            return "unlimited"
        return max(0, self.max_uses - self.current_uses)

    @property
    def guest_passes_remaining(self):
        """Get remaining guest passes"""
        return max(0, self.guest_passes_included - self.guest_passes_used)

    def can_access_zone(self, zone_id: str) -> bool:
        """Check if pass allows access to specific zone"""
        if not self.is_valid:
            return False
        
        # Check if zone is restricted
        if self.restricted_zones and zone_id in self.restricted_zones:
            return False
        
        # Check if zone is in allowed zones (if specified)
        if self.allowed_zones and zone_id not in self.allowed_zones:
            return False
        
        return True

    def can_access_at_time(self, check_time: datetime = None) -> bool:
        """Check if pass allows access at specific time"""
        if not self.is_valid:
            return False
        
        if not self.allowed_times:
            return True  # No time restrictions
        
        check_time = check_time or datetime.utcnow()
        weekday = check_time.strftime("%A").lower()
        current_time = check_time.time()
        
        # Check weekday restrictions
        if weekday in self.allowed_times:
            time_slots = self.allowed_times[weekday]
            for slot in time_slots:
                start_time = datetime.strptime(slot["start"], "%H:%M").time()
                end_time = datetime.strptime(slot["end"], "%H:%M").time()
                if start_time <= current_time <= end_time:
                    return True
            return False
        
        return True

    def use_pass(self):
        """Record pass usage"""
        if not self.is_valid:
            return False
        
        self.current_uses += 1
        self.last_use = datetime.utcnow()
        
        if self.first_use is None:
            self.first_use = self.last_use
        
        # Update average daily uses
        if self.first_use:
            days_active = (self.last_use - self.first_use).days + 1
            self.average_daily_uses = self.current_uses / days_active
        
        return True

    def use_guest_pass(self):
        """Use a guest pass"""
        if self.guest_passes_remaining <= 0:
            return False
        
        self.guest_passes_used += 1
        return True

    def extend_validity(self, days: int):
        """Extend pass validity by specified days"""
        self.valid_until += timedelta(days=days)
        
        # Update renewal date if auto-renewal is enabled
        if self.auto_renewal and self.next_renewal_date:
            self.next_renewal_date += timedelta(days=days)

    def suspend(self, reason: str = None):
        """Suspend the pass"""
        self.status = PassStatus.SUSPENDED
        self.is_active = False
        # Could log reason in audit system

    def reactivate(self):
        """Reactivate a suspended pass"""
        if not self.is_expired:
            self.status = PassStatus.ACTIVE
            self.is_active = True

    def dict(self):
        """Convert pass to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "vehicle_id": self.vehicle_id,
            "plan_id": self.plan_id,
            "pass_number": self.pass_number,
            "pass_type": self.pass_type.value if self.pass_type else None,
            "access_level": self.access_level.value if self.access_level else None,
            "status": self.status.value if self.status else None,
            "is_active": self.is_active,
            "is_valid": self.is_valid,
            "is_expired": self.is_expired,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "days_until_expiry": self.days_until_expiry,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "activated_at": self.activated_at.isoformat() if self.activated_at else None,
            "max_uses": self.max_uses,
            "current_uses": self.current_uses,
            "remaining_uses": self.remaining_uses,
            "usage_percentage": self.usage_percentage,
            "daily_limit": self.daily_limit,
            "allowed_zones": self.allowed_zones,
            "restricted_zones": self.restricted_zones,
            "allowed_times": self.allowed_times,
            "price": float(self.price) if self.price else 0.0,
            "currency": self.currency,
            "facility_access": self.facility_access,
            "parking_preferences": self.parking_preferences,
            "discount_code": self.discount_code,
            "discount_amount": float(self.discount_amount) if self.discount_amount else 0.0,
            "promotional_pass": self.promotional_pass,
            "auto_renewal": self.auto_renewal,
            "next_renewal_date": self.next_renewal_date.isoformat() if self.next_renewal_date else None,
            "guest_passes_included": self.guest_passes_included,
            "guest_passes_used": self.guest_passes_used,
            "guest_passes_remaining": self.guest_passes_remaining,
            "first_use": self.first_use.isoformat() if self.first_use else None,
            "last_use": self.last_use.isoformat() if self.last_use else None,
            "mobile_pass_enabled": self.mobile_pass_enabled,
            "push_notifications": self.push_notifications,
        }
