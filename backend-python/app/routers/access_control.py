# Access Control API - QR Scanning & Visitor Management
# Multi-industry access control with QR codes, plate recognition, and visitor tracking

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import json

from ..database import get_db
from ..models.user import User
from ..models.business import Business
from ..models.access_control import AccessLog, Visitor, VehicleAccess
from ..core.security import get_current_user, get_optional_user
from ..schemas.access import *
from ..services.qr_service import generate_access_qr, validate_qr_token
from ..services.notification_service import send_access_notification
from ..services.plate_recognition import recognize_plate
from ..services.face_recognition import verify_face

router = APIRouter(prefix="/api/access", tags=["Access Control"])

# =====================================================
# QR CODE GENERATION & VALIDATION
# =====================================================

@router.post("/generate-qr", response_model=QRAccessResponse)
async def generate_access_qr_code(
    qr_request: QRAccessRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Generate QR code for business access
    Can be used by registered users or guests (with business approval)
    """
    
    # Verify business exists and is active
    business = db.query(Business).filter(
        Business.id == qr_request.business_id,
        Business.status == "active"
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or inactive"
        )
    
    # Check if business requires pre-approval for guests
    settings = business.settings or {}
    requires_approval = settings.get("require_pre_approval", False)
    
    if not current_user and requires_approval:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This business requires pre-approval for guest access"
        )
    
    # Create or update visitor record
    visitor_data = None
    if current_user:
        visitor_data = {
            "user_id": current_user.id,
            "name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone
        }
    else:
        # Guest access
        visitor_data = {
            "name": qr_request.visitor_name,
            "email": qr_request.visitor_email,
            "phone": qr_request.visitor_phone
        }
    
    # Check for existing visitor
    visitor = None
    if current_user:
        visitor = db.query(Visitor).filter(
            Visitor.business_id == qr_request.business_id,
            Visitor.user_id == current_user.id
        ).first()
    else:
        visitor = db.query(Visitor).filter(
            Visitor.business_id == qr_request.business_id,
            Visitor.email == qr_request.visitor_email
        ).first()
    
    if not visitor:
        visitor = Visitor(
            id=str(uuid.uuid4()),
            business_id=qr_request.business_id,
            user_id=current_user.id if current_user else None,
            name=visitor_data["name"],
            email=visitor_data["email"],
            phone=visitor_data["phone"],
            visitor_type="registered" if current_user else "guest",
            status="approved"  # Auto-approve for now
        )
        db.add(visitor)
        db.flush()
    
    # Create vehicle access record if vehicle info provided
    vehicle_access = None
    if qr_request.vehicle_plate:
        vehicle_access = VehicleAccess(
            id=str(uuid.uuid4()),
            visitor_id=visitor.id,
            plate_number=qr_request.vehicle_plate.upper(),
            vehicle_make=qr_request.vehicle_make,
            vehicle_model=qr_request.vehicle_model,
            vehicle_color=qr_request.vehicle_color,
            vin=qr_request.vehicle_vin
        )
        db.add(vehicle_access)
        db.flush()
    
    # Generate QR code with access token
    qr_data = await generate_access_qr(
        business_id=qr_request.business_id,
        visitor_id=visitor.id,
        vehicle_id=vehicle_access.id if vehicle_access else None,
        valid_until=qr_request.valid_until,
        access_type=qr_request.access_type,
        visit_purpose=qr_request.visit_purpose
    )
    
    # Create initial access log entry
    access_log = AccessLog(
        id=str(uuid.uuid4()),
        business_id=qr_request.business_id,
        visitor_id=visitor.id,
        vehicle_access_id=vehicle_access.id if vehicle_access else None,
        access_method="qr_code",
        access_type="qr_generated",
        timestamp=datetime.utcnow(),
        qr_token=qr_data["access_token"],
        location=qr_request.entry_point,
        notes=f"QR generated for: {qr_request.visit_purpose}",
        metadata={
            "generated_by": current_user.id if current_user else "guest",
            "device_info": qr_request.device_info
        }
    )
    
    db.add(access_log)
    db.commit()
    
    # Send notification to business if enabled
    if settings.get("notifications_enabled", True):
        await send_access_notification(
            business=business,
            visitor=visitor,
            action="qr_generated",
            details={"purpose": qr_request.visit_purpose}
        )
    
    return QRAccessResponse(
        qr_code=qr_data["qr_code"],
        qr_data=qr_data["qr_data"],
        access_token=qr_data["access_token"],
        valid_until=qr_data["valid_until"],
        business_name=business.name,
        visitor_id=visitor.id,
        entry_instructions=f"Present this QR code at {business.name} entrance"
    )

@router.post("/scan-qr", response_model=AccessScanResponse)
async def scan_qr_code(
    scan_request: QRScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scan and validate QR code for access control
    Used by business employees at entry/exit points
    """
    
    # Validate QR token
    token_data = await validate_qr_token(scan_request.qr_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired QR code"
        )
    
    business_id = token_data.get("business_id")
    visitor_id = token_data.get("visitor_id")
    
    # Verify business access
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
    # Get visitor info
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    # Check for existing active access (already checked in)
    existing_access = db.query(AccessLog).filter(
        AccessLog.visitor_id == visitor_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).first()
    
    access_type = "check_out" if existing_access else "check_in"
    
    # Create access log entry
    access_log = AccessLog(
        id=str(uuid.uuid4()),
        business_id=business_id,
        visitor_id=visitor_id,
        vehicle_access_id=token_data.get("vehicle_id"),
        access_method="qr_code",
        access_type=access_type,
        timestamp=datetime.utcnow(),
        qr_token=scan_request.qr_token,
        location=scan_request.scan_location,
        scanned_by=current_user.id,
        notes=scan_request.notes,
        metadata={
            "scanner_device": scan_request.scanner_device,
            "scan_method": scan_request.scan_method
        }
    )
    
    # If this is a checkout, update the checkin record
    if access_type == "check_out" and existing_access:
        existing_access.checkout_time = datetime.utcnow()
        existing_access.visit_duration = int(
            (existing_access.checkout_time - existing_access.timestamp).total_seconds() / 60
        )
    
    db.add(access_log)
    db.commit()
    db.refresh(access_log)
    
    # Auto-generate checkout QR if business has auto-checkout disabled
    settings = business.settings or {}
    checkout_qr = None
    if access_type == "check_in" and not settings.get("auto_checkout", False):
        checkout_qr_data = await generate_access_qr(
            business_id=business_id,
            visitor_id=visitor_id,
            access_type="checkout_only",
            valid_until=datetime.utcnow() + timedelta(hours=24)
        )
        checkout_qr = checkout_qr_data["qr_code"]
    
    # Send notifications
    if settings.get("notifications_enabled", True):
        await send_access_notification(
            business=business,
            visitor=visitor,
            action=access_type,
            details={
                "location": scan_request.scan_location,
                "time": access_log.timestamp.isoformat()
            }
        )
    
    return AccessScanResponse(
        access_granted=True,
        access_type=access_type,
        visitor_name=visitor.name,
        business_name=business.name,
        timestamp=access_log.timestamp,
        location=scan_request.scan_location,
        visit_duration=existing_access.visit_duration if access_type == "check_out" else None,
        checkout_qr=checkout_qr,
        message=f"Access {access_type.replace('_', ' ')} successful"
    )

# =====================================================
# VISITOR MANAGEMENT
# =====================================================

@router.post("/register-visitor", response_model=VisitorResponse)
async def register_visitor(
    visitor_data: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new visitor for a business"""
    
    # Check if visitor already exists
    existing_visitor = db.query(Visitor).filter(
        Visitor.business_id == visitor_data.business_id,
        Visitor.email == visitor_data.email
    ).first()
    
    if existing_visitor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Visitor already registered for this business"
        )
    
    new_visitor = Visitor(
        id=str(uuid.uuid4()),
        business_id=visitor_data.business_id,
        user_id=visitor_data.user_id,
        name=visitor_data.name,
        email=visitor_data.email,
        phone=visitor_data.phone,
        visitor_type=visitor_data.visitor_type,
        company=visitor_data.company,
        purpose=visitor_data.purpose,
        status="pending_approval",
        registered_by=current_user.id,
        metadata=visitor_data.metadata or {}
    )
    
    db.add(new_visitor)
    db.commit()
    db.refresh(new_visitor)
    
    return VisitorResponse.from_orm(new_visitor)

@router.get("/visitors/{business_id}", response_model=List[VisitorResponse])
async def get_business_visitors(
    business_id: str,
    status: Optional[str] = Query(None),
    visitor_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visitors for a business with filtering options"""
    
    query = db.query(Visitor).filter(Visitor.business_id == business_id)
    
    if status:
        query = query.filter(Visitor.status == status)
    
    if visitor_type:
        query = query.filter(Visitor.visitor_type == visitor_type)
    
    if search:
        query = query.filter(
            or_(
                Visitor.name.icontains(search),
                Visitor.email.icontains(search),
                Visitor.company.icontains(search)
            )
        )
    
    visitors = query.order_by(desc(Visitor.created_at)).offset(offset).limit(limit).all()
    
    return [VisitorResponse.from_orm(visitor) for visitor in visitors]

@router.put("/visitors/{visitor_id}/approve", response_model=VisitorResponse)
async def approve_visitor(
    visitor_id: str,
    approval_data: VisitorApproval,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a visitor"""
    
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Visitor not found"
        )
    
    visitor.status = "approved" if approval_data.approved else "rejected"
    visitor.approved_by = current_user.id
    visitor.approval_date = datetime.utcnow()
    visitor.approval_notes = approval_data.notes
    
    db.commit()
    db.refresh(visitor)
    
    # Send notification to visitor
    business = db.query(Business).filter(Business.id == visitor.business_id).first()
    await send_access_notification(
        business=business,
        visitor=visitor,
        action="visitor_approved" if approval_data.approved else "visitor_rejected",
        details={"notes": approval_data.notes}
    )
    
    return VisitorResponse.from_orm(visitor)

# =====================================================
# ACCESS LOGS & HISTORY
# =====================================================

@router.get("/logs/{business_id}", response_model=List[AccessLogResponse])
async def get_access_logs(
    business_id: str,
    access_type: Optional[str] = Query(None),
    visitor_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get access logs for a business with filtering"""
    
    query = db.query(AccessLog).filter(AccessLog.business_id == business_id)
    
    if access_type:
        query = query.filter(AccessLog.access_type == access_type)
    
    if visitor_id:
        query = query.filter(AccessLog.visitor_id == visitor_id)
    
    if date_from:
        query = query.filter(AccessLog.timestamp >= date_from)
    
    if date_to:
        query = query.filter(AccessLog.timestamp <= date_to)
    
    logs = query.order_by(desc(AccessLog.timestamp)).offset(offset).limit(limit).all()
    
    return [AccessLogResponse.from_orm(log) for log in logs]

@router.get("/live-activity/{business_id}", response_model=LiveActivityResponse)
async def get_live_activity(
    business_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get real-time activity for a business"""
    
    # Get currently checked-in visitors
    active_visitors = db.query(AccessLog).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).all()
    
    # Get recent activity (last 2 hours)
    recent_cutoff = datetime.utcnow() - timedelta(hours=2)
    recent_activity = db.query(AccessLog).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= recent_cutoff
    ).order_by(desc(AccessLog.timestamp)).limit(20).all()
    
    # Get today's stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_stats = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= today_start,
        AccessLog.access_type == "check_in"
    ).count()
    
    return LiveActivityResponse(
        active_visitors_count=len(active_visitors),
        active_visitors=[
            {
                "visitor_name": log.visitor.name,
                "check_in_time": log.timestamp,
                "location": log.location,
                "duration_minutes": int((datetime.utcnow() - log.timestamp).total_seconds() / 60)
            }
            for log in active_visitors
        ],
        recent_activity=[
            {
                "visitor_name": log.visitor.name,
                "action": log.access_type,
                "timestamp": log.timestamp,
                "location": log.location
            }
            for log in recent_activity
        ],
        today_total_visits=today_stats
    )

# =====================================================
# PLATE RECOGNITION & FACIAL RECOGNITION
# =====================================================

@router.post("/recognize-plate", response_model=PlateRecognitionResponse)
async def recognize_vehicle_plate(
    recognition_request: PlateRecognitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recognize license plate for automatic access"""
    
    # Process plate recognition
    plate_result = await recognize_plate(recognition_request.image_data)
    
    if not plate_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not recognize license plate"
        )
    
    plate_number = plate_result["plate_number"]
    
    # Look for registered vehicle
    vehicle_access = db.query(VehicleAccess).join(Visitor).filter(
        VehicleAccess.plate_number == plate_number.upper(),
        Visitor.business_id == recognition_request.business_id,
        Visitor.status == "approved"
    ).first()
    
    if not vehicle_access:
        return PlateRecognitionResponse(
            recognized=True,
            plate_number=plate_number,
            vehicle_registered=False,
            access_granted=False,
            message="Vehicle not registered for this business"
        )
    
    # Grant access and create log
    access_log = AccessLog(
        id=str(uuid.uuid4()),
        business_id=recognition_request.business_id,
        visitor_id=vehicle_access.visitor_id,
        vehicle_access_id=vehicle_access.id,
        access_method="plate_recognition",
        access_type="check_in",
        timestamp=datetime.utcnow(),
        location=recognition_request.camera_location,
        scanned_by=current_user.id,
        metadata={
            "camera_id": recognition_request.camera_id,
            "confidence": plate_result.get("confidence", 0.9)
        }
    )
    
    db.add(access_log)
    db.commit()
    
    return PlateRecognitionResponse(
        recognized=True,
        plate_number=plate_number,
        vehicle_registered=True,
        access_granted=True,
        visitor_name=vehicle_access.visitor.name,
        message="Access granted via plate recognition"
    )
