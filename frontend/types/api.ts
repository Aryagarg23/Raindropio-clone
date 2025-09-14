export interface UserProfile {
  user_id: string;  // Changed to match backend
  email: string;
  full_name?: string;
  avatar_url?: string;
  favorite_color?: string;
  role: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    favorite_color?: string;
  };
}

export interface SyncResponse {
  profile: UserProfile;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by?: string;
  member_count?: number;
}

export interface TeamMembership {
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface ListTeamsResponse {
  teams: Team[];
  message: string;
}

export interface ListUsersResponse {
  users: UserProfile[];
  message: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface CreateTeamResponse {
  team: Team;
  message: string;
}

export interface AddMemberRequest {
  user_id: string;
}

export interface AddMemberResponse {
  message: string;
  team_id: string;
  user_id: string;
}