import supabase from './supabaseClient';
import { UpdateTeamRequest } from '../types/api';

// Resolve API base URL at runtime when possible so production builds
// don't embed a localhost fallback into the compiled bundle.
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '') {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:8000';
  }

  throw new Error('Missing NEXT_PUBLIC_API_URL environment variable in production');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const apiUrl = getApiBaseUrl();
  console.log(`🌐 Making API request to: ${apiUrl}${endpoint}`);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    console.error("❌ No access token available");
    throw new ApiError('No authentication token available', 401, 'UNAUTHORIZED');
  }

  console.log("🔑 Token found, making request...");
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData 
    ? { 'Authorization': `Bearer ${session.access_token}` }
    : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` };
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    console.log(`📡 Response status: ${response.status} for ${endpoint}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error(`❌ API Error ${response.status}:`, errorData);
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other fetch errors
    console.error("❌ Network/Fetch error:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error - unable to connect to API server', 0, 'NETWORK_ERROR');
    }
    
    throw new ApiError('Request failed', 0, 'UNKNOWN_ERROR', error);
  }
}

async function makeAuthenticatedFormRequest(endpoint: string, formData: FormData, method: string = 'PUT') {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new ApiError('No authentication token available', 401, 'UNAUTHORIZED');
  }

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: method,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Network error' };
    }
    
    throw new ApiError(
      errorData.error?.message || errorData.message || 'Request failed',
      response.status,
      errorData.error?.code,
      errorData.error?.details
    );
  }

  return response.json();
}

export const apiClient = {
  // User profile operations
  syncProfile: async () => {
    return makeAuthenticatedRequest('/users/sync', {
      method: 'POST',
    });
  },

  updateProfile: async (fullName: string, favoriteColor: string, avatar?: File) => {
    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('favorite_color', favoriteColor);
    if (avatar) {
      formData.append('avatar', avatar);
    }
    
    return makeAuthenticatedFormRequest('/users/profile', formData);
  },

  // Team operations
  getTeams: async () => {
    return makeAuthenticatedRequest('/teams');
  },

  // Admin operations
  getUsers: async () => {
    return makeAuthenticatedRequest('/admin/users');
  },

  listUsers: async () => {
    return makeAuthenticatedRequest('/admin/users');
  },

  listAllTeams: async () => {
    return makeAuthenticatedRequest('/admin/teams');
  },

  createTeam: async (teamRequest: any) => {
    return makeAuthenticatedRequest('/admin/teams', {
      method: 'POST',
      body: teamRequest instanceof FormData ? teamRequest : JSON.stringify(teamRequest),
    });
  },

  updateTeam: async (teamId: string, teamRequest: any) => {
    return makeAuthenticatedRequest(`/admin/teams/${teamId}`, {
      method: 'PUT',
      body: teamRequest instanceof FormData ? teamRequest : JSON.stringify(teamRequest),
    });
  },

  addMemberToTeam: async (teamId: string, memberRequest: { user_id: string }) => {
    return makeAuthenticatedRequest(`/admin/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberRequest),
    });
  },

  addTeamMember: async (teamId: string, userId: string) => {
    return makeAuthenticatedRequest(`/admin/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  removeMemberFromTeam: async (teamId: string, userId: string) => {
    return makeAuthenticatedRequest(`/admin/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  getTeamMembers: async (teamId: string) => {
    return makeAuthenticatedRequest(`/teams/${teamId}/members`);
  },

  getUserTeams: async (userId: string) => {
    return makeAuthenticatedRequest(`/admin/users/${userId}/teams`);
  },
};