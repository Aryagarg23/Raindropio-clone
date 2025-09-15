import React from 'react';
import { UserProfile, Team } from '../../types/api';

interface UserTeamsDisplayProps {
  selectedUser: UserProfile | null;
  userTeams: Team[];
}

export default function UserTeamsDisplay({ selectedUser, userTeams }: UserTeamsDisplayProps) {
  if (!selectedUser) {
    return (
      <div className="text-center py-16 px-6 bg-grey-accent-50 rounded-xl border-2 border-dashed border-grey-accent-300">
        <div className="text-5xl mb-4 opacity-50">👤</div>
        <p className="text-lg text-grey-accent-600">Select a member to view their teams</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-grey-accent-900 mb-4">
        Teams for "{selectedUser.full_name || selectedUser.email}"
      </h2>
      
      <div className="max-h-96 overflow-y-auto scrollbar-hide space-y-3">
        {userTeams.map((team) => (
          <div key={team.id} className="p-6 bg-white border border-grey-accent-200 rounded-xl hover:border-grey-accent-300 hover:shadow-md transition-all duration-200">
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
            </div>
          </div>
        ))}
        {userTeams.length === 0 && (
          <div className="text-center py-12 px-6 bg-white border border-grey-accent-200 rounded-xl">
            <div className="text-4xl mb-4 opacity-40">📋</div>
            <p className="text-grey-accent-500 text-base">This user is not a member of any teams.</p>
          </div>
        )}
      </div>
      
      {userTeams.length > 0 && (
        <div className="mt-4 py-3 px-4 bg-grey-accent-50 rounded-lg border border-grey-accent-200 text-center">
          <span className="text-grey-accent-600 text-sm font-medium">
            Member of {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}