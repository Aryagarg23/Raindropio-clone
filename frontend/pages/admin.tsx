import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAdminPanel } from '../hooks/useAdminPanel';
import { useTeamManagement } from '../hooks/useTeamManagement';
import { useMemberManagement } from '../hooks/useMemberManagement';
import AdminPanelLayout from '../components/admin/AdminPanelLayout';
import AdminTeamForm from '../components/admin/AdminTeamForm';
import LoadingSpinner from '../components/admin/LoadingSpinner';
import ErrorMessage from '../components/admin/ErrorMessage';
import TabNavigation from '../components/admin/TabNavigation';
import Modal from '../components/admin/Modal';
import TeamManagementSection from '../components/admin/TeamManagementSection';
import MemberManagementSection from '../components/admin/MemberManagementSection';

export default function AdminPanel() {
  const router = useRouter();
  const { users, teams, loading, error, setError, setTeams } = useAdminPanel();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams');
  
  // Team management hook
  const teamManagement = useTeamManagement(teams, setTeams, setError);
  
  // Member management hook  
  const memberManagement = useMemberManagement();

  const tabs = [
    { id: 'teams', label: 'Teams' },
    { id: 'members', label: 'Members' }
  ];

  if (loading) {
    return (
      <AdminPanelLayout>
        <LoadingSpinner message="Loading admin panel..." />
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout>
      {/* Header */}
      <div style={{ 
        marginBottom: 32, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        animation: 'slideInFromTop 0.3s ease-out'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            marginBottom: 8,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Admin Panel
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '1.1rem',
            margin: 0
          }}>
            Manage teams and users
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{ 
            background: 'var(--surface)', 
            color: 'var(--text-secondary)', 
            padding: '12px 24px', 
            borderRadius: 'var(--rounded-md)', 
            fontWeight: 500, 
            fontSize: '1rem', 
            border: '1px solid var(--border)', 
            boxShadow: 'var(--shadow-md)', 
            cursor: 'pointer', 
            transition: 'all var(--transition-speed) var(--transition-ease)',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      
      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={(tabId) => setActiveTab(tabId as 'teams' | 'members')}
      />

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      {/* Tab Content */}
      {activeTab === 'teams' && (
        <TeamManagementSection
          teams={teams}
          users={users}
          selectedTeam={teamManagement.selectedTeam}
          teamMembers={teamManagement.teamMembers}
          showCreateTeam={teamManagement.showCreateTeam}
          onTeamSelect={teamManagement.handleTeamSelection}
          onTeamEdit={teamManagement.handleOpenEditModal}
          onCreateTeam={() => teamManagement.setShowCreateTeam(!teamManagement.showCreateTeam)}
          onAddMember={teamManagement.handleAddMember}
          onRemoveMember={teamManagement.handleRemoveMember}
        />
      )}

      {activeTab === 'members' && (
        <MemberManagementSection
          users={users}
          selectedUser={memberManagement.selectedUser}
          userTeams={memberManagement.userTeams}
          onUserSelect={memberManagement.handleUserSelection}
        />
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={teamManagement.showCreateTeam}
        onClose={teamManagement.resetCreateForm}
        title="Create New Team"
      >
        <AdminTeamForm
          teamForm={teamManagement.teamForm}
          setTeamForm={teamManagement.setTeamForm}
          users={users}
          selectedMembers={teamManagement.newTeamMembers}
          setSelectedMembers={teamManagement.setNewTeamMembers}
          onSubmit={teamManagement.handleCreateTeam}
          onCancel={teamManagement.resetCreateForm}
          error={error}
          loading={loading}
          mode="create"
          logoFile={teamManagement.logoFile}
          setLogoFile={teamManagement.setLogoFile}
        />
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={teamManagement.showEditTeam}
        onClose={teamManagement.resetEditForm}
        title="Edit Team"
      >
        <AdminTeamForm
          teamForm={teamManagement.teamForm}
          setTeamForm={teamManagement.setTeamForm}
          users={users}
          selectedMembers={[]}
          setSelectedMembers={() => {}}
          onSubmit={teamManagement.handleUpdateTeam}
          onCancel={teamManagement.resetEditForm}
          error={error}
          loading={loading}
          mode="edit"
          logoFile={teamManagement.logoFile}
          setLogoFile={teamManagement.setLogoFile}
        />
      </Modal>
    </AdminPanelLayout>
  );
}