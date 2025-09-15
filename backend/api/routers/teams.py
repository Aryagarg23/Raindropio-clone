from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from api.deps import get_current_user
from models.team import Team, ListTeamsResponse
from models.user import UserProfile
from core.supabase_client import supabase_service

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("", response_model=ListTeamsResponse)
async def get_user_teams(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get all teams that the current user belongs to (or all teams if admin)
    """
    user_id = current_user.get("id")
    user_role = current_user.get("role", "user")
    print(f"🏢 Getting teams for user: {user_id} (role: {user_role})")
    
    try:
        # If user is admin, return all teams
        if user_role == "admin":
            print("👑 Admin user - fetching all teams")
            result = supabase_service.table("teams").select("*").execute()
            print(f"📊 Admin query result: {result.data}")
        else:
            # For regular users, get teams they're members of
            # First get team IDs that the user is a member of
            membership_result = supabase_service.table("team_memberships").select("team_id").eq("user_id", user_id).execute()
            
            if not membership_result.data:
                # User is not a member of any teams
                print(f"✅ Found 0 teams for user")
                return ListTeamsResponse(teams=[])
            
            # Extract team IDs
            team_ids = [membership["team_id"] for membership in membership_result.data]
            
            # Get team details for those IDs
            result = supabase_service.table("teams").select("*").in_("id", team_ids).execute()
            print(f"📊 Member query result: {result.data}")
        
        teams = []
        if result.data:
            for team_data in result.data:
                team = Team(
                    id=team_data["id"],
                    name=team_data["name"],
                    description=team_data.get("description"),
                    logo_url=team_data.get("logo_url"),
                    created_at=team_data["created_at"],
                    created_by=team_data.get("created_by")
                )
                teams.append(team)
        
        print(f"✅ Found {len(teams)} teams for user")
        return ListTeamsResponse(teams=teams)
        
    except Exception as e:
        error_message = str(e).lower()
        print(f"❌ Error fetching teams: {e}")
        
        # If tables don't exist yet (migrations not run), return empty teams
        if "does not exist" in error_message or "relation" in error_message:
            print("⚠️ Teams tables don't exist yet - returning empty list")
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
    print(f"👥 Getting members for team: {team_id}, requested by user: {user_id} (role: {user_role})")
    
    try:
        # Check if user is admin or a member of this team
        if user_role != "admin":
            # Check if user is a member of this team
            membership_check = supabase_service.table("team_memberships").select("team_id").eq("team_id", team_id).eq("user_id", user_id).execute()
            
            if not membership_check.data:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be a member of this team to view its members"
                )
        
        # Get team memberships with user profiles
        result = supabase_service.table("team_memberships").select(
            "user_id, joined_at, profiles!inner(user_id, email, full_name, avatar_url, favorite_color, role)"
        ).eq("team_id", team_id).execute()
        
        members = []
        if result.data:
            for membership in result.data:
                profile_data = membership["profiles"]
                from models.user import UserProfile
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
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 403 Forbidden)
        raise
    except Exception as e:
        print(f"❌ Error fetching team members: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching team members"
        )