import React from 'react';
import { Team, UserProfile } from '../../types/api';
import TeamsList from './TeamsList';
import TeamMemberManager from './TeamMemberManager';

interface TeamManagementSectionProps {
  teams: Team[];
  users: UserProfile[];
  selectedTeam: Team | null;
  teamMembers: UserProfile[];
  showCreateTeam: boolean;
  onTeamSelect: (team: Team) => void;
  onTeamEdit: (team: Team) => void;
  onCreateTeam: () => void;
  onAddMember: (teamId: string, userId: string) => void;
  onRemoveMember: (teamId: string, userId: string) => void;
}

export default function TeamManagementSection({
  teams,
  users,
  selectedTeam,
  teamMembers,
  showCreateTeam,
  onTeamSelect,
  onTeamEdit,
  onCreateTeam,
  onAddMember,
  onRemoveMember
}: TeamManagementSectionProps) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: 48,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <TeamsList
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamSelect={onTeamSelect}
        onTeamEdit={onTeamEdit}
        onCreateTeam={onCreateTeam}
        showCreateTeam={showCreateTeam}
      />
      
      <TeamMemberManager
        selectedTeam={selectedTeam}
        teamMembers={teamMembers}
        allUsers={users}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
      />
    </div>
  );
}