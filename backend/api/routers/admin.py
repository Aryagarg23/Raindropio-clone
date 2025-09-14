from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from api.deps import require_admin
from models.user import UserProfile
from models.team import (
    Team, CreateTeamRequest, CreateTeamResponse, 
    AddMemberRequest, AddMemberResponse, ListUsersResponse
)
from core.supabase_client import supabase_service

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=ListUsersResponse)
async def list_all_users(current_user: Dict[str, Any] = Depends(require_admin)):
    """
    Admin only: Get all users in the system
    """
    print(f"👑 Admin {current_user.get('id')} requesting all users")
    
    try:
        result = supabase_service.table("profiles").select(
            "user_id, email, full_name, avatar_url, favorite_color, role, created_at"
        ).execute()
        
        users = []
        if result.data:
            for user_data in result.data:
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
        
        print(f"✅ Found {len(users)} users")
        return ListUsersResponse(users=users)
        
    except Exception as e:
        print(f"❌ Error fetching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching users"
        )

@router.post("/teams", response_model=CreateTeamResponse)
async def create_team(
    team_data: CreateTeamRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Admin only: Create a new team
    """
    user_id = current_user.get("id")
    print(f"👑 Admin {user_id} creating team: {team_data.name}")
    
    try:
        # Insert new team
        print(f"🔄 Creating team with data: {team_data}")
        result = supabase_service.table("teams").insert({
            "name": team_data.name,
            "description": team_data.description,
            "logo_url": team_data.logo_url,
            "created_by": user_id
        }).execute()
        
        print(f"📊 Team creation result: {result}")
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create team"
            )
        
        team_record = result.data[0]
        team = Team(
            id=team_record["id"],
            name=team_record["name"],
            description=team_record.get("description"),
            logo_url=team_record.get("logo_url"),
            created_at=team_record["created_at"],
            created_by=team_record.get("created_by")
        )
        
        print(f"✅ Team created successfully: {team.id}")
        return CreateTeamResponse(team=team)
        
    except Exception as e:
        print(f"❌ Error creating team: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating team"
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
        # First, verify the team exists
        team_check = supabase_service.table("teams").select("id").eq("id", team_id).execute()
        if not team_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        
        # Verify the user exists
        user_check = supabase_service.table("profiles").select("user_id").eq("user_id", user_id).execute()
        if not user_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if membership already exists
        membership_check = supabase_service.table("team_memberships").select("*").match({
            "team_id": team_id,
            "user_id": user_id
        }).execute()
        
        if membership_check.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this team"
            )
        
        # Add the membership
        print(f"🔄 Inserting membership: team_id={team_id}, user_id={user_id}")
        result = supabase_service.table("team_memberships").insert({
            "team_id": team_id,
            "user_id": user_id
        }).execute()
        
        print(f"📊 Insert result: {result}")
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add user to team"
            )
        
        print(f"✅ User {user_id} added to team {team_id}")
        return AddMemberResponse(
            message="User added to team successfully",
            team_id=team_id,
            user_id=user_id
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
        result = supabase_service.table("teams").select(
            "id, name, description, created_at, created_by"
        ).execute()
        
        teams = []
        if result.data:
            for team_data in result.data:
                team = Team(
                    id=team_data["id"],
                    name=team_data["name"],
                    description=team_data.get("description"),
                    created_at=team_data["created_at"],
                    created_by=team_data.get("created_by")
                )
                teams.append(team)
        
        print(f"✅ Found {len(teams)} teams")
        return teams
        
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
        # Check if membership exists
        membership_check = supabase_service.table("team_memberships").select("*").match({
            "team_id": team_id,
            "user_id": user_id
        }).execute()
        
        if not membership_check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a member of this team"
            )
        
        # Remove the membership
        print(f"🔄 Removing membership: team_id={team_id}, user_id={user_id}")
        result = supabase_service.table("team_memberships").delete().match({
            "team_id": team_id,
            "user_id": user_id
        }).execute()
        
        print(f"📊 Delete result: {result}")
        print(f"✅ User {user_id} removed from team {team_id}")
        return {"message": "User removed from team successfully", "team_id": team_id, "user_id": user_id}
        
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
        # Get team memberships with user profiles
        result = supabase_service.table("team_memberships").select(
            "user_id, joined_at, profiles!inner(user_id, email, full_name, avatar_url, favorite_color, role)"
        ).eq("team_id", team_id).execute()
        
        members = []
        if result.data:
            for membership in result.data:
                profile_data = membership["profiles"]
                member = UserProfile(
                    user_id=profile_data["user_id"],
                    email=profile_data["email"],
                    full_name=profile_data.get("full_name"),
                    avatar_url=profile_data.get("avatar_url"),
                    favorite_color=profile_data.get("favorite_color"),
                    role=profile_data.get("role", "user")
                )
                members.append(member)
        
        print(f"✅ Found {len(members)} members for team {team_id}")
        return {"members": members, "team_id": team_id}
        
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
        # Get user's team memberships with team details
        result = supabase_service.table("team_memberships").select(
            "team_id, joined_at, teams!inner(id, name, description, logo_url, created_at)"
        ).eq("user_id", user_id).execute()
        
        teams = []
        if result.data:
            for membership in result.data:
                team_data = membership["teams"]
                team = Team(
                    id=team_data["id"],
                    name=team_data["name"],
                    description=team_data.get("description"),
                    logo_url=team_data.get("logo_url"),
                    created_at=team_data["created_at"]
                )
                teams.append(team)
        
        print(f"✅ Found {len(teams)} teams for user {user_id}")
        return {"teams": teams, "user_id": user_id}
        
    except Exception as e:
        print(f"❌ Error fetching user teams: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user teams"
        )