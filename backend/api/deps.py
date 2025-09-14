from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from core.security import get_user_from_token

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user from JWT token"""
    return get_user_from_token(credentials.credentials)

def get_current_user_id(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """Dependency to extract user ID from current user"""
    return current_user.get("id", "")

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency that requires admin role"""
    # For now, we'll check if user is admin in the profiles table
    # This will be implemented when we have the profiles table check
    return current_user