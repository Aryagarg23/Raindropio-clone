import { useState } from 'react';
import { apiClient } from '../modules/apiClient';
import { UserProfile, Team } from '../types/api';

export function useMemberManagement() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);

  const handleUserSelection = async (user: UserProfile) => {
    if (selectedUser?.user_id === user.user_id) {
      setSelectedUser(null);
      setUserTeams([]);
    } else {
      setSelectedUser(user);
      await loadUserTeams(user.user_id);
    }
  };

  const loadUserTeams = async (userId: string) => {
    try {
      const response = await apiClient.getUserTeams(userId);
      setUserTeams(response.teams || []);
    } catch (error: any) {
      console.error('Error loading user teams:', error);
      setUserTeams([]);
    }
  };

  return {
    selectedUser,
    userTeams,
    handleUserSelection
  };
}