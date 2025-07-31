# Dashboard Schemas
# Pydantic models for industry-specific dashboards and analytics

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

# =====================================================
# SHARED DASHBOARD COMPONENTS
# =====================================================

class AlertType(str, Enum):
    info = "info"
    warning = "warning"
    error = "error"
    success = "success"

class DashboardAlert(BaseModel):
    type: AlertType
    title: str
    message: str
    action_required: bool = False
    timestamp: datetime = None
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.utcnow()
        super().__init__(**data)

class BusinessInfo(BaseModel):
    id: str
    name: str
    industry: str
    address: str
    city: str
    phone: str
    email: str
    
    class Config:
        orm_mode = True

class HourlyStats(BaseModel):
    hour: int
    count: int

class DailyStats(BaseModel):
    date: date
    visits: int
    unique_visitors: int
    revenue: float = 0.0

class AccessMethodStats(BaseModel):
    method: str
    count: int
    percentage: float

# =====================================================
# AUTOMOTIVE/WORKSHOP DASHBOARD
# =====================================================

class VehicleInService(BaseModel):
    visitor_name: str
    vehicle_plate: str
    vehicle_info: str
    service_type: str
    check_in_time: datetime
    estimated_completion: datetime
    status: str = "in_progress"  # in_progress, completed, delayed

class ServiceTypeStats(BaseModel):
    service_type: str
    count: int
    percentage: Optional[float] = None

class AutomotiveDashboard(BaseModel):
    business_info: BusinessInfo
    vehicles_in_service: int
    total_vehicles_period: int
    average_service_time: int  # in minutes
    service_capacity: int
    capacity_utilization: float  # percentage
    revenue_period: float
    recent_vehicles: List[VehicleInService]
    service_breakdown: List[ServiceTypeStats]
    peak_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# PARKING DASHBOARD
# =====================================================

class ParkedVehicle(BaseModel):
    visitor_name: str
    vehicle_plate: str
    entry_time: datetime
    duration_minutes: int
    estimated_cost: float

class ParkingDashboard(BaseModel):
    business_info: BusinessInfo
    total_spaces: int
    occupied_spaces: int
    available_spaces: int
    occupancy_percentage: float
    total_parkings_period: int
    average_duration: int  # in minutes
    revenue_period: float
    current_hourly_rate: float
    current_vehicles: List[ParkedVehicle]
    peak_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# AIRPORT LOUNGE DASHBOARD
# =====================================================

class LoungeGuest(BaseModel):
    guest_name: str
    membership_type: str
    entry_time: datetime
    estimated_departure: Optional[datetime] = None
    duration_minutes: int
    special_requests: Optional[str] = None

class AirportDashboard(BaseModel):
    business_info: BusinessInfo
    current_guests: int
    total_capacity: int
    occupancy_percentage: float
    total_visits_period: int
    average_stay_duration: int  # in minutes
    revenue_period: float
    airport_code: str
    terminal: str
    guest_list: List[LoungeGuest]
    alerts: List[DashboardAlert]

# =====================================================
# BANK LOUNGE DASHBOARD
# =====================================================

class BankCustomer(BaseModel):
    customer_name: str
    card_type: str
    entry_time: datetime
    duration_minutes: int
    services_used: List[str] = []

class BankDashboard(BaseModel):
    business_info: BusinessInfo
    current_customers: int
    total_capacity: int
    occupancy_percentage: float
    total_visits_period: int
    average_stay_duration: int
    revenue_period: float
    bank_name: str
    eligible_cards: List[str]
    current_customers_list: List[BankCustomer]
    card_type_breakdown: List[ServiceTypeStats]
    alerts: List[DashboardAlert]

# =====================================================
# RESIDENTIAL DASHBOARD
# =====================================================

class ActiveVisitor(BaseModel):
    visitor_name: str
    visiting_unit: str
    entry_time: datetime
    duration_minutes: int
    visitor_type: str  # guest, delivery, service, contractor

class ResidentialDashboard(BaseModel):
    business_info: BusinessInfo
    active_visitors: int
    total_visits_today: int
    total_visits_period: int
    pending_approvals: int
    total_units: int
    visitor_breakdown: List[ServiceTypeStats]
    active_visitor_list: List[ActiveVisitor]
    peak_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# EDUCATIONAL DASHBOARD
# =====================================================

class CampusVisitor(BaseModel):
    visitor_name: str
    purpose: str
    department: Optional[str] = None
    entry_time: datetime
    duration_minutes: int
    escort_required: bool = False

