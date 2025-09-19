import supabase from './supabaseClient';
import { UpdateTeamRequest } from '../types/api';

// Cache API base URL to prevent excessive logging and computation
let cachedApiBaseUrl: string | null = null;

// Resolve API base URL at runtime when possible so production builds
// don't embed a localhost fallback into the compiled bundle.
export function getApiBaseUrl(): string {
  // Return cached URL if already resolved
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  // First priority: explicit environment variable
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '') {
    console.log(`🌐 Using API URL from env: ${process.env.NEXT_PUBLIC_API_URL}`);
    cachedApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    return cachedApiBaseUrl;
  }

  // Second priority: development mode uses localhost
  if (process.env.NODE_ENV !== 'production') {
    console.log('🌐 Using localhost API URL for development');
    cachedApiBaseUrl = 'http://localhost:8000';
    return cachedApiBaseUrl;
  }

  // For production without explicit API URL, this is an error
  // Don't fallback to window.location as that would point to the frontend domain
  console.error('❌ Missing NEXT_PUBLIC_API_URL in production environment');
  throw new Error('Missing NEXT_PUBLIC_API_URL environment variable in production. Backend API URL must be explicitly configured.');
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

export async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}, retries: number = 2) {
  const apiUrl = getApiBaseUrl();
  console.log(`🌐 Making API request to: ${apiUrl}${endpoint}`);
  
  // Add timeout to prevent hanging requests
  // Increased timeout for Render.com cold starts (can take up to 40+ seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout for cold starts
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      throw new ApiError('Authentication session error', 401, 'SESSION_ERROR');
    }
    
    if (!session?.access_token) {
      console.error("❌ No access token available");
      throw new ApiError('No authentication token available', 401, 'UNAUTHORIZED');
    }

    // Log masked token info for diagnostics (never log full token)
    const token = session.access_token as string;
    const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : 'none';
    console.log(`🔑 Token found (masked=${masked}), making request to ${endpoint}...`);
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    const isFormData = options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = isFormData 
      ? { 'Authorization': `Bearer ${session.access_token}` }
      : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` };
    
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`📡 Response status: ${response.status} for ${endpoint}`);

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { message: `HTTP ${response.status}: ${response.statusText}` };
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.error(`❌ API Error ${response.status}:`, errorData);
      
      // Provide user-friendly error messages
      let userMessage = errorData.message || `Request failed with status ${response.status}`;
      if (response.status === 401) {
        userMessage = 'Authentication failed. Please sign in again.';
      } else if (response.status === 403) {
        userMessage = 'Access denied. You may not have permission for this action.';
      } else if (response.status >= 500) {
        userMessage = 'Server error. Please try again in a moment.';
      }
      
      throw new ApiError(
        userMessage,
        response.status,
        errorData.code,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    
    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`❌ Request timeout for ${endpoint}`);
      throw new ApiError('Server startup in progress. Render.com services require ~40 seconds to wake from sleep. Please wait and try again.', 0, 'TIMEOUT_ERROR');
    }
    
    // Network or other fetch errors
    console.error("❌ Network/Fetch error:", error);
    
    // Retry logic for network errors
    if (retries > 0 && (error instanceof TypeError || (error instanceof Error && error.name === 'NetworkError'))) {
      console.log(`🔄 Retrying request to ${endpoint} (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return makeAuthenticatedRequest(endpoint, options, retries - 1);
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Unable to connect to the server. Please check your internet connection.', 0, 'NETWORK_ERROR');
    }
    
    throw new ApiError('An unexpected error occurred. Please try again.', 0, 'UNKNOWN_ERROR', error);
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

  updateBookmark: async (bookmarkId: string, title: string, description?: string, previewImage?: string, imageFile?: File, color?: string) => {
    const formData = new FormData();
    formData.append('title', title);
    if (description !== undefined) {
      formData.append('description', description);
    }
    if (previewImage !== undefined) {
      formData.append('preview_image', previewImage);
    }
    if (imageFile) {
      formData.append('image_file', imageFile);
    }
    if (color !== undefined) {
      formData.append('color', color);
    }

    return makeAuthenticatedFormRequest(`/bookmarks/${bookmarkId}`, formData, 'PUT');
  },
};