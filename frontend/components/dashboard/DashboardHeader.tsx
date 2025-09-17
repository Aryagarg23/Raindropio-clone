import React from 'react'
import { getClosestColorName } from '../../utils/colors'
import { UserProfile } from '../../types/api'

interface DashboardHeaderProps {
  profile: UserProfile | null
  onSignOut: () => void
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  profile,
  onSignOut
}) => {
  return (
    <div className="w-full card-subtle">
      {/* Header Section */}
      <div className="pt-4 pb-4 px-6">
        {/* Main header content (aligned with dashboard container width) */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profile?.avatar_url || "/default-avatar.svg"}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full shadow-md ring-2 ring-grey-accent-200"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-grey-accent-600 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-semibold text-grey-accent-900">{profile?.full_name || "Dashboard"}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-grey-accent-500 bg-grey-accent-100 px-2 py-0.5 rounded-md">
                    {profile?.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md" style={{
                    color: profile?.favorite_color || "#6b7280",
                    backgroundColor: `${profile?.favorite_color || "#6b7280"}15`
                  }}>
                    {getClosestColorName(profile?.favorite_color || "#6b7280")}
                  </span>
                </div>
              </div>
            </div>

            {/* Right-side controls (Sign out + Admin) */}
            <div className="flex items-center space-x-3">
              {profile?.role === 'admin' && (
                <a
                  href="/admin"
                  className="inline-flex items-center px-3 py-1.5 bg-grey-accent-800 hover:bg-grey-accent-900 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Admin Panel
                </a>
              )}

              <button
                onClick={onSignOut}
                className="text-grey-accent-600 hover:text-grey-accent-800 text-sm transition-colors px-2 py-1 rounded-md"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}