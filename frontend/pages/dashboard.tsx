import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import { getClosestColorName } from "../utils/colors";
import ProfileForm from "../components/ProfileForm";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile, Team, ListTeamsResponse } from "../types/api";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, UserProfile[]>>({});
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch teams in parallel with profile - don't wait for profile completion
  useEffect(() => {
    if (user && profile) {
      fetchTeams();
    }
  }, [user, profile]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error("⏰ Loading timeout reached - something went wrong");
        setError("Loading is taking too long. Please refresh the page or try again.");
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

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
          console.log("✅ User found, syncing profile and fetching initial data...");
          
          // Start profile sync and teams fetch in parallel
          const profilePromise = syncUserProfile();
          const teamsPromise = fetchTeamsData();
          
          // Wait for both to complete, but don't block on errors
          await Promise.allSettled([profilePromise, teamsPromise]);
        } else {
          // No user, redirect to login page
          router.push('/');
        }
      } catch (error) {
        console.error("❌ Auth initialization failed:", error);
        router.push('/'); // Redirect to login page on error
      }
      setLoading(false);
    }

    async function syncUserProfile() {
      setProfileLoading(true);
      try {
        const response = await apiClient.syncProfile();
        console.log("✅ Profile sync successful:", response);
        setProfile(response.profile);
      } catch (error) {
        console.error("❌ Profile sync failed:", error);
        if (error instanceof ApiError && error.status === 401) {
          console.log("🚫 Unauthorized, redirecting to login...");
          setUser(null);
          router.push('/'); // Redirect to login page
          return;
        } else if (error instanceof ApiError && error.status === 0) {
          console.error("❌ Network error during profile sync");
          setError("Unable to connect to the server. Please check your internet connection and try again.");
          return;
        } else {
          console.error("❌ Non-auth error during profile sync, continuing without profile");
          // Continue with no profile - let user complete it
        }
      } finally {
        setProfileLoading(false);
      }
    }

    async function fetchTeamsData() {
      setTeamsLoading(true);
      try {
        console.log("🏢 Fetching user teams...");
        const response: ListTeamsResponse = await apiClient.getTeams();
        setTeams(response.teams || []);
        console.log(`✅ Loaded ${response.teams?.length || 0} teams`);
        
        // Fetch team members in parallel for all teams
        if (response.teams?.length) {
          fetchAllTeamMembers(response.teams);
        }
      } catch (error) {
        console.error("❌ Error fetching teams:", error);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    }
    
    // Listen for auth state changes (handles OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        // Don't sync profile here - it's already handled in fetchUserAndProfile()
        // This prevents race conditions for new users
        console.log("🔄 Auth state changed to SIGNED_IN, user data will be handled by main flow");
        setUser(session.user as AuthUser);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setTeams([]);
        router.push('/');
      }
    });
    
    fetchUserAndProfile();

    return () => subscription?.unsubscribe();
  }, [router]);

  const refreshProfile = async () => {
    console.log("🔄 Refreshing profile...");
    setError(null); // Clear any existing error
    setProfileLoading(true);
    
    try {
      const response = await apiClient.syncProfile();
      console.log("🔍 Sync response:", response);
      console.log("🔍 Profile from response:", response.profile);
      setProfile(response.profile);
      
      // Teams are fetched automatically via useEffect when profile updates
    } catch (error) {
      console.error("❌ Error refreshing profile:", error);
      if (error instanceof ApiError && error.status === 0) {
        setError("Unable to connect to the server. Please check your internet connection and try again.");
      } else if (error instanceof ApiError) {
        setError(`Error ${error.status}: ${error.message}`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await apiClient.getTeamMembers(teamId);
      return response.members || [];
    } catch (error) {
      console.error(`❌ Error fetching members for team ${teamId}:`, error);
      return [];
    }
  };

  const fetchAllTeamMembers = async (teams: Team[]) => {
    console.log(`🔄 Fetching members for ${teams.length} teams in parallel...`);
    
    // Set loading state for all teams
    const loadingStates: Record<string, boolean> = {};
    teams.forEach(team => loadingStates[team.id] = true);
    setMembersLoading(loadingStates);

    // Fetch all team members in parallel
    const memberPromises = teams.map(async (team) => {
      const members = await fetchTeamMembers(team.id);
      return { teamId: team.id, members };
    });

    try {
      const results = await Promise.allSettled(memberPromises);
      const membersData: Record<string, UserProfile[]> = {};
      const finalLoadingStates: Record<string, boolean> = {};

      results.forEach((result, index) => {
        const teamId = teams[index].id;
        finalLoadingStates[teamId] = false;
        
        if (result.status === 'fulfilled') {
          membersData[result.value.teamId] = result.value.members;
        } else {
          console.error(`❌ Failed to fetch members for team ${teamId}:`, result.reason);
          membersData[teamId] = [];
        }
      });

      setTeamMembers(membersData);
      setMembersLoading(finalLoadingStates);
      console.log(`✅ Finished loading team members for ${teams.length} teams`);
    } catch (error) {
      console.error("❌ Error in parallel team members fetch:", error);
      // Clear loading states
      const clearedStates: Record<string, boolean> = {};
      teams.forEach(team => clearedStates[team.id] = false);
      setMembersLoading(clearedStates);
    }
  };

  const fetchTeams = async () => {
    if (!user) return;
    
    setTeamsLoading(true);
    try {
      console.log("🏢 Fetching user teams...");
      const response: ListTeamsResponse = await apiClient.getTeams();
      setTeams(response.teams || []);
      console.log(`✅ Loaded ${response.teams?.length || 0} teams`);
      
      // Fetch team members in parallel for all teams
      if (response.teams?.length) {
        fetchAllTeamMembers(response.teams);
      }
    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const retryLoading = () => {
    console.log("🔄 Retrying dashboard loading...");
    setError(null);
    setLoading(true);
    setRetryCount(prev => prev + 1);
    // The useEffect will trigger and run fetchUserAndProfile again
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
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
                  onClick={retryLoading} 
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
    );
  }

  if (!user) {
    // This should not happen as we redirect, but just in case
    router.push('/');
    return null;
  }

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
      {/* Header with sign out */}
      <div className="absolute top-6 right-6">
        <button
          onClick={signOut}
          className="text-grey-accent-600 hover:text-grey-accent-800 text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="flex flex-col min-h-screen">
        {/* Compact Header */}
        <div className="pt-20 pb-8 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={profile?.avatar_url || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full shadow-md ring-2 ring-grey-accent-200"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-grey-accent-600 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-semibold text-grey-accent-900">{profile?.full_name || "Dashboard"}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-grey-accent-500 bg-grey-accent-100 px-2 py-0.5 rounded-md">
                      {profile?.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md" style={{ 
                      color: profile?.favorite_color || "#6b7280",
                      backgroundColor: `${profile?.favorite_color || "#6b7280"}15`
                    }}>
                      {getClosestColorName(profile?.favorite_color || "#6b7280")}
                    </span>
                  </div>
                </div>
              </div>
              {profile?.role === 'admin' && (
                <a 
                  href="/admin" 
                  className="inline-flex items-center px-3 py-1.5 bg-grey-accent-800 hover:bg-grey-accent-900 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  Admin Panel
                </a>
              )}
            </div>

        {isProfileIncomplete ? (
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
            <ProfileForm user={user} profile={profile} onProfileUpdated={refreshProfile} />
          </div>
        ) : (
          profile ? (
            <div className="w-full">{/* Content moved to main area */}

              {/* Teams Section */}
              <div className="text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-grey-accent-900">Teams</h3>
                  <button 
                    onClick={fetchTeams}
                    disabled={teamsLoading}
                    className="text-grey-accent-600 hover:text-grey-accent-800 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {teamsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {teamsLoading ? (
                  <div className="space-y-6">
                    {/* Team skeleton cards */}
                    {[1, 2].map((i) => (
                      <div key={i} className="p-6 border border-grey-accent-200 rounded-xl bg-white animate-pulse">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-grey-accent-200 rounded-xl"></div>
                            <div>
                              <div className="w-32 h-5 bg-grey-accent-200 rounded mb-2"></div>
                              <div className="w-20 h-3 bg-grey-accent-100 rounded"></div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex -space-x-2">
                              {[1, 2, 3].map((j) => (
                                <div key={j} className="w-8 h-8 bg-grey-accent-200 rounded-full"></div>
                              ))}
                            </div>
                            <div className="w-16 h-4 bg-grey-accent-100 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div className="w-48 h-4 bg-grey-accent-100 rounded"></div>
                          <div className="w-16 h-8 bg-grey-accent-200 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : teams.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-grey-accent-300 rounded-xl bg-grey-accent-50">
                    <div className="w-16 h-16 bg-gradient-to-br from-grey-accent-500 to-grey-accent-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md border border-grey-accent-300">
                      <span className="text-2xl text-white">👥</span>
                    </div>
                    <h4 className="text-lg font-semibold mb-3 text-grey-accent-800">
                      No teams yet
                    </h4>
                    <p className="text-grey-accent-600 mb-4">
                      You haven't been assigned to any teams yet. Contact an admin to get started.
                    </p>
                    <div className="text-xs text-grey-accent-500 bg-white px-4 py-2 rounded-full inline-block border border-grey-accent-200 shadow-sm">
                      Teams will appear here once you're added
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {teams.map((team: Team) => (
                      <div 
                        key={team.id}
                        className="p-6 border border-grey-accent-200 rounded-xl bg-white hover:border-grey-accent-300 hover:shadow-lg transition-all duration-200 min-h-[160px]"
                      >
                        {/* Top Row: Logo/Name (Left) + Pictures/Members (Right) */}
                        <div className="flex items-start justify-between mb-6">
                          {/* Top Left: Team logo and name */}
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-grey-accent-200 flex-shrink-0">
                              {team.logo_url ? (
                                <img 
                                  src={team.logo_url} 
                                  alt={`${team.name} logo`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                className="w-full h-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center"
                                style={{ display: team.logo_url ? 'none' : 'flex' }}
                              >
                                <span className="text-white text-sm font-bold">{team.name.charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-grey-accent-900 mb-1">
                                {team.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-grey-accent-500">
                                <span>{new Date(team.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Top Right: Profile pictures and member count */}
                          <div className="flex flex-col items-end space-y-2">
                            {/* Member avatars */}
                            <div className="flex -space-x-2">
                              {membersLoading[team.id] ? (
                                // Show skeleton avatars while loading
                                Array.from({ length: 3 }, (_, i) => (
                                  <div key={i} className="w-8 h-8 bg-grey-accent-200 rounded-full animate-pulse"></div>
                                ))
                              ) : teamMembers[team.id] && teamMembers[team.id].length > 0 ? (
                                <>
                                  {teamMembers[team.id].slice(0, 5).map((member, i) => (
                                    <div key={member.user_id} className="relative">
                                      <div className="group relative inline-block">
                                        <img
                                          src={member.avatar_url || `/api/placeholder/32/32`}
                                          alt={member.full_name || member.email}
                                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover hover:scale-110 transition-transform cursor-pointer"
                                          onError={(e) => {
                                            // Fallback to initials if avatar fails to load
                                            const target = e.target as HTMLImageElement;
                                            const name = member.full_name || member.email;
                                            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) {
                                              fallback.style.display = 'flex';
                                              fallback.textContent = initials;
                                            }
                                          }}
                                        />
                                        <div 
                                          className="w-8 h-8 rounded-full bg-gradient-to-br from-grey-accent-400 to-grey-accent-600 border-2 border-white shadow-sm flex items-center justify-center absolute inset-0"
                                          style={{ display: 'none' }}
                                        >
                                          <span className="text-white text-sm font-medium"></span>
                                        </div>

                                        {/* Individual tooltip placed inside the group so group-hover works */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-grey-accent-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all whitespace-nowrap pointer-events-auto z-50 shadow-lg">
                                          <div className="font-medium">{member.full_name || 'Unknown'}</div>
                                          <div className="text-grey-accent-300 text-xs">{member.email}</div>
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-grey-accent-900"></div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {teamMembers[team.id].length > 5 && (
                                    <div className="relative inline-block">
                                      <div className="group inline-block">
                                        <div className="w-8 h-8 rounded-full bg-grey-accent-200 border-2 border-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                                          <span className="text-grey-accent-600 text-xs font-medium">
                                            +{teamMembers[team.id].length - 5}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Tooltip for extra members placed inside group wrapper */}
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-grey-accent-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all whitespace-normal pointer-events-auto z-50 shadow-lg max-w-xs">
                                        <div className="font-medium">{teamMembers[team.id].length - 5} more</div>
                                        <div className="text-grey-accent-300 text-xs">
                                          {teamMembers[team.id].slice(5).map(m => m.full_name || m.email.split('@')[0]).join(', ')}
                                        </div>
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-grey-accent-900"></div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Fallback for teams without member data
                                Array.from({ length: Math.min(team.member_count || 0, 5) }, (_, i) => (
                                  <div 
                                    key={i}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-grey-accent-400 to-grey-accent-600 border-2 border-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                                  >
                                    <span className="text-white text-sm font-medium">
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                            {/* Member count */}
                            <div className="text-xs text-grey-accent-500 bg-grey-accent-50 px-2 py-1 rounded-full">
                              {((teamMembers[team.id] && teamMembers[team.id].length > 0) || team.member_count) && (
                                <>
                                  {teamMembers[team.id] ? 
                                    (teamMembers[team.id].length === 1 ? '1 member' : `${teamMembers[team.id].length} members`) :
                                    (team.member_count === 1 ? '1 member' : `${team.member_count} members`)
                                  }
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Description (Left) + Open Button (Right) */}
                        <div className="flex items-end justify-between">
                          {/* Bottom Left: Description */}
                          <div className="flex-1 pr-4">
                            {team.description && (
                              <p className="text-grey-accent-600 text-sm leading-relaxed">
                                {team.description}
                              </p>
                            )}
                          </div>

                          {/* Bottom Right: Open button */}
                          <div className="flex-shrink-0">
                            <a
                              href={`/team-site/${team.id}`}
                              className="px-4 py-2 bg-grey-accent-800 hover:bg-grey-accent-900 text-white no-underline rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                            >
                              Open →
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null
        )}
          </div>
        </div>
      </div>
    </main>
  );
}