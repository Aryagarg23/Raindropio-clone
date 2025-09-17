import React from 'react'
import { UserProfile } from '../../types/api'

interface DashboardWelcomeMessageProps {
  profile: UserProfile | null
  profileLoading: boolean
}

export const DashboardWelcomeMessage: React.FC<DashboardWelcomeMessageProps> = ({
  profile,
  profileLoading
}) => {
  return (
    <div className="w-full">
      {/* Welcome message for new users */}
      <div className="p-6 bg-gradient-to-r from-grey-accent-50 to-grey-accent-100 border border-grey-accent-200 rounded-xl" style={{ boxShadow: '0 6px 18px rgba(16,24,40,0.04)' }}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-grey-accent-200 rounded-full flex items-center justify-center">
              <span className="text-grey-accent-700 text-xl">👋</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">Welcome to Raindropio Clone!</h3>
            <p className="text-grey-accent-700 mb-4">
              {profile ?
                "Please complete your profile to get started and access your teams." :
                "We're setting up your profile. This will just take a moment."
              }
            </p>
            {profileLoading && (
              <div className="flex items-center space-x-3 text-grey-accent-600">
                <div className="animate-spin w-4 h-4 border-2 border-grey-accent-300 border-t-grey-accent-600 rounded-full"></div>
                <span className="text-sm font-medium">Setting up your profile...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}