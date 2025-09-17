from typing import Dict, Optional
from .base_repository import BaseRepository


class UserRepository(BaseRepository):
    """
    Repository for user-related database operations.
    Handles user profile management and user data access.
    """

    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """
        Get user profile by user ID.

        Args:
            user_id: The user's ID

        Returns:
            User profile data or None if not found
        """
        try:
            response = self.supabase.table("profiles").select("*").eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to get user profile: {str(e)}")

    async def upsert_user_profile(self, data: Dict) -> Dict:
        """
        Insert or update user profile data.

        Args:
            data: The profile data to upsert

        Returns:
            The upserted profile data
        """
        try:
            response = self.supabase.table("profiles").upsert(data).execute()
            return response.data[0]
        except Exception as e:
            raise Exception(f"Failed to upsert user profile: {str(e)}")

    async def update_user_profile(self, user_id: str, data: Dict) -> Dict:
        """
        Update user profile by user ID.

        Args:
            user_id: The user's ID
            data: The data to update

        Returns:
            The updated profile data
        """
        try:
            response = self.supabase.table("profiles").update(data).eq("user_id", user_id).execute()
            return response.data[0]
        except Exception as e:
            raise Exception(f"Failed to update user profile: {str(e)}")

    async def get_all_users(self) -> list[Dict]:
        """
        Get all user profiles.

        Returns:
            List of all user profiles
        """
        return await self.get_all("profiles")