import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { apiClient } from '../modules/apiClient';
import { UserProfile, Team } from '../types/api';

export function useAdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser(user);

    try {
      // Get profile to check admin role
      const syncResponse = await apiClient.syncProfile();
      if (syncResponse.profile.role !== 'admin') {
        router.push('/');
        return;
      }
      setProfile(syncResponse.profile);
      await loadData();
    } catch (error) {
      router.push('/');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, teamsResponse] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getTeams()
      ]);
      setUsers(usersResponse.users);
      setTeams(teamsResponse.teams);
    } catch (error) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  return {
    user,
    profile,
    users,
    teams,
    loading,
    error,
    setError,
    refreshData,
    setTeams,
    setUsers
  };
}