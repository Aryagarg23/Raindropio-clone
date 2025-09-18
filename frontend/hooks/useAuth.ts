import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { UserProfile } from '../types/api';

export function useAuth(teamId: string | string[] | undefined) {
  const router = useRouter();

  const rawTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
  const actualTeamId = (rawTeamId === 'undefined' || rawTeamId === 'null' || rawTeamId === '') ? undefined : rawTeamId;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthAndMembership = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    setUser(currentUser);

    if (actualTeamId) {
      const { data: membership, error: membershipError } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', actualTeamId)
        .eq('user_id', currentUser.id)
        .single();

      if (membershipError || !membership) {
        setError('You are not a member of this team');
        router.push('/dashboard'); // Redirect to a safe page
        return;
      }
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    
    setProfile(profileData || null);
    setLoading(false);
  }, [actualTeamId, router]);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentUser) {
          checkAuthAndMembership(currentUser);
        } else {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        router.push('/');
        setLoading(false);
      }
    });

    // Initial check in case onAuthStateChange doesn't fire immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        router.push('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuthAndMembership, router]);

  return {
    user,
    profile,
    loading,
    error,
    checkAuth: () => checkAuthAndMembership(user) // Expose a manual check function if needed
  };
}
