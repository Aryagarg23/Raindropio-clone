from typing import Dict, Optional, Any
from .base_repository import BaseRepository


class UserRepository(BaseRepository):
    """
    Repository for user-related database operations.
    Handles user profile management and user data access.
    """

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user profile by user ID.

        Args:
            user_id: The user ID

        Returns:
            The user profile if found, None otherwise
        """
        try:
            response = self.supabase.table("profiles").select("*").match({"user_id": user_id}).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Database query failed: {str(e)}")

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

    async def update_user_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user profile.

        Args:
            user_id: The user ID
            data: The data to update

        Returns:
            The updated user profile
        """
        try:
            response = self.supabase.table("profiles").update(data).match({"user_id": user_id}).execute()
            return response.data[0]
        except Exception as e:
            raise Exception(f"Database update failed: {str(e)}")

    async def get_all_users(self) -> list[Dict]:
        """
        Get all user profiles.

        Returns:
            List of all user profiles
        """
        return await self.get_all("profiles")