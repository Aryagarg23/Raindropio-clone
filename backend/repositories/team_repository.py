from typing import Dict, List, Optional
from .base_repository import BaseRepository


class TeamRepository(BaseRepository):
    """
    Repository for team-related database operations.
    Handles team management, memberships, and related queries.
    """

    async def get_team_by_id(self, team_id: str) -> Optional[Dict]:
        """
        Get team by ID.

        Args:
            team_id: The team's ID

        Returns:
            Team data or None if not found
        """
        return await self.get_by_id("teams", team_id)

    async def get_all_teams(self) -> List[Dict]:
        """
        Get all teams.

        Returns:
            List of all teams
        """
        return await self.get_all("teams")

    async def create_team(self, data: Dict) -> Dict:
        """
        Create a new team.

        Args:
            data: Team data to insert

        Returns:
            The created team data
        """
        return await self.insert("teams", data)

    async def update_team(self, team_id: str, data: Dict) -> Dict:
        """
        Update team by ID.

        Args:
            team_id: The team's ID
            data: Data to update

        Returns:
            The updated team data
        """
        return await self.update("teams", team_id, data)

    async def get_user_teams(self, user_id: str) -> List[Dict]:
        """
        Get all teams for a user.

        Args:
            user_id: The user's ID

        Returns:
            List of teams the user belongs to
        """
        try:
            # Get teams through team_memberships join
            response = self.supabase.table("team_memberships").select("teams(*)").eq("user_id", user_id).execute()
            # Extract teams from the nested structure
            return [item["teams"] for item in response.data] if response.data else []
        except Exception as e:
            raise Exception(f"Failed to get user teams: {str(e)}")

    async def get_team_members(self, team_id: str) -> List[Dict]:
        """
        Get all members of a team.

        Args:
            team_id: The team's ID

        Returns:
            List of team members (profiles)
        """
        try:
            # Get profiles through team_memberships join
            response = self.supabase.table("team_memberships").select("profiles(*)").eq("team_id", team_id).execute()
            # Extract profiles from the nested structure
            return [item["profiles"] for item in response.data] if response.data else []
        except Exception as e:
            raise Exception(f"Failed to get team members: {str(e)}")

    async def add_team_member(self, team_id: str, user_id: str, role: str = "member") -> Dict:
        """
        Add a member to a team.

        Args:
            team_id: The team's ID
            user_id: The user's ID
            role: The member's role (default: member)

        Returns:
            The membership data
        """
        data = {
            "team_id": team_id,
            "user_id": user_id,
            "role": role
        }
        return await self.insert("team_memberships", data)

    async def remove_team_member(self, team_id: str, user_id: str) -> bool:
        """
        Remove a member from a team.

        Args:
            team_id: The team's ID
            user_id: The user's ID

        Returns:
            True if removed successfully
        """
        try:
            response = self.supabase.table("team_memberships").delete().eq("team_id", team_id).eq("user_id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            raise Exception(f"Failed to remove team member: {str(e)}")

    async def get_team_membership(self, team_id: str, user_id: str) -> Optional[Dict]:
        """
        Get membership details for a user in a team.

        Args:
            team_id: The team's ID
            user_id: The user's ID

        Returns:
            Membership data or None
        """
        try:
            response = self.supabase.table("team_memberships").select("*").eq("team_id", team_id).eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to get team membership: {str(e)}")