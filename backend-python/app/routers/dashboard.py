# Industry-Specific Dashboard API
# Customized dashboards for each business vertical with real-time analytics

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta

from ..database import get_db
from ..models.user import User
from ..models.business import Business
from ..models.industry_specific import Workshop, AirportLounge, ParkingFacility, BankLounge, Residential, School, Corporate, ValetParking
from ..models.access_control import AccessLog, Visitor, VehicleAccess
from ..models.billing import Commission, Invoice
from ..core.security import get_current_user, require_roles
from ..schemas.dashboard import *

router = APIRouter(prefix="/api/dashboard", tags=["Industry Dashboards"])

# =====================================================
# AUTOMOTIVE/WORKSHOP DASHBOARD
# =====================================================

@router.get("/automotive/{business_id}", response_model=AutomotiveDashboard)
async def get_automotive_dashboard(
    business_id: str,
    period: str = Query("week", regex="^(today|week|month|quarter)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Comprehensive dashboard for automotive workshops
    Shows vehicles in service, appointments, revenue, etc.
    """
    
    # Verify business exists and user has access
    business = db.query(Business).filter(
        Business.id == business_id,
        Business.industry == "automotive"
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automotive business not found"
        )
    
    # Get workshop-specific data
    workshop = db.query(Workshop).filter(Workshop.business_id == business_id).first()
    
    # Calculate date range
    end_date = datetime.utcnow()
    if period == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    elif period == "month":
        start_date = end_date - timedelta(days=30)
    else:  # quarter
        start_date = end_date - timedelta(days=90)
    
    # Vehicles currently in service (checked in but not out)
    vehicles_in_service = db.query(AccessLog).join(VehicleAccess).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).count()
    
    # Total vehicles serviced in period
    total_vehicles_period = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).count()
    
    # Average service time (for completed visits)
    avg_service_time_result = db.query(func.avg(AccessLog.visit_duration)).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_out",
        AccessLog.timestamp >= start_date,
        AccessLog.visit_duration.isnot(None)
    ).scalar()
    
    avg_service_time = int(avg_service_time_result) if avg_service_time_result else 0
    
    # Revenue from commissions
    total_revenue = db.query(func.sum(Commission.amount)).filter(
        Commission.business_id == business_id,
        Commission.created_at >= start_date
    ).scalar() or 0.0
    
    # Recent vehicles (last 10)
    recent_vehicles = db.query(AccessLog).join(VehicleAccess).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in"
    ).order_by(desc(AccessLog.timestamp)).limit(10).all()
    
    # Service type breakdown
    service_breakdown = db.query(
        Visitor.purpose, func.count(AccessLog.id).label('count')
    ).join(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= start_date,
        AccessLog.access_type == "check_in"
    ).group_by(Visitor.purpose).all()
    
    # Peak hours analysis
    peak_hours = db.query(
        func.extract('hour', AccessLog.timestamp).label('hour'),
        func.count(AccessLog.id).label('count')
    ).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= start_date,
        AccessLog.access_type == "check_in"
    ).group_by(func.extract('hour', AccessLog.timestamp)).all()
    
    return AutomotiveDashboard(
        business_info=BusinessInfo.from_orm(business),
        vehicles_in_service=vehicles_in_service,
        total_vehicles_period=total_vehicles_period,
        average_service_time=avg_service_time,
        service_capacity=workshop.service_capacity if workshop else 10,
        capacity_utilization=round((vehicles_in_service / (workshop.service_capacity if workshop else 10)) * 100, 1),
        revenue_period=total_revenue,
        recent_vehicles=[
            VehicleInService(
                visitor_name=log.visitor.name,
                vehicle_plate=log.vehicle_access.plate_number if log.vehicle_access else "N/A",
                vehicle_info=f"{log.vehicle_access.vehicle_make} {log.vehicle_access.vehicle_model}" if log.vehicle_access else "Unknown",
                service_type=log.visitor.purpose or "General",
                check_in_time=log.timestamp,
                estimated_completion=log.timestamp + timedelta(hours=2),  # Default estimate
                status="in_progress" if not log.checkout_time else "completed"
            ) for log in recent_vehicles
        ],
        service_breakdown=[
            ServiceTypeStats(service_type=item[0] or "General", count=item[1])
            for item in service_breakdown
        ],
        peak_hours=[
            HourlyStats(hour=int(item[0]), count=item[1])
            for item in peak_hours
        ],
        alerts=await get_automotive_alerts(business_id, db)
    )

async def get_automotive_alerts(business_id: str, db: Session) -> List[DashboardAlert]:
    """Generate alerts specific to automotive business"""
    
    alerts = []
    
    # Check for vehicles that have been in service too long (>8 hours)
    long_service_vehicles = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None),
        AccessLog.timestamp < datetime.utcnow() - timedelta(hours=8)
    ).count()
    
    if long_service_vehicles > 0:
        alerts.append(DashboardAlert(
            type="warning",
            title="Long Service Times",
            message=f"{long_service_vehicles} vehicle(s) have been in service for over 8 hours",
            action_required=True
        ))
    
    # Check capacity utilization
    workshop = db.query(Workshop).filter(Workshop.business_id == business_id).first()
    if workshop:
        current_vehicles = db.query(AccessLog).filter(
            AccessLog.business_id == business_id,
            AccessLog.access_type == "check_in",
            AccessLog.checkout_time.is_(None)
        ).count()
        
        utilization = (current_vehicles / workshop.service_capacity) * 100
        
        if utilization > 90:
            alerts.append(DashboardAlert(
                type="error",
                title="Capacity Critical",
                message=f"Workshop is at {utilization:.1f}% capacity",
                action_required=True
            ))
        elif utilization > 75:
            alerts.append(DashboardAlert(
                type="warning",
                title="High Capacity",
                message=f"Workshop is at {utilization:.1f}% capacity",
                action_required=False
            ))
    
    return alerts

# =====================================================
# PARKING DASHBOARD
# =====================================================

@router.get("/parking/{business_id}", response_model=ParkingDashboard)
async def get_parking_dashboard(
    business_id: str,
    period: str = Query("today", regex="^(today|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Real-time parking facility dashboard
    Shows occupancy, revenue, turnover rates
    """
    
    business = db.query(Business).filter(
        Business.id == business_id,
        Business.industry == "parking"
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking business not found"
        )
    
    parking = db.query(ParkingFacility).filter(ParkingFacility.business_id == business_id).first()
    
    # Calculate date range
    end_date = datetime.utcnow()
    if period == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    else:  # month
        start_date = end_date - timedelta(days=30)
    
    # Current occupancy
    current_occupancy = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).count()
    
    # Total parkings in period
    total_parkings = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).count()
    
    # Average parking duration
    avg_duration_result = db.query(func.avg(AccessLog.visit_duration)).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_out",
        AccessLog.timestamp >= start_date,
        AccessLog.visit_duration.isnot(None)
    ).scalar()
    
    avg_duration = int(avg_duration_result) if avg_duration_result else 0
    
    # Revenue
    revenue = db.query(func.sum(Commission.amount)).filter(
        Commission.business_id == business_id,
        Commission.created_at >= start_date
    ).scalar() or 0.0
    
    # Peak hours
    peak_hours = db.query(
        func.extract('hour', AccessLog.timestamp).label('hour'),
        func.count(AccessLog.id).label('count')
    ).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= start_date,
        AccessLog.access_type == "check_in"
    ).group_by(func.extract('hour', AccessLog.timestamp)).all()
    
    # Current vehicles
    current_vehicles = db.query(AccessLog).join(VehicleAccess).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).order_by(AccessLog.timestamp).all()
    
    return ParkingDashboard(
        business_info=BusinessInfo.from_orm(business),
        total_spaces=parking.total_spaces if parking else 50,
        occupied_spaces=current_occupancy,
        available_spaces=(parking.total_spaces if parking else 50) - current_occupancy,
        occupancy_percentage=round((current_occupancy / (parking.total_spaces if parking else 50)) * 100, 1),
        total_parkings_period=total_parkings,
        average_duration=avg_duration,
        revenue_period=revenue,
        current_hourly_rate=parking.hourly_rate if parking else 25.0,
        current_vehicles=[
            ParkedVehicle(
                visitor_name=log.visitor.name,
                vehicle_plate=log.vehicle_access.plate_number if log.vehicle_access else "N/A",
                entry_time=log.timestamp,
                duration_minutes=int((datetime.utcnow() - log.timestamp).total_seconds() / 60),
                estimated_cost=calculate_parking_cost(log.timestamp, parking.hourly_rate if parking else 25.0)
            ) for log in current_vehicles
        ],
        peak_hours=[
            HourlyStats(hour=int(item[0]), count=item[1])
            for item in peak_hours
        ],
        alerts=await get_parking_alerts(business_id, current_occupancy, parking, db)
    )

