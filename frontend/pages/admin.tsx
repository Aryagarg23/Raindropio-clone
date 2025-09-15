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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-grey-accent-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-grey-accent-600 text-lg">
            Manage teams and users
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-grey-accent-600 hover:text-grey-accent-800 px-6 py-3 rounded-lg font-medium border border-grey-accent-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
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