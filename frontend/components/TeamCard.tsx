import React from 'react';
import { Team } from '../types/api';

interface TeamCardProps {
  team: Team;
  selected?: boolean;
  onClick?: () => void;
}

export default function TeamCard({ team, selected, onClick }: TeamCardProps) {
  return (
    <div
      className={`p-6 bg-[var(--surface)] rounded-lg shadow-md border transition-all duration-&lsqb;var(--transition-speed)&rsqb; cursor-pointer ${
        selected ? 'border-[var(--primary)] scale-[1.03] shadow-lg' : 'border-[var(--border)] hover:shadow-lg hover:-translate-y-1'
      }`}
      onClick={onClick}
      style={{ marginBottom: '16px' }}
    >
      <div className="flex items-center space-x-4">
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.name}
            className="w-12 h-12 rounded-full object-cover bg-[var(--background)] border border-[var(--border)]"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="w-12 h-12 bg-[var(--background)] rounded-full flex items-center justify-center border border-[var(--border)]">
            <span className="text-[var(--text-secondary)] font-bold text-xl">
              {team.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] text-lg mb-1">{team.name}</h3>
          {team.description && (
            <p className="text-sm text-[var(--text-secondary)]">{team.description}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-2">Created: {new Date(team.created_at).toLocaleDateString()}</p>
    </div>
  );
}
