from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from api.deps import get_current_user
from models.team import Team, ListTeamsResponse
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