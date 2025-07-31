# Access Control Schemas
# Pydantic models for QR codes, visitor management, and access logs

from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# =====================================================
# ENUMS
# =====================================================

class AccessMethod(str, Enum):
    qr_code = "qr_code"
    plate_recognition = "plate_recognition"
    facial_recognition = "facial_recognition"
    manual = "manual"
    nfc_tag = "nfc_tag"

class AccessType(str, Enum):
    check_in = "check_in"
    check_out = "check_out"
    qr_generated = "qr_generated"
    checkout_only = "checkout_only"

class VisitorType(str, Enum):
    registered = "registered"
    guest = "guest"
    employee = "employee"
    contractor = "contractor"
    delivery = "delivery"
    service = "service"

class VisitorStatus(str, Enum):
    pending_approval = "pending_approval"
    approved = "approved"
    rejected = "rejected"
    blocked = "blocked"

# =====================================================
# QR CODE GENERATION SCHEMAS
# =====================================================

class QRAccessRequest(BaseModel):
    business_id: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[EmailStr] = None
    visitor_phone: Optional[str] = None
    visit_purpose: Optional[str] = "General visit"
    entry_point: Optional[str] = "Main entrance"
    
    # Vehicle information
    vehicle_plate: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_vin: Optional[str] = None
    
    # QR configuration
    valid_until: Optional[datetime] = None
    access_type: str = "single_use"  # single_use, multi_use, time_limited
    
    # Additional metadata
    device_info: Optional[Dict[str, Any]] = None

class QRAccessResponse(BaseModel):
    qr_code: str  # Base64 encoded QR image
    qr_data: str  # QR code data/URL
    access_token: str
    valid_until: datetime
    business_name: str
    visitor_id: str
    entry_instructions: str

# =====================================================
# QR SCANNING SCHEMAS
# =====================================================

class QRScanRequest(BaseModel):
    qr_token: str
    scan_location: Optional[str] = "Main entrance"
    scanner_device: Optional[str] = None
    scan_method: str = "mobile_app"  # mobile_app, fixed_scanner, tablet
    notes: Optional[str] = None

class AccessScanResponse(BaseModel):
    access_granted: bool
    access_type: AccessType
    visitor_name: str
    business_name: str
    timestamp: datetime
    location: str
    visit_duration: Optional[int] = None  # in minutes
    checkout_qr: Optional[str] = None  # For checkout QR if needed
    message: str

# =====================================================
# VISITOR MANAGEMENT SCHEMAS
# =====================================================

class VisitorCreate(BaseModel):
    business_id: str
    user_id: Optional[str] = None  # If registered user
    name: str
    email: EmailStr
    phone: str
    visitor_type: VisitorType = VisitorType.guest
    company: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class VisitorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[VisitorStatus] = None

class VisitorResponse(BaseModel):
    id: str
    business_id: str
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    visitor_type: VisitorType
    company: Optional[str] = None
    purpose: Optional[str] = None
    status: VisitorStatus
    created_at: datetime
    last_visit: Optional[datetime] = None
    total_visits: int = 0
    
    class Config:
        orm_mode = True

class VisitorApproval(BaseModel):
    approved: bool
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None

# =====================================================
# ACCESS LOG SCHEMAS
# =====================================================

class AccessLogCreate(BaseModel):
    business_id: str
    visitor_id: str
    vehicle_access_id: Optional[str] = None
    access_method: AccessMethod
    access_type: AccessType
    location: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AccessLogResponse(BaseModel):
    id: str
    business_id: str
    visitor_id: str
    visitor_name: Optional[str] = None
    vehicle_plate: Optional[str] = None
    access_method: AccessMethod
    access_type: AccessType
    timestamp: datetime
    checkout_time: Optional[datetime] = None
    visit_duration: Optional[int] = None  # in minutes
    location: Optional[str] = None
    scanned_by: Optional[str] = None
    scanner_name: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        orm_mode = True

