# AXS360 - Business Management API
# Multi-tenant business registration and management

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime, timedelta

from ..database import get_db
from ..models.business import Business, BusinessEmployee, BusinessPlan
from ..models.industry_specific import Workshop, AirportLounge, ParkingFacility, BankLounge, Residential, School, Corporate, ValetParking
from ..models.user import User
from ..models.billing import CommissionRule, Invoice
from ..core.security import get_current_user, require_roles
from ..schemas.business import *
from ..services.qr_service import generate_business_qr
from ..services.email_service import send_business_welcome_email

router = APIRouter(prefix="/api/business", tags=["Business Management"])

# =====================================================
# BUSINESS REGISTRATION & MANAGEMENT
# =====================================================

@router.post("/register", response_model=BusinessResponse)
async def register_business(
    business_data: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new business in the platform
    Supports: automotive, parking, airport, banking, residential, education, corporate, valet
    """
    
    # Check if business already exists
    existing_business = db.query(Business).filter(
        Business.email == business_data.email
    ).first()
    
    if existing_business:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business with this email already exists"
        )
    
    # Create main business record
    new_business = Business(
        id=str(uuid.uuid4()),
        name=business_data.name,
        business_type=business_data.business_type,
        industry=business_data.industry,
        email=business_data.email,
        phone=business_data.phone,
        address=business_data.address,
        city=business_data.city,
        state=business_data.state,
        country=business_data.country,
        postal_code=business_data.postal_code,
        tax_id=business_data.tax_id,
        website=business_data.website,
        description=business_data.description,
        owner_id=current_user.id,
        status="pending_verification",
        settings={
            "qr_enabled": True,
            "plate_recognition": False,
            "facial_recognition": False,
            "auto_checkout": business_data.industry in ["parking", "valet"],
            "notifications_enabled": True,
            "multi_location": False
        }
    )
    
    db.add(new_business)
    db.flush()  # Get the ID
    
    # Create industry-specific records
    industry_record = None
    
    if business_data.industry == "automotive":
        industry_record = Workshop(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            workshop_type=business_data.industry_data.get("workshop_type", "general"),
            certifications=business_data.industry_data.get("certifications", []),
            insurance_partnerships=business_data.industry_data.get("insurance_partnerships", []),
            service_capacity=business_data.industry_data.get("service_capacity", 10),
            specializations=business_data.industry_data.get("specializations", [])
        )
    
    elif business_data.industry == "parking":
        industry_record = ParkingFacility(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            facility_type=business_data.industry_data.get("facility_type", "surface"),
            total_spaces=business_data.industry_data.get("total_spaces", 50),
            available_spaces=business_data.industry_data.get("total_spaces", 50),
            hourly_rate=business_data.industry_data.get("hourly_rate", 25.00),
            daily_rate=business_data.industry_data.get("daily_rate", 150.00),
            monthly_rate=business_data.industry_data.get("monthly_rate", 2500.00),
            accepts_reservations=business_data.industry_data.get("accepts_reservations", True),
            valet_service=business_data.industry_data.get("valet_service", False)
        )
    
    elif business_data.industry == "airport":
        industry_record = AirportLounge(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            airport_code=business_data.industry_data.get("airport_code"),
            terminal=business_data.industry_data.get("terminal"),
            lounge_type=business_data.industry_data.get("lounge_type", "premium"),
            capacity=business_data.industry_data.get("capacity", 100),
            bank_partnerships=business_data.industry_data.get("bank_partnerships", []),
            access_methods=business_data.industry_data.get("access_methods", ["credit_card", "membership"]),
            amenities=business_data.industry_data.get("amenities", [])
        )
    
    elif business_data.industry == "banking":
        industry_record = BankLounge(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            bank_name=business_data.industry_data.get("bank_name"),
            location_type=business_data.industry_data.get("location_type", "branch"),
            eligible_cards=business_data.industry_data.get("eligible_cards", []),
            minimum_spend=business_data.industry_data.get("minimum_spend", 0),
            capacity=business_data.industry_data.get("capacity", 50),
            operating_hours=business_data.industry_data.get("operating_hours", {}),
            amenities=business_data.industry_data.get("amenities", [])
        )
    
    elif business_data.industry == "residential":
        industry_record = Residential(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            complex_type=business_data.industry_data.get("complex_type", "condominiums"),
            total_units=business_data.industry_data.get("total_units", 100),
            visitor_policy=business_data.industry_data.get("visitor_policy", "pre_approval"),
            security_level=business_data.industry_data.get("security_level", "medium"),
            amenities=business_data.industry_data.get("amenities", [])
        )
    
    elif business_data.industry == "education":
        industry_record = School(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            institution_type=business_data.industry_data.get("institution_type", "university"),
            student_capacity=business_data.industry_data.get("student_capacity", 1000),
            grade_levels=business_data.industry_data.get("grade_levels", []),
            visitor_policy=business_data.industry_data.get("visitor_policy", "scheduled_only"),
            security_requirements=business_data.industry_data.get("security_requirements", [])
        )
    
    elif business_data.industry == "corporate":
        industry_record = Corporate(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            company_size=business_data.industry_data.get("company_size", "medium"),
            industry_sector=business_data.industry_data.get("industry_sector"),
            security_clearance=business_data.industry_data.get("security_clearance", "standard"),
            visitor_policy=business_data.industry_data.get("visitor_policy", "appointment_required"),
            departments=business_data.industry_data.get("departments", [])
        )
    
    elif business_data.industry == "valet":
        industry_record = ValetParking(
            id=str(uuid.uuid4()),
            business_id=new_business.id,
            service_type=business_data.industry_data.get("service_type", "hotel"),
            capacity=business_data.industry_data.get("capacity", 50),
            pricing_model=business_data.industry_data.get("pricing_model", "flat_rate"),
            insurance_coverage=business_data.industry_data.get("insurance_coverage", 1000000),
            operates_24_7=business_data.industry_data.get("operates_24_7", True)
        )
    
    if industry_record:
        db.add(industry_record)
    
    # Create default commission rule
    commission_rule = CommissionRule(
        id=str(uuid.uuid4()),
        business_id=new_business.id,
        commission_type="percentage",
        rate=0.05,  # 5% default
        applies_to="all_transactions",
        minimum_amount=0,
        is_active=True
    )
    db.add(commission_rule)
    
    # Add owner as admin employee
    owner_employee = BusinessEmployee(
        id=str(uuid.uuid4()),
        business_id=new_business.id,
        user_id=current_user.id,
        role="owner",
        permissions=["all"],
        status="active"
    )
    db.add(owner_employee)
    
    db.commit()
    
    # Generate QR code for business
    qr_code = await generate_business_qr(new_business.id)
    
    # Send welcome email
    await send_business_welcome_email(
        business_email=new_business.email,
        business_name=new_business.name,
        owner_name=current_user.full_name
    )
    
    return BusinessResponse.from_orm(new_business)

@router.get("/my-businesses", response_model=List[BusinessResponse])
async def get_my_businesses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all businesses owned or managed by current user"""
    
    # Get businesses where user is owner or employee
    businesses = db.query(Business).join(BusinessEmployee).filter(
        BusinessEmployee.user_id == current_user.id,
        BusinessEmployee.status == "active"
    ).all()
    
    return [BusinessResponse.from_orm(business) for business in businesses]

@router.get("/{business_id}", response_model=BusinessDetailResponse)
async def get_business_details(
    business_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin", "manager"]))
):
    """Get detailed information about a specific business"""
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Check permissions
    employee = db.query(BusinessEmployee).filter(
        BusinessEmployee.business_id == business_id,
        BusinessEmployee.user_id == current_user.id,
        BusinessEmployee.status == "active"
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this business"
        )
    
    return BusinessDetailResponse.from_orm(business)

@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: str,
    update_data: BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin"]))
):
    """Update business information"""
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if hasattr(business, field):
            setattr(business, field, value)
    
    business.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(business)
    
    return BusinessResponse.from_orm(business)

