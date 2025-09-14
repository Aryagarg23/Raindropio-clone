
import { useEffect, useState } from "react";
import supabase from "../modules/supabaseClient";
import { getClosestColorName } from "../utils/colors";
import ProfileForm from "../components/ProfileForm";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile } from "../types/api";

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndProfile() {
      console.log("🔄 Starting fetchUserAndProfile...");
      setLoading(true);
      
      try {
        // Check if we have access_token in URL hash (OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log("🔑 Found access token in URL, setting session...");
          
          // Manually set the session with the tokens from URL
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (sessionError) {
            console.error("❌ Failed to set session:", sessionError.message);
          } else {
            console.log("✅ Session set successfully");
            // Clear the URL hash
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("📱 Session data:", sessionData?.session ? "Session found" : "No session", sessionError?.message || "");
        
        const { data } = await supabase.auth.getUser();
        console.log("👤 User from Supabase:", data?.user?.id ? "Found user" : "No user");
        setUser(data?.user as AuthUser);
        
        if (data?.user) {
          try {
            console.log("🚀 Calling backend API to sync profile...");
            const response = await apiClient.syncProfile();
            console.log("✅ Profile sync successful:", response);
            setProfile(response.profile);
          } catch (error) {
            console.error("❌ Profile sync failed:", error);
            if (error instanceof ApiError) {
              console.error("Profile sync error:", error.message, error.code);
              if (error.status === 401) {
                setUser(null);
              }
            } else {
              console.error("Unexpected error:", error);
            }
          }
        } else {
          console.log("⚠️ No user found, skipping profile sync");
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
      }
      
      setLoading(false);
    }

    // Listen for auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ User signed in, fetching profile...");
        console.log("🔍 Session details:", {
          expires_at: session.expires_at,
          current_time: Math.floor(Date.now() / 1000),
          time_diff: session.expires_at ? (session.expires_at - Math.floor(Date.now() / 1000)) : 'unknown'
        });
        
        setUser(session.user as AuthUser);
        
        try {
          console.log("🚀 Calling backend API to sync profile...");
          const response = await apiClient.syncProfile();
          console.log("✅ Profile sync successful:", response);
          setProfile(response.profile);
        } catch (error) {
          console.error("❌ Profile sync failed:", error);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log("🔄 Token refreshed, updating user");
        setUser(session.user as AuthUser);
      }
    });

    // Initial load
    fetchUserAndProfile();

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  async function refreshProfile() {
    try {
      const response = await apiClient.syncProfile();
      setProfile(response.profile);
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  }

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
      ) : !user ? (
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
            transition: "background 200ms ease-out, box-shadow 200ms ease-out"
          }}
        >
          Sign in with Google
        </button>
      ) : (!profile ||
        !profile.full_name || profile.full_name === "" ||
        !profile.avatar_url || profile.avatar_url === "" ||
        !profile.favorite_color || profile.favorite_color === ""
      ) ? (
        <ProfileForm user={user} profile={profile} onProfileUpdated={refreshProfile} />
      ) : (
        profile ? (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <img
              src={profile.avatar_url || "/default-avatar.png"}
              alt="Avatar"
              style={{ width: 96, height: 96, borderRadius: "9999px", boxShadow: "var(--shadow-md)", marginBottom: 16 }}
            />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>{profile.full_name || "Unnamed User"}</h2>
            <p style={{ color: profile.favorite_color || "#A0D2EB", fontWeight: 600 }}>
              Favorite Color: {getClosestColorName(profile.favorite_color || "#A0D2EB")}
            </p>
          </div>
        ) : null
      )}
    </main>
  );
}
