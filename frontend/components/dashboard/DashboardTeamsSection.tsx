import React from 'react'
import { Team, UserProfile } from '../../types/api'
import { TeamCard } from './TeamCard'

interface DashboardTeamsSectionProps {
  teams: Team[]
  teamMembers: Record<string, UserProfile[]>
  teamsLoading: boolean
  membersLoading: Record<string, boolean>
  onRefreshTeams: () => void
}

export const DashboardTeamsSection: React.FC<DashboardTeamsSectionProps> = ({
  teams,
  teamMembers,
  teamsLoading,
  membersLoading,
  onRefreshTeams
}) => {
  return (
    <div className="text-left">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-grey-accent-900">Teams</h3>
        <button
          onClick={onRefreshTeams}
          disabled={teamsLoading}
          className="text-grey-accent-600 hover:text-grey-accent-800 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {teamsLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {teamsLoading ? (
        <div className="space-y-6">
          {/* Team skeleton cards */}
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-xl card-subtle animate-pulse">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-grey-accent-200 rounded-xl"></div>
                  <div>
                    <div className="w-32 h-5 bg-grey-accent-200 rounded mb-2"></div>
                    <div className="w-20 h-3 bg-grey-accent-100 rounded"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="w-8 h-8 bg-grey-accent-200 rounded-full"></div>
                    ))}
                  </div>
                  <div className="w-16 h-4 bg-grey-accent-100 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="w-48 h-4 bg-grey-accent-100 rounded"></div>
                <div className="w-16 h-8 bg-grey-accent-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
  <div className="p-12 text-center border-2 border-dashed border-grey-accent-300 rounded-xl bg-grey-accent-50 card-subtle">
          <div className="w-16 h-16 bg-gradient-to-br from-grey-accent-500 to-grey-accent-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md border border-grey-accent-300">
            <span className="text-2xl text-white">👥</span>
          </div>
          <h4 className="text-lg font-semibold mb-3 text-grey-accent-800">
            No teams yet
          </h4>
          <p className="text-grey-accent-600 mb-4">
            You haven't been assigned to any teams yet. Contact an admin to get started.
          </p>
          <div className="text-xs text-grey-accent-500 bg-white px-4 py-2 rounded-full inline-block border border-grey-accent-200 shadow-sm">
            Teams will appear here once you're added
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {teams.map((team: Team) => (
            <div key={team.id} className="p-0">
              <TeamCard
                team={team}
                members={teamMembers[team.id] || []}
                membersLoading={membersLoading[team.id] || false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}