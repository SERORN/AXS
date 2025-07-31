# Face Recognition Service
# AI-powered facial recognition for biometric access control

import base64
import io
import cv2
import numpy as np
from typing import Dict, Any, Optional, List
import face_recognition
import pickle
from datetime import datetime, timedelta
import asyncio

from ..core.config import settings
from ..database import get_redis
from ..models.access_control import FaceRecognitionData
import json

# Face recognition configuration
FACE_RECOGNITION_CONFIG = {
    "tolerance": 0.6,  # Lower = more strict
    "model": "large",  # "large" for better accuracy, "small" for speed
    "num_jitters": 1,  # Number of times to resample for encoding
    "upsamples": 1     # How many times to upsample image for detection
}

async def register_face(
    visitor_id: str,
    business_id: str,
    image_data: str,
    visitor_name: str
) -> Dict[str, Any]:
    """
    Register a face for biometric access
    Creates face encoding and stores it securely
    """
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        # Find face locations
        face_locations = face_recognition.face_locations(
            image, 
            number_of_times_to_upsample=FACE_RECOGNITION_CONFIG["upsamples"],
            model="hog"  # Use HOG for speed, CNN for accuracy
        )
        
        if not face_locations:
            return {
                "success": False,
                "error": "No face detected in image",
                "face_count": 0
            }
        
        if len(face_locations) > 1:
            return {
                "success": False,
                "error": "Multiple faces detected. Please use image with single face",
                "face_count": len(face_locations)
            }
        
        # Generate face encoding
        face_encodings = face_recognition.face_encodings(
            image,
            face_locations,
            num_jitters=FACE_RECOGNITION_CONFIG["num_jitters"],
            model=FACE_RECOGNITION_CONFIG["model"]
        )
        
        if not face_encodings:
            return {
                "success": False,
                "error": "Could not generate face encoding",
                "face_count": len(face_locations)
            }
        
        face_encoding = face_encodings[0]
        
        # Store face encoding in Redis for quick access
        redis_client = get_redis()
        face_data = {
            "visitor_id": visitor_id,
            "business_id": business_id,
            "visitor_name": visitor_name,
            "face_encoding": face_encoding.tolist(),  # Convert numpy array to list
            "registered_at": datetime.utcnow().isoformat(),
            "is_active": True
        }
        
        # Store with business-specific key
        await redis_client.set(
            f"face_data:{business_id}:{visitor_id}",
            json.dumps(face_data),
            ex=30 * 24 * 60 * 60  # Expire in 30 days
        )
        
        # Also store in business face index for batch recognition
        await redis_client.sadd(f"face_index:{business_id}", visitor_id)
        
        return {
            "success": True,
            "visitor_id": visitor_id,
            "face_encoding_length": len(face_encoding),
            "face_location": face_locations[0],
            "message": "Face registered successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Face registration failed: {str(e)}"
        }

