"""
Commission and billing model for AXS360 API
Handles platform monetization, commissions, and billing
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta

from app.core.database import Base


class CommissionType(str, enum.Enum):
    TRANSACTION_PERCENTAGE = "transaction_percentage"
    FIXED_TRANSACTION_FEE = "fixed_transaction_fee"
    MONTHLY_SUBSCRIPTION = "monthly_subscription"
    SETUP_FEE = "setup_fee"
    PAYMENT_PROCESSING = "payment_processing"
    PREMIUM_FEATURE = "premium_feature"


class BillingStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


# Platform Commission Configuration
class CommissionRule(Base):
    __tablename__ = "commission_rules"

    id = Column(Integer, primary_key=True, index=True)
    
    # Rule Configuration
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    business_type = Column(String(50), nullable=True)  # Apply to specific business types
    
    # Commission Settings
    commission_type = Column(Enum(CommissionType), nullable=False)
    percentage_rate = Column(Numeric(5, 2), nullable=True)  # For percentage-based
    fixed_amount = Column(Numeric(10, 2), nullable=True)  # For fixed fee
    minimum_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    maximum_fee = Column(Numeric(10, 2), nullable=True)
    
    # Tiered Pricing
    tier_thresholds = Column(JSON, default=list, nullable=True)  # Volume-based tiers
    tier_rates = Column(JSON, default=list, nullable=True)
    
    # Applicability Rules
    applies_to_services = Column(JSON, default=list, nullable=True)  # Specific services
    minimum_transaction = Column(Numeric(10, 2), default=0.00, nullable=False)
    maximum_transaction = Column(Numeric(10, 2), nullable=True)
    
    # Time-based Rules
    effective_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    days_of_week = Column(JSON, default=list, nullable=True)  # Apply on specific days
    hours_of_day = Column(JSON, default=dict, nullable=True)  # Apply during specific hours
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=0, nullable=False)  # For rule precedence
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Commission Transactions
class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Reference Information
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    commission_rule_id = Column(Integer, ForeignKey("commission_rules.id"), nullable=False)
    
    # Commission Details
    commission_type = Column(Enum(CommissionType), nullable=False)
    gross_amount = Column(Numeric(12, 2), nullable=False)  # Original transaction amount
    commission_rate = Column(Numeric(5, 2), nullable=True)
    commission_amount = Column(Numeric(10, 2), nullable=False)
    
    # Processing Information
    calculation_details = Column(JSON, default=dict, nullable=True)  # How it was calculated
    applied_rule_name = Column(String(255), nullable=True)
    
    # Status and Timing
    status = Column(String(20), default="pending", nullable=False)
    processed_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Billing Period
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    business = relationship("Business")
    payment = relationship("Payment")
    commission_rule = relationship("CommissionRule")


# Platform Subscription Plans
class PlatformSubscription(Base):
    __tablename__ = "platform_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Subscription Details
    plan_name = Column(String(100), nullable=False)
    plan_type = Column(String(50), nullable=False)  # basic, professional, enterprise
    monthly_fee = Column(Numeric(10, 2), nullable=False)
    setup_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    # Billing Cycle
    billing_cycle = Column(String(20), default="monthly", nullable=False)  # monthly, quarterly, annual
    next_billing_date = Column(DateTime, nullable=False)
    last_billed_date = Column(DateTime, nullable=True)
    
    # Features and Limits
    included_features = Column(JSON, default=list, nullable=True)
    transaction_limit = Column(Integer, nullable=True)
    user_limit = Column(Integer, nullable=True)
    api_calls_limit = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(20), default="active", nullable=False)
    trial_ends_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Payment Information
    stripe_subscription_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business = relationship("Business")


# Invoice Management
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Invoice Details
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    # Amounts
    subtotal = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    
    # Status and Payment
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    payment_terms = Column(String(50), default="net_30", nullable=False)
    
    # Invoice Items (stored as JSON for flexibility)
    line_items = Column(JSON, default=list, nullable=False)
    
    # Payment Tracking
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    # Documents
    pdf_url = Column(String(500), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business = relationship("Business")


# Billing Cycle Management
class BillingCycle(Base):
    __tablename__ = "billing_cycles"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Cycle Information
    cycle_start_date = Column(DateTime, nullable=False)
    cycle_end_date = Column(DateTime, nullable=False)
    cycle_type = Column(String(20), nullable=False)  # monthly, weekly, custom
    
    # Revenue Summary
    total_transactions = Column(Integer, default=0, nullable=False)
    gross_revenue = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_commissions = Column(Numeric(10, 2), default=0.00, nullable=False)
    subscription_fees = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    # Processing Status
    is_processed = Column(Boolean, default=False, nullable=False)
    invoice_generated = Column(Boolean, default=False, nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    business = relationship("Business")
    invoice = relationship("Invoice")


# Payout Management
class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Payout Details
    payout_date = Column(DateTime, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Amounts
    gross_amount = Column(Numeric(12, 2), nullable=False)
    commission_deducted = Column(Numeric(10, 2), nullable=False)
    fees_deducted = Column(Numeric(10, 2), default=0.00, nullable=False)
    net_amount = Column(Numeric(12, 2), nullable=False)
    
    # Payment Information
    payment_method = Column(String(50), nullable=False)  # bank_transfer, stripe, check
    bank_account_last4 = Column(String(4), nullable=True)
    transaction_reference = Column(String(255), nullable=True)
    
    # Status
    status = Column(String(20), default="pending", nullable=False)
    initiated_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Metadata
    included_transactions = Column(JSON, default=list, nullable=True)
    payout_breakdown = Column(JSON, default=dict, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    business = relationship("Business")


# Platform Revenue Analytics
class PlatformRevenue(Base):
    __tablename__ = "platform_revenue"

    id = Column(Integer, primary_key=True, index=True)
    
    # Time Period
    date = Column(DateTime, nullable=False, index=True)
    period_type = Column(String(20), nullable=False)  # daily, weekly, monthly
    
    # Revenue Metrics
    total_gross_volume = Column(Numeric(15, 2), nullable=False)
    total_commission_earned = Column(Numeric(12, 2), nullable=False)
    subscription_revenue = Column(Numeric(10, 2), nullable=False)
    setup_fees = Column(Numeric(10, 2), nullable=False)
    
    # Transaction Metrics
    total_transactions = Column(Integer, nullable=False)
    unique_businesses = Column(Integer, nullable=False)
    new_businesses = Column(Integer, nullable=False)
    
    # Business Type Breakdown
    revenue_by_business_type = Column(JSON, default=dict, nullable=True)
    transactions_by_type = Column(JSON, default=dict, nullable=True)
    
    # Geographic Breakdown
    revenue_by_region = Column(JSON, default=dict, nullable=True)
    
    # Created timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def calculate_commission(self, transaction_amount: float, business_type: str = None) -> dict:
        """Calculate commission for a transaction"""
        # This would use the commission rules to calculate
        # For now, return a simple percentage
        default_rate = 0.15  # 15% default
        commission = transaction_amount * default_rate
        
        return {
            "gross_amount": transaction_amount,
            "commission_rate": default_rate * 100,
            "commission_amount": commission,
            "net_amount": transaction_amount - commission
        }

    @classmethod
    def get_monthly_revenue(cls, year: int, month: int):
        """Get monthly revenue summary"""
        # Query would go here
        pass

    @classmethod
    def generate_business_invoice(cls, business_id: int, billing_period_start: datetime, billing_period_end: datetime):
        """Generate invoice for a business"""
        # Invoice generation logic
        pass
