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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-grey-accent-900">
          Teams ({teams.length})
        </h2>
        <button
          onClick={onCreateTeam}
          className="bg-grey-accent-800 hover:bg-grey-accent-900 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
          <div className="text-center py-12 px-6 bg-grey-accent-50 rounded-xl border-2 border-dashed border-grey-accent-300">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-grey-accent-800 mb-2">No teams yet</h3>
            <p className="text-grey-accent-600">Create your first team to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}