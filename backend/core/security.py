import jwt
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from core.supabase_client import supabase_service
from core.config import settings
import requests
from functools import lru_cache
import time
import hashlib

# Simple in-memory cache for token validation
token_cache = {}
cache_ttl = 300  # 5 minutes

def get_token_hash(token: str) -> str:
    """Get a hash of the token for caching"""
    return hashlib.sha256(token.encode()).hexdigest()[:16]

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decode and validate Supabase JWT token with caching"""
    token_hash = get_token_hash(token)
    current_time = time.time()
    
    # Check cache first
    if token_hash in token_cache:
        cached_data, cached_time = token_cache[token_hash]
        if current_time - cached_time < cache_ttl:
            print(f"✅ Using cached token validation for user: {cached_data.get('id', 'unknown')}")
            return cached_data
        else:
            # Remove expired cache entry
            del token_cache[token_hash]
    
    try:
        print(f"🔐 Validating token with Supabase...")
        
        # Validate token by calling Supabase user endpoint with user's token
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_service_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers=headers,
            timeout=10  # Add timeout to prevent hanging
        )
        
        print(f"📡 Supabase response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Token validation failed: {response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
            
        user_data = response.json()
        
        # Cache the result
        token_cache[token_hash] = (user_data, current_time)
        
        # Clean old cache entries (simple cleanup)
        if len(token_cache) > 1000:  # Prevent memory bloat
            old_entries = [k for k, (_, t) in token_cache.items() if current_time - t > cache_ttl]
            for k in old_entries:
                del token_cache[k]
        
        print(f"✅ Token validated and cached for user: {user_data.get('id', 'unknown')}")
        return user_data
        
    except requests.exceptions.Timeout:
        print(f"❌ Token validation timeout")
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Token validation timeout"
        )
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