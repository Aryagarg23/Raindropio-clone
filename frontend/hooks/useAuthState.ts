import { useState, useEffect, useRef } from 'react';
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
  const profileRef = useRef<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the in-flight sync promise to avoid concurrent races
  const inFlightSync = useRef<Promise<UserProfile | null> | null>(null);
  // Ensure initializeAuth only runs once per component lifecycle
  const initializedRef = useRef<boolean>(false);

  // Handle OAuth redirect tokens from URL hash
  const handleOAuthRedirect = async () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken) {
      console.log("🔑 Found OAuth tokens in URL, setting session...");
      try {
        if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
        } else {
          console.warn('OAuth tokens present but invalid, skipping setSession');
        }
      } catch (err: any) {
        console.warn('Failed to set session from OAuth redirect:', err?.message || err);
        // If the session is missing or invalid, continue as unauthenticated
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Sync user profile with backend
  const syncUserProfile = async () => {
    if (inFlightSync.current) return inFlightSync.current;

    const doSync = (async (): Promise<UserProfile | null> => {
      try {
  // Match apiClient's fetch timeout (50s) to avoid racing and false timeouts
  const timeoutMs = 50000;
        const syncPromise = apiClient.syncProfile();

        const response = await Promise.race([
          syncPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('sync timeout')), timeoutMs)),
        ]);

        console.log("✅ Profile sync successful:", response);
        setProfile(response.profile);
        profileRef.current = response.profile;
        options.onProfileChange?.(response.profile);
        return response.profile;
      } catch (err: any) {
        console.error("❌ Profile sync failed:", err);
        // If the call timed out but we already have a cached profile, prefer that
        const isTimeout = (err instanceof ApiError && err.code === 'TIMEOUT_ERROR') || (err && err.message === 'sync timeout');
        if (isTimeout && profileRef.current) {
          console.warn("⚠️ Sync timed out but using cached profile to avoid UX error");
          // Return previously cached profile — do not throw so UI stays stable
          return profileRef.current;
        }

        if (err instanceof ApiError && err.status === 401) {
          console.log("🚫 Unauthorized, clearing user state...");
          setUser(null);
          setProfile(null);
          profileRef.current = null;
          options.onUserChange?.(null);
          options.onProfileChange?.(null);
          if (options.redirectToHome) {
            router.push('/');
          }
          return null;
        }
        throw err;
      } finally {
        inFlightSync.current = null;
      }
    })();

    inFlightSync.current = doSync;
    return doSync;
  };

  // Initialize authentication state
  const initializeAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Handle OAuth redirect if tokens are present
      await handleOAuthRedirect();

      // Get current session and user
      let currentUser: AuthUser | null = null;
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('Session fetch warning:', sessionError?.message || sessionError);
        }

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.warn('User fetch warning:', userError?.message || userError);
        }

        currentUser = (data?.user as AuthUser) || null;
      } catch (err: any) {
        // Handle AuthSessionMissingError or other client-side auth errors gracefully
        console.warn('Auth session missing or fetch failed:', err?.message || err);
        currentUser = null;
      }
      setUser(currentUser);
      options.onUserChange?.(currentUser);

      if (currentUser) {
        console.log("✅ User authenticated");
        if (options.redirectToDashboard) {
          // clear loading before redirect to avoid timeout
          setLoading(false);
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
    // Prefer explicit public frontend URL (set in env) so dev/prod redirects work predictably.
    // `NEXT_PUBLIC_FRONTEND_URL` is set in `.env.local` for development and in Vercel for production.
    const frontendBase = (process.env.NEXT_PUBLIC_FRONTEND_URL && process.env.NEXT_PUBLIC_FRONTEND_URL !== '')
      ? process.env.NEXT_PUBLIC_FRONTEND_URL
      : (typeof window !== 'undefined' ? window.location.origin : '');

    const redirectTo = `${frontendBase}${options.redirectToDashboard ? '/dashboard' : '/'}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
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
          // Only sync profile if we don't already have it or user changed
          if (!profile || profile.user_id !== signedInUser.id) {
            try {
              await syncUserProfile();
            } catch (profileError) {
              console.error("Profile sync failed on sign in:", profileError);
            }
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

    // Initialize auth state only once per component lifecycle
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeAuth();
    }

    return () => subscription?.unsubscribe();
  }, [router.pathname]); // Only re-run if pathname changes, not router object

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