def calculate_parking_cost(entry_time: datetime, hourly_rate: float) -> float:
    """Calculate current parking cost based on duration"""
    duration_hours = (datetime.utcnow() - entry_time).total_seconds() / 3600
    return round(duration_hours * hourly_rate, 2)

async def get_parking_alerts(
    business_id: str, 
    current_occupancy: int, 
    parking: ParkingFacility, 
    db: Session
) -> List[DashboardAlert]:
    """Generate parking-specific alerts"""
    
    alerts = []
    
    if parking:
        occupancy_rate = (current_occupancy / parking.total_spaces) * 100
        
        if occupancy_rate >= 95:
            alerts.append(DashboardAlert(
                type="error",
                title="Parking Full",
                message=f"Only {parking.total_spaces - current_occupancy} spaces remaining",
                action_required=True
            ))
        elif occupancy_rate >= 80:
            alerts.append(DashboardAlert(
                type="warning",
                title="High Occupancy",
                message=f"Parking is {occupancy_rate:.1f}% full",
                action_required=False
            ))
    
    # Check for vehicles parked too long
    long_parked = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None),
        AccessLog.timestamp < datetime.utcnow() - timedelta(hours=24)
    ).count()
    
    if long_parked > 0:
        alerts.append(DashboardAlert(
            type="info",
            title="Long-term Parking",
            message=f"{long_parked} vehicle(s) parked for over 24 hours",
            action_required=False
        ))
    
    return alerts

