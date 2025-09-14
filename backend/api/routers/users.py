from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Dict, Any, Optional
from api.deps import get_current_user
from models.user import UserProfile, SyncResponse, ErrorResponse
from core.supabase_client import supabase_service

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/sync", response_model=SyncResponse)
async def sync_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Sync user profile from Supabase auth to public.profiles table
    Creates or updates profile record using service role
    """
    print(f"🚀 Sync profile endpoint called for user: {current_user.get('id', 'unknown')}")
    try:
        user_id = current_user.get("id")
        email = current_user.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data from token"
            )
        
        # Check if profile exists
        existing_profile = supabase_service.table("profiles").select("*").eq("user_id", user_id).execute()
        
        if existing_profile.data:
            # Profile exists, just return it (no need to update on every sync)
            profile = existing_profile.data[0]
            print(f"✅ Found existing profile: {profile.get('full_name')}, {profile.get('favorite_color')}")
        else:
            # Create new profile from user metadata
            profile_data = {
                "user_id": user_id,
                "email": email,
                "full_name": current_user.get("user_metadata", {}).get("full_name"),
                "avatar_url": current_user.get("user_metadata", {}).get("avatar_url"),
                "favorite_color": current_user.get("user_metadata", {}).get("favorite_color"),
            }
            
            try:
                result = supabase_service.table("profiles").insert(profile_data).execute()
                profile = result.data[0] if result.data else None
                print(f"✅ Created new profile for {email}")
            except Exception as e:
                print(f"❌ Error creating profile: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create profile"
                )
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create or update profile"
            )
        
        user_profile = UserProfile(
            user_id=profile["user_id"],
            email=profile["email"],
            full_name=profile.get("full_name"),
            avatar_url=profile.get("avatar_url"),
            favorite_color=profile.get("favorite_color"),
            role=profile.get("role", "user"),  # Get role from DB or default to "user"
            created_at=profile.get("created_at")
        )
        
        return SyncResponse(profile=user_profile)
        
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
    print(f"🔄 Update profile endpoint called for user: {current_user.get('id', 'unknown')}")
    print(f"📝 Form data - full_name: {full_name}, favorite_color: {favorite_color}")
    print(f"🖼️ Avatar provided: {avatar is not None}")
    
    try:
        user_id = current_user.get("id")
        if not user_id:
            print("❌ No user_id in token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data from token"
            )
        
        # Get current profile
        print(f"🔍 Looking up existing profile for user: {user_id}")
        existing_profile = supabase_service.table("profiles").select("*").eq("user_id", user_id).execute()
        print(f"📊 Profile query result: {existing_profile.data if hasattr(existing_profile, 'data') else 'No data attribute'}")
        
        if not existing_profile.data:
            print("❌ Profile not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        current_profile = existing_profile.data[0]
        avatar_url = current_profile.get("avatar_url", "")
        print(f"✅ Found existing profile, current avatar_url: {avatar_url}")
        
        # Handle avatar upload if provided
        if avatar:
            print("🖼️ Uploading avatar to Supabase Storage...")
            try:
                contents = await avatar.read()
                # Use a unique filename per user in the 'avatars/' subfolder of 'nis' bucket
                filename = f"avatars/{user_id}_{avatar.filename}"
                # Upload to Supabase Storage (bucket 'nis', subfolder 'avatars')
                upload_response = supabase_service.storage.from_("nis").upload(filename, contents)
                if hasattr(upload_response, 'error') and upload_response.error:
                    print(f"❌ Avatar upload error: {upload_response.error}")
                else:
                    print(f"✅ Avatar uploaded: {filename}")
                    # Get public URL
                    public_url = supabase_service.storage.from_("nis").get_public_url(filename)
                    # Remove trailing '?' if present
                    if public_url:
                        avatar_url = public_url.rstrip('?')
            except Exception as avatar_error:
                print(f"❌ Avatar upload failed: {avatar_error}")
                # Fallback to previous avatar_url
                pass
        
        # Update profile
        update_data = {
            "full_name": full_name,
            "favorite_color": favorite_color,
            "avatar_url": avatar_url
        }
        print(f"📝 Updating profile with data: {update_data}")
        
        # Check what we're trying to update
        print(f"🎯 Attempting to update user_id: {user_id}")
        print(f"📝 Update data: {update_data}")
        
        # Try using upsert instead of update to see if that works
        print("🔄 Trying upsert approach...")
        try:
            # Use upsert with on_conflict to ensure the record is updated
            upsert_data = {
                "user_id": user_id,
                "email": current_profile["email"],  # Keep existing email
                "full_name": update_data["full_name"],
                "favorite_color": update_data["favorite_color"], 
                "avatar_url": update_data["avatar_url"],
                "created_at": current_profile["created_at"]  # Keep existing timestamp
            }
            
            result = supabase_service.table("profiles").upsert(upsert_data, on_conflict="user_id").execute()
            print(f"� Upsert result: {result.data}")
            
        except Exception as upsert_error:
            print(f"❌ Upsert failed, falling back to regular update: {upsert_error}")
            result = supabase_service.table("profiles").update(update_data).eq("user_id", user_id).execute()
        print(f"📊 Update result data: {result.data if hasattr(result, 'data') else 'No data attribute'}")
        print(f"🔍 Update result type: {type(result)}")
        print(f"🔍 Update result count: {getattr(result, 'count', 'No count attribute')}")
        
        # Check for any errors in different possible locations
        if hasattr(result, 'error') and result.error:
            print(f"❌ Update error: {result.error}")
        
        # Verify the update was successful
        verify_result = supabase_service.table("profiles").select("*").eq("user_id", user_id).execute()
        updated_profile = verify_result.data[0] if verify_result.data else result.data[0]
        
        print(f"✅ Profile updated successfully: {updated_profile.get('full_name')}, {updated_profile.get('favorite_color')}")
        
        # Compare what we tried to update vs what's actually in the database
        if verify_result.data:
            actual_data = verify_result.data[0]
            print(f"🔍 Database vs Update comparison:")
            print(f"   Expected full_name: '{update_data['full_name']}' | Actual: '{actual_data.get('full_name')}'")
            print(f"   Expected favorite_color: '{update_data['favorite_color']}' | Actual: '{actual_data.get('favorite_color')}'")
            
            # Check if the update actually worked  
            if (actual_data.get('full_name') != update_data['full_name'] or 
                actual_data.get('favorite_color') != update_data['favorite_color']):
                print("❌ DATABASE UPDATE FAILED - RLS policy may be blocking the update")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database update failed - likely due to Row Level Security policies"
                )
            else:
                print("✅ UPDATE CONFIRMED - Data matches expected values")
        
        if not result.data:
            print("❌ Profile update failed - no data returned")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        updated_profile = result.data[0]
        user_profile = UserProfile(
            user_id=updated_profile["user_id"],
            email=updated_profile["email"],
            full_name=updated_profile.get("full_name"),
            avatar_url=updated_profile.get("avatar_url"),
            favorite_color=updated_profile.get("favorite_color"),
            role=updated_profile.get("role", "user"),
            created_at=updated_profile.get("created_at")
        )
        
        # Return the updated profile
        return {
            "message": "Profile updated successfully",
            "profile": updated_profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in update_profile: {str(e)}")
        print(f"🔍 Error type: {type(e)}")
        import traceback
        print(f"📊 Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )