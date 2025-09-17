import React, { useState } from 'react'
import { UserProfile } from '../../types/api'

interface MemberAvatarsProps {
  members: UserProfile[]
  membersLoading?: boolean
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  showMemberCount?: boolean
  className?: string
  fallbackCount?: number // For when we only have a count but no member data
}

const sizeClasses = {
  sm: {
    avatar: 'w-6 h-6',
    text: 'text-xs',
    spacing: '-space-x-1'
  },
  md: {
    avatar: 'w-8 h-8',
    text: 'text-xs',
    spacing: '-space-x-2'
  },
  lg: {
    avatar: 'w-10 h-10',
    text: 'text-sm',
    spacing: '-space-x-2'
  }
}

export const MemberAvatars: React.FC<MemberAvatarsProps> = ({
  members,
  membersLoading = false,
  maxVisible = 5,
  size = 'md',
  showMemberCount = true,
  className = '',
  fallbackCount = 0
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const sizeConfig = sizeClasses[size]
  const visibleMembers = members?.slice(0, maxVisible) || []
  const hiddenMembers = members?.slice(maxVisible) || []
  const totalMembers = members?.length || fallbackCount

  // Generate initials from name or email
  const getInitials = (member: UserProfile): string => {
    if (member.full_name) {
      return member.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return member.email[0].toUpperCase()
  }

  // Generate a consistent color based on user ID for fallback avatars
  const getAvatarColor = (userId: string): string => {
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-teal-400 to-teal-600'
    ]
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (membersLoading) {
    return (
      <div className={`flex ${sizeConfig.spacing} ${className}`}>
        {Array.from({ length: Math.min(maxVisible, 3) }, (_, i) => (
          <div 
            key={i} 
            className={`${sizeConfig.avatar} bg-grey-accent-200 rounded-full animate-pulse border-2 border-white shadow-sm`}
          />
        ))}
      </div>
    )
  }

  if (!members || members.length === 0) {
    if (fallbackCount > 0) {
      return (
        <div className={`flex ${sizeConfig.spacing} ${className}`}>
          {Array.from({ length: Math.min(fallbackCount, maxVisible) }, (_, i) => (
            <div
              key={i}
              className={`${sizeConfig.avatar} rounded-full bg-gradient-to-br from-grey-accent-400 to-grey-accent-600 border-2 border-white shadow-sm flex items-center justify-center`}
            >
              <span className={`text-white ${sizeConfig.text} font-medium`}>
                {String.fromCharCode(65 + i)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`flex flex-col items-end space-y-2 ${className}`}>
      {/* Avatar Row */}
      <div className={`flex ${sizeConfig.spacing} relative`}>
        {/* Visible Members */}
        {visibleMembers.map((member) => (
          <div key={member.user_id} className="relative group">
            <div
              className={`${sizeConfig.avatar} rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer overflow-hidden bg-gradient-to-br ${getAvatarColor(member.user_id)}`}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name || member.email}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) {
                      fallback.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              {/* Fallback initials */}
              <div
                className={`w-full h-full flex items-center justify-center ${member.avatar_url ? 'hidden' : 'flex'}`}
              >
                <span className={`text-white ${sizeConfig.text} font-medium`}>
                  {getInitials(member)}
                </span>
              </div>
            </div>

            {/* Individual Member Tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-grey-accent-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all whitespace-nowrap pointer-events-none z-[100] shadow-lg">
              <div className="font-medium">{member.full_name || 'Unknown'}</div>
              <div className="text-grey-accent-300 text-xs">{member.email}</div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-grey-accent-900"></div>
            </div>
          </div>
        ))}

        {/* More Members Indicator */}
        {hiddenMembers.length > 0 && (
          // Wrap both the indicator and tooltip so hover state persists while moving between them
          <div
            className="relative"
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
          >
            <div
              className={`${sizeConfig.avatar} rounded-full bg-grey-accent-200 border-2 border-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform cursor-pointer`}
            >
              <span className={`text-grey-accent-600 ${sizeConfig.text} font-medium`}>
                +{hiddenMembers.length}
              </span>
            </div>

            {/* All Members Tooltip -- allow pointer events so user can move into it */}
            {isTooltipOpen && (
              <div className="absolute top-full right-0 mt-2 p-4 bg-white border border-grey-accent-200 rounded-lg shadow-xl z-[100] min-w-64 max-w-sm pointer-events-auto">
                <div className="text-sm font-semibold text-grey-accent-900 mb-3">
                  Team Members ({totalMembers})
                </div>
                {/* 👇 THIS IS THE LINE TO CHANGE 👇 */}
                <div className="space-y-2 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br ${getAvatarColor(member.user_id)} flex-shrink-0`}>
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name || member.email}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {getInitials(member)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-grey-accent-900 truncate">
                          {member.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-grey-accent-500">{member.email}</div>
                      </div>
                      {member.role === 'admin' && (
                        <div className="text-xs bg-grey-accent-100 text-grey-accent-600 px-2 py-1 rounded">
                          Admin
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-full right-6 border-4 border-transparent border-b-white"></div>
                <div className="absolute bottom-full right-6 mt-1 border-4 border-transparent border-b-grey-accent-200"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Count */}
      {showMemberCount && (
        <div className="text-xs text-grey-accent-500 bg-grey-accent-50 px-2 py-1 rounded-full">
          {totalMembers === 1 ? '1 member' : `${totalMembers} members`}
        </div>
      )}
    </div>
  )
}