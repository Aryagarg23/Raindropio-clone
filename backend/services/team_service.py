"""
Team service for handling team operations
"""
from typing import Dict, Any, List
from fastapi import HTTPException, status
from .base_service import BaseService
from models.team import Team
from models.user import UserProfile


class TeamService(BaseService):
    """
    Service for team management operations
    """

    async def get_user_teams(self, user_id: str, user_role: str = "user") -> List[Team]:
        """
        Get all teams that the user belongs to (or all teams if admin)

        Args:
            user_id: The user ID
            user_role: The user's role (admin or user)

        Returns:
            List[Team]: List of teams the user has access to
        """
        try:
            # If user is admin, return all teams
            if user_role == "admin":
                teams_data = await self.team_repository.get_all_teams()
            else:
                # For regular users, get teams they're members of with roles
                teams_data = await self.team_repository.get_user_teams(user_id)

            # Convert to Team objects
            teams = []
            for team_data in teams_data:
                team = Team(
                    id=team_data["id"],
                    name=team_data["name"],
                    description=team_data.get("description"),
                    logo_url=team_data.get("logo_url"),
                    created_at=team_data["created_at"],
                    created_by=team_data.get("created_by")
                )
                teams.append(team)

            return teams

        except Exception as e:
            error_message = str(e).lower()

            # If tables don't exist yet (migrations not run), return empty teams
            if "does not exist" in error_message or "relation" in error_message:
                return []

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error fetching teams"
            )

    async def get_team_members(self, team_id: str, requesting_user_id: str, requesting_user_role: str = "user") -> List[UserProfile]:
        """
        Get members of a specific team (only if requesting user is a member or is admin)

        Args:
            team_id: The team ID to get members for
            requesting_user_id: The user making the request
            requesting_user_role: The role of the requesting user

        Returns:
            List[UserProfile]: List of team members

        Raises:
            HTTPException: If user doesn't have permission or team not found
        """
        # Check if user has permission to view this team's members
        if requesting_user_role != "admin":
            # Check if user is a member of this team
            membership = await self._select_one("team_memberships", {
                "team_id": team_id,
                "user_id": requesting_user_id
            })

            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be a member of this team to view its members"
                )

        # Get team memberships with user profiles
        # Use repository to get members with their roles
        members_data = await self.team_repository.get_team_members(team_id)

        members = []
        for member_data in members_data:
            member = UserProfile(
                user_id=member_data["user_id"],
                email=member_data["email"],
                full_name=member_data.get("full_name"),
                avatar_url=member_data.get("avatar_url"),
                favorite_color=member_data.get("favorite_color"),
                role=member_data.get("role", "user"),  # User's global role from profile
                created_at=member_data.get("created_at")
            )
            members.append(member)

        return members