export interface UserProfile {
  id: string;
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