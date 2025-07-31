# Plate Recognition Service
# AI-powered license plate recognition using OpenALPR and computer vision

import base64
import io
import cv2
import numpy as np
from typing import Dict, Any, Optional, List
import requests
import asyncio
from PIL import Image
import re

from ..core.config import settings

# OpenALPR API configuration
OPENALPR_API_URL = "https://api.openalpr.com/v3/recognize"
OPENALPR_SECRET_KEY = settings.OPENALPR_API_KEY if hasattr(settings, 'OPENALPR_API_KEY') else None

# Plate recognition patterns for Mexico
MEXICO_PLATE_PATTERNS = [
    r'^[A-Z]{3}-\d{3}$',      # Old format: ABC-123
    r'^[A-Z]{3}-\d{2}-\d{2}$', # New format: ABC-12-34
    r'^\d{3}-[A-Z]{3}$',      # Reverse: 123-ABC
    r'^[A-Z]{2}-\d{3}-[A-Z]{1}$', # Special: AB-123-C
]

async def recognize_plate(image_data: str, country: str = "mx") -> Dict[str, Any]:
    """
    Recognize license plate from base64 image
    Uses multiple recognition methods for best accuracy
    """
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[-1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Try multiple recognition methods
        results = []
        
        # Method 1: OpenALPR API (if configured)
        if OPENALPR_SECRET_KEY:
            openalpr_result = await recognize_with_openalpr(image_data, country)
            if openalpr_result["success"]:
                results.append(openalpr_result)
        
        # Method 2: Local OpenCV recognition
        local_result = await recognize_with_opencv(opencv_image)
        if local_result["success"]:
            results.append(local_result)
        
        # Method 3: Pattern matching enhancement
        enhanced_results = []
        for result in results:
            enhanced = enhance_plate_text(result["plate_number"])
            if enhanced:
                enhanced_result = result.copy()
                enhanced_result["plate_number"] = enhanced
                enhanced_result["confidence"] = min(result["confidence"] + 0.1, 1.0)
                enhanced_results.append(enhanced_result)
        
        results.extend(enhanced_results)
        
        # Select best result
        if results:
            best_result = max(results, key=lambda x: x["confidence"])
            return {
                "success": True,
                "plate_number": best_result["plate_number"].upper(),
                "confidence": best_result["confidence"],
                "method": best_result["method"],
                "bounding_box": best_result.get("bounding_box"),
                "processing_time": best_result.get("processing_time", 0)
            }
        
        return {
            "success": False,
            "error": "No license plate detected",
            "confidence": 0.0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Plate recognition failed: {str(e)}",
            "confidence": 0.0
        }

async def recognize_with_openalpr(image_data: str, country: str = "mx") -> Dict[str, Any]:
    """
    Recognize plate using OpenALPR cloud API
    """
    
    if not OPENALPR_SECRET_KEY:
        return {"success": False, "error": "OpenALPR not configured"}
    
    try:
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Prepare API request
        payload = {
            "secret_key": OPENALPR_SECRET_KEY,
            "country": country,
            "recognize_vehicle": 1,
            "return_image": 0,
            "topn": 3
        }
        
        files = {"image": ("image.jpg", base64.b64decode(image_data), "image/jpeg")}
        
        # Make API request
        response = requests.post(OPENALPR_API_URL, data=payload, files=files, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("results"):
                best_result = data["results"][0]
                plate_number = best_result["plate"]
                confidence = best_result["confidence"] / 100.0  # Convert to 0-1 scale
                
                return {
                    "success": True,
                    "plate_number": plate_number,
                    "confidence": confidence,
                    "method": "openalpr_api",
                    "bounding_box": best_result.get("coordinates"),
                    "processing_time": data.get("processing_time_ms", 0) / 1000.0,
                    "raw_response": data
                }
        
        return {
            "success": False,
            "error": f"OpenALPR API error: {response.status_code}",
            "confidence": 0.0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"OpenALPR recognition failed: {str(e)}",
            "confidence": 0.0
        }

async def recognize_with_opencv(image: np.ndarray) -> Dict[str, Any]:
    """
    Local plate recognition using OpenCV and OCR
    Fallback method when cloud APIs are unavailable
    """
    
    try:
        # Preprocess image for better OCR
        processed_image = preprocess_plate_image(image)
        
        # Find plate regions
        plate_regions = find_plate_regions(processed_image)
        
        if not plate_regions:
            return {
                "success": False,
                "error": "No plate regions detected",
                "confidence": 0.0
            }
        
        best_result = None
        best_confidence = 0.0
        
        # Process each potential plate region
        for region in plate_regions:
            try:
                # Extract and enhance plate region
                plate_roi = extract_plate_roi(processed_image, region)
                
                # Perform OCR on plate region
                plate_text = perform_ocr_on_plate(plate_roi)
                
                if plate_text:
                    # Validate plate format
                    confidence = validate_plate_format(plate_text)
                    
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_result = {
                            "success": True,
                            "plate_number": plate_text,
                            "confidence": confidence,
                            "method": "opencv_local",
                            "bounding_box": region,
                            "processing_time": 0
                        }
            
            except Exception as e:
                continue
        
        if best_result:
            return best_result
        
        return {
            "success": False,
            "error": "No valid plates recognized",
            "confidence": 0.0
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"OpenCV recognition failed: {str(e)}",
            "confidence": 0.0
        }

def preprocess_plate_image(image: np.ndarray) -> np.ndarray:
    """
    Preprocess image for better plate detection
    """
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply edge detection
    edged = cv2.Canny(blurred, 50, 150)
    
    # Apply morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    processed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)
    
    return processed

def find_plate_regions(image: np.ndarray) -> List[tuple]:
    """
    Find potential license plate regions in image
    """
    
    # Find contours
    contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    plate_regions = []
    
    for contour in contours:
        # Calculate contour area
        area = cv2.contourArea(contour)
        
        # Filter by area (plates are usually medium-sized)
        if 1000 < area < 50000:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Check aspect ratio (plates are typically rectangular)
            aspect_ratio = w / h
            
            # License plates typically have aspect ratio between 2:1 and 5:1
            if 2.0 <= aspect_ratio <= 5.0:
                plate_regions.append((x, y, w, h))
    
    # Sort by area (larger regions first)
    plate_regions.sort(key=lambda region: region[2] * region[3], reverse=True)
    
    return plate_regions[:5]  # Return top 5 candidates

def extract_plate_roi(image: np.ndarray, region: tuple) -> np.ndarray:
    """
    Extract and enhance plate region of interest
    """
    
    x, y, w, h = region
    
    # Extract ROI
    roi = image[y:y+h, x:x+w]
    
    # Enhance contrast
    enhanced = cv2.equalizeHist(roi)
    
    # Apply additional morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    enhanced = cv2.morphologyEx(enhanced, cv2.MORPH_OPEN, kernel)
    
    return enhanced

def perform_ocr_on_plate(plate_roi: np.ndarray) -> Optional[str]:
    """
    Perform OCR on plate region
    Note: This is a simplified version. In production, use pytesseract or similar
    """
    
    try:
        # This is a placeholder for actual OCR implementation
        # In production, you would use:
        # import pytesseract
        # text = pytesseract.image_to_string(plate_roi, config='--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        
        # For now, return None (would be replaced with actual OCR)
        return None
        
    except Exception:
        return None

def validate_plate_format(plate_text: str) -> float:
    """
    Validate plate text against known patterns and return confidence
    """
    
    if not plate_text:
        return 0.0
    
    # Clean the text
    cleaned = re.sub(r'[^A-Z0-9]', '', plate_text.upper())
    
    # Check against Mexico plate patterns
    for pattern in MEXICO_PLATE_PATTERNS:
        # Add hyphens for pattern matching
        formatted_plate = format_plate_for_pattern(cleaned)
        if re.match(pattern, formatted_plate):
            return 0.8  # High confidence for valid format
    
    # Check for reasonable plate characteristics
    if 6 <= len(cleaned) <= 8:
        has_letters = any(c.isalpha() for c in cleaned)
        has_numbers = any(c.isdigit() for c in cleaned)
        
        if has_letters and has_numbers:
            return 0.6  # Medium confidence
    
    return 0.2  # Low confidence

def format_plate_for_pattern(plate_text: str) -> str:
    """
    Format cleaned plate text to match common patterns
    """
    
    if len(plate_text) == 6:
        # Try ABC123 -> ABC-123
        if plate_text[:3].isalpha() and plate_text[3:].isdigit():
            return f"{plate_text[:3]}-{plate_text[3:]}"
        # Try 123ABC -> 123-ABC
        elif plate_text[:3].isdigit() and plate_text[3:].isalpha():
            return f"{plate_text[:3]}-{plate_text[3:]}"
    
    elif len(plate_text) == 7:
        # Try ABC1234 -> ABC-12-34
        if plate_text[:3].isalpha() and plate_text[3:].isdigit():
            return f"{plate_text[:3]}-{plate_text[3:5]}-{plate_text[5:]}"
    
    return plate_text

def enhance_plate_text(plate_text: str) -> Optional[str]:
    """
    Enhance plate text using common corrections
    """
    
    if not plate_text:
        return None
    
    # Common OCR corrections
    corrections = {
        '0': 'O',  # Zero to O
        'O': '0',  # O to zero (context dependent)
        '1': 'I',  # One to I
        'I': '1',  # I to one (context dependent)
        '5': 'S',  # Five to S
        'S': '5',  # S to five (context dependent)
        '8': 'B',  # Eight to B
        'B': '8',  # B to eight (context dependent)
    }
    
    # Apply corrections and validate
    enhanced_versions = [plate_text]
    
    for char, replacement in corrections.items():
        if char in plate_text:
            enhanced = plate_text.replace(char, replacement)
            enhanced_versions.append(enhanced)
    
    # Return the version with highest confidence
    best_version = None
    best_confidence = 0.0
    
    for version in enhanced_versions:
        confidence = validate_plate_format(version)
        if confidence > best_confidence:
            best_confidence = confidence
            best_version = version
    
    return best_version if best_confidence > 0.5 else plate_text

async def get_plate_recognition_analytics(business_id: str) -> Dict[str, Any]:
    """
    Get analytics for plate recognition performance
    """
    
    # This would connect to access logs and analyze plate recognition data
    # Placeholder implementation
    
    return {
        "total_recognitions": 0,
        "success_rate": 0.0,
        "average_confidence": 0.0,
        "most_common_errors": [],
        "recognition_methods": {
            "openalpr_api": 0,
            "opencv_local": 0
        }
    }

async def train_custom_plate_model(training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Train custom plate recognition model for specific business
    Future enhancement for improved accuracy
    """
    
    # Placeholder for custom model training
    return {
        "model_trained": False,
        "message": "Custom model training not yet implemented"
    }
