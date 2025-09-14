import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { apiClient } from '../modules/apiClient';
import { UserProfile, Team, CreateTeamRequest, UpdateTeamRequest } from '../types/api';
import AdminPanelLayout from '../components/admin/AdminPanelLayout';
import AdminTeamCard from '../components/admin/AdminTeamCard';
import AdminUserCard from '../components/admin/AdminUserCard';
import AdminTeamForm from '../components/admin/AdminTeamForm';

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams');
  
  // Teams tab states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<CreateTeamRequest | UpdateTeamRequest>({
    name: '',
    description: '',
    logo_url: ''
  });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  
  // Members tab states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);

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

  // ...existing code...
  // Store logo file for create/edit
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = (teamForm.name ?? '').trim();
    if (!trimmedName) {
      setError('Team name is required');
      return;
    }
    // Prepare FormData for file upload
    const formData = new FormData();
    formData.append('name', trimmedName);
    formData.append('description', teamForm.description ?? '');
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    // logo_url is not sent directly; backend will set it from upload
    try {
      const response = await apiClient.createTeam(formData);
      const newTeam = response.team;
      if (newTeamMembers.length > 0) {
        for (const userId of newTeamMembers) {
          try { await apiClient.addMemberToTeam(newTeam.id, { user_id: userId }); } catch {}
        }
      }
      setTeams([...teams, newTeam]);
      setTeamForm({ name: '', description: '', logo_url: '' });
      setLogoFile(null);
      setNewTeamMembers([]);
      setShowCreateTeam(false);
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
    // Check if any field changed
    const nameChanged = trimmedName !== currentName;
    const descChanged = newDesc !== currentDesc;
    const logoChanged = !!logoFile;
    
    console.log('Update check:', { nameChanged, descChanged, logoChanged, trimmedName, currentName, newDesc, currentDesc });
    
    if (!nameChanged && !descChanged && !logoChanged) {
      setError('No changes to update');
      return;
    }
    
    // Always send current values, let backend decide what changed
    const formData = new FormData();
    formData.append('name', trimmedName);
    formData.append('description', newDesc);
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    
    console.log('FormData contents:', Array.from(formData.entries()));
    
    try {
      const response = await apiClient.updateTeam(editingTeam.id, formData);
      const updatedTeam = response.team;
      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
      setShowEditTeam(false);
      setEditingTeam(null);
      setLogoFile(null);
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

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await apiClient.getTeamMembers(teamId);
      setTeamMembers(response.members || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
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

  const handleTeamSelection = async (team: Team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamMembers([]);
    } else {
      setSelectedTeam(team);
      await loadTeamMembers(team.id);
    }
  };

  const handleUserSelection = async (user: UserProfile) => {
    if (selectedUser?.user_id === user.user_id) {
      setSelectedUser(null);
      setUserTeams([]);
    } else {
      setSelectedUser(user);
      await loadUserTeams(user.user_id);
    }
  };

  if (loading) {
    return (
      <AdminPanelLayout>
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 'var(--rounded-full)', background: 'var(--primary)', margin: '0 auto', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading admin panel...</p>
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Admin Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage teams and users</p>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)', padding: '12px 24px', borderRadius: 'var(--rounded-md)', fontWeight: 500, fontSize: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'background var(--transition-speed) var(--transition-ease), box-shadow var(--transition-speed) var(--transition-ease)' }}
        >
          ← Back to Dashboard
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('teams')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'teams' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'teams' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'teams' ? 700 : 500,
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all var(--transition-speed) var(--transition-ease)'
          }}
        >
          Teams
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'members' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'members' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'members' ? 700 : 500,
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all var(--transition-speed) var(--transition-ease)'
          }}
        >
          Members
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--accent)', color: '#fff', padding: 16, borderRadius: 'var(--rounded-md)', marginBottom: 24, fontWeight: 600 }}>{error}</div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          {/* Teams List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Teams ({teams.length})</h2>
              <button
                onClick={() => {
                  if (showCreateTeam) {
                    setTeamForm({ name: '', description: '', logo_url: '' });
                    setNewTeamMembers([]);
                    setShowCreateTeam(false);
                  } else {
                    setShowCreateTeam(true);
                  }
                }}
                style={{ background: 'var(--primary)', color: '#212529', padding: '12px 24px', borderRadius: 'var(--rounded-md)', fontWeight: 600, fontSize: '1rem', border: 'none', boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'background var(--transition-speed) var(--transition-ease), box-shadow var(--transition-speed) var(--transition-ease)' }}
              >
                {showCreateTeam ? 'Cancel' : 'Create Team'}
              </button>
            </div>
            

            
            <div style={{ marginTop: 16 }}>
              {teams.map((team) => (
                <AdminTeamCard
                  key={team.id}
                  team={team}
                  selected={selectedTeam?.id === team.id}
                  onSelect={() => handleTeamSelection(team)}
                  onModify={() => handleOpenEditModal(team)}
                />
              ))}
              {teams.length === 0 && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>No teams created yet. Create your first team!</div>
              )}
            </div>
          </div>

          {/* Team Member Management */}
          <div>
            {selectedTeam ? (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Manage Members for "{selectedTeam.name}"
                </h2>
                
                {/* Current Members */}
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Current Members ({teamMembers.length})
                  </h3>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {teamMembers.map((member) => (
                      <div key={member.user_id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 12px', 
                        marginBottom: 8, 
                        background: 'var(--surface)', 
                        borderRadius: 'var(--rounded-md)',
                        border: '1px solid var(--border)'
                      }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {member.full_name || member.email}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(selectedTeam.id, member.user_id)}
                          style={{ 
                            background: 'var(--accent)', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 'var(--rounded-md)', 
                            padding: '4px 12px', 
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 16 }}>No members yet.</div>
                    )}
                  </div>
                </div>

                {/* Add Members */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Add Members
                  </h3>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {users.filter(user => !teamMembers.some(member => member.user_id === user.user_id)).map((user) => (
                      <div key={user.user_id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '8px 12px', 
                        marginBottom: 8, 
                        background: 'var(--surface)', 
                        borderRadius: 'var(--rounded-md)',
                        border: '1px solid var(--border)'
                      }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {user.full_name || user.email}
                        </span>
                        <button
                          onClick={() => handleAddMember(selectedTeam.id, user.user_id)}
                          style={{ 
                            background: 'var(--primary)', 
                            color: '#212529', 
                            border: 'none', 
                            borderRadius: 'var(--rounded-md)', 
                            padding: '4px 12px', 
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                    {users.filter(user => !teamMembers.some(member => member.user_id === user.user_id)).length === 0 && (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 16 }}>All users are already members.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 64 }}>
                Select a team to manage its members
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          {/* Members List */}
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
              Members ({users.length})
            </h2>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {users.map((user) => (
                <AdminUserCard
                  key={user.user_id}
                  user={user}
                  selected={selectedUser?.user_id === user.user_id}
                  onSelect={() => handleUserSelection(user)}
                  disabled={false}
                />
              ))}
              {users.length === 0 && (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>No users found.</div>
              )}
            </div>
          </div>

          {/* User's Teams */}
          <div>
            {selectedUser ? (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Teams for "{selectedUser.full_name || selectedUser.email}"
                </h2>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {userTeams.map((team) => (
                    <div key={team.id} style={{ 
                      padding: '12px 16px', 
                      marginBottom: 12, 
                      background: 'var(--surface)', 
                      borderRadius: 'var(--rounded-md)',
                      border: '1px solid var(--border)'
                    }}>
                      <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                        {team.name}
                      </h3>
                      {team.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                          {team.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {userTeams.length === 0 && (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 32 }}>
                      This user is not a member of any teams.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 64 }}>
                Select a member to view their teams
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--rounded-lg)',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Create New Team
              </h2>
              <button
                onClick={() => {
                  setTeamForm({ name: '', description: '', logo_url: '' });
                  setNewTeamMembers([]);
                  setShowCreateTeam(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--rounded-md)',
                  transition: 'color var(--transition-speed) var(--transition-ease)'
                }}
              >
                ✕
              </button>
            </div>
            
            <AdminTeamForm
              teamForm={teamForm}
              setTeamForm={setTeamForm}
              users={users}
              selectedMembers={newTeamMembers}
              setSelectedMembers={setNewTeamMembers}
              onSubmit={handleCreateTeam}
              onCancel={() => {
                setTeamForm({ name: '', description: '', logo_url: '' });
                setNewTeamMembers([]);
                setLogoFile(null);
                setShowCreateTeam(false);
              }}
              error={error}
              loading={loading}
              mode="create"
              logoFile={logoFile}
              setLogoFile={setLogoFile}
            />
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeam && editingTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--rounded-lg)',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Edit Team
              </h2>
              <button
                onClick={() => {
                  setShowEditTeam(false);
                  setEditingTeam(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: 'var(--rounded-md)',
                  transition: 'color var(--transition-speed) var(--transition-ease)'
                }}
              >
                ✕
              </button>
            </div>
            
            <AdminTeamForm
              teamForm={teamForm}
              setTeamForm={setTeamForm}
              users={users}
              selectedMembers={[]}
              setSelectedMembers={() => {}}
              onSubmit={handleUpdateTeam}
              onCancel={() => {
                setShowEditTeam(false);
                setEditingTeam(null);
                setLogoFile(null);
              }}
              error={error}
              loading={loading}
              mode="edit"
              logoFile={logoFile}
              setLogoFile={setLogoFile}
            />
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
}
