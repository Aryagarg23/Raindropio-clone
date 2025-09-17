import React from 'react'
import { Team, UserProfile } from '../../types/api'

interface TeamCardProps {
  team: Team
  members: UserProfile[]
  membersLoading: boolean
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  members,
  membersLoading
}) => {
  return (
    <div
      className="p-6 border border-grey-accent-200 rounded-xl bg-white hover:border-grey-accent-300 hover:shadow-lg transition-all duration-200 min-h-[160px]"
    >
      {/* Top Row: Logo/Name (Left) + Pictures/Members (Right) */}
      <div className="flex items-start justify-between mb-6">
        {/* Top Left: Team logo and name */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-grey-accent-200 flex-shrink-0">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={`${team.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center"
              style={{ display: team.logo_url ? 'none' : 'flex' }}
            >
              <span className="text-white text-sm font-bold">{team.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-grey-accent-900 mb-1">
              {team.name}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-grey-accent-500">
              <span>{new Date(team.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Top Right: Profile pictures and member count */}
        <div className="flex flex-col items-end space-y-2">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {membersLoading ? (
              // Show skeleton avatars while loading
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="w-8 h-8 bg-grey-accent-200 rounded-full animate-pulse"></div>
              ))
            ) : members && members.length > 0 ? (
              <>
                {members.slice(0, 5).map((member, i) => (
                  <div key={member.user_id} className="relative">
                    <div className="group relative inline-block">
                      <img
                        src={member.avatar_url || `/api/placeholder/32/32`}
                        alt={member.full_name || member.email}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover hover:scale-110 transition-transform cursor-pointer"
                        onError={(e) => {
                          // Fallback to initials if avatar fails to load
                          const target = e.target as HTMLImageElement;
                          const name = member.full_name || member.email;
                          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                            fallback.textContent = initials;
                          }
                        }}
                      />
                      <div
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-grey-accent-400 to-grey-accent-600 border-2 border-white shadow-sm flex items-center justify-center absolute inset-0"
                        style={{ display: 'none' }}
                      >
                        <span className="text-white text-sm font-medium"></span>
                      </div>

                      {/* Individual tooltip placed inside the group so group-hover works */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-grey-accent-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all whitespace-nowrap pointer-events-auto z-50 shadow-lg">
                        <div className="font-medium">{member.full_name || 'Unknown'}</div>
                        <div className="text-grey-accent-300 text-xs">{member.email}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-grey-accent-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="relative inline-block">
                    <div className="group inline-block">
                      <div className="w-8 h-8 rounded-full bg-grey-accent-200 border-2 border-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        <span className="text-grey-accent-600 text-xs font-medium">
                          +{members.length - 5}
                        </span>
                      </div>
                    </div>

                    {/* Tooltip for extra members placed inside group wrapper */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-grey-accent-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all whitespace-normal pointer-events-auto z-50 shadow-lg max-w-xs">
                      <div className="font-medium">{members.length - 5} more</div>
                      <div className="text-grey-accent-300 text-xs">
                        {members.slice(5).map(m => m.full_name || m.email.split('@')[0]).join(', ')}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-grey-accent-900"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Fallback for teams without member data
              Array.from({ length: Math.min(team.member_count || 0, 5) }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-grey-accent-400 to-grey-accent-600 border-2 border-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <span className="text-white text-sm font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))
            )}
          </div>
          {/* Member count */}
          <div className="text-xs text-grey-accent-500 bg-grey-accent-50 px-2 py-1 rounded-full">
            {((members && members.length > 0) || team.member_count) && (
              <>
                {members ?
                  (members.length === 1 ? '1 member' : `${members.length} members`) :
                  (team.member_count === 1 ? '1 member' : `${team.member_count} members`)
                }
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Description (Left) + Open Button (Right) */}
      <div className="flex items-end justify-between">
        {/* Bottom Left: Description */}
        <div className="flex-1 pr-4">
          {team.description && (
            <p className="text-grey-accent-600 text-sm leading-relaxed">
              {team.description}
            </p>
          )}
        </div>

        {/* Bottom Right: Open button */}
        <div className="flex-shrink-0">
          <a
            href={`/team-site/${team.id}`}
            className="px-4 py-2 bg-grey-accent-800 hover:bg-grey-accent-900 text-white no-underline rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
          >
            Open →
          </a>
        </div>
      </div>
    </div>
  )
}