async def recognize_face(
    business_id: str,
    image_data: str,
    confidence_threshold: float = None
) -> Dict[str, Any]:
    """
    Recognize a face against registered visitors for a business
    Returns visitor information if match found
    """
    
    if confidence_threshold is None:
        confidence_threshold = FACE_RECOGNITION_CONFIG["tolerance"]
    
    try:
        # Decode and process image
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        # Find faces in image
        face_locations = face_recognition.face_locations(
            image,
            number_of_times_to_upsample=FACE_RECOGNITION_CONFIG["upsamples"]
        )
        
        if not face_locations:
            return {
                "success": False,
                "error": "No face detected in image",
                "recognized": False
            }
        
        # Generate encodings for detected faces
        face_encodings = face_recognition.face_encodings(
            image,
            face_locations,
            num_jitters=FACE_RECOGNITION_CONFIG["num_jitters"],
            model=FACE_RECOGNITION_CONFIG["model"]
        )
        
        if not face_encodings:
            return {
                "success": False,
                "error": "Could not generate face encodings",
                "recognized": False
            }
        
        # Get registered faces for this business
        redis_client = get_redis()
        registered_visitor_ids = await redis_client.smembers(f"face_index:{business_id}")
        
        if not registered_visitor_ids:
            return {
                "success": True,
                "recognized": False,
                "message": "No registered faces for this business"
            }
        
        # Load all registered face encodings
        registered_faces = []
        for visitor_id_bytes in registered_visitor_ids:
            visitor_id = visitor_id_bytes.decode('utf-8')
            face_data_str = await redis_client.get(f"face_data:{business_id}:{visitor_id}")
            
            if face_data_str:
                try:
                    face_data = json.loads(face_data_str)
                    if face_data.get("is_active", True):
                        registered_faces.append({
                            "visitor_id": visitor_id,
                            "visitor_name": face_data["visitor_name"],
                            "encoding": np.array(face_data["face_encoding"])
                        })
                except (json.JSONDecodeError, KeyError):
                    continue
        
        if not registered_faces:
            return {
                "success": True,
                "recognized": False,
                "message": "No active registered faces found"
            }
        
        # Compare each detected face against registered faces
        best_match = None
        best_distance = float('inf')
        
        for face_encoding in face_encodings:
            # Calculate distances to all registered faces
            registered_encodings = [face["encoding"] for face in registered_faces]
            distances = face_recognition.face_distance(registered_encodings, face_encoding)
            
            # Find best match
            min_distance_idx = np.argmin(distances)
            min_distance = distances[min_distance_idx]
            
            if min_distance < confidence_threshold and min_distance < best_distance:
                best_distance = min_distance
                best_match = registered_faces[min_distance_idx]
        
        if best_match:
            # Update recognition count
            await update_face_recognition_stats(business_id, best_match["visitor_id"])
            
            # Calculate confidence percentage
            confidence = max(0, (1.0 - best_distance) * 100)
            
            return {
                "success": True,
                "recognized": True,
                "visitor_id": best_match["visitor_id"],
                "visitor_name": best_match["visitor_name"],
                "confidence": round(confidence, 2),
                "distance": round(best_distance, 4),
                "face_locations": face_locations,
                "message": f"Face recognized: {best_match['visitor_name']}"
            }
        
        return {
            "success": True,
            "recognized": False,
            "confidence": 0.0,
            "face_locations": face_locations,
            "message": "Face not recognized"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Face recognition failed: {str(e)}",
            "recognized": False
        }

async def update_face_recognition_stats(business_id: str, visitor_id: str) -> bool:
    """
    Update face recognition statistics
    """
    
    try:
        redis_client = get_redis()
        face_data_key = f"face_data:{business_id}:{visitor_id}"
        
        face_data_str = await redis_client.get(face_data_key)
        if face_data_str:
            face_data = json.loads(face_data_str)
            face_data["last_recognition"] = datetime.utcnow().isoformat()
            face_data["recognition_count"] = face_data.get("recognition_count", 0) + 1
            
            await redis_client.set(face_data_key, json.dumps(face_data))
            return True
            
    except Exception:
        pass
    
    return False

async def remove_face_registration(business_id: str, visitor_id: str) -> Dict[str, Any]:
    """
    Remove face registration for a visitor
    """
    
    try:
        redis_client = get_redis()
        
        # Remove from face data
        face_data_key = f"face_data:{business_id}:{visitor_id}"
        await redis_client.delete(face_data_key)
        
        # Remove from face index
        await redis_client.srem(f"face_index:{business_id}", visitor_id)
        
        return {
            "success": True,
            "message": "Face registration removed successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to remove face registration: {str(e)}"
        }

async def update_face_registration(
    business_id: str,
    visitor_id: str,
    new_image_data: str
) -> Dict[str, Any]:
    """
    Update existing face registration with new image
    """
    
    # Remove old registration
    await remove_face_registration(business_id, visitor_id)
    
    # Register new face
    # Note: You'd need to get visitor_name from database
    return await register_face(visitor_id, business_id, new_image_data, "Visitor")

