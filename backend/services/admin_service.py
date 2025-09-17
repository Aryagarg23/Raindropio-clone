"""
Admin service for administrative operations
"""
from typing import Dict, Any, List
from fastapi import UploadFile, HTTPException, status
from .base_service import BaseService
from models.user import UserProfile
from models.team import Team
from core.exceptions import NotFoundError, ConflictError


class AdminService(BaseService):
    """
    Service for administrative operations
    """

    async def list_all_users(self) -> List[UserProfile]:
        """
        Get all users in the system

        Returns:
            List[UserProfile]: All user profiles
        """
        try:
            users_data = await self.user_repository.get_all_users()

            users = []
            for user_data in users_data:
                user = UserProfile(
                    user_id=user_data["user_id"],
                    email=user_data["email"],
                    full_name=user_data.get("full_name"),
                    avatar_url=user_data.get("avatar_url"),
                    favorite_color=user_data.get("favorite_color"),
                    role=user_data.get("role", "user"),
                    created_at=user_data.get("created_at")
                )
                users.append(user)

            return users

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching users: {str(e)}"
            )

    async def create_team(
        self,
        name: str,
        description: str,
        logo: UploadFile = None,
        created_by: str = None
    ) -> Team:
        """
        Create a new team with optional logo upload

        Args:
            name: Team name
            description: Team description
            logo: Optional logo file
            created_by: User ID of creator

        Returns:
            Team: Created team
        """
        try:
            logo_url = ''
            if logo:
                contents = await logo.read()
                filename = f"avatars/team_{name}_{logo.filename}"
                upload_response = self.supabase.storage.from_("nis").upload(filename, contents)
                if hasattr(upload_response, 'error') and upload_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Logo upload failed: {upload_response.error}"
                    )
                else:
                    public_url = self.supabase.storage.from_("nis").get_public_url(filename)
                    if public_url:
                        logo_url = public_url.rstrip('?')

            team_data = {
                "name": name,
                "description": description,
                "logo_url": logo_url,
                "created_by": created_by
            }

            result = await self.team_repository.create_team(team_data)

            return Team(
                id=result["id"],
                name=result["name"],
                description=result.get("description"),
                logo_url=result.get("logo_url"),
                created_at=result["created_at"],
                created_by=result.get("created_by")
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating team: {str(e)}"
            )

    async def update_team(
        self,
        team_id: str,
        name: str = None,
        description: str = None,
        logo: UploadFile = None
    ) -> Team:
        """
        Update team details with optional logo upload

        Args:
            team_id: Team ID to update
            name: New team name
            description: New team description
            logo: New logo file

        Returns:
            Team: Updated team
        """
        try:
            update_data = {}
            if name is not None and name.strip():
                update_data['name'] = name.strip()
            if description is not None:
                update_data['description'] = description
            if logo:
                contents = await logo.read()
                filename = f"avatars/team_{name or 'unknown'}_{logo.filename}"
                upload_response = self.supabase.storage.from_("nis").upload(filename, contents)
                if hasattr(upload_response, 'error') and upload_response.error:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Logo upload failed: {upload_response.error}"
                    )
                else:
                    public_url = self.supabase.storage.from_("nis").get_public_url(filename)
                    if public_url:
                        update_data['logo_url'] = public_url.rstrip('?')

            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )

            result = await self.team_repository.update_team(team_id, update_data)

            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Team not found"
                )

            return Team(
                id=result["id"],
                name=result["name"],
                description=result.get("description"),
                logo_url=result.get("logo_url"),
                created_at=result["created_at"],
                created_by=result.get("created_by")
            )

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating team: {str(e)}"
            )

    async def add_team_member(self, team_id: str, user_id: str) -> Dict[str, str]:
        """
        Add a user to a team

        Args:
            team_id: Team ID
            user_id: User ID to add

        Returns:
            Dict with success message
        """
        try:
            # Verify team exists
            team = await self.team_repository.get_team_by_id(team_id)
            if not team:
                raise NotFoundError("Team", team_id)

            # Verify user exists
            user = await self.user_repository.get_user_profile(user_id)
            if not user:
                raise NotFoundError("User", user_id)

            # Check if membership already exists
            existing = await self.team_repository.get_team_membership(team_id, user_id)
            if existing:
                raise ConflictError("User is already a member of this team", {
                    "team_id": team_id,
                    "user_id": user_id
                })

            # Add membership
            await self.team_repository.add_team_member(team_id, user_id)

            return {
                "message": "User added to team successfully",
                "team_id": team_id,
                "user_id": user_id
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error adding user to team: {str(e)}"
            )

    async def list_all_teams(self) -> List[Team]:
        """
        Get all teams in the system

        Returns:
            List[Team]: All teams
        """
        try:
            teams_data = await self.team_repository.get_all_teams()

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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching teams: {str(e)}"
            )

    async def remove_team_member(self, team_id: str, user_id: str) -> Dict[str, str]:
        """
        Remove a user from a team

        Args:
            team_id: Team ID
            user_id: User ID to remove

        Returns:
            Dict with success message
        """
        try:
            # Check if membership exists
            membership = await self.team_repository.get_team_membership(team_id, user_id)
            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User is not a member of this team"
                )

            # Remove membership
            await self.team_repository.remove_team_member(team_id, user_id)

            return {
                "message": "User removed from team successfully",
                "team_id": team_id,
                "user_id": user_id
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error removing user from team: {str(e)}"
            )

    async def get_team_members(self, team_id: str) -> List[UserProfile]:
        """
        Get all members of a specific team

        Args:
            team_id: Team ID

        Returns:
            List[UserProfile]: Team members
        """
        try:
            # Use repository to get team members
            members_data = await self.team_repository.get_team_members(team_id)

            members = []
            for member_data in members_data:
                member = UserProfile(
                    user_id=member_data["user_id"],
                    email=member_data["email"],
                    full_name=member_data.get("full_name"),
                    avatar_url=member_data.get("avatar_url"),
                    favorite_color=member_data.get("favorite_color"),
                    role=member_data.get("role", "user")
                )
                members.append(member)

            return members

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching team members: {str(e)}"
            )

    async def get_user_teams(self, user_id: str) -> List[Team]:
        """
        Get all teams for a specific user

        Args:
            user_id: User ID

        Returns:
            List[Team]: User's teams
        """
        try:
            # Use repository to get user teams
            teams_data = await self.team_repository.get_user_teams(user_id)

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
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error fetching user teams: {str(e)}"
            )