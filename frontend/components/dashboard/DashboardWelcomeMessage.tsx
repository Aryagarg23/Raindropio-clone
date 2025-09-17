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
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">👋</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Welcome to Raindropio Clone!</h3>
            <p className="text-blue-700 text-sm mb-3">
              {profile ?
                "Please complete your profile to get started and access your teams." :
                "We're setting up your profile. This will just take a moment."
              }
            </p>
            {profileLoading && (
              <div className="flex items-center space-x-2 text-blue-600 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full"></div>
                <span>Setting up your profile...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}