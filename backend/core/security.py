import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from core.supabase_client import supabase_service
from core.config import settings
import requests

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate Supabase JWT token"""
    try:
        print(f"🔐 Validating token with Supabase...")
        print(f"📍 Using URL: {settings.supabase_url}")
        
        # Validate token by calling Supabase user endpoint with user's token
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_service_key  # Add service key for validation
        }
        
        response = requests.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers=headers
        )
        
        print(f"📡 Supabase response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Token validation failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        user_data = response.json()
        print(f"✅ Token validated for user: {user_data.get('id', 'unknown')}")
        return user_data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error validating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        )
    except Exception as e:
        print(f"❌ Unexpected error validating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def get_user_from_token(token: str) -> Dict[str, Any]:
    """Extract user data from validated JWT token"""
    print(f"👤 Getting user from token...")
    return decode_jwt_token(token)