import React from 'react';
import { Team, UserProfile } from '../../types/api';

interface TeamMemberManagerProps {
  selectedTeam: Team | null;
  teamMembers: UserProfile[];
  allUsers: UserProfile[];
  onAddMember: (teamId: string, userId: string) => void;
  onRemoveMember: (teamId: string, userId: string) => void;
}

export default function TeamMemberManager({ 
  selectedTeam, 
  teamMembers, 
  allUsers, 
  onAddMember, 
  onRemoveMember 
}: TeamMemberManagerProps) {
  if (!selectedTeam) {
    return (
      <div style={{ 
        color: 'var(--text-secondary)', 
        textAlign: 'center', 
        padding: 64,
        background: 'var(--surface)',
        borderRadius: 'var(--rounded-lg)',
        border: '2px dashed var(--border)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>👥</div>
        <p style={{ fontSize: '1.1rem', margin: 0 }}>Select a team to manage its members</p>
      </div>
    );
  }

  const availableUsers = allUsers.filter(user => 
    !teamMembers.some(member => member.user_id === user.user_id)
  );

  return (
    <div>
      <h2 style={{ 
        fontSize: '1.3rem', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        marginBottom: 16 
      }}>
        Manage Members for "{selectedTeam.name}"
      </h2>
      
      {/* Current Members */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-grey-accent-900 mb-3">
          Current Members ({teamMembers.length})
        </h3>
        <div className="max-h-48 overflow-y-auto scrollbar-hide border border-grey-accent-200 rounded-lg bg-white">
          {teamMembers.map((member) => (
            <div key={member.user_id} className="flex justify-between items-center p-3 border-b border-grey-accent-100 last:border-b-0 hover:bg-grey-accent-50 transition-colors duration-200">
              <div>
                <div className="text-grey-accent-900 font-medium mb-1">
                  {member.full_name || 'Unnamed User'}
                </div>
                <div className="text-grey-accent-600 text-sm">
                  {member.email}
                </div>
              </div>
              <button
                onClick={() => onRemoveMember(selectedTeam.id, member.user_id)}
                className="bg-red-500 hover:bg-red-600 text-white border-none rounded-md px-3 py-1.5 text-sm cursor-pointer font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                Remove
              </button>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <div className="text-grey-accent-500 text-center py-6 italic">
              No members yet. Add some members below!
            </div>
          )}
        </div>
      </div>

      {/* Add Members */}
      <div>
        <h3 className="text-lg font-semibold text-grey-accent-900 mb-3">
          Add Members
        </h3>
        <div className="max-h-48 overflow-y-auto scrollbar-hide border border-grey-accent-200 rounded-lg bg-white">
          {availableUsers.map((user) => (
            <div key={user.user_id} className="flex justify-between items-center p-3 border-b border-grey-accent-100 last:border-b-0 hover:bg-grey-accent-50 transition-colors duration-200">
              <div>
                <div className="text-grey-accent-900 font-medium mb-1">
                  {user.full_name || 'Unnamed User'}
                </div>
                <div className="text-grey-accent-600 text-sm">
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => onAddMember(selectedTeam.id, user.user_id)}
                className="bg-green-500 hover:bg-green-600 text-white border-none rounded-md px-3 py-1.5 text-sm cursor-pointer font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                Add
              </button>
            </div>
          ))}
          {availableUsers.length === 0 && (
            <div className="text-grey-accent-500 text-center py-6 italic">
              All users are already members of this team.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}