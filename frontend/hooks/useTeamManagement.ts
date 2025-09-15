import { useState } from 'react';
import { apiClient } from '../modules/apiClient';
import { Team, UserProfile, CreateTeamRequest, UpdateTeamRequest } from '../types/api';

export function useTeamManagement(teams: Team[], setTeams: (teams: Team[]) => void, setError: (error: string | null) => void) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<CreateTeamRequest | UpdateTeamRequest>({
    name: '',
    description: '',
    logo_url: ''
  });
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = (teamForm.name ?? '').trim();
    if (!trimmedName) {
      setError('Team name is required');
      return;
    }

    const formData = new FormData();
    formData.append('name', trimmedName);
    formData.append('description', teamForm.description ?? '');
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const response = await apiClient.createTeam(formData);
      const newTeam = response.team;
      
      if (newTeamMembers.length > 0) {
        for (const userId of newTeamMembers) {
          try { 
            await apiClient.addMemberToTeam(newTeam.id, { user_id: userId }); 
          } catch {}
        }
      }
      
      setTeams([...teams, newTeam]);
      resetCreateForm();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to create team');
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    const trimmedName = (teamForm.name ?? '').trim();
    const currentName = editingTeam.name;
    const currentDesc = editingTeam.description ?? '';
    const newDesc = teamForm.description ?? '';
    
    const nameChanged = trimmedName !== currentName;
    const descChanged = newDesc !== currentDesc;
    const logoChanged = !!logoFile;
    
    if (!nameChanged && !descChanged && !logoChanged) {
      setError('No changes to update');
      return;
    }
    
    const formData = new FormData();
    formData.append('name', trimmedName);
    formData.append('description', newDesc);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    try {
      const response = await apiClient.updateTeam(editingTeam.id, formData);
      const updatedTeam = response.team;
      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      resetEditForm();
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to update team');
    }
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description || '',
      logo_url: team.logo_url || ''
    });
    setShowEditTeam(true);
  };

  const handleTeamSelection = async (team: Team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamMembers([]);
    } else {
      setSelectedTeam(team);
      await loadTeamMembers(team.id);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await apiClient.getTeamMembers(teamId);
      setTeamMembers(response.members || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      await apiClient.addMemberToTeam(teamId, { user_id: userId });
      await loadTeamMembers(teamId);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      await apiClient.removeMemberFromTeam(teamId, userId);
      await loadTeamMembers(teamId);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to remove member');
    }
  };

  const resetCreateForm = () => {
    setTeamForm({ name: '', description: '', logo_url: '' });
    setLogoFile(null);
    setNewTeamMembers([]);
    setShowCreateTeam(false);
  };

  const resetEditForm = () => {
    setShowEditTeam(false);
    setEditingTeam(null);
    setLogoFile(null);
  };

  return {
    // State
    selectedTeam,
    teamMembers,
    showCreateTeam,
    showEditTeam,
    editingTeam,
    teamForm,
    newTeamMembers,
    logoFile,
    
    // Setters
    setShowCreateTeam,
    setTeamForm,
    setNewTeamMembers,
    setLogoFile,
    
    // Actions
    handleCreateTeam,
    handleUpdateTeam,
    handleOpenEditModal,
    handleTeamSelection,
    handleAddMember,
    handleRemoveMember,
    resetCreateForm,
    resetEditForm
  };
}