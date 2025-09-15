import React from "react";
import { Team } from "../../types/api";

interface AdminTeamCardProps {
  team: Team;
  selected?: boolean;
  onSelect?: (team: Team) => void;
  onModify?: (team: Team) => void;
}

export default function AdminTeamCard({ team, selected, onSelect, onModify }: AdminTeamCardProps) {
  return (
    <div
      className={`p-6 mb-4 rounded-xl cursor-pointer transition-all duration-200 ${
        selected 
          ? 'bg-grey-accent-100 border-2 border-grey-accent-400 shadow-lg -translate-y-1' 
          : 'bg-white border border-grey-accent-200 hover:border-grey-accent-300 hover:shadow-md'
      }`}
      onClick={() => onSelect?.(team)}
    >
      <div className="flex items-center gap-4">
        {team.logo_url ? (
          <img
            src={team.logo_url}
            alt={team.name}
            className="w-12 h-12 rounded-xl object-cover shadow-md border-2 border-grey-accent-200"
            onError={e => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {team.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-grey-accent-900 truncate">
            {team.name}
          </div>
          {team.description && (
            <div className="text-sm text-grey-accent-600 mt-1 line-clamp-2">
              {team.description}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onModify?.(team);
          }}
          className="px-4 py-2 bg-grey-accent-50 hover:bg-grey-accent-100 text-grey-accent-700 border border-grey-accent-300 rounded-lg transition-all duration-200 text-sm font-medium"
        >
          Modify
        </button>
      </div>
    </div>
  );
}
