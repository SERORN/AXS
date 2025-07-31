"""
Business model for AXS360 API
Handles business/organization management for multi-tenant platform
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class BusinessType(str, enum.Enum):
    PARKING = "parking"
    AIRPORT_LOUNGE = "airport_lounge"
    WORKSHOP = "workshop"
    BANK_LOUNGE = "bank_lounge"
    HOTEL = "hotel"
    OFFICE_BUILDING = "office_building"
    SHOPPING_MALL = "shopping_mall"
    RESTAURANT = "restaurant"
    FITNESS_CENTER = "fitness_center"
    COWORKING = "coworking"
    EVENT_VENUE = "event_venue"
    OTHER = "other"


class BusinessStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_APPROVAL = "pending_approval"


class CommissionModel(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_FEE = "fixed_fee"
    MONTHLY_SUBSCRIPTION = "monthly_subscription"
    TRANSACTION_BASED = "transaction_based"


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    name = Column(String(255), nullable=False, index=True)
    business_type = Column(Enum(BusinessType), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    
    # Status and Verification
    status = Column(Enum(BusinessStatus), default=BusinessStatus.PENDING_APPROVAL, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_documents = Column(JSON, default=list, nullable=True)
    
    # Contact Information
    primary_contact_name = Column(String(255), nullable=False)
    primary_contact_email = Column(String(255), nullable=False)
    primary_contact_phone = Column(String(20), nullable=False)
    secondary_contact_email = Column(String(255), nullable=True)
    secondary_contact_phone = Column(String(20), nullable=True)
    
    # Address Information
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=False)
    country = Column(String(2), default="US", nullable=False)
    
    # Location Data
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    
    # Business License and Legal
    business_license_number = Column(String(100), nullable=True)
    tax_id = Column(String(50), nullable=True)
    legal_entity_type = Column(String(50), nullable=True)  # LLC, Corporation, etc.
    
    # Operating Information
    operating_hours = Column(JSON, default=dict, nullable=True)  # {"monday": {"open": "08:00", "close": "18:00"}}
    capacity = Column(Integer, nullable=True)
    total_spaces = Column(Integer, nullable=True)  # For parking/venues
    available_spaces = Column(Integer, nullable=True)
    
    # Services and Amenities
    services_offered = Column(JSON, default=list, nullable=True)  # ["valet", "charging", "wifi"]
    amenities = Column(JSON, default=list, nullable=True)  # ["restroom", "food", "wifi"]
    facility_features = Column(JSON, default=dict, nullable=True)  # Custom features per industry
    
    # Pricing Configuration
    base_pricing = Column(JSON, default=dict, nullable=True)  # Base pricing structure
    dynamic_pricing_enabled = Column(Boolean, default=False, nullable=False)
    pricing_rules = Column(JSON, default=list, nullable=True)  # Complex pricing rules
    
    # Commission and Revenue
    commission_model = Column(Enum(CommissionModel), default=CommissionModel.PERCENTAGE, nullable=False)
    commission_rate = Column(Numeric(5, 2), default=0.00, nullable=False)  # Percentage or fixed amount
    monthly_subscription_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    transaction_fee = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    # Payment Information
    stripe_account_id = Column(String(255), nullable=True)  # Connected account
    bank_account_details = Column(JSON, default=dict, nullable=True)  # Encrypted
    payout_schedule = Column(String(20), default="weekly", nullable=False)  # daily, weekly, monthly
    
    # Integration Settings
    api_enabled = Column(Boolean, default=False, nullable=False)
    api_key = Column(String(255), nullable=True)
    webhook_url = Column(String(500), nullable=True)
    integration_settings = Column(JSON, default=dict, nullable=True)
    
    # Business Rules and Policies
    cancellation_policy = Column(Text, nullable=True)
    terms_of_service = Column(Text, nullable=True)
    privacy_policy = Column(Text, nullable=True)
    refund_policy = Column(Text, nullable=True)
    
    # Access Control
    access_requirements = Column(JSON, default=dict, nullable=True)  # What's needed for access
    security_level = Column(String(20), default="standard", nullable=False)
    requires_pre_approval = Column(Boolean, default=False, nullable=False)
    
    # Analytics and Reporting
    monthly_revenue = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_transactions = Column(Integer, default=0, nullable=False)
    customer_rating = Column(Numeric(3, 2), default=0.00, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    
    # Marketing and Visibility
    featured = Column(Boolean, default=False, nullable=False)
    promotional_offers = Column(JSON, default=list, nullable=True)
    marketing_preferences = Column(JSON, default=dict, nullable=True)
    
    # Industry-Specific Fields
    industry_data = Column(JSON, default=dict, nullable=True)  # Flexible field for industry-specific data
    
    # Compliance and Certifications
    certifications = Column(JSON, default=list, nullable=True)  # ISO, safety certs, etc.
    compliance_status = Column(JSON, default=dict, nullable=True)
    last_inspection_date = Column(DateTime, nullable=True)
    next_inspection_due = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime, nullable=True)
    last_active = Column(DateTime, nullable=True)
    
    # Relationships
    locations = relationship("Location", back_populates="business", cascade="all, delete-orphan")
    employees = relationship("BusinessEmployee", back_populates="business", cascade="all, delete-orphan")
    contracts = relationship("BusinessContract", back_populates="business", cascade="all, delete-orphan")
    revenue_reports = relationship("RevenueReport", back_populates="business", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Business(id={self.id}, name='{self.name}', type='{self.business_type}')>"

    @property
    def is_operational(self):
        """Check if business is operational"""
        return self.status == BusinessStatus.ACTIVE and self.is_verified

    @property
    def commission_amount(self, transaction_amount: float) -> float:
        """Calculate commission for a transaction"""
        if self.commission_model == CommissionModel.PERCENTAGE:
            return transaction_amount * (self.commission_rate / 100)
        elif self.commission_model == CommissionModel.FIXED_FEE:
            return float(self.commission_rate)
        elif self.commission_model == CommissionModel.TRANSACTION_BASED:
            return float(self.transaction_fee)
        else:
            return 0.00

    def is_open_now(self) -> bool:
        """Check if business is currently open"""
        from datetime import datetime
        import pytz
        
        if not self.operating_hours:
            return True  # Always open if no hours specified
        
        now = datetime.now(pytz.timezone(self.timezone))
        day_name = now.strftime("%A").lower()
        
        if day_name not in self.operating_hours:
            return False
        
        hours = self.operating_hours[day_name]
        if not hours or hours.get("closed", False):
            return False
        
        current_time = now.time()
        open_time = datetime.strptime(hours["open"], "%H:%M").time()
        close_time = datetime.strptime(hours["close"], "%H:%M").time()
        
        return open_time <= current_time <= close_time

    def get_current_availability(self) -> dict:
        """Get current space availability"""
        if self.total_spaces is None:
            return {"available": True, "spaces": "unlimited"}
        
        available = self.available_spaces or 0
        total = self.total_spaces
        
        return {
            "available": available > 0,
            "spaces": available,
            "total": total,
            "occupancy_rate": ((total - available) / total * 100) if total > 0 else 0
        }

    def calculate_pricing(self, service_type: str, duration_hours: int = 1, **kwargs) -> dict:
        """Calculate pricing based on business rules"""
        base_price = 0.00
        
        if self.base_pricing and service_type in self.base_pricing:
            base_price = self.base_pricing[service_type].get("hourly_rate", 0.00)
        
        total_price = base_price * duration_hours
        
        # Apply dynamic pricing if enabled
        if self.dynamic_pricing_enabled and self.pricing_rules:
            for rule in self.pricing_rules:
                if self._matches_pricing_rule(rule, **kwargs):
                    multiplier = rule.get("multiplier", 1.0)
                    total_price *= multiplier
        
        return {
            "base_price": base_price,
            "total_price": total_price,
            "duration_hours": duration_hours,
            "service_type": service_type
        }

    def _matches_pricing_rule(self, rule: dict, **kwargs) -> bool:
        """Check if a pricing rule applies"""
        # Implement rule matching logic based on time, occupancy, etc.
        return False  # Simplified for now

    def dict(self):
        """Convert business to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "business_type": self.business_type.value if self.business_type else None,
            "description": self.description,
            "website": self.website,
            "status": self.status.value if self.status else None,
            "is_verified": self.is_verified,
            "is_operational": self.is_operational,
            "contact": {
                "primary_name": self.primary_contact_name,
                "primary_email": self.primary_contact_email,
                "primary_phone": self.primary_contact_phone,
                "secondary_email": self.secondary_contact_email,
                "secondary_phone": self.secondary_contact_phone,
            },
            "address": {
                "line1": self.address_line1,
                "line2": self.address_line2,
                "city": self.city,
                "state": self.state,
                "postal_code": self.postal_code,
                "country": self.country,
            },
            "location": {
                "latitude": float(self.latitude) if self.latitude else None,
                "longitude": float(self.longitude) if self.longitude else None,
                "timezone": self.timezone,
            },
            "operating_hours": self.operating_hours,
            "capacity": self.capacity,
            "availability": self.get_current_availability(),
            "services_offered": self.services_offered,
            "amenities": self.amenities,
            "commission_model": self.commission_model.value if self.commission_model else None,
            "commission_rate": float(self.commission_rate) if self.commission_rate else 0.0,
            "customer_rating": float(self.customer_rating) if self.customer_rating else 0.0,
            "total_reviews": self.total_reviews,
            "featured": self.featured,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
