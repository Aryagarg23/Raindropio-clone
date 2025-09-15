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
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: 600, 
          color: 'var(--text-primary)', 
          marginBottom: 12 
        }}>
          Current Members ({teamMembers.length})
        </h3>
        <div style={{ 
          maxHeight: 200, 
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 'var(--rounded-md)',
          background: 'var(--surface)'
        }}>
          {teamMembers.map((member) => (
            <div key={member.user_id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderBottom: '1px solid var(--border)',
              transition: 'background var(--transition-speed) var(--transition-ease)'
            }}>
              <div>
                <div style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 500,
                  marginBottom: 2
                }}>
                  {member.full_name || 'Unnamed User'}
                </div>
                <div style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem'
                }}>
                  {member.email}
                </div>
              </div>
              <button
                onClick={() => onRemoveMember(selectedTeam.id, member.user_id)}
                style={{ 
                  background: 'var(--accent)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 'var(--rounded-md)', 
                  padding: '6px 12px', 
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all var(--transition-speed) var(--transition-ease)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Remove
              </button>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <div style={{ 
              color: 'var(--text-secondary)', 
              textAlign: 'center', 
              padding: 24,
              fontStyle: 'italic'
            }}>
              No members yet. Add some members below!
            </div>
          )}
        </div>
      </div>

      {/* Add Members */}
      <div>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: 600, 
          color: 'var(--text-primary)', 
          marginBottom: 12 
        }}>
          Add Members
        </h3>
        <div style={{ 
          maxHeight: 200, 
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 'var(--rounded-md)',
          background: 'var(--surface)'
        }}>
          {availableUsers.map((user) => (
            <div key={user.user_id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px 16px', 
              borderBottom: '1px solid var(--border)',
              transition: 'background var(--transition-speed) var(--transition-ease)'
            }}>
              <div>
                <div style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 500,
                  marginBottom: 2
                }}>
                  {user.full_name || 'Unnamed User'}
                </div>
                <div style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.9rem'
                }}>
                  {user.email}
                </div>
              </div>
              <button
                onClick={() => onAddMember(selectedTeam.id, user.user_id)}
                style={{ 
                  background: 'var(--primary)', 
                  color: '#212529', 
                  border: 'none', 
                  borderRadius: 'var(--rounded-md)', 
                  padding: '6px 12px', 
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all var(--transition-speed) var(--transition-ease)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Add
              </button>
            </div>
          ))}
          {availableUsers.length === 0 && (
            <div style={{ 
              color: 'var(--text-secondary)', 
              textAlign: 'center', 
              padding: 24,
              fontStyle: 'italic'
            }}>
              All users are already members of this team.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}