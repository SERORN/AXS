"""
Industry-specific models for AXS360 API
Handles different business verticals and their specific requirements
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, JSON, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class WorkshopType(str, enum.Enum):
    AUTO_REPAIR = "auto_repair"
    BODY_SHOP = "body_shop"
    TIRE_SERVICE = "tire_service"
    OIL_CHANGE = "oil_change"
    DETAILING = "detailing"
    INSPECTION = "inspection"
    TRANSMISSION = "transmission"
    ELECTRICAL = "electrical"
    DIESEL_REPAIR = "diesel_repair"
    MOTORCYCLE = "motorcycle"


class AirportLoungeType(str, enum.Enum):
    AIRLINE = "airline"
    INDEPENDENT = "independent"
    CREDIT_CARD = "credit_card"
    BANK_SPONSORED = "bank_sponsored"
    VIP = "vip"
    BUSINESS = "business"
    FIRST_CLASS = "first_class"


class ParkingType(str, enum.Enum):
    STREET = "street"
    GARAGE = "garage"
    LOT = "lot"
    VALET = "valet"
    SELF_PARK = "self_park"
    COVERED = "covered"
    OUTDOOR = "outdoor"
    RESERVED = "reserved"


# Workshop-specific model
class Workshop(Base):
    __tablename__ = "workshops"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Workshop Type and Services
    workshop_type = Column(Enum(WorkshopType), nullable=False)
    services_offered = Column(JSON, default=list, nullable=True)  # ["oil_change", "brake_repair"]
    brands_serviced = Column(JSON, default=list, nullable=True)  # ["Toyota", "Honda", "BMW"]
    
    # Certifications and Licenses
    certifications = Column(JSON, default=list, nullable=True)  # ["ASE", "Bosch", "Snap-on"]
    license_numbers = Column(JSON, default=dict, nullable=True)
    insurance_coverage = Column(JSON, default=dict, nullable=True)
    
    # Facility Information
    total_bays = Column(Integer, nullable=False)
    available_bays = Column(Integer, nullable=False)
    lift_count = Column(Integer, default=0, nullable=False)
    equipment_list = Column(JSON, default=list, nullable=True)
    
    # Service Hours and Appointments
    appointment_required = Column(Boolean, default=True, nullable=False)
    walk_in_accepted = Column(Boolean, default=False, nullable=False)
    emergency_service = Column(Boolean, default=False, nullable=False)
    
    # Pricing and Estimates
    labor_rate = Column(Numeric(8, 2), nullable=False)  # Per hour
    diagnostic_fee = Column(Numeric(8, 2), default=0.00, nullable=False)
    estimate_turnaround = Column(String(50), nullable=True)  # "24 hours", "Same day"
    
    # Forms and Customer Data
    customer_intake_form = Column(JSON, default=dict, nullable=True)
    service_checklist = Column(JSON, default=list, nullable=True)
    warranty_terms = Column(Text, nullable=True)
    
    # Integration with Parts Systems
    parts_suppliers = Column(JSON, default=list, nullable=True)
    inventory_system = Column(String(100), nullable=True)
    
    # Business relationship
    business = relationship("Business", back_populates="workshop_details")


# Airport Lounge-specific model
class AirportLounge(Base):
    __tablename__ = "airport_lounges"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Lounge Information
    lounge_type = Column(Enum(AirportLoungeType), nullable=False)
    airport_code = Column(String(3), nullable=False, index=True)  # IATA code
    terminal = Column(String(10), nullable=False)
    gate_proximity = Column(String(100), nullable=True)
    
    # Access Requirements
    access_methods = Column(JSON, default=list, nullable=True)  # ["priority_pass", "credit_card", "airline_status"]
    partner_airlines = Column(JSON, default=list, nullable=True)
    eligible_credit_cards = Column(JSON, default=list, nullable=True)
    
    # Capacity and Facilities
    total_seats = Column(Integer, nullable=False)
    quiet_zones = Column(Integer, default=0, nullable=False)
    business_centers = Column(Integer, default=0, nullable=False)
    shower_facilities = Column(Integer, default=0, nullable=False)
    
    # Services and Amenities
    food_service = Column(JSON, default=dict, nullable=True)  # {"buffet": true, "a_la_carte": false}
    beverage_service = Column(JSON, default=dict, nullable=True)
    wifi_details = Column(JSON, default=dict, nullable=True)
    entertainment = Column(JSON, default=list, nullable=True)
    
    # Bank Partnership Information
    partner_banks = Column(JSON, default=list, nullable=True)
    bank_customer_benefits = Column(JSON, default=dict, nullable=True)
    card_tier_access = Column(JSON, default=dict, nullable=True)  # Which card tiers get access
    
    # Operating Hours (may differ from business hours)
    operating_hours_override = Column(JSON, default=dict, nullable=True)
    
    # Business relationship
    business = relationship("Business", back_populates="lounge_details")


# Parking-specific model
class ParkingFacility(Base):
    __tablename__ = "parking_facilities"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Parking Type and Configuration
    parking_type = Column(Enum(ParkingType), nullable=False)
    total_spaces = Column(Integer, nullable=False)
    available_spaces = Column(Integer, nullable=False)
    
    # Space Types
    regular_spaces = Column(Integer, default=0, nullable=False)
    compact_spaces = Column(Integer, default=0, nullable=False)
    handicap_spaces = Column(Integer, default=0, nullable=False)
    electric_charging = Column(Integer, default=0, nullable=False)
    
    # Vehicle Restrictions
    max_height = Column(Numeric(4, 2), nullable=True)  # in feet
    max_length = Column(Numeric(4, 2), nullable=True)
    weight_limit = Column(Numeric(8, 2), nullable=True)  # in pounds
    restricted_vehicles = Column(JSON, default=list, nullable=True)
    
    # Pricing Structure
    hourly_rates = Column(JSON, default=dict, nullable=True)
    daily_rates = Column(JSON, default=dict, nullable=True)
    monthly_rates = Column(JSON, default=dict, nullable=True)
    peak_pricing = Column(JSON, default=dict, nullable=True)
    
    # Security and Features
    security_level = Column(String(20), default="standard", nullable=False)
    surveillance = Column(Boolean, default=False, nullable=False)
    security_patrol = Column(Boolean, default=False, nullable=False)
    lighting_quality = Column(String(20), default="standard", nullable=False)
    
    # Access Control
    gate_access = Column(Boolean, default=False, nullable=False)
    payment_methods = Column(JSON, default=list, nullable=True)
    reservation_system = Column(Boolean, default=False, nullable=False)
    
    # Location Features
    weather_protection = Column(String(20), default="none", nullable=False)  # none, partial, full
    ground_surface = Column(String(20), default="asphalt", nullable=False)
    
    # Business relationship
    business = relationship("Business", back_populates="parking_details")


# Bank Lounge-specific model (for bank partnerships)
class BankLounge(Base):
    __tablename__ = "bank_lounges"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Bank Partnership Details
    partner_bank_name = Column(String(255), nullable=False)
    bank_routing_number = Column(String(20), nullable=True)
    partnership_type = Column(String(50), nullable=False)  # exclusive, non-exclusive
    
    # Customer Eligibility
    minimum_account_balance = Column(Numeric(12, 2), nullable=True)
    eligible_account_types = Column(JSON, default=list, nullable=True)
    credit_card_requirements = Column(JSON, default=dict, nullable=True)
    
    # Revenue Sharing
    revenue_share_percentage = Column(Numeric(5, 2), nullable=False)
    minimum_monthly_guarantee = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    # Services for Bank Customers
    complimentary_services = Column(JSON, default=list, nullable=True)
    discounted_services = Column(JSON, default=dict, nullable=True)
    exclusive_hours = Column(JSON, default=dict, nullable=True)
    
    # Business relationship
    business = relationship("Business", back_populates="bank_lounge_details")


# Contract and Commission Management
class BusinessContract(Base):
    __tablename__ = "business_contracts"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Contract Details
    contract_type = Column(String(50), nullable=False)  # revenue_share, flat_fee, subscription
    contract_number = Column(String(100), unique=True, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    auto_renewal = Column(Boolean, default=False, nullable=False)
    
    # Terms and Conditions
    commission_rate = Column(Numeric(5, 2), nullable=False)
    minimum_monthly_revenue = Column(Numeric(10, 2), default=0.00, nullable=False)
    payment_terms = Column(String(50), default="net_30", nullable=False)
    
    # Contract Documents
    signed_contract_url = Column(String(500), nullable=True)
    terms_document_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    signed_by_business = Column(Boolean, default=False, nullable=False)
    signed_by_platform = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    signed_at = Column(DateTime, nullable=True)
    
    # Business relationship
    business = relationship("Business", back_populates="contracts")


# Revenue Reporting and Analytics
class RevenueReport(Base):
    __tablename__ = "revenue_reports"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Report Period
    report_date = Column(DateTime, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    report_type = Column(String(20), nullable=False)  # daily, weekly, monthly, quarterly
    
    # Revenue Metrics
    gross_revenue = Column(Numeric(12, 2), nullable=False)
    platform_commission = Column(Numeric(12, 2), nullable=False)
    net_revenue = Column(Numeric(12, 2), nullable=False)
    transaction_count = Column(Integer, nullable=False)
    
    # Customer Metrics
    unique_customers = Column(Integer, nullable=False)
    repeat_customers = Column(Integer, nullable=False)
    average_transaction = Column(Numeric(8, 2), nullable=False)
    
    # Service Breakdown
    service_breakdown = Column(JSON, default=dict, nullable=True)  # Revenue by service type
    hourly_breakdown = Column(JSON, default=dict, nullable=True)  # Revenue by hour
    
    # Business relationship
    business = relationship("Business", back_populates="revenue_reports")


# Business Employee Management
class BusinessEmployee(Base):
    __tablename__ = "business_employees"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # If they have an app account
    
    # Employee Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Role and Permissions
    role = Column(String(50), nullable=False)  # manager, technician, receptionist, etc.
    permissions = Column(JSON, default=list, nullable=True)
    access_level = Column(String(20), default="basic", nullable=False)
    
    # Employment Details
    employee_id = Column(String(50), nullable=True)
    hire_date = Column(DateTime, nullable=False)
    termination_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="employees")
    user = relationship("User")