class EducationalDashboard(BaseModel):
    business_info: BusinessInfo
    current_visitors: int
    total_visits_period: int
    student_capacity: int
    visitor_types: List[ServiceTypeStats]
    current_visitor_list: List[CampusVisitor]
    security_alerts: List[DashboardAlert]
    peak_visiting_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# CORPORATE DASHBOARD
# =====================================================

class CorporateVisitor(BaseModel):
    visitor_name: str
    company: Optional[str] = None
    meeting_with: Optional[str] = None
    department: Optional[str] = None
    entry_time: datetime
    duration_minutes: int
    security_clearance: str = "standard"

class CorporateDashboard(BaseModel):
    business_info: BusinessInfo
    current_visitors: int
    scheduled_meetings: int
    total_visits_period: int
    department_breakdown: List[ServiceTypeStats]
    current_visitor_list: List[CorporateVisitor]
    security_level_stats: List[ServiceTypeStats]
    peak_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# VALET PARKING DASHBOARD
# =====================================================

class ValetVehicle(BaseModel):
    customer_name: str
    vehicle_plate: str
    vehicle_info: str
    drop_off_time: datetime
    estimated_pickup: Optional[datetime] = None
    duration_minutes: int
    service_type: str  # hotel, restaurant, event
    status: str = "parked"  # parked, retrieving, ready

class ValetDashboard(BaseModel):
    business_info: BusinessInfo
    vehicles_in_service: int
    total_capacity: int
    utilization_percentage: float
    total_services_period: int
    average_service_duration: int
    revenue_period: float
    current_vehicles: List[ValetVehicle]
    service_type_breakdown: List[ServiceTypeStats]
    peak_hours: List[HourlyStats]
    alerts: List[DashboardAlert]

# =====================================================
# UNIVERSAL BUSINESS ANALYTICS
# =====================================================

class BusinessAnalytics(BaseModel):
    business_info: BusinessInfo
    period: str
    total_visits: int
    unique_visitors: int
    total_revenue: float
    average_visit_duration: int  # in minutes
    visitor_return_rate: float  # percentage
    daily_stats: List[DailyStats]
    access_method_breakdown: List[AccessMethodStats]
    growth_metrics: Optional[Dict[str, float]] = None

# =====================================================
# REAL-TIME METRICS
# =====================================================

class RealTimeMetrics(BaseModel):
    current_occupancy: int
    capacity_utilization: float
    todays_revenue: float
    todays_visits: int
    average_wait_time: Optional[int] = None  # in minutes
    system_status: str = "operational"  # operational, maintenance, offline
    last_updated: datetime

class LiveDashboardUpdate(BaseModel):
    business_id: str
    metrics: RealTimeMetrics
    recent_activity: List[Dict[str, Any]]
    alerts: List[DashboardAlert]
    timestamp: datetime

# =====================================================
# DASHBOARD CONFIGURATION
# =====================================================

class DashboardWidget(BaseModel):
    widget_id: str
    widget_type: str  # chart, metric, list, alert
    title: str
    position: Dict[str, int]  # x, y, width, height
    config: Dict[str, Any]
    is_visible: bool = True

class DashboardLayout(BaseModel):
    business_id: str
    layout_name: str
    widgets: List[DashboardWidget]
    is_default: bool = False
    created_by: str
    created_at: datetime

# =====================================================
# NOTIFICATION PREFERENCES
# =====================================================

class NotificationSettings(BaseModel):
    email_alerts: bool = True
    sms_alerts: bool = False
    push_notifications: bool = True
    alert_types: List[AlertType] = [AlertType.warning, AlertType.error]
    quiet_hours_start: Optional[str] = None  # HH:MM format
    quiet_hours_end: Optional[str] = None

# =====================================================
# EXPORT/REPORT SCHEMAS
# =====================================================

class ReportRequest(BaseModel):
    business_id: str
    report_type: str  # visitors, revenue, analytics, access_logs
    period_start: datetime
    period_end: datetime
    format: str = "pdf"  # pdf, excel, csv
    filters: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    report_id: str
    download_url: str
    expires_at: datetime
    file_size_bytes: int
    generated_at: datetime

# =====================================================
# DASHBOARD SEARCH & FILTERS
# =====================================================

class DashboardFilter(BaseModel):
    date_range: Optional[Dict[str, datetime]] = None
    visitor_type: Optional[str] = None
    access_method: Optional[str] = None
    status: Optional[str] = None
    search_term: Optional[str] = None

class FilteredDashboardData(BaseModel):
    filtered_results: Dict[str, Any]
    total_count: int
    applied_filters: DashboardFilter
    suggestions: List[str] = []
