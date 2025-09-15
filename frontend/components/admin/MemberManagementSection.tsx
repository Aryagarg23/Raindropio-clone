import React from 'react';
import { UserProfile, Team } from '../../types/api';
import MembersList from './MembersList';
import UserTeamsDisplay from './UserTeamsDisplay';

interface MemberManagementSectionProps {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  userTeams: Team[];
  onUserSelect: (user: UserProfile) => void;
}

export default function MemberManagementSection({
  users,
  selectedUser,
  userTeams,
  onUserSelect
}: MemberManagementSectionProps) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: 48,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <MembersList
        users={users}
        selectedUser={selectedUser}
        onUserSelect={onUserSelect}
      />
      
      <UserTeamsDisplay
        selectedUser={selectedUser}
        userTeams={userTeams}
      />
    </div>
  );
}