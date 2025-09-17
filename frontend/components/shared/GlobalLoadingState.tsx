import React, { useState, useEffect } from 'react'

interface GlobalLoadingStateProps {
  message?: string
  retryCount?: number
  error?: string | null
  onRetry?: () => void
  showColdStartMessage?: boolean
}

export const GlobalLoadingState: React.FC<GlobalLoadingStateProps> = ({
  message = 'Loading...',
  retryCount = 0,
  error = null,
  onRetry,
  showColdStartMessage = true
}) => {
  const [internalShowColdStartMessage, setInternalShowColdStartMessage] = useState(false);

  // Show cold start message after 5 seconds of loading
  useEffect(() => {
    if (showColdStartMessage && !error) {
      const timer = setTimeout(() => {
        setInternalShowColdStartMessage(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showColdStartMessage, error]);

  // Check if this looks like a cold start timeout error
  const isColdStartError = error?.includes('Render.com') || error?.includes('startup in progress');

  return (
    <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans flex flex-col items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-spin w-6 h-6 border-2 border-grey-accent-300 border-t-grey-accent-700 rounded-full mx-auto mb-3"></div>
        <p className="text-sm text-grey-accent-600">{message}</p>

        {(internalShowColdStartMessage || (showColdStartMessage && error && isColdStartError)) && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Backend is waking up...</span>
              <br />
              Render.com services sleep after inactivity and take ~40 seconds to restart.
            </p>
          </div>
        )}

        {retryCount > 0 && (
          <p className="text-xs text-grey-accent-500 mt-1">Attempt {retryCount + 1}</p>
        )}
        {error && (
          <div className={`mt-4 p-4 border rounded-md ${
            isColdStartError
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm mb-3 ${
              isColdStartError ? 'text-amber-700' : 'text-red-700'
            }`}>
              {error}
            </p>
            {isColdStartError && (
              <p className="text-xs text-amber-600 mb-3">
                This is normal for free hosting. Please be patient while the server starts up.
              </p>
            )}
            {onRetry && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={onRetry}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    isColdStartError
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  }`}
                >
                  {isColdStartError ? 'Wait & Retry' : 'Try Again'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-grey-accent-100 hover:bg-grey-accent-200 text-grey-accent-800 text-xs rounded transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}