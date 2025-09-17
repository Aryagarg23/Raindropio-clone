"""
User service for handling user profile operations
"""
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException, status
from .base_service import BaseService
from models.user import UserProfile


class UserService(BaseService):
    """
    Service for user profile management operations
    """

    async def sync_user_profile(self, current_user: Dict[str, Any]) -> UserProfile:
        """
        Sync user profile from Supabase auth to public.profiles table
        Creates or updates profile record using service role

        Args:
            current_user: User data from JWT token

        Returns:
            UserProfile: The synced user profile

        Raises:
            HTTPException: If user data is invalid or database operations fail
        """
        user_id = current_user.get("id")
        email = current_user.get("email")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data from token"
            )

        # Check if profile exists
        existing_profile = await self.user_repository.get_user_profile(user_id)

        if existing_profile:
            # Profile exists, return it
            profile = existing_profile
        else:
            # Create new profile from user metadata
            profile_data = {
                "user_id": user_id,
                "email": email,
                "full_name": current_user.get("user_metadata", {}).get("full_name"),
                "avatar_url": current_user.get("user_metadata", {}).get("avatar_url"),
                "favorite_color": current_user.get("user_metadata", {}).get("favorite_color"),
            }

            profile = await self.user_repository.upsert_user_profile(profile_data)
            if not profile:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create profile"
                )

        return UserProfile(
            user_id=profile["user_id"],
            email=profile["email"],
            full_name=profile.get("full_name"),
            avatar_url=profile.get("avatar_url"),
            favorite_color=profile.get("favorite_color"),
            role=profile.get("role", "user"),
            created_at=profile.get("created_at")
        )

    async def update_user_profile(
        self,
        user_id: str,
        full_name: str,
        favorite_color: str,
        avatar: Optional[UploadFile] = None
    ) -> UserProfile:
        """
        Update user profile with optional avatar upload

        Args:
            user_id: The user ID to update
            full_name: New full name
            favorite_color: New favorite color
            avatar: Optional avatar file to upload

        Returns:
            UserProfile: The updated user profile

        Raises:
            HTTPException: If profile not found or update fails
        """
        # Get current profile
        current_profile = await self.user_repository.get_user_profile(user_id)
        if not current_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )

        avatar_url = current_profile.get("avatar_url", "")

        # Handle avatar upload if provided
        if avatar:
            try:
                contents = await avatar.read()
                # Use a unique filename per user in the 'avatars/' subfolder of 'nis' bucket
                filename = f"avatars/{user_id}_{avatar.filename}"

                # Upload to Supabase Storage (bucket 'nis', subfolder 'avatars')
                upload_response = self.supabase.storage.from_("nis").upload(filename, contents)
                if hasattr(upload_response, 'error') and upload_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Avatar upload failed: {upload_response.error}"
                    )

                # Get public URL
                public_url = self.supabase.storage.from_("nis").get_public_url(filename)
                if public_url:
                    avatar_url = public_url.rstrip('?')

            except HTTPException:
                raise
            except Exception as e:
                # Fallback to previous avatar_url on error
                pass

        # Prepare update data
        update_data = {
            "full_name": full_name,
            "favorite_color": favorite_color,
            "avatar_url": avatar_url
        }

        # Update the profile
        result = await self.user_repository.update_user_profile(user_id, update_data)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )

        # Verify the update was successful
        verify_result = await self.user_repository.get_user_profile(user_id)
        if verify_result:
            # Check if the update actually worked
            if (verify_result.get('full_name') != full_name or
                verify_result.get('favorite_color') != favorite_color):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database update failed - likely due to Row Level Security policies"
                )

        return UserProfile(
            user_id=result["user_id"],
            email=result["email"],
            full_name=result.get("full_name"),
            avatar_url=result.get("avatar_url"),
            favorite_color=result.get("favorite_color"),
            role=result.get("role", "user"),
            created_at=result.get("created_at")
        )