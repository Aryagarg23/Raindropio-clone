import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import ProfileForm from "../components/ProfileForm";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile, Team, ListTeamsResponse } from "../types/api";
import { DashboardLoadingState } from "../components/dashboard/DashboardLoadingState";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardWelcomeMessage } from "../components/dashboard/DashboardWelcomeMessage";
import { DashboardTeamsSection } from "../components/dashboard/DashboardTeamsSection";

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
      <DashboardLoadingState
        retryCount={retryCount}
        error={error}
        onRetry={retryLoading}
      />
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
      <DashboardHeader
        profile={profile}
        onSignOut={signOut}
      />

      <div className="px-6">
        <div className="max-w-5xl mx-auto">
          {isProfileIncomplete ? (
            <div className="w-full">
              <DashboardWelcomeMessage
                profile={profile}
                profileLoading={profileLoading}
              />
              <ProfileForm user={user} profile={profile} onProfileUpdated={refreshProfile} />
            </div>
          ) : (
            profile ? (
              <div className="w-full">
                <DashboardTeamsSection
                  teams={teams}
                  teamMembers={teamMembers}
                  teamsLoading={teamsLoading}
                  membersLoading={membersLoading}
                  onRefreshTeams={fetchTeams}
                />
              </div>
            ) : null
          )}
        </div>
      </div>
    </main>
  );
}