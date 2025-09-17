import React from 'react'

interface DashboardLoadingStateProps {
  retryCount: number
  error: string | null
  onRetry: () => void
}

export const DashboardLoadingState: React.FC<DashboardLoadingStateProps> = ({
  retryCount,
  error,
  onRetry
}) => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-6 h-6 border-2 border-grey-accent-300 border-t-grey-accent-700 rounded-full mx-auto mb-3"></div>
        <p className="text-sm text-grey-accent-600">Loading dashboard...</p>
        {retryCount > 0 && (
          <p className="text-xs text-grey-accent-500 mt-1">Attempt {retryCount + 1}</p>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-md">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}