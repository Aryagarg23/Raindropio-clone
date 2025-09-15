
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
    <main
      style={{
        background: "var(--background)",
        color: "var(--text-primary)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, Nunito Sans, sans-serif"
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: 32 }}>
        Raindropio Clone
      </h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: "1.1rem" }}>
            Sign in to access your team workspaces
          </p>
          <button
            onClick={signInWithGoogle}
            style={{
              background: "var(--primary)",
              color: "#212529",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "1.2em",
              fontWeight: 600,
              boxShadow: "var(--shadow-md)",
              border: "none",
              cursor: "pointer",
              transition: "all 200ms ease-out",
              width: "100%"
            }}
          >
            Continue with Google
          </button>
        </div>
      )}
    </main>
  );
}
