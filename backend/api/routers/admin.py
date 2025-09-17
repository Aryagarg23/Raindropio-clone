from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Dict, Any, List
from api.deps import require_admin
from models.user import UserProfile
from models.team import (
    Team, CreateTeamRequest, CreateTeamResponse,
    UpdateTeamRequest, UpdateTeamResponse,
    AddMemberRequest, AddMemberResponse, ListUsersResponse
)
from services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=ListUsersResponse)
async def list_all_users(current_user: Dict[str, Any] = Depends(require_admin)):
    """
    Admin only: Get all users in the system
    """
    print(f"👑 Admin {current_user.get('id')} requesting all users")
    
    try:
        users = await admin_service.list_all_users()
        
        print(f"✅ Found {len(users)} users")
        return ListUsersResponse(users=users)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching users"
        )

@router.post("/teams", response_model=CreateTeamResponse)
async def create_team(
    name: str = Form(...),
    description: str = Form(''),
    logo: UploadFile = File(None),
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Create a new team
    """
    user_id = current_user.get("id")
    print(f"👑 Admin {user_id} creating team: {name}")
    
    try:
        team = await admin_service.create_team(
            name=name,
            description=description,
            logo=logo,
            created_by=user_id
        )
        
        print(f"✅ Team created successfully: {team.id}")
        return CreateTeamResponse(team=team)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating team"
        )

@router.put("/teams/{team_id}", response_model=UpdateTeamResponse)
async def update_team(
    team_id: str,
    name: str = Form(None),
    description: str = Form(None),
    logo: UploadFile = File(None),
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Update a team
    """
    user_id = current_user.get("id")
    print(f"👑 Admin {user_id} updating team: {team_id}")
    
    try:
        print(f"🔄 Update request: name={name}, description={description}, logo={logo is not None}")
        
        team = await admin_service.update_team(
            team_id=team_id,
            name=name,
            description=description,
            logo=logo
        )
        
        print(f"✅ Team updated successfully: {team.id}")
        return UpdateTeamResponse(team=team)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating team"
        )

@router.post("/teams/{team_id}/members", response_model=AddMemberResponse)
async def add_team_member(
    team_id: str,
    member_data: AddMemberRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Add a user to a team
    """
    admin_id = current_user.get("id")
    user_id = member_data.user_id
    
    print(f"👑 Admin {admin_id} adding user {user_id} to team {team_id}")
    
    try:
        result = await admin_service.add_team_member(team_id, user_id)
        
        print(f"✅ User {user_id} added to team {team_id}")
        return AddMemberResponse(
            message=result["message"],
            team_id=result["team_id"],
            user_id=result["user_id"]
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Error adding team member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding user to team"
        )

@router.get("/teams", response_model=List[Team])
async def list_all_teams(current_user: Dict[str, Any] = Depends(require_admin)):
    """
    Admin only: Get all teams in the system
    """
    print(f"👑 Admin {current_user.get('id')} requesting all teams")
    
    try:
        teams = await admin_service.list_all_teams()
        
        print(f"✅ Found {len(teams)} teams")
        return teams
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching teams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching teams"
        )

@router.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: str,
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Remove a user from a team
    """
    admin_id = current_user.get("id")
    print(f"👑 Admin {admin_id} removing user {user_id} from team {team_id}")
    
    try:
        result = await admin_service.remove_team_member(team_id, user_id)
        
        print(f"✅ User {user_id} removed from team {team_id}")
        return result
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"❌ Error removing team member: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing user from team"
        )

@router.get("/teams/{team_id}/members")
async def get_team_members(
    team_id: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Get all members of a specific team
    """
    print(f"👑 Admin {current_user.get('id')} requesting members for team {team_id}")
    
    try:
        members = await admin_service.get_team_members(team_id)
        
        print(f"✅ Found {len(members)} members for team {team_id}")
        return {"members": members, "team_id": team_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching team members: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching team members"
        )

@router.get("/users/{user_id}/teams")
async def get_user_teams(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Get all teams for a specific user
    """
    print(f"👑 Admin {current_user.get('id')} requesting teams for user {user_id}")
    
    try:
        teams = await admin_service.get_user_teams(user_id)
        
        print(f"✅ Found {len(teams)} teams for user {user_id}")
        return {"teams": teams, "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user teams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user teams"
        )