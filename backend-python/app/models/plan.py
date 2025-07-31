"""
Plan model for AXS360 API
Handles subscription plans and pricing
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class BillingCycle(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    LIFETIME = "lifetime"


class PlanStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"
    COMING_SOON = "coming_soon"


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    
    # Plan Information
    name = Column(String(100), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(255), nullable=True)
    
    # Plan Type and Category
    plan_type = Column(Enum(PlanType), nullable=False)
    category = Column(String(50), nullable=True)  # "individual", "business", "enterprise"
    
    # Status
    status = Column(Enum(PlanStatus), default=PlanStatus.ACTIVE, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_popular = Column(Boolean, default=False, nullable=False)
    
    # Pricing
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    currency = Column(String(3), default="USD", nullable=False)
    billing_cycle = Column(Enum(BillingCycle), nullable=False)
    
    # Special Pricing
    setup_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)
    promotional_price = Column(Numeric(10, 2), nullable=True)
    promotional_until = Column(DateTime, nullable=True)
    
    # Stripe Integration
    stripe_price_id = Column(String(255), nullable=True)
    stripe_product_id = Column(String(255), nullable=True)
    
    # Features and Limits
    features = Column(JSON, default=list, nullable=True)  # List of feature names
    feature_limits = Column(JSON, default=dict, nullable=True)  # {"vehicles": 5, "passes": 100}
    
    # Access Controls
    max_vehicles = Column(Integer, nullable=True)  # None for unlimited
    max_passes_per_month = Column(Integer, nullable=True)
    max_concurrent_passes = Column(Integer, nullable=True)
    max_users = Column(Integer, default=1, nullable=False)  # For business plans
    
    # Zone Access
    allowed_zones = Column(JSON, default=list, nullable=True)
    access_level = Column(String(20), default="standard", nullable=False)  # basic, standard, premium, vip
    
    # Time and Usage Restrictions
    usage_restrictions = Column(JSON, default=dict, nullable=True)
    time_restrictions = Column(JSON, default=dict, nullable=True)
    
    # Support and Services
    support_level = Column(String(20), default="standard", nullable=False)  # basic, standard, priority, dedicated
    includes_mobile_app = Column(Boolean, default=True, nullable=False)
    includes_api_access = Column(Boolean, default=False, nullable=False)
    includes_analytics = Column(Boolean, default=False, nullable=False)
    
    # Trial and Freemium
    trial_days = Column(Integer, default=0, nullable=False)
    is_free_plan = Column(Boolean, default=False, nullable=False)
    
    # Visibility and Availability
    is_public = Column(Boolean, default=True, nullable=False)
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)
    target_audience = Column(JSON, default=list, nullable=True)  # ["individual", "small_business", "enterprise"]
    
    # Marketing
    marketing_headline = Column(String(255), nullable=True)
    call_to_action = Column(String(100), default="Subscribe Now", nullable=False)
    badge_text = Column(String(50), nullable=True)  # "Most Popular", "Best Value"
    
    # Customization Options
    customizable = Column(Boolean, default=False, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    contact_for_pricing = Column(Boolean, default=False, nullable=False)
    
    # Add-ons and Extras
    available_addons = Column(JSON, default=list, nullable=True)
    included_addons = Column(JSON, default=list, nullable=True)
    
    # Compliance and Legal
    terms_of_service = Column(Text, nullable=True)
    privacy_policy = Column(Text, nullable=True)
    data_retention_days = Column(Integer, default=365, nullable=False)
    
    # Analytics and Tracking
    signup_count = Column(Integer, default=0, nullable=False)
    active_subscriptions = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    passes = relationship("Pass", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Plan(id={self.id}, name='{self.name}', type='{self.plan_type}', price={self.price})>"

    @property
    def effective_price(self):
        """Get current effective price (considering promotions)"""
        if self.promotional_price and self.promotional_until:
            from datetime import datetime
            if datetime.utcnow() <= self.promotional_until:
                return self.promotional_price
        
        if self.discount_percentage > 0:
            discount_amount = self.price * (self.discount_percentage / 100)
            return self.price - discount_amount
        
        return self.price

    @property
    def is_promotional_active(self):
        """Check if promotional pricing is active"""
        if not self.promotional_price or not self.promotional_until:
            return False
        
        from datetime import datetime
        return datetime.utcnow() <= self.promotional_until

    @property
    def is_available(self):
        """Check if plan is currently available"""
        if self.status != PlanStatus.ACTIVE:
            return False
        
        from datetime import datetime
        now = datetime.utcnow()
        
        if self.available_from and now < self.available_from:
            return False
        
        if self.available_until and now > self.available_until:
            return False
        
        return True

    @property
    def monthly_equivalent_price(self):
        """Convert price to monthly equivalent for comparison"""
        price = self.effective_price
        
        if self.billing_cycle == BillingCycle.DAILY:
            return price * 30
        elif self.billing_cycle == BillingCycle.WEEKLY:
            return price * 4.33
        elif self.billing_cycle == BillingCycle.MONTHLY:
            return price
        elif self.billing_cycle == BillingCycle.QUARTERLY:
            return price / 3
        elif self.billing_cycle == BillingCycle.ANNUALLY:
            return price / 12
        elif self.billing_cycle == BillingCycle.LIFETIME:
            return price / 120  # Assume 10-year lifetime
        else:
            return price

    def has_feature(self, feature_name: str) -> bool:
        """Check if plan includes specific feature"""
        return feature_name in (self.features or [])

    def get_feature_limit(self, feature_name: str) -> int:
        """Get limit for specific feature"""
        if not self.feature_limits:
            return 0
        return self.feature_limits.get(feature_name, 0)

    def can_access_zone(self, zone_access_level: str) -> bool:
        """Check if plan allows access to specific zone level"""
        access_levels = ["basic", "standard", "premium", "vip"]
        
        if self.access_level not in access_levels or zone_access_level not in access_levels:
            return False
        
        plan_level_index = access_levels.index(self.access_level)
        zone_level_index = access_levels.index(zone_access_level)
        
        return plan_level_index >= zone_level_index

    def calculate_total_cost(self, months: int = 1) -> float:
        """Calculate total cost for specified period"""
        if self.billing_cycle == BillingCycle.MONTHLY:
            return float(self.effective_price * months)
        elif self.billing_cycle == BillingCycle.ANNUALLY:
            years = months / 12
            return float(self.effective_price * years)
        else:
            # Convert to monthly equivalent and multiply
            monthly_price = self.monthly_equivalent_price
            return float(monthly_price * months)

    def dict(self):
        """Convert plan to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "short_description": self.short_description,
            "plan_type": self.plan_type.value if self.plan_type else None,
            "category": self.category,
            "status": self.status.value if self.status else None,
            "is_featured": self.is_featured,
            "is_popular": self.is_popular,
            "price": float(self.price) if self.price else 0.0,
            "effective_price": float(self.effective_price) if self.effective_price else 0.0,
            "currency": self.currency,
            "billing_cycle": self.billing_cycle.value if self.billing_cycle else None,
            "setup_fee": float(self.setup_fee) if self.setup_fee else 0.0,
            "discount_percentage": float(self.discount_percentage) if self.discount_percentage else 0.0,
            "promotional_price": float(self.promotional_price) if self.promotional_price else None,
            "promotional_until": self.promotional_until.isoformat() if self.promotional_until else None,
            "is_promotional_active": self.is_promotional_active,
            "is_available": self.is_available,
            "monthly_equivalent_price": float(self.monthly_equivalent_price),
            "features": self.features,
            "feature_limits": self.feature_limits,
            "max_vehicles": self.max_vehicles,
            "max_passes_per_month": self.max_passes_per_month,
            "max_concurrent_passes": self.max_concurrent_passes,
            "max_users": self.max_users,
            "allowed_zones": self.allowed_zones,
            "access_level": self.access_level,
            "support_level": self.support_level,
            "includes_mobile_app": self.includes_mobile_app,
            "includes_api_access": self.includes_api_access,
            "includes_analytics": self.includes_analytics,
            "trial_days": self.trial_days,
            "is_free_plan": self.is_free_plan,
            "is_public": self.is_public,
            "target_audience": self.target_audience,
            "marketing_headline": self.marketing_headline,
            "call_to_action": self.call_to_action,
            "badge_text": self.badge_text,
            "customizable": self.customizable,
            "requires_approval": self.requires_approval,
            "contact_for_pricing": self.contact_for_pricing,
            "available_addons": self.available_addons,
            "included_addons": self.included_addons,
            "signup_count": self.signup_count,
            "active_subscriptions": self.active_subscriptions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
