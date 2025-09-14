from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    user_id: str  # Changed from id to user_id to match database schema
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    favorite_color: Optional[str] = None
    created_at: Optional[datetime] = None

class SyncResponse(BaseModel):
    profile: UserProfile
    message: str = "Profile synced successfully"

class ErrorResponse(BaseModel):
    error: dict
    
    @classmethod
    def create(cls, code: str, message: str, details: Optional[dict] = None):
        return cls(error={
            "code": code,
            "message": message,
            "details": details or {}
        })