"""
Custom exceptions for AXS360 API
"""

from fastapi import HTTPException, status


class AXSException(Exception):
    """Base exception for AXS360 application"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details
        super().__init__(self.message)


class ValidationException(AXSException):
    """Raised when validation fails"""
    pass


class AuthenticationException(HTTPException):
    """Raised when authentication fails"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationException(HTTPException):
    """Raised when authorization fails"""
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class NotFoundException(HTTPException):
    """Raised when resource is not found"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class ConflictException(HTTPException):
    """Raised when there's a conflict with existing data"""
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


class RateLimitException(HTTPException):
    """Raised when rate limit is exceeded"""
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )


class PaymentException(AXSException):
    """Raised when payment processing fails"""
    pass


class VehicleException(AXSException):
    """Raised when vehicle operations fail"""
    pass


class PassException(AXSException):
    """Raised when pass operations fail"""
    pass


class WalletException(AXSException):
    """Raised when wallet operations fail"""
    pass


class NotificationException(AXSException):
    """Raised when notification operations fail"""
    pass


class QRCodeException(AXSException):
    """Raised when QR code operations fail"""
    pass


class FileUploadException(AXSException):
    """Raised when file upload fails"""
    pass


class DatabaseException(AXSException):
    """Raised when database operations fail"""
    pass


class ExternalServiceException(AXSException):
    """Raised when external service calls fail"""
    pass


class ConfigurationException(AXSException):
    """Raised when configuration is invalid"""
    pass
