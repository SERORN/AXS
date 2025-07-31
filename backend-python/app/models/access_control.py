# Access Control Database Models
# SQLAlchemy models for visitor management, access logs, and QR tracking

from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from .base import Base

# =====================================================
# VISITOR MANAGEMENT
# =====================================================

class Visitor(Base):
    """
    Visitors to businesses - can be registered users or guests
    Tracks visitor information and approval status
    """
    __tablename__ = "visitors"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # If registered user
    
    # Visitor information
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    visitor_type = Column(String, default="guest")  # guest, registered, employee, contractor, delivery, service
    company = Column(String, nullable=True)
    purpose = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status and approval
    status = Column(String, default="pending_approval")  # pending_approval, approved, rejected, blocked
    registered_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    approval_notes = Column(Text, nullable=True)
    
    # Visit tracking
    first_visit = Column(DateTime, default=func.now())
    last_visit = Column(DateTime, nullable=True)
    total_visits = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Additional data
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    business = relationship("Business", back_populates="visitors")
    user = relationship("User", foreign_keys=[user_id])
    registered_by_user = relationship("User", foreign_keys=[registered_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    access_logs = relationship("AccessLog", back_populates="visitor")
    vehicles = relationship("VehicleAccess", back_populates="visitor")
    
    def __repr__(self):
        return f"<Visitor {self.name} - {self.business.name if self.business else 'Unknown'}>"

# =====================================================
# VEHICLE ACCESS TRACKING
# =====================================================

class VehicleAccess(Base):
    """
    Vehicle information for visitor access control
    Links vehicles to visitors for plate recognition
    """
    __tablename__ = "vehicle_access"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    
    # Vehicle information
    plate_number = Column(String, nullable=False, index=True)
    vehicle_make = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=True)
    vehicle_color = Column(String, nullable=True)
    vehicle_year = Column(Integer, nullable=True)
    vin = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Additional data
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    visitor = relationship("Visitor", back_populates="vehicles")
    access_logs = relationship("AccessLog", back_populates="vehicle_access")
    
    def __repr__(self):
        return f"<VehicleAccess {self.plate_number} - {self.visitor.name if self.visitor else 'Unknown'}>"

# =====================================================
# ACCESS LOGS
# =====================================================

class AccessLog(Base):
    """
    Complete log of all access events
    Tracks check-ins, check-outs, QR scans, plate recognition, etc.
    """
    __tablename__ = "access_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False)
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    vehicle_access_id = Column(String, ForeignKey("vehicle_access.id"), nullable=True)
    
    # Access details
    access_method = Column(String, nullable=False)  # qr_code, plate_recognition, facial_recognition, manual, nfc_tag
    access_type = Column(String, nullable=False)  # check_in, check_out, qr_generated, checkout_only
    timestamp = Column(DateTime, default=func.now(), nullable=False)
    checkout_time = Column(DateTime, nullable=True)
    visit_duration = Column(Integer, nullable=True)  # in minutes
    
    # Location and device info
    location = Column(String, nullable=True)  # entrance name/location
    scanned_by = Column(String, ForeignKey("users.id"), nullable=True)  # employee who scanned
    scanner_device = Column(String, nullable=True)  # device identifier
    
    # QR specific
    qr_token = Column(String, nullable=True, index=True)
    qr_expires_at = Column(DateTime, nullable=True)
    
    # Recognition specific
    recognition_confidence = Column(Float, nullable=True)
    recognition_data = Column(JSON, nullable=True)
    
    # Additional info
    notes = Column(Text, nullable=True)
    status = Column(String, default="successful")  # successful, failed, denied
    
    # Metadata
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    business = relationship("Business")
    visitor = relationship("Visitor", back_populates="access_logs")
    vehicle_access = relationship("VehicleAccess", back_populates="access_logs")
    scanned_by_user = relationship("User", foreign_keys=[scanned_by])
    
    def __repr__(self):
        return f"<AccessLog {self.access_type} - {self.visitor.name if self.visitor else 'Unknown'} @ {self.timestamp}>"

# =====================================================
# QR TOKEN TRACKING
# =====================================================

class QRToken(Base):
    """
    Tracks generated QR tokens for access control
    Manages token expiration and usage limits
    """
    __tablename__ = "qr_tokens"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String, unique=True, nullable=False, index=True)
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False)
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    vehicle_access_id = Column(String, ForeignKey("vehicle_access.id"), nullable=True)
    
    # Token configuration
    token_type = Column(String, default="single_use")  # single_use, multi_use, time_limited
    access_type = Column(String, default="check_in")  # check_in, check_out, checkout_only
    max_uses = Column(Integer, default=1)
    current_uses = Column(Integer, default=0)
    
    # Validity
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Usage tracking
    first_used = Column(DateTime, nullable=True)
    last_used = Column(DateTime, nullable=True)
    
    # Additional data
    visit_purpose = Column(String, nullable=True)
    entry_point = Column(String, nullable=True)
    generated_by = Column(String, ForeignKey("users.id"), nullable=True)
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    business = relationship("Business")
    visitor = relationship("Visitor")
    vehicle_access = relationship("VehicleAccess")
    generated_by_user = relationship("User", foreign_keys=[generated_by])
    
    def __repr__(self):
        return f"<QRToken {self.token[:8]}... - {self.visitor.name if self.visitor else 'Unknown'}>"

# =====================================================
# FACE RECOGNITION DATA
# =====================================================

class FaceRecognitionData(Base):
    """
    Stores facial recognition data for visitors
    Enables biometric access control
    """
    __tablename__ = "face_recognition_data"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False)
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False)
    
    # Face data
    face_encoding = Column(JSON, nullable=False)  # Facial features vector
    face_image_url = Column(String, nullable=True)  # Reference image URL
    
    # Training and accuracy
    training_images = Column(Integer, default=1)
    confidence_threshold = Column(Float, default=0.6)
    last_recognition = Column(DateTime, nullable=True)
    recognition_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    visitor = relationship("Visitor")
    business = relationship("Business")
    
    def __repr__(self):
        return f"<FaceRecognitionData {self.visitor.name if self.visitor else 'Unknown'}>"

# =====================================================
# ACCESS CONTROL DEVICES
# =====================================================

class AccessDevice(Base):
    """
    Physical devices used for access control
    Tablets, scanners, cameras, etc.
    """
    __tablename__ = "access_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String, ForeignKey("businesses.id"), nullable=False)
    
    # Device information
    device_name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)  # tablet, scanner, camera, reader
    device_id = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=False)
    
    # Configuration
    capabilities = Column(JSON, nullable=True)  # qr_scan, plate_recognition, face_recognition
    settings = Column(JSON, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Additional data
    metadata = Column(JSON, nullable=True)
    
    # Relationships
    business = relationship("Business")
    
    def __repr__(self):
        return f"<AccessDevice {self.device_name} - {self.location}>"

# =====================================================
# UPDATE BUSINESS MODEL TO INCLUDE VISITORS
# =====================================================

# This will be added to the Business model:
# visitors = relationship("Visitor", back_populates="business")
# access_logs = relationship("AccessLog", back_populates="business")
# qr_tokens = relationship("QRToken", back_populates="business")
# face_recognition_data = relationship("FaceRecognitionData", back_populates="business")
# access_devices = relationship("AccessDevice", back_populates="business")
