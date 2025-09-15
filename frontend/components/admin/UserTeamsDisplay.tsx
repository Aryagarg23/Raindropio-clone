import React from 'react';
import { UserProfile, Team } from '../../types/api';

interface UserTeamsDisplayProps {
  selectedUser: UserProfile | null;
  userTeams: Team[];
}

export default function UserTeamsDisplay({ selectedUser, userTeams }: UserTeamsDisplayProps) {
  if (!selectedUser) {
    return (
      <div style={{ 
        color: 'var(--text-secondary)', 
        textAlign: 'center', 
        padding: 64,
        background: 'var(--surface)',
        borderRadius: 'var(--rounded-lg)',
        border: '2px dashed var(--border)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>👤</div>
        <p style={{ fontSize: '1.1rem', margin: 0 }}>Select a member to view their teams</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        fontSize: '1.3rem', 
        fontWeight: 700, 
        color: 'var(--text-primary)', 
        marginBottom: 16 
      }}>
        Teams for "{selectedUser.full_name || selectedUser.email}"
      </h2>
      
      <div style={{ 
        maxHeight: 400, 
        overflowY: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--rounded-lg)',
        background: 'var(--surface)'
      }}>
        {userTeams.map((team, index) => (
          <div key={team.id} style={{ 
            padding: '16px 20px', 
            borderBottom: index < userTeams.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background var(--transition-speed) var(--transition-ease)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              {team.logo_url && (
                <img 
                  src={team.logo_url} 
                  alt={team.name}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 'var(--rounded-md)', 
                    marginRight: 12,
                    objectFit: 'cover'
                  }}
                />
              )}
              <h3 style={{ 
                color: 'var(--text-primary)', 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                margin: 0 
              }}>
                {team.name}
              </h3>
            </div>
            {team.description && (
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.9rem', 
                margin: 0,
                marginLeft: team.logo_url ? 44 : 0,
                lineHeight: 1.4
              }}>
                {team.description}
              </p>
            )}
          </div>
        ))}
        {userTeams.length === 0 && (
          <div style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center', 
            padding: 32,
            fontStyle: 'italic'
          }}>
            This user is not a member of any teams.
          </div>
        )}
      </div>
      
      {userTeams.length > 0 && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'var(--surface)',
          borderRadius: 'var(--rounded-md)',
          border: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <span style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.9rem',
            fontWeight: 500
          }}>
            Member of {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}