async def get_business_face_registrations(business_id: str) -> Dict[str, Any]:
    """
    Get all face registrations for a business
    """
    
    try:
        redis_client = get_redis()
        visitor_ids = await redis_client.smembers(f"face_index:{business_id}")
        
        registrations = []
        for visitor_id_bytes in visitor_ids:
            visitor_id = visitor_id_bytes.decode('utf-8')
            face_data_str = await redis_client.get(f"face_data:{business_id}:{visitor_id}")
            
            if face_data_str:
                try:
                    face_data = json.loads(face_data_str)
                    registrations.append({
                        "visitor_id": visitor_id,
                        "visitor_name": face_data["visitor_name"],
                        "registered_at": face_data["registered_at"],
                        "last_recognition": face_data.get("last_recognition"),
                        "recognition_count": face_data.get("recognition_count", 0),
                        "is_active": face_data.get("is_active", True)
                    })
                except (json.JSONDecodeError, KeyError):
                    continue
        
        return {
            "success": True,
            "total_registrations": len(registrations),
            "registrations": registrations
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get face registrations: {str(e)}",
            "registrations": []
        }

async def validate_face_image(image_data: str) -> Dict[str, Any]:
    """
    Validate if image is suitable for face registration
    Checks quality, lighting, face size, etc.
    """
    
    try:
        # Decode image
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format for quality checks
        opencv_image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
        
        # Check image dimensions
        height, width = gray.shape
        if height < 480 or width < 640:
            return {
                "valid": False,
                "error": "Image resolution too low. Minimum 640x480 required.",
                "recommendations": ["Use higher resolution camera", "Take photo closer to face"]
            }
        
        # Find faces
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return {
                "valid": False,
                "error": "No face detected in image",
                "recommendations": ["Ensure face is clearly visible", "Improve lighting", "Look directly at camera"]
            }
        
        if len(face_locations) > 1:
            return {
                "valid": False,
                "error": "Multiple faces detected",
                "recommendations": ["Use image with only one person", "Crop image to show single face"]
            }
        
        # Check face size
        top, right, bottom, left = face_locations[0]
        face_width = right - left
        face_height = bottom - top
        
        # Face should be at least 20% of image width
        min_face_size = width * 0.2
        if face_width < min_face_size or face_height < min_face_size:
            return {
                "valid": False,
                "error": "Face too small in image",
                "recommendations": ["Move closer to camera", "Use higher resolution image"]
            }
        
        # Check brightness/contrast
        brightness = np.mean(gray)
        if brightness < 60:
            return {
                "valid": False,
                "error": "Image too dark",
                "recommendations": ["Improve lighting", "Take photo in well-lit area"]
            }
        
        if brightness > 200:
            return {
                "valid": False,
                "error": "Image too bright",
                "recommendations": ["Reduce lighting", "Avoid direct sunlight"]
            }
        
        # Check blur (Laplacian variance)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        if blur_score < 100:
            return {
                "valid": False,
                "error": "Image is blurry",
                "recommendations": ["Hold camera steady", "Ensure good focus", "Clean camera lens"]
            }
        
        return {
            "valid": True,
            "face_location": face_locations[0],
            "face_size": {"width": face_width, "height": face_height},
            "brightness": round(brightness, 2),
            "blur_score": round(blur_score, 2),
            "quality": "Good" if blur_score > 500 else "Acceptable"
        }
        
    except Exception as e:
        return {
            "valid": False,
            "error": f"Image validation failed: {str(e)}",
            "recommendations": ["Try different image", "Check image format"]
        }

