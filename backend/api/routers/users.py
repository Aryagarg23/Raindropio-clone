from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Dict, Any, Optional
from api.deps import get_current_user
from models.user import UserProfile, SyncResponse, ErrorResponse
from services import user_service

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/sync", response_model=SyncResponse)
async def sync_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Sync user profile from Supabase auth to public.profiles table
    Creates or updates profile record using service role
    """
    try:
        profile = await user_service.sync_user_profile(current_user)
        return SyncResponse(profile=profile)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.put("/profile", response_model=SyncResponse)
async def update_profile(
    full_name: str = Form(...),
    favorite_color: str = Form(...),
    avatar: Optional[UploadFile] = File(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update user profile with optional avatar upload
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data from token"
            )

        profile = await user_service.update_user_profile(
            user_id=user_id,
            full_name=full_name,
            favorite_color=favorite_color,
            avatar=avatar
        )

        return SyncResponse(profile=profile)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )