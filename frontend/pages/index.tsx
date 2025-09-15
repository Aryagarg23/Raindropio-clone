
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import { AuthUser } from "../types/api";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndProfile() {
      setLoading(true);
      try {
        // Check if we have access_token in URL hash (OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
      }
      setLoading(false);
    }
        // Listen for auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        // Redirect to dashboard on sign in
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        // Stay on landing page when signed out
        setLoading(false);
      }
    });
    fetchUserAndProfile();
    return () => subscription?.unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

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
