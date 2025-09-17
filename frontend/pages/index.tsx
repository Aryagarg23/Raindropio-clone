
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import { AuthUser } from "../types/api";
import { useAuthState } from "../hooks/useAuthState";

export default function Home() {
  const router = useRouter();

  // Use the auth state hook
  const { user, loading, error, signInWithGoogle, setError } = useAuthState({
    redirectToDashboard: true, // Redirect to dashboard if authenticated
    onUserChange: (newUser) => {
      // Handle user changes if needed
    }
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
      <div className="max-w-md w-full px-6">
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-grey-accent-700 to-grey-accent-800 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xl border border-grey-accent-200">
              <span className="text-2xl text-white font-bold">R</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-grey-accent-800 to-grey-accent-900 bg-clip-text text-transparent mb-4">
            Raindropio Clone
          </h1>
          <p className="text-grey-accent-600 text-lg">
            Sign in to access your team workspaces
          </p>
        </div>
        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-grey-accent-600"></div>
            <p className="mt-2 text-grey-accent-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-grey-accent-100 hover:bg-grey-accent-200 text-grey-accent-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
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
        ) : (
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="w-full bg-gradient-to-r from-grey-accent-700 to-grey-accent-800 hover:from-grey-accent-800 hover:to-grey-accent-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-lg transform hover:scale-[1.02] border border-grey-accent-600"
            >
              Continue with Google
            </button>
            <div className="text-center">
              <p className="text-xs text-grey-accent-500 bg-grey-accent-50 px-3 py-1 rounded-full inline-block border border-grey-accent-200">
                🔒 Secure authentication powered by Google
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
