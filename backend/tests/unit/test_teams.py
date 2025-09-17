"""
Unit tests for teams router endpoints
"""
import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException


class TestGetUserTeams:
    """Test cases for getting user teams"""

    @pytest.mark.asyncio
    async def test_get_user_teams_admin(self, test_app, mock_team_repository, mock_admin_user, sample_team):
        """Test admin user getting all teams"""
        from api.routers.teams import get_user_teams

        # Mock repository method
        mock_team_repository.get_all_teams.return_value = [sample_team]

        response = await get_user_teams(mock_admin_user)

        assert len(response.teams) == 1
        assert response.teams[0].id == sample_team["id"]
        assert response.message == "Teams retrieved successfully"

    @pytest.mark.asyncio
    async def test_get_user_teams_regular_user(self, test_app, mock_team_repository, mock_current_user, sample_team):
        """Test regular user getting their teams"""
        from api.routers.teams import get_user_teams

        # Mock repository method
        mock_team_repository.get_user_teams.return_value = [sample_team]

        response = await get_user_teams(mock_current_user)

        assert len(response.teams) == 1
        assert response.teams[0].id == sample_team["id"]

    @pytest.mark.asyncio
    async def test_get_user_teams_no_memberships(self, test_app, mock_team_repository, mock_current_user):
        """Test user with no team memberships"""
        from api.routers.teams import get_user_teams

        # Mock repository method to return empty list
        mock_team_repository.get_user_teams.return_value = []

        response = await get_user_teams(mock_current_user)

        assert len(response.teams) == 0
        assert response.message == "Teams retrieved successfully"

    @pytest.mark.asyncio
    async def test_get_user_teams_database_error(self, mock_supabase_client, mock_current_user):
        """Test handling of database errors"""
        from api.routers.teams import get_user_teams
        
        with patch("services.team_service._select_many", side_effect=Exception("Database connection failed")):
            with pytest.raises(HTTPException) as exc_info:
                await get_user_teams(mock_current_user)

        assert exc_info.value.status_code == 500
        assert "Error fetching teams" in exc_info.value.detail


class TestGetTeamMembers:
    """Test cases for getting team members"""

    @pytest.mark.asyncio
    async def test_get_team_members_admin(self, test_app, mock_team_repository, mock_admin_user, sample_user_profile):
        """Test admin getting team members"""
        from api.routers.teams import get_team_members

        team_id = "test-team-id"

        # Mock repository method
        mock_team_repository.get_team_members.return_value = [sample_user_profile]

        response = await get_team_members(team_id, mock_admin_user)

        assert len(response["members"]) == 1
        assert response["members"][0].user_id == sample_user_profile["user_id"]
        assert response["team_id"] == team_id

    @pytest.mark.asyncio
    async def test_get_team_members_regular_user_member(self, test_app, mock_team_repository, mock_current_user, sample_user_profile):
        """Test regular user who is a team member getting team members"""
        from api.routers.teams import get_team_members

        team_id = "test-team-id"

        # Mock repository methods
        mock_team_repository.get_team_members.return_value = [sample_user_profile]

        # Mock membership check in service
        with patch("api.routers.teams.team_service._select_one", return_value={"team_id": team_id, "user_id": mock_current_user["id"]}):
            response = await get_team_members(team_id, mock_current_user)

        assert len(response["members"]) == 1
        assert response["team_id"] == team_id

    @pytest.mark.asyncio
    async def test_get_team_members_regular_user_not_member(self, mock_supabase_client, mock_current_user):
        """Test regular user who is not a team member trying to get members"""
        from api.routers.teams import get_team_members
        
        team_id = "test-team-id"

        with patch("services.team_service._select_one", return_value=None):
            with pytest.raises(HTTPException) as exc_info:
                await get_team_members(team_id, mock_current_user)

        assert exc_info.value.status_code == 403
        assert "must be a member of this team" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_team_members_empty_team(self, test_app, mock_team_repository, mock_admin_user):
        """Test getting members of empty team"""
        from api.routers.teams import get_team_members

        team_id = "empty-team-id"

        # Mock repository to return empty list
        mock_team_repository.get_team_members.return_value = []

        response = await get_team_members(team_id, mock_admin_user)

        assert len(response["members"]) == 0
        assert response["team_id"] == team_id