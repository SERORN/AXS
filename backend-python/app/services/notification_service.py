# Notification Service
# Handles email, SMS, and push notifications for access control events

import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient
import redis

from ..core.config import settings
from ..models.user import User
from ..models.business import Business
from ..models.access_control import Visitor
from ..database import get_redis

# Initialize external services
sendgrid_client = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None
twilio_client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN) if settings.TWILIO_ACCOUNT_SID else None

# =====================================================
# EMAIL NOTIFICATIONS
# =====================================================

async def send_email_notification(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str = None
) -> bool:
    """
    Send email notification via SendGrid
    """
    
    if not sendgrid_client:
        print("SendGrid not configured - email notification skipped")
        return False
    
    try:
        message = Mail(
            from_email=from_email or settings.FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        response = sendgrid_client.send(message)
        return response.status_code == 202
        
    except Exception as e:
        print(f"Email notification failed: {str(e)}")
        return False

async def send_access_email(
    visitor: Visitor,
    business: Business,
    action: str,
    details: Dict[str, Any] = None
) -> bool:
    """
    Send access-related email to visitor
    """
    
    if not visitor.email:
        return False
    
    # Email templates based on action
    templates = {
        "qr_generated": {
            "subject": f"Access QR Code for {business.name}",
            "template": "access_qr_generated.html"
        },
        "visitor_approved": {
            "subject": f"Access Approved - {business.name}",
            "template": "visitor_approved.html"
        },
        "visitor_rejected": {
            "subject": f"Access Request Update - {business.name}",
            "template": "visitor_rejected.html"
        },
        "check_in": {
            "subject": f"Check-in Confirmation - {business.name}",
            "template": "check_in_confirmation.html"
        },
        "check_out": {
            "subject": f"Visit Summary - {business.name}",
            "template": "check_out_summary.html"
        }
    }
    
    template_config = templates.get(action)
    if not template_config:
        return False
    
    # Generate email content
    html_content = generate_email_template(
        template_config["template"],
        {
            "visitor_name": visitor.name,
            "business_name": business.name,
            "business_address": f"{business.address}, {business.city}",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
            "details": details or {},
            "app_url": settings.APP_URL
        }
    )
    
    return await send_email_notification(
        to_email=visitor.email,
        subject=template_config["subject"],
        html_content=html_content
    )

async def send_business_notification_email(
    business: Business,
    subject: str,
    content: str,
    recipient_emails: List[str] = None
) -> bool:
    """
    Send notification to business administrators
    """
    
    if not recipient_emails:
        # Send to business owner/admins
        # TODO: Get admin emails from business employees
        recipient_emails = [business.email]
    
    success_count = 0
    for email in recipient_emails:
        if await send_email_notification(email, subject, content):
            success_count += 1
    
    return success_count > 0

# =====================================================
# SMS NOTIFICATIONS
# =====================================================

async def send_sms_notification(
    phone_number: str,
    message: str
) -> bool:
    """
    Send SMS notification via Twilio
    """
    
    if not twilio_client:
        print("Twilio not configured - SMS notification skipped")
        return False
    
    try:
        # Format phone number
        if not phone_number.startswith('+'):
            phone_number = f"+52{phone_number}"  # Mexico country code
        
        message = twilio_client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        
        return message.sid is not None
        
    except Exception as e:
        print(f"SMS notification failed: {str(e)}")
        return False

async def send_access_sms(
    visitor: Visitor,
    business: Business,
    action: str,
    details: Dict[str, Any] = None
) -> bool:
    """
    Send access-related SMS to visitor
    """
    
    if not visitor.phone:
        return False
    
    # SMS templates
    sms_templates = {
        "qr_generated": f"Your access QR for {business.name} is ready. Valid until {details.get('valid_until', 'today')}. Safe travels!",
        "visitor_approved": f"Great news! Your access to {business.name} has been approved. You can now generate your QR code.",
        "visitor_rejected": f"Your access request for {business.name} needs review. Please contact them directly for assistance.",
        "check_in": f"Welcome to {business.name}! Check-in confirmed at {details.get('time', 'now')}.",
        "check_out": f"Thanks for visiting {business.name}! Visit duration: {details.get('duration', 'N/A')} minutes."
    }
    
    message = sms_templates.get(action)
    if not message:
        return False
    
    return await send_sms_notification(visitor.phone, message)

# =====================================================
# PUSH NOTIFICATIONS
# =====================================================

async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: Dict[str, Any] = None
) -> bool:
    """
    Send push notification to mobile app
    Uses Redis for real-time delivery
    """
    
    redis_client = get_redis()
    
    notification = {
        "id": f"notif_{datetime.utcnow().timestamp()}",
        "user_id": user_id,
        "title": title,
        "body": body,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    }
    
    try:
        # Store notification
        await redis_client.lpush(
            f"notifications:{user_id}",
            json.dumps(notification)
        )
        
        # Keep only last 100 notifications
        await redis_client.ltrim(f"notifications:{user_id}", 0, 99)
        
        # Publish to real-time channel
        await redis_client.publish(
            f"user_notifications:{user_id}",
            json.dumps(notification)
        )
        
        return True
        
    except Exception as e:
        print(f"Push notification failed: {str(e)}")
        return False