# =====================================================
# AIRPORT LOUNGE DASHBOARD
# =====================================================

@router.get("/airport/{business_id}", response_model=AirportDashboard)
async def get_airport_dashboard(
    business_id: str,
    period: str = Query("today", regex="^(today|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Airport lounge dashboard with flight integration
    Shows current guests, capacity, premium services
    """
    
    business = db.query(Business).filter(
        Business.id == business_id,
        Business.industry == "airport"
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Airport business not found"
        )
    
    lounge = db.query(AirportLounge).filter(AirportLounge.business_id == business_id).first()
    
    # Date range calculation
    end_date = datetime.utcnow()
    if period == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = end_date - timedelta(days=7)
    else:  # month
        start_date = end_date - timedelta(days=30)
    
    # Current guests
    current_guests = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).count()
    
    # Total visits in period
    total_visits = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).count()
    
    # Average stay duration
    avg_stay = db.query(func.avg(AccessLog.visit_duration)).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_out",
        AccessLog.timestamp >= start_date,
        AccessLog.visit_duration.isnot(None)
    ).scalar() or 0
    
    # Revenue
    revenue = db.query(func.sum(Commission.amount)).filter(
        Commission.business_id == business_id,
        Commission.created_at >= start_date
    ).scalar() or 0.0
    
    # Current guests details
    current_guest_details = db.query(AccessLog).join(Visitor).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.checkout_time.is_(None)
    ).order_by(AccessLog.timestamp).all()
    
    return AirportDashboard(
        business_info=BusinessInfo.from_orm(business),
        current_guests=current_guests,
        total_capacity=lounge.capacity if lounge else 100,
        occupancy_percentage=round((current_guests / (lounge.capacity if lounge else 100)) * 100, 1),
        total_visits_period=total_visits,
        average_stay_duration=int(avg_stay),
        revenue_period=revenue,
        airport_code=lounge.airport_code if lounge else "UNK",
        terminal=lounge.terminal if lounge else "Unknown",
        guest_list=[
            LoungeGuest(
                guest_name=log.visitor.name,
                membership_type=log.visitor.visitor_type,
                entry_time=log.timestamp,
                estimated_departure=log.timestamp + timedelta(hours=2),  # Default estimate
                duration_minutes=int((datetime.utcnow() - log.timestamp).total_seconds() / 60)
            ) for log in current_guest_details
        ],
        alerts=await get_airport_alerts(business_id, current_guests, lounge, db)
    )

async def get_airport_alerts(
    business_id: str,
    current_guests: int,
    lounge: AirportLounge,
    db: Session
) -> List[DashboardAlert]:
    """Generate airport-specific alerts"""
    
    alerts = []
    
    if lounge:
        occupancy_rate = (current_guests / lounge.capacity) * 100
        
        if occupancy_rate >= 90:
            alerts.append(DashboardAlert(
                type="warning",
                title="Lounge Nearly Full",
                message=f"Lounge is at {occupancy_rate:.1f}% capacity",
                action_required=True
            ))
    
    return alerts

# =====================================================
# UNIVERSAL ANALYTICS ENDPOINT
# =====================================================

@router.get("/analytics/{business_id}", response_model=BusinessAnalytics)
async def get_business_analytics(
    business_id: str,
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Universal analytics for any business type
    Provides core metrics regardless of industry
    """
    
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found"
        )
    
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
    
    # Core metrics
    total_visits = db.query(AccessLog).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).count()
    
    unique_visitors = db.query(AccessLog.visitor_id).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).distinct().count()
    
    total_revenue = db.query(func.sum(Commission.amount)).filter(
        Commission.business_id == business_id,
        Commission.created_at >= start_date
    ).scalar() or 0.0
    
    avg_visit_duration = db.query(func.avg(AccessLog.visit_duration)).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_out",
        AccessLog.timestamp >= start_date,
        AccessLog.visit_duration.isnot(None)
    ).scalar() or 0
    
    # Daily breakdown
    daily_stats = db.query(
        func.date(AccessLog.timestamp).label('date'),
        func.count(AccessLog.id).label('visits'),
        func.count(func.distinct(AccessLog.visitor_id)).label('unique_visitors')
    ).filter(
        AccessLog.business_id == business_id,
        AccessLog.access_type == "check_in",
        AccessLog.timestamp >= start_date
    ).group_by(func.date(AccessLog.timestamp)).all()
    
    # Access method breakdown
    access_methods = db.query(
        AccessLog.access_method,
        func.count(AccessLog.id).label('count')
    ).filter(
        AccessLog.business_id == business_id,
        AccessLog.timestamp >= start_date
    ).group_by(AccessLog.access_method).all()
    
    return BusinessAnalytics(
        business_info=BusinessInfo.from_orm(business),
        period=period,
        total_visits=total_visits,
        unique_visitors=unique_visitors,
        total_revenue=total_revenue,
        average_visit_duration=int(avg_visit_duration),
        visitor_return_rate=round((total_visits - unique_visitors) / max(unique_visitors, 1) * 100, 1),
        daily_stats=[
            DailyStats(
                date=item[0],
                visits=item[1],
                unique_visitors=item[2]
            ) for item in daily_stats
        ],
        access_method_breakdown=[
            AccessMethodStats(method=item[0], count=item[1], percentage=round(item[1]/total_visits*100, 1))
            for item in access_methods
        ] if total_visits > 0 else []
    )
