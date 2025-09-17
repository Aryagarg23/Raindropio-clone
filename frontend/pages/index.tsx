
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import { AuthUser } from "../types/api";
import { useAuthState } from "../hooks/useAuthState";
import { GlobalLoadingState } from "../components/shared/GlobalLoadingState";

export default function Home() {
  const router = useRouter();
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  // Use the auth state hook
  const { user, loading, error, signInWithGoogle, setError } = useAuthState({
    redirectToDashboard: true, // Redirect to dashboard if authenticated
    onUserChange: (newUser) => {
      // Handle user changes if needed
    }
  });

  // Show cold start message after 5 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowColdStartMessage(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowColdStartMessage(false);
    }
  }, [loading]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
      <div className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-md mx-auto">
            <div className="card-subtle p-8">
              <div className="text-center mb-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-grey-accent-700 to-grey-accent-800 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-grey-accent-200">
                      <span className="text-3xl text-white font-bold">R</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-grey-accent-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-grey-accent-800 to-grey-accent-900 bg-clip-text text-transparent">
                      Raindropio Clone
                    </h1>
                    <p className="text-grey-accent-600 text-lg max-w-sm">
                      Sign in to access your team workspaces and start collaborating
                    </p>
                  </div>
                </div>
              </div>

              {loading ? (
                <GlobalLoadingState
                  message="Loading..."
                  error={error}
                  onRetry={signInWithGoogle}
                  showColdStartMessage={showColdStartMessage}
                />
              ) : error ? (
                <div className="space-y-6">
                  <div className={`p-6 rounded-xl border-2 ${
                    error.includes('Render.com') || error.includes('startup in progress')
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`} style={{ boxShadow: '0 6px 18px rgba(16,24,40,0.04)' }}>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          error.includes('Render.com') || error.includes('startup in progress')
                            ? 'bg-amber-200'
                            : 'bg-red-200'
                        }`}>
                          <span className={`text-sm ${
                            error.includes('Render.com') || error.includes('startup in progress')
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}>
                            {error.includes('Render.com') || error.includes('startup in progress') ? '⏱️' : '❌'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          error.includes('Render.com') || error.includes('startup in progress')
                            ? 'text-amber-800'
                            : 'text-red-800'
                        }`}>
                          {error}
                        </p>
                        {(error.includes('Render.com') || error.includes('startup in progress')) && (
                          <p className="text-amber-700 text-xs mt-2">
                            Please be patient while the server starts up. This is normal for free hosting.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-grey-accent-100 hover:bg-grey-accent-200 text-grey-accent-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Refresh Page
                    </button>
                    <button
                      onClick={signInWithGoogle}
                      className="w-full bg-gradient-to-r from-grey-accent-700 to-grey-accent-800 hover:from-grey-accent-800 hover:to-grey-accent-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg transform hover:scale-[1.02] border border-grey-accent-600"
                    >
                      Try Sign In Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={signInWithGoogle}
                    className="w-full bg-gradient-to-r from-grey-accent-700 to-grey-accent-800 hover:from-grey-accent-800 hover:to-grey-accent-900 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg transform hover:scale-[1.02] border border-grey-accent-600 flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-grey-accent-500 bg-grey-accent-50 px-3 py-1.5 rounded-full inline-block border border-grey-accent-200">
                      🔒 Secure authentication powered by Google
                    </p>
                  </div>

                  <div className="pt-6 border-t border-grey-accent-100">
                    <div className="flex items-center justify-center space-x-6 text-xs text-grey-accent-400">
                      <span>Terms of Service</span>
                      <span>•</span>
                      <span>Privacy Policy</span>
                      <span>•</span>
                      <span>Help</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