async def send_access_push(
    user_id: str,
    business: Business,
    action: str,
    details: Dict[str, Any] = None
) -> bool:
    """
    Send access-related push notification
    """
    
    push_templates = {
        "qr_generated": {
            "title": "QR Code Ready",
            "body": f"Your access QR for {business.name} is ready to use"
        },
        "visitor_approved": {
            "title": "Access Approved",
            "body": f"You can now access {business.name}"
        },
        "check_in": {
            "title": "Check-in Successful",
            "body": f"Welcome to {business.name}!"
        },
        "check_out": {
            "title": "Check-out Complete",
            "body": f"Thanks for visiting {business.name}"
        }
    }
    
    template = push_templates.get(action)
    if not template:
        return False
    
    return await send_push_notification(
        user_id=user_id,
        title=template["title"],
        body=template["body"],
        data={
            "business_id": business.id,
            "action": action,
            "details": details or {}
        }
    )

# =====================================================
# UNIFIED NOTIFICATION HANDLER
# =====================================================

async def send_access_notification(
    business: Business,
    visitor: Visitor,
    action: str,
    details: Dict[str, Any] = None,
    channels: List[str] = None
) -> Dict[str, bool]:
    """
    Send notifications across multiple channels
    Returns success status for each channel
    """
    
    if not channels:
        # Default channels based on business settings
        settings_data = business.settings or {}
        channels = []
        
        if settings_data.get("email_notifications", True):
            channels.append("email")
        if settings_data.get("sms_notifications", False):
            channels.append("sms")
        if settings_data.get("push_notifications", True) and visitor.user_id:
            channels.append("push")
    
    results = {}
    
    # Send email notification
    if "email" in channels:
        results["email"] = await send_access_email(visitor, business, action, details)
    
    # Send SMS notification
    if "sms" in channels:
        results["sms"] = await send_access_sms(visitor, business, action, details)
    
    # Send push notification
    if "push" in channels and visitor.user_id:
        results["push"] = await send_access_push(visitor.user_id, business, action, details)
    
    return results

async def send_business_alert(
    business: Business,
    alert_type: str,
    message: str,
    data: Dict[str, Any] = None
) -> bool:
    """
    Send alert to business administrators
    """
    
    # Get business admin emails from employees
    # TODO: Query business employees with admin/manager roles
    admin_emails = [business.email]
    
    alert_subject = f"AXS360 Alert - {business.name}"
    alert_content = f"""
    <h2>Business Alert</h2>
    <p><strong>Type:</strong> {alert_type}</p>
    <p><strong>Message:</strong> {message}</p>
    <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
    
    {f"<p><strong>Additional Data:</strong> {json.dumps(data, indent=2)}</p>" if data else ""}
    
    <p>Please log into your AXS360 dashboard for more details.</p>
    """
    
    return await send_business_notification_email(
        business=business,
        subject=alert_subject,
        content=alert_content,
        recipient_emails=admin_emails
    )

# =====================================================
# EMAIL TEMPLATES
# =====================================================

def generate_email_template(template_name: str, variables: Dict[str, Any]) -> str:
    """
    Generate HTML email content from template
    """
    
    # Basic email templates
    templates = {
        "access_qr_generated.html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Your Access QR Code is Ready!</h2>
            
            <p>Hello {visitor_name},</p>
            
            <p>Your QR code for accessing <strong>{business_name}</strong> has been generated successfully.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Visit Details:</h3>
                <p><strong>Business:</strong> {business_name}</p>
                <p><strong>Address:</strong> {business_address}</p>
                <p><strong>Generated:</strong> {timestamp}</p>
            </div>
            
            <p>Please present your QR code at the entrance. Have a great visit!</p>
            
            <p style="color: #6b7280; font-size: 12px;">
                This QR code is valid for the time specified in your request. 
                For support, contact the business directly.
            </p>
        </div>
        """,
        
        "visitor_approved.html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Access Approved!</h2>
            
            <p>Hello {visitor_name},</p>
            
            <p>Great news! Your access request for <strong>{business_name}</strong> has been approved.</p>
            
            <p>You can now generate your QR code and visit the location.</p>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Open the AXS360 app</li>
                    <li>Generate your access QR code</li>
                    <li>Present it at the entrance</li>
                </ol>
            </div>
            
            <p>Welcome to {business_name}!</p>
        </div>
        """,
        
        "check_in_confirmation.html": """
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Check-in Confirmed</h2>
            
            <p>Hello {visitor_name},</p>
            
            <p>You have successfully checked in to <strong>{business_name}</strong>.</p>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Check-in Time:</strong> {timestamp}</p>
                <p><strong>Location:</strong> {details.location}</p>
            </div>
            
            <p>Enjoy your visit! Don't forget to check out when you leave.</p>
        </div>
        """
    }
    
    template = templates.get(template_name, "<p>Notification from AXS360</p>")
    
    # Replace variables
    try:
        return template.format(**variables)
    except KeyError as e:
        print(f"Template variable missing: {e}")
        return template

# =====================================================
# NOTIFICATION PREFERENCES
# =====================================================

async def update_notification_preferences(
    user_id: str,
    preferences: Dict[str, bool]
) -> bool:
    """
    Update user notification preferences
    """
    
    redis_client = get_redis()
    
    try:
        await redis_client.set(
            f"notification_prefs:{user_id}",
            json.dumps(preferences)
        )
        return True
    except:
        return False

async def get_notification_preferences(user_id: str) -> Dict[str, bool]:
    """
    Get user notification preferences
    """
    
    redis_client = get_redis()
    
    try:
        prefs_str = await redis_client.get(f"notification_prefs:{user_id}")
        if prefs_str:
            return json.loads(prefs_str)
    except:
        pass
    
    # Default preferences
    return {
        "email_notifications": True,
        "sms_notifications": False,
        "push_notifications": True,
        "marketing_emails": False
    }
