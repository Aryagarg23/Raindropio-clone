"""
Custom exception classes for better error handling
"""
from typing import Any, Dict, Optional
from fastapi import HTTPException


class BusinessLogicError(HTTPException):
    """
    Exception for business logic errors that should return specific HTTP status codes
    """

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=message)
        self.error_code = error_code
        self.details = details or {}


class ValidationError(BusinessLogicError):
    """Exception for validation errors"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=400,
            error_code="VALIDATION_ERROR",
            message=message,
            details=details
        )


class NotFoundError(BusinessLogicError):
    """Exception for resource not found errors"""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=404,
            error_code="NOT_FOUND",
            message=f"{resource} not found: {identifier}",
            details={"resource": resource, "identifier": identifier}
        )


class ForbiddenError(BusinessLogicError):
    """Exception for forbidden access errors"""

    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            status_code=403,
            error_code="FORBIDDEN",
            message=message
        )


class ConflictError(BusinessLogicError):
    """Exception for conflict errors (e.g., duplicate resources)"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=409,
            error_code="CONFLICT",
            message=message,
            details=details
        )


class ServiceUnavailableError(BusinessLogicError):
    """Exception for service unavailable errors"""

    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(
            status_code=503,
            error_code="SERVICE_UNAVAILABLE",
            message=message
        )