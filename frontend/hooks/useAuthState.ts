import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { AuthUser, UserProfile } from '../types/api';
import { apiClient, ApiError } from '../modules/apiClient';

interface UseAuthStateOptions {
  redirectToDashboard?: boolean;
  redirectToHome?: boolean;
  onUserChange?: (user: AuthUser | null) => void;
  onProfileChange?: (profile: UserProfile | null) => void;
}

export const useAuthState = (options: UseAuthStateOptions = {}) => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth redirect tokens from URL hash
  const handleOAuthRedirect = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      console.log("🔑 Found OAuth tokens in URL, setting session...");
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Sync user profile with backend
  const syncUserProfile = async () => {
    try {
      const response = await apiClient.syncProfile();
      console.log("✅ Profile sync successful:", response);
      setProfile(response.profile);
      options.onProfileChange?.(response.profile);
      return response.profile;
    } catch (error) {
      console.error("❌ Profile sync failed:", error);
      if (error instanceof ApiError && error.status === 401) {
        console.log("🚫 Unauthorized, clearing user state...");
        setUser(null);
        setProfile(null);
        options.onUserChange?.(null);
        options.onProfileChange?.(null);
        if (options.redirectToHome) {
          router.push('/');
        }
        return null;
      }
      throw error;
    }
  };

  // Initialize authentication state
  const initializeAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Handle OAuth redirect if tokens are present
      await handleOAuthRedirect();

      // Get current session and user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("❌ Session error:", sessionError);
        setError("Authentication failed. Please try signing in again.");
        setLoading(false);
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("❌ User fetch error:", userError);
        // Not critical - user might just not be logged in
      }

      const currentUser = data?.user as AuthUser;
      setUser(currentUser);
      options.onUserChange?.(currentUser);

      if (currentUser) {
        console.log("✅ User authenticated");
        if (options.redirectToDashboard) {
          router.push('/dashboard');
          return;
        }

        // Sync profile for authenticated users
        try {
          await syncUserProfile();
        } catch (profileError) {
          console.error("Profile sync failed:", profileError);
          // Don't fail initialization if profile sync fails
        }
      } else {
        console.log("ℹ️ No authenticated user");
        if (options.redirectToHome) {
          router.push('/');
        }
      }
    } catch (error) {
      console.error("❌ Auth initialization failed:", error);
      setError("Failed to initialize authentication. Please refresh the page and try again.");
    }

    setLoading(false);
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${options.redirectToDashboard ? '/dashboard' : '/'}`
      }
    });

    if (error) {
      console.error("❌ Google sign in failed:", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Sign out failed:", error);
    }
    // State will be cleared by auth state change listener
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log("🔄 Auth state changed:", event);

      if (event === 'SIGNED_IN' && session) {
        const signedInUser = session.user as AuthUser;
        setUser(signedInUser);
        options.onUserChange?.(signedInUser);

        if (options.redirectToDashboard) {
          router.push('/dashboard');
        } else {
          // Sync profile for authenticated users
          try {
            await syncUserProfile();
          } catch (profileError) {
            console.error("Profile sync failed on sign in:", profileError);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        options.onUserChange?.(null);
        options.onProfileChange?.(null);

        if (options.redirectToHome) {
          router.push('/');
        }
      }
    });

    // Initialize auth state
    initializeAuth();

    return () => subscription?.unsubscribe();
  }, [router]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error("⏰ Auth loading timeout reached");
        setError("Loading is taking too long. Please refresh the page or try again.");
        setLoading(false);
      }
    }, options.redirectToDashboard ? 15000 : 10000);

    return () => clearTimeout(timeout);
  }, [loading, options.redirectToDashboard]);

  return {
    user,
    profile,
    loading,
    error,
    signInWithGoogle,
    signOut,
    syncUserProfile,
    setError
  };
};