# =====================================================
# LIVE ACTIVITY SCHEMAS
# =====================================================

class ActiveVisitor(BaseModel):
    visitor_name: str
    check_in_time: datetime
    location: str
    duration_minutes: int
    vehicle_plate: Optional[str] = None

class RecentActivity(BaseModel):
    visitor_name: str
    action: AccessType
    timestamp: datetime
    location: str

class LiveActivityResponse(BaseModel):
    active_visitors_count: int
    active_visitors: List[ActiveVisitor]
    recent_activity: List[RecentActivity]
    today_total_visits: int

# =====================================================
# PLATE RECOGNITION SCHEMAS
# =====================================================

class PlateRecognitionRequest(BaseModel):
    business_id: str
    image_data: str  # Base64 encoded image
    camera_location: str
    camera_id: Optional[str] = None

class PlateRecognitionResponse(BaseModel):
    recognized: bool
    plate_number: Optional[str] = None
    vehicle_registered: bool = False
    access_granted: bool = False
    visitor_name: Optional[str] = None
    message: str
    confidence: Optional[float] = None

# =====================================================
# FACIAL RECOGNITION SCHEMAS
# =====================================================

class FaceRecognitionRequest(BaseModel):
    business_id: str
    image_data: str  # Base64 encoded image
    camera_location: str
    camera_id: Optional[str] = None

class FaceRecognitionResponse(BaseModel):
    recognized: bool
    visitor_id: Optional[str] = None
    visitor_name: Optional[str] = None
    access_granted: bool = False
    message: str
    confidence: Optional[float] = None

# =====================================================
# VEHICLE ACCESS SCHEMAS
# =====================================================

class VehicleAccessCreate(BaseModel):
    visitor_id: str
    plate_number: str
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_year: Optional[int] = None
    vin: Optional[str] = None

class VehicleAccessResponse(BaseModel):
    id: str
    visitor_id: str
    plate_number: str
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_color: Optional[str] = None
    vehicle_year: Optional[int] = None
    vin: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

# =====================================================
# BUSINESS ACCESS SETTINGS SCHEMAS
# =====================================================

class AccessSettings(BaseModel):
    qr_enabled: bool = True
    plate_recognition_enabled: bool = False
    facial_recognition_enabled: bool = False
    auto_checkout: bool = False
    checkout_timeout_minutes: int = 480  # 8 hours
    require_pre_approval: bool = False
    allow_guest_access: bool = True
    notifications_enabled: bool = True
    max_concurrent_visitors: Optional[int] = None
    operating_hours: Optional[Dict[str, str]] = None

class AccessSettingsUpdate(BaseModel):
    qr_enabled: Optional[bool] = None
    plate_recognition_enabled: Optional[bool] = None
    facial_recognition_enabled: Optional[bool] = None
    auto_checkout: Optional[bool] = None
    checkout_timeout_minutes: Optional[int] = None
    require_pre_approval: Optional[bool] = None
    allow_guest_access: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    max_concurrent_visitors: Optional[int] = None
    operating_hours: Optional[Dict[str, str]] = None

# =====================================================
# ANALYTICS SCHEMAS
# =====================================================

class AccessAnalytics(BaseModel):
    total_visits_today: int = 0
    total_visits_week: int = 0
    total_visits_month: int = 0
    unique_visitors_today: int = 0
    unique_visitors_week: int = 0
    unique_visitors_month: int = 0
    average_visit_duration: Optional[float] = None  # in minutes
    peak_hours: List[Dict[str, Any]] = []
    busiest_day: Optional[str] = None
    most_common_access_method: Optional[AccessMethod] = None
    visitor_return_rate: Optional[float] = None

class AccessReport(BaseModel):
    business_id: str
    period_start: datetime
    period_end: datetime
    analytics: AccessAnalytics
    top_visitors: List[Dict[str, Any]] = []
    access_patterns: List[Dict[str, Any]] = []
