from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from core.security import get_user_from_token

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Dependency to get current authenticated user from JWT token with role"""
    from supabase import create_client
    from core.config import settings
    import httpx
    from supabase.lib.client_options import SyncClientOptions
    
    user_data = get_user_from_token(credentials.credentials)
    user_data["token"] = credentials.credentials  # Store token for later use
    user_id = user_data.get("id")
    
    if user_id:
        try:
            # Create user-specific client with JWT token for proper RLS context
            http_client = httpx.Client(
                timeout=httpx.Timeout(30.0),
                verify=True,
                headers={'Authorization': f'Bearer {credentials.credentials}'}
            )
            options = SyncClientOptions(
                httpx_client=http_client,
                postgrest_client_timeout=30.0
            )
            
            # Create client with anon key and set user auth token
            user_client = create_client(
                settings.supabase_url,
                settings.supabase_key,  # Use anon key, not service key
                options=options
            )
            # No need for set_auth, token is in headers
            
            # Fetch user role from profiles table
            result = user_client.table("profiles").select("role").eq("user_id", user_id).execute()
            if result.data:
                user_data["role"] = result.data[0].get("role", "user")
            else:
                user_data["role"] = "user"
        except Exception as e:
            print(f"⚠️ Warning: Could not fetch user role: {e}")
            user_data["role"] = "user"
    
    return user_data

def get_current_user_id(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """Dependency to extract user ID from current user"""
    return current_user.get("id", "")

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency that requires admin role"""
    from supabase import create_client
    from core.config import settings
    import httpx
    from supabase.lib.client_options import SyncClientOptions
    from fastapi import HTTPException, status
    
    user_id = current_user.get("id")
    token = current_user.get("token")
    
    if not user_id or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token"
        )
    
    # Check user role from profiles table
    try:
        # Create user-specific client with JWT token for proper RLS context
        http_client = httpx.Client(
            timeout=httpx.Timeout(30.0),
            verify=True,
            headers={'Authorization': f'Bearer {token}'}
        )
        options = SyncClientOptions(
            httpx_client=http_client,
            postgrest_client_timeout=30.0
        )
        
        # Create client with anon key and set user auth token
        user_client = create_client(
            settings.supabase_url,
            settings.supabase_key,  # Use anon key, not service key
            options=options
        )
        # No need for set_auth, token is in headers
        
        result = user_client.table("profiles").select("role").eq("user_id", user_id).execute()
        
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