# =====================================================
# BUSINESS CONFIGURATION & SETTINGS
# =====================================================

@router.post("/{business_id}/configure-access", response_model=dict)
async def configure_access_methods(
    business_id: str,
    config: AccessMethodConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin"]))
):
    """Configure access methods (QR, plate recognition, facial recognition)"""
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Update settings
    settings = business.settings or {}
    settings.update({
        "qr_enabled": config.qr_enabled,
        "plate_recognition": config.plate_recognition,
        "facial_recognition": config.facial_recognition,
        "auto_checkout": config.auto_checkout,
        "checkout_timeout": config.checkout_timeout,
        "notifications_enabled": config.notifications_enabled,
        "require_pre_approval": config.require_pre_approval
    })
    
    business.settings = settings
    business.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Access methods configured successfully",
        "settings": settings
    }

@router.get("/{business_id}/qr-code")
async def get_business_qr_code(
    business_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin", "manager"]))
):
    """Get QR code for business access"""
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    qr_data = await generate_business_qr(business_id)
    
    return {
        "business_id": business_id,
        "qr_code": qr_data["qr_code"],
        "qr_url": qr_data["qr_url"],
        "expires_at": qr_data["expires_at"]
    }

# =====================================================
# EMPLOYEE MANAGEMENT
# =====================================================

@router.post("/{business_id}/employees", response_model=BusinessEmployeeResponse)
async def add_employee(
    business_id: str,
    employee_data: BusinessEmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin"]))
):
    """Add new employee to business"""
    
    # Check if user exists
    user = db.query(User).filter(User.email == employee_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email"
        )
    
    # Check if already employee
    existing = db.query(BusinessEmployee).filter(
        BusinessEmployee.business_id == business_id,
        BusinessEmployee.user_id == user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an employee of this business"
        )
    
    new_employee = BusinessEmployee(
        id=str(uuid.uuid4()),
        business_id=business_id,
        user_id=user.id,
        role=employee_data.role,
        permissions=employee_data.permissions,
        status="active",
        hire_date=datetime.utcnow()
    )
    
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return BusinessEmployeeResponse.from_orm(new_employee)

@router.get("/{business_id}/employees", response_model=List[BusinessEmployeeResponse])
async def get_business_employees(
    business_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin", "manager"]))
):
    """Get all employees of a business"""
    
    employees = db.query(BusinessEmployee).filter(
        BusinessEmployee.business_id == business_id,
        BusinessEmployee.status == "active"
    ).all()
    
    return [BusinessEmployeeResponse.from_orm(emp) for emp in employees]

# =====================================================
# BUSINESS ANALYTICS & METRICS
# =====================================================

@router.get("/{business_id}/analytics", response_model=dict)
async def get_business_analytics(
    business_id: str,
    period: str = "week",  # week, month, quarter, year
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["owner", "admin", "manager"]))
):
    """Get business analytics and metrics"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    if period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    elif period == "quarter":
        start_date = end_date - timedelta(days=90)
    else:  # year
        start_date = end_date - timedelta(days=365)
    
    # TODO: Implement actual analytics queries
    # This will connect to access logs, payments, etc.
    
    return {
        "business_id": business_id,
        "period": period,
        "total_accesses": 0,  # Will implement with access log model
        "unique_visitors": 0,
        "revenue": 0.00,
        "commission_earned": 0.00,
        "peak_hours": [],
        "popular_services": [],
        "customer_satisfaction": 0.0
    }