async def get_face_recognition_analytics(business_id: str) -> Dict[str, Any]:
    """
    Get face recognition analytics for a business
    """
    
    try:
        redis_client = get_redis()
        visitor_ids = await redis_client.smembers(f"face_index:{business_id}")
        
        total_registrations = len(visitor_ids)
        total_recognitions = 0
        active_registrations = 0
        recent_recognitions = 0
        
        now = datetime.utcnow()
        recent_cutoff = now - timedelta(days=7)
        
        for visitor_id_bytes in visitor_ids:
            visitor_id = visitor_id_bytes.decode('utf-8')
            face_data_str = await redis_client.get(f"face_data:{business_id}:{visitor_id}")
            
            if face_data_str:
                try:
                    face_data = json.loads(face_data_str)
                    
                    if face_data.get("is_active", True):
                        active_registrations += 1
                    
                    recognition_count = face_data.get("recognition_count", 0)
                    total_recognitions += recognition_count
                    
                    last_recognition = face_data.get("last_recognition")
                    if last_recognition:
                        last_recognition_date = datetime.fromisoformat(last_recognition)
                        if last_recognition_date > recent_cutoff:
                            recent_recognitions += recognition_count
                            
                except (json.JSONDecodeError, KeyError):
                    continue
        
        return {
            "total_registrations": total_registrations,
            "active_registrations": active_registrations,
            "total_recognitions": total_recognitions,
            "recent_recognitions_7_days": recent_recognitions,
            "average_recognitions_per_user": round(total_recognitions / max(active_registrations, 1), 2),
            "registration_active_rate": round(active_registrations / max(total_registrations, 1) * 100, 2)
        }
        
    except Exception as e:
        return {
            "error": f"Failed to get analytics: {str(e)}",
            "total_registrations": 0,
            "active_registrations": 0,
            "total_recognitions": 0
        }

async def bulk_face_recognition(business_id: str, image_data: str) -> Dict[str, Any]:
    """
    Recognize multiple faces in a single image
    Useful for group access scenarios
    """
    
    try:
        # Decode image
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        # Find all faces
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return {
                "success": True,
                "faces_detected": 0,
                "recognized_faces": [],
                "unrecognized_faces": 0
            }
        
        # Get registered faces
        redis_client = get_redis()
        registered_visitor_ids = await redis_client.smembers(f"face_index:{business_id}")
        
        registered_faces = []
        for visitor_id_bytes in registered_visitor_ids:
            visitor_id = visitor_id_bytes.decode('utf-8')
            face_data_str = await redis_client.get(f"face_data:{business_id}:{visitor_id}")
            
            if face_data_str:
                try:
                    face_data = json.loads(face_data_str)
                    if face_data.get("is_active", True):
                        registered_faces.append({
                            "visitor_id": visitor_id,
                            "visitor_name": face_data["visitor_name"],
                            "encoding": np.array(face_data["face_encoding"])
                        })
                except (json.JSONDecodeError, KeyError):
                    continue
        
        # Compare each detected face
        recognized_faces = []
        unrecognized_count = 0
        
        for i, face_encoding in enumerate(face_encodings):
            if registered_faces:
                registered_encodings = [face["encoding"] for face in registered_faces]
                distances = face_recognition.face_distance(registered_encodings, face_encoding)
                
                min_distance_idx = np.argmin(distances)
                min_distance = distances[min_distance_idx]
                
                if min_distance < FACE_RECOGNITION_CONFIG["tolerance"]:
                    best_match = registered_faces[min_distance_idx]
                    confidence = max(0, (1.0 - min_distance) * 100)
                    
                    recognized_faces.append({
                        "visitor_id": best_match["visitor_id"],
                        "visitor_name": best_match["visitor_name"],
                        "confidence": round(confidence, 2),
                        "face_location": face_locations[i]
                    })
                    
                    # Update stats
                    await update_face_recognition_stats(business_id, best_match["visitor_id"])
                else:
                    unrecognized_count += 1
            else:
                unrecognized_count += 1
        
        return {
            "success": True,
            "faces_detected": len(face_encodings),
            "recognized_faces": recognized_faces,
            "unrecognized_faces": unrecognized_count,
            "recognition_rate": round(len(recognized_faces) / len(face_encodings) * 100, 2) if face_encodings else 0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Bulk recognition failed: {str(e)}",
            "faces_detected": 0,
            "recognized_faces": [],
            "unrecognized_faces": 0
        }
