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
    from core.supabase_client import supabase_service
    
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token"
        )
    
    # Check user role from profiles table
    try:
        result = supabase_service.table("profiles").select("role").eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User profile not found"
            )
            
        user_role = result.data[0].get("role")
        if user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
            
        return current_user
        
    except Exception as e:
        print(f"❌ Error checking admin role: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validating admin access"
        )