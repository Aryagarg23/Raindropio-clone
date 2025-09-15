import React from 'react';
import { Team } from '../../types/api';
import AdminTeamCard from './AdminTeamCard';

interface TeamsListProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  onTeamEdit: (team: Team) => void;
  onCreateTeam: () => void;
  showCreateTeam: boolean;
}

export default function TeamsList({ 
  teams, 
  selectedTeam, 
  onTeamSelect, 
  onTeamEdit, 
  onCreateTeam,
  showCreateTeam 
}: TeamsListProps) {
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)' 
        }}>
          Teams ({teams.length})
        </h2>
        <button
          onClick={onCreateTeam}
          style={{ 
            background: 'var(--primary)', 
            color: '#212529', 
            padding: '12px 24px', 
            borderRadius: 'var(--rounded-md)', 
            fontWeight: 600, 
            fontSize: '1rem', 
            border: 'none', 
            boxShadow: 'var(--shadow-md)', 
            cursor: 'pointer', 
            transition: 'all var(--transition-speed) var(--transition-ease)',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
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
            onSelect={() => onTeamSelect(team)}
            onModify={() => onTeamEdit(team)}
          />
        ))}
        {teams.length === 0 && (
          <div style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center', 
            padding: 32,
            background: 'var(--surface)',
            borderRadius: 'var(--rounded-lg)',
            border: '2px dashed var(--border)'
          }}>
            No teams created yet. Create your first team!
          </div>
        )}
      </div>
    </div>
  );
}