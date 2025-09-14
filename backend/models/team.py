from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class Team(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None  # URL to team logo/avatar
    created_at: datetime
    created_by: Optional[str] = None
    member_count: Optional[int] = None  # For views with member counts

class TeamMembership(BaseModel):
    team_id: str
    user_id: str
    joined_at: datetime

class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80, description="Team name")
    description: Optional[str] = Field(None, max_length=500, description="Team description")
    logo_url: Optional[str] = Field(None, max_length=500, description="Team logo URL")

class CreateTeamResponse(BaseModel):
    team: Team
    message: str = "Team created successfully"

class AddMemberRequest(BaseModel):
    user_id: str = Field(..., description="User ID to add to team")

class AddMemberResponse(BaseModel):
    message: str
    team_id: str
    user_id: str

# Response models for listing
class ListTeamsResponse(BaseModel):
    teams: List[Team]
    message: str = "Teams retrieved successfully"

class ListUsersResponse(BaseModel):
    users: List['UserProfile']  # Forward reference to avoid circular import
    message: str = "Users retrieved successfully"

class TeamWithMembers(BaseModel):
    """Extended team model with member list for admin views"""
    id: str
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    created_by: Optional[str] = None
    members: List['UserProfile'] = []

# Import UserProfile here to resolve forward reference
from .user import UserProfile
ListUsersResponse.model_rebuild()
TeamWithMembers.model_rebuild()