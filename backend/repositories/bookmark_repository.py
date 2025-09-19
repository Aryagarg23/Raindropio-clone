from typing import List, Dict, Any, Optional
from repositories.base_repository import BaseRepository
from models.bookmark import Bookmark


class BookmarkRepository(BaseRepository):
    """
    Repository for bookmark operations.
    """

    def __init__(self):
        super().__init__()

    async def create_bookmark(self, bookmark_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new bookmark.

        Args:
            bookmark_data: The bookmark data to insert

        Returns:
            The created bookmark record
        """
        return await self.insert("bookmarks", bookmark_data)

    async def get_bookmarks_by_team(self, team_id: str) -> List[Dict[str, Any]]:
        """
        Get all bookmarks for a team.

        Args:
            team_id: The team ID

        Returns:
            List of bookmarks
        """
        try:
            response = self.supabase.table("bookmarks").select("*").eq("team_id", team_id).order("created_at", desc=True).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to get bookmarks for team {team_id}: {str(e)}")

    async def get_bookmark_by_id(self, bookmark_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a bookmark by its ID.

        Args:
            bookmark_id: The bookmark ID

        Returns:
            The bookmark record if found, None otherwise
        """
        return await self.get_by_id("bookmarks", bookmark_id)

    async def update_bookmark(self, bookmark_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a bookmark.

        Args:
            bookmark_id: The bookmark ID
            data: The data to update

        Returns:
            The updated bookmark record
        """
        return await self.update("bookmarks", bookmark_id, data)

    async def delete_bookmark(self, bookmark_id: str) -> bool:
        """
        Delete a bookmark.

        Args:
            bookmark_id: The bookmark ID

        Returns:
            True if deleted successfully
        """
        try:
            response = self.supabase.table("bookmarks").delete().eq("id", bookmark_id).execute()
            return len(response.data) > 0
        except Exception as e:
            raise Exception(f"Failed to delete bookmark {bookmark_id}: {str(e)}")