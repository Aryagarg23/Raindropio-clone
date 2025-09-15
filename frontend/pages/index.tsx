
import { useEffect, useState } from "react";
import supabase from "../modules/supabaseClient";
import { getClosestColorName } from "../utils/colors";
import ProfileForm from "../components/ProfileForm";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile, Team, ListTeamsResponse } from "../types/api";

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Always fetch teams when profile is set and complete
  useEffect(() => {
    if (profile && profile.full_name && profile.avatar_url && profile.favorite_color) {
      fetchTeams();
    }
  }, [profile]);

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
        setUser(data?.user as AuthUser);
        if (data?.user) {
          try {
            const response = await apiClient.syncProfile();
            setProfile(response.profile);
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
      }
      setLoading(false);
    }
    // Listen for auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user as AuthUser);
        try {
          const response = await apiClient.syncProfile();
          setProfile(response.profile);
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            setUser(null);
          }
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setTeams([]);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user as AuthUser);
      }
    });
    fetchUserAndProfile();
    return () => subscription.unsubscribe();
  }, []);

    const refreshProfile = async () => {
    console.log("🔄 Refreshing profile...");
    try {
      const response = await apiClient.syncProfile();
      console.log("🔍 Sync response:", response);
      console.log("🔍 Profile from response:", response.profile);
      setProfile(response.profile);
      
      // Fetch teams after profile is refreshed
      await fetchTeams();
    } catch (error) {
      console.error("❌ Error refreshing profile:", error);
    }
  };

  const fetchTeams = async () => {
    if (!user || !profile) return;
    
    setTeamsLoading(true);
    try {
      console.log("🏢 Fetching user teams...");
      const response: ListTeamsResponse = await apiClient.getTeams();
      setTeams(response.teams || []);
      console.log(`✅ Loaded ${response.teams?.length || 0} teams`);
    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

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
      ) : (() => {
        // Debug profile completion check
        console.log("🔍 Profile completion check:", {
          profile_exists: !!profile,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          favorite_color: profile?.favorite_color,
          full_name_valid: !!(profile?.full_name && profile.full_name !== ""),
          avatar_url_valid: !!(profile?.avatar_url && profile.avatar_url !== ""),
          favorite_color_valid: !!(profile?.favorite_color && profile.favorite_color !== ""),
        });
        
        const isProfileIncomplete = !profile ||
          !profile.full_name || profile.full_name === "" ||
          !profile.avatar_url || profile.avatar_url === "" ||
          !profile.favorite_color || profile.favorite_color === "";
          
        console.log("🔍 Profile incomplete:", isProfileIncomplete);
        return isProfileIncomplete;
      })() ? (
        <ProfileForm user={user} profile={profile} onProfileUpdated={refreshProfile} />
      ) : (
        profile ? (
          <div style={{ textAlign: "center", width: "100%", maxWidth: "800px", padding: "0 20px" }}>
            {/* User Profile Header */}
            <div style={{ marginBottom: 48 }}>
              <img
                src={profile.avatar_url || "/default-avatar.png"}
                alt="Avatar"
                style={{ width: 96, height: 96, borderRadius: "9999px", boxShadow: "var(--shadow-md)", marginBottom: 16 }}
              />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>{profile.full_name || "Unnamed User"}</h2>
              <p style={{ color: profile.favorite_color || "#A0D2EB", fontWeight: 600, marginBottom: 4 }}>
                Favorite Color: {getClosestColorName(profile.favorite_color || "#A0D2EB")}
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Role: {profile.role === 'admin' ? '👑 Admin' : '👤 User'}
              </p>
              {profile.role === 'admin' && (
                <a 
                  href="/admin" 
                  style={{ 
                    display: "inline-block", 
                    marginTop: 12, 
                    padding: "8px 16px", 
                    background: "var(--primary)", 
                    color: "#212529", 
                    textDecoration: "none", 
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600
                  }}
                >
                  Admin Panel
                </a>
              )}
            </div>

            {/* Teams Section */}
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>My Teams</h3>
                <button 
                  onClick={fetchTeams}
                  disabled={teamsLoading}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    cursor: teamsLoading ? "not-allowed" : "pointer",
                    opacity: teamsLoading ? 0.6 : 1
                  }}
                >
                  {teamsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {teamsLoading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                  Loading teams...
                </div>
              ) : teams.length === 0 ? (
                <div style={{ 
                  padding: "40px", 
                  textAlign: "center", 
                  border: "2px dashed var(--border)", 
                  borderRadius: "8px",
                  background: "var(--surface)"
                }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                    Welcome to the Lobby!
                  </h4>
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    You haven't been assigned to any teams yet. Contact an admin to get started.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {teams.map((team) => (
                    <div 
                      key={team.id}
                      style={{ 
                        padding: "20px", 
                        border: "1px solid var(--border)", 
                        borderRadius: "8px",
                        background: "var(--surface)",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8, margin: 0 }}>
                            {team.name}
                          </h4>
                          {team.description && (
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 8 }}>
                              {team.description}
                            </p>
                          )}
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}>
                            Created: {new Date(team.created_at).toLocaleDateString()}
                            {team.member_count && (
                              <span style={{ marginLeft: 8 }}>• {team.member_count} members</span>
                            )}
                          </p>
                        </div>
                        <a
                          href={`/team-site/${team.id}`}
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            background: "var(--primary)",
                            color: "#212529",
                            textDecoration: "none",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            marginLeft: 16,
                            transition: "all 200ms ease-out",
                            boxShadow: "var(--shadow-sm)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "var(--shadow-md)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                          }}
                        >
                          Open Workspace →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null
      )}
    </main>
  );
}
