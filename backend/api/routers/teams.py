from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from api.deps import get_current_user
from models.team import Team, ListTeamsResponse
from models.user import UserProfile
from services import team_service

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("", response_model=ListTeamsResponse)
async def get_user_teams(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get all teams that the current user belongs to (or all teams if admin)
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")

    try:
        teams = await team_service.get_user_teams(user_id, user_role)
        return ListTeamsResponse(teams=teams)
    except HTTPException:
        raise
    except Exception as e:
        # If tables don't exist yet (migrations not run), return empty teams
        error_message = str(e).lower()
        if "does not exist" in error_message or "relation" in error_message:
            return ListTeamsResponse(teams=[])

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching teams"
        )

@router.get("/{team_id}/members")
async def get_team_members(
    team_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get members of a specific team (only if current user is a member of that team or is admin)
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")

    try:
        members = await team_service.get_team_members(team_id, user_id, user_role)
        return {"members": members, "team_id": team_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching team members"
        )