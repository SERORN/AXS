# Business Management Schemas
# Pydantic models for business registration and management

from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# =====================================================
# ENUMS
# =====================================================

class BusinessType(str, Enum):
    individual = "individual"
    corporation = "corporation"
    llc = "llc"
    partnership = "partnership"
    nonprofit = "nonprofit"

class IndustryType(str, Enum):
    automotive = "automotive"
    parking = "parking"
    airport = "airport"
    banking = "banking"
    residential = "residential"
    education = "education"
    corporate = "corporate"
    valet = "valet"

class BusinessStatus(str, Enum):
    pending_verification = "pending_verification"
    active = "active"
    suspended = "suspended"
    inactive = "inactive"

class EmployeeRole(str, Enum):
    owner = "owner"
    admin = "admin"
    manager = "manager"
    operator = "operator"
    viewer = "viewer"

# =====================================================
# BUSINESS SCHEMAS
# =====================================================

class BusinessCreate(BaseModel):
    name: str
    business_type: BusinessType
    industry: IndustryType
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str = "Mexico"
    postal_code: str
    tax_id: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    industry_data: Dict[str, Any] = {}
    
    @validator('phone')
    def validate_phone(cls, v):
        # Remove spaces and special characters
        phone = ''.join(filter(str.isdigit, v))
        if len(phone) < 10:
            raise ValueError('Phone number must have at least 10 digits')
        return phone

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class BusinessResponse(BaseModel):
    id: str
    name: str
    business_type: BusinessType
    industry: IndustryType
    email: str
    phone: str
    address: str
    city: str
    state: str
    country: str
    status: BusinessStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class BusinessDetailResponse(BusinessResponse):
    postal_code: str
    tax_id: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    total_employees: Optional[int] = 0
    monthly_revenue: Optional[float] = 0.0
    total_accesses: Optional[int] = 0

# =====================================================
# ACCESS METHOD CONFIGURATION
# =====================================================

class AccessMethodConfig(BaseModel):
    qr_enabled: bool = True
    plate_recognition: bool = False
    facial_recognition: bool = False
    auto_checkout: bool = False
    checkout_timeout: Optional[int] = 480  # 8 hours in minutes
    notifications_enabled: bool = True
    require_pre_approval: bool = False

# =====================================================
# EMPLOYEE SCHEMAS
# =====================================================

class BusinessEmployeeCreate(BaseModel):
    email: EmailStr
    role: EmployeeRole
    permissions: List[str] = ["view_dashboard", "manage_access"]

class BusinessEmployeeUpdate(BaseModel):
    role: Optional[EmployeeRole] = None
    permissions: Optional[List[str]] = None
    status: Optional[str] = None

class BusinessEmployeeResponse(BaseModel):
    id: str
    business_id: str
    user_id: str
    role: EmployeeRole
    permissions: List[str]
    status: str
    hire_date: datetime
    
    # Joined user data
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        orm_mode = True

# =====================================================
# INDUSTRY-SPECIFIC SCHEMAS
# =====================================================

class WorkshopData(BaseModel):
    workshop_type: str = "general"  # general, body_shop, mechanical, electrical
    certifications: List[str] = []
    insurance_partnerships: List[str] = []
    service_capacity: int = 10
    specializations: List[str] = []

class ParkingData(BaseModel):
    facility_type: str = "surface"  # surface, garage, valet
    total_spaces: int = 50
    hourly_rate: float = 25.00
    daily_rate: float = 150.00
    monthly_rate: float = 2500.00
    accepts_reservations: bool = True
    valet_service: bool = False

class AirportData(BaseModel):
    airport_code: str
    terminal: str
    lounge_type: str = "premium"  # premium, business, first_class
    capacity: int = 100
    bank_partnerships: List[str] = []
    access_methods: List[str] = ["credit_card", "membership"]
    amenities: List[str] = []

class BankingData(BaseModel):
    bank_name: str
    location_type: str = "branch"  # branch, mall, airport
    eligible_cards: List[str] = []
    minimum_spend: float = 0
    capacity: int = 50
    operating_hours: Dict[str, str] = {}
    amenities: List[str] = []

class ResidentialData(BaseModel):
    complex_type: str = "condominiums"  # condominiums, apartments, houses
    total_units: int = 100
    visitor_policy: str = "pre_approval"  # open, pre_approval, resident_only
    security_level: str = "medium"  # low, medium, high
    amenities: List[str] = []

class EducationData(BaseModel):
    institution_type: str = "university"  # preschool, elementary, middle, high_school, university
    student_capacity: int = 1000
    grade_levels: List[str] = []
    visitor_policy: str = "scheduled_only"
    security_requirements: List[str] = []

class CorporateData(BaseModel):
    company_size: str = "medium"  # small, medium, large, enterprise
    industry_sector: str
    security_clearance: str = "standard"  # standard, medium, high, classified
    visitor_policy: str = "appointment_required"
    departments: List[str] = []

class ValetData(BaseModel):
    service_type: str = "hotel"  # hotel, restaurant, event, residential
    capacity: int = 50
    pricing_model: str = "flat_rate"  # flat_rate, hourly, event_based
    insurance_coverage: float = 1000000  # Coverage amount
    operates_24_7: bool = True

# =====================================================
# QR CODE & ACCESS SCHEMAS
# =====================================================

class QRCodeRequest(BaseModel):
    business_id: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    visit_purpose: Optional[str] = None
    vehicle_plate: Optional[str] = None
    valid_until: Optional[datetime] = None
    access_type: str = "single_use"  # single_use, multi_use, time_limited

class QRCodeResponse(BaseModel):
    qr_code: str  # Base64 encoded QR image
    qr_data: str  # QR code data/URL
    access_token: str
    valid_until: datetime
    business_name: str

# =====================================================
# ACCESS LOG SCHEMAS
# =====================================================

class AccessLogCreate(BaseModel):
    business_id: str
    user_id: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    visitor_phone: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_vin: Optional[str] = None
    access_method: str = "qr_code"  # qr_code, plate_recognition, facial_recognition, manual
    access_type: str = "check_in"  # check_in, check_out
    location: Optional[str] = None
    notes: Optional[str] = None

class AccessLogResponse(BaseModel):
    id: str
    business_id: str
    user_id: Optional[str] = None
    visitor_name: Optional[str] = None
    access_method: str
    access_type: str
    timestamp: datetime
    location: Optional[str] = None
    vehicle_plate: Optional[str] = None
    status: str = "successful"
    
    class Config:
        orm_mode = True

# =====================================================
# DASHBOARD & ANALYTICS SCHEMAS
# =====================================================

class BusinessMetrics(BaseModel):
    total_accesses_today: int = 0
    total_accesses_week: int = 0
    total_accesses_month: int = 0
    unique_visitors_today: int = 0
    unique_visitors_week: int = 0
    unique_visitors_month: int = 0
    revenue_today: float = 0.0
    revenue_week: float = 0.0
    revenue_month: float = 0.0
    average_visit_duration: Optional[float] = None  # in minutes
    peak_hours: List[Dict[str, Any]] = []
    popular_services: List[Dict[str, Any]] = []

class DashboardData(BaseModel):
    business: BusinessResponse
    metrics: BusinessMetrics
    recent_accesses: List[AccessLogResponse]
    active_visitors: int = 0
    alerts: List[Dict[str, Any]] = []
    notifications: List[Dict[str, Any]] = []
