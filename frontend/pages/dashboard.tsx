import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import supabase from "../modules/supabaseClient";
import ProfileForm from "../components/ProfileForm";
import { apiClient, ApiError } from "../modules/apiClient";
import { AuthUser, UserProfile, Team, ListTeamsResponse } from "../types/api";
import { DashboardLoadingState } from "../components/dashboard/DashboardLoadingState";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardWelcomeMessage } from "../components/dashboard/DashboardWelcomeMessage";
import { DashboardTeamsSection } from "../components/dashboard/DashboardTeamsSection";
import { useAuthState } from "../hooks/useAuthState";

export default function Dashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, UserProfile[]>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});
  const [retryCount, setRetryCount] = useState(0);

    // Use the auth state hook
  const { user, profile, loading, error, signOut, syncUserProfile, setError } = useAuthState({
    redirectToHome: true, // Redirect to home if not authenticated
    onUserChange: (newUser) => {
      if (!newUser) {
        setTeams([]);
        setTeamMembers({});
      }
    },
  });

  // Memoize profile completion check to prevent excessive calculations
  // This must be called before any conditional returns to maintain hook order
  const isProfileIncomplete = useMemo(() => {
    if (!profile) return true;
    
    const incomplete = !profile.full_name || profile.full_name === "" ||
      !profile.avatar_url || profile.avatar_url === "" ||
      !profile.favorite_color || profile.favorite_color === "";
    
    return incomplete;
  }, [profile]); // Use entire profile object to reduce recalculations
  
  // Only log when profile actually changes (separate from memoization)
  useEffect(() => {
    if (profile) {
      console.log("🔍 Profile completion check:", {
        profile_exists: !!profile,
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        favorite_color: profile?.favorite_color,
        full_name_valid: !!(profile?.full_name && profile.full_name !== ""),
        avatar_url_valid: !!(profile?.avatar_url && profile.avatar_url !== ""),
        favorite_color_valid: !!(profile?.favorite_color && profile.favorite_color !== ""),
        incomplete: isProfileIncomplete
      });
    }
  }, [profile?.user_id, isProfileIncomplete]); // Log only when user changes or completion status changes

  // Fetch teams when user and profile are available
  const [hasLoadedTeams, setHasLoadedTeams] = useState(false);
  
  useEffect(() => {
    if (user?.id && profile?.user_id && !hasLoadedTeams) {
      setHasLoadedTeams(true);
      fetchTeams();
    }
  }, [user?.id, profile?.user_id]); // Remove hasLoadedTeams from dependencies to prevent loops

  const refreshProfile = useCallback(async () => {
    console.log("🔄 Refreshing profile...");
    setError(null); // Clear any existing error
    setProfileLoading(true);

    try {
      await syncUserProfile();
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
  }, [syncUserProfile, setError]);

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
    // Filter out teams that already have members loaded to prevent duplicates
    const teamsToFetch = teams.filter(team => !teamMembers[team.id]);
    
    if (teamsToFetch.length === 0) {
      console.log("✅ All team members already loaded, skipping fetch");
      return;
    }
    
    console.log(`🔄 Fetching members for ${teamsToFetch.length} teams in parallel...`);
    
    // Set loading state for teams that need fetching
    const loadingStates: Record<string, boolean> = { ...membersLoading };
    teamsToFetch.forEach(team => loadingStates[team.id] = true);
    setMembersLoading(loadingStates);

    // Fetch team members only for teams that need it
    const memberPromises = teamsToFetch.map(async (team) => {
      const members = await fetchTeamMembers(team.id);
      return { teamId: team.id, members };
    });

    try {
      const results = await Promise.allSettled(memberPromises);
      const membersData: Record<string, UserProfile[]> = { ...teamMembers };
      const finalLoadingStates: Record<string, boolean> = { ...membersLoading };

      results.forEach((result, index) => {
        const teamId = teamsToFetch[index].id;
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
      console.log(`✅ Finished loading team members for ${teamsToFetch.length} teams`);
    } catch (error) {
      console.error("❌ Error in parallel team members fetch:", error);
      // Clear loading states for teams that were being fetched
      const clearedStates: Record<string, boolean> = { ...membersLoading };
      teamsToFetch.forEach(team => clearedStates[team.id] = false);
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

  const retryLoading = useCallback(() => {
    console.log("🔄 Retrying dashboard loading...");
    setError(null);
    setRetryCount(prev => prev + 1);
    // The auth hook will handle re-initialization
  }, [setError]);

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