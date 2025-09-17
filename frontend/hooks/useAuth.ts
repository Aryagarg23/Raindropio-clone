import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { UserProfile } from '../types/api';

export function useAuth(teamId: string | string[] | undefined) {
  const router = useRouter();

  // Normalize teamId to string
  const rawTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
  const actualTeamId = (rawTeamId === 'undefined' || rawTeamId === 'null' || rawTeamId === '') ? undefined : rawTeamId;

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth check and team membership verification (memoized to prevent duplicate calls)
  const checkAuth = useCallback(async () => {
    console.log('=== AUTH CHECK START ===', { teamId: actualTeamId });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth user check:', { user: user?.id, email: user?.email });

      if (!user) {
        console.log('No authenticated user, redirecting to home');
        router.push('/');
        return false;
      }
      setUser(user);

      // Verify team membership
      if (!actualTeamId) {
        console.log('No teamId provided, skipping team membership check');
      } else {
        console.log('Checking team membership:', { teamId: actualTeamId, userId: user.id });
        const { data: membership, error: membershipError } = await supabase
          .from('team_memberships')
          .select('*')
          .eq('team_id', actualTeamId)
          .eq('user_id', user.id)
          .single();

        console.log('Team membership result:', { membership, membershipError });

        if (membershipError || !membership) {
          console.error('Team membership denied:', { membershipError, membership });
          setError('You are not a member of this team');
          return false;
        }
      }

      // Get user profile
      console.log('Loading user profile for:', user.id);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile result:', { profileData, profileError });

      if (profileData) {
        setProfile(profileData);
      } else if (profileError) {
        console.warn('Profile loading failed, continuing without profile:', profileError);
      }

      return true;
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [actualTeamId, router]); // useCallback dependencies

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Include checkAuth in dependencies

  return {
    user,
    profile,
    loading,
    error,
    checkAuth
  };
}