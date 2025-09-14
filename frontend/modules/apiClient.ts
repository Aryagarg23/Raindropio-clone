import supabase from './supabaseClient';
import { UpdateTeamRequest } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  console.log(`🌐 Making API request to: ${API_BASE_URL}${endpoint}`);
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    console.error("❌ No access token available");
    throw new ApiError('No authentication token available', 401, 'UNAUTHORIZED');
  }

  console.log("🔑 Token found, making request...");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    },
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

async function makeAuthenticatedFormRequest(endpoint: string, formData: FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new ApiError('No authentication token available', 401, 'UNAUTHORIZED');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
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

  createTeam: async (teamRequest: { name: string; description?: string; logo_url?: string }) => {
    return makeAuthenticatedRequest('/admin/teams', {
      method: 'POST',
      body: JSON.stringify(teamRequest),
    });
  },

  updateTeam: async (teamId: string, teamRequest: UpdateTeamRequest) => {
    return makeAuthenticatedRequest(`/admin/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(teamRequest),
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
    return makeAuthenticatedRequest(`/admin/teams/${teamId}/members`);
  },

  getUserTeams: async (userId: string) => {
    return makeAuthenticatedRequest(`/admin/users/${userId}/teams`);
  },
};