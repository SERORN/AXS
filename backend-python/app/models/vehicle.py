"""
Vehicle model for AXS360 API
Handles vehicle registration and management
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class VehicleType(str, enum.Enum):
    CAR = "car"
    SUV = "suv"
    TRUCK = "truck"
    MOTORCYCLE = "motorcycle"
    VAN = "van"
    BUS = "bus"
    OTHER = "other"


class VehicleStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    
    # Owner relationship
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Vehicle Information
    license_plate = Column(String(20), unique=True, index=True, nullable=False)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    color = Column(String(30), nullable=False)
    vehicle_type = Column(Enum(VehicleType), nullable=False)
    
    # Registration Information
    vin = Column(String(17), unique=True, nullable=True)  # Vehicle Identification Number
    registration_country = Column(String(2), nullable=False, default="US")
    registration_state = Column(String(50), nullable=True)
    registration_expires = Column(DateTime, nullable=True)
    
    # Status and Verification
    status = Column(Enum(VehicleStatus), default=VehicleStatus.PENDING_VERIFICATION, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_document = Column(String(255), nullable=True)  # Path to uploaded document
    
    # Insurance Information
    insurance_company = Column(String(100), nullable=True)
    insurance_policy_number = Column(String(50), nullable=True)
    insurance_expires = Column(DateTime, nullable=True)
    insurance_document = Column(String(255), nullable=True)
    
    # Physical Characteristics
    dimensions = Column(JSON, nullable=True)  # {"length": X, "width": Y, "height": Z}
    weight = Column(Integer, nullable=True)  # in pounds
    fuel_type = Column(String(20), nullable=True)  # gasoline, diesel, electric, hybrid
    transmission = Column(String(20), nullable=True)  # manual, automatic
    
    # Vehicle Photos
    primary_image = Column(String(255), nullable=True)
    additional_images = Column(JSON, default=list, nullable=True)  # List of image paths
    
    # Access and Security
    is_active = Column(Boolean, default=True, nullable=False)
    access_level = Column(String(20), default="standard", nullable=False)  # standard, premium, vip
    security_features = Column(JSON, default=list, nullable=True)  # ["alarm", "gps", "immobilizer"]
    
    # Location and Parking
    preferred_parking_zones = Column(JSON, default=list, nullable=True)
    parking_preferences = Column(JSON, default=dict, nullable=True)
    current_location = Column(JSON, nullable=True)  # {"lat": X, "lng": Y, "timestamp": Z}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used = Column(DateTime, nullable=True)
    
    # Notes and Metadata
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=list, nullable=True)  # ["family", "work", "rental"]
    metadata = Column(JSON, default=dict, nullable=True)
    
    # Compliance and Regulations
    emissions_class = Column(String(10), nullable=True)
    safety_rating = Column(String(10), nullable=True)
    inspection_expires = Column(DateTime, nullable=True)
    
    # Commercial Vehicle Information
    is_commercial = Column(Boolean, default=False, nullable=False)
    commercial_license = Column(String(50), nullable=True)
    gross_weight = Column(Integer, nullable=True)
    passenger_capacity = Column(Integer, nullable=True)
    
    # Relationships
    owner = relationship("User", back_populates="vehicles")
    passes = relationship("Pass", back_populates="vehicle", cascade="all, delete-orphan")
    qr_codes = relationship("QRCode", back_populates="vehicle", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Vehicle(id={self.id}, license_plate='{self.license_plate}', make='{self.make}', model='{self.model}')>"

    @property
    def full_name(self):
        """Get vehicle's full name"""
        return f"{self.year} {self.make} {self.model}".strip()

    @property
    def is_expired_registration(self):
        """Check if vehicle registration is expired"""
        if not self.registration_expires:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.registration_expires

    @property
    def is_expired_insurance(self):
        """Check if vehicle insurance is expired"""
        if not self.insurance_expires:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.insurance_expires

    @property
    def is_expired_inspection(self):
        """Check if vehicle inspection is expired"""
        if not self.inspection_expires:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.inspection_expires

    @property
    def compliance_status(self):
        """Get overall compliance status"""
        issues = []
        
        if self.is_expired_registration:
            issues.append("registration_expired")
        
        if self.is_expired_insurance:
            issues.append("insurance_expired")
        
        if self.is_expired_inspection:
            issues.append("inspection_expired")
        
        if not self.is_verified:
            issues.append("not_verified")
        
        if issues:
            return {"status": "non_compliant", "issues": issues}
        else:
            return {"status": "compliant", "issues": []}

    def can_access_zone(self, zone_access_level: str) -> bool:
        """Check if vehicle can access a specific zone"""
        zone_levels = ["standard", "premium", "vip"]
        vehicle_level_index = zone_levels.index(self.access_level)
        zone_level_index = zone_levels.index(zone_access_level)
        
        return vehicle_level_index >= zone_level_index

    def dict(self):
        """Convert vehicle to dictionary"""
        return {
            "id": self.id,
            "owner_id": self.owner_id,
            "license_plate": self.license_plate,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "color": self.color,
            "vehicle_type": self.vehicle_type.value if self.vehicle_type else None,
            "full_name": self.full_name,
            "vin": self.vin,
            "registration_country": self.registration_country,
            "registration_state": self.registration_state,
            "registration_expires": self.registration_expires.isoformat() if self.registration_expires else None,
            "status": self.status.value if self.status else None,
            "is_verified": self.is_verified,
            "insurance_company": self.insurance_company,
            "insurance_expires": self.insurance_expires.isoformat() if self.insurance_expires else None,
            "dimensions": self.dimensions,
            "weight": self.weight,
            "fuel_type": self.fuel_type,
            "transmission": self.transmission,
            "primary_image": self.primary_image,
            "additional_images": self.additional_images,
            "is_active": self.is_active,
            "access_level": self.access_level,
            "security_features": self.security_features,
            "preferred_parking_zones": self.preferred_parking_zones,
            "parking_preferences": self.parking_preferences,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "tags": self.tags,
            "is_commercial": self.is_commercial,
            "passenger_capacity": self.passenger_capacity,
            "compliance_status": self.compliance_status,
        }
