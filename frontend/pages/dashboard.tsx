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

  const { user, profile, loading, error, signOut, syncUserProfile, setError } = useAuthState({
    redirectToHome: true,
    onUserChange: (newUser) => {
      if (!newUser) {
        setTeams([]);
        setTeamMembers({});
      }
    },
  });

  const isProfileIncomplete = useMemo(() => {
    if (!profile) return true;
    return !profile.full_name || !profile.avatar_url || !profile.favorite_color;
  }, [profile]);

  useEffect(() => {
    if (user?.id && profile?.user_id && teams.length === 0) {
      fetchTeams();
    }
  }, [user?.id, profile?.user_id]);

  const refreshProfile = useCallback(async () => {
    setError(null);
    setProfileLoading(true);
    try {
      await syncUserProfile();
    } catch (error) {
      console.error("❌ Error refreshing profile:", error);
      if (error instanceof ApiError) {
        setError(`Error ${error.status}: ${error.message}`);
      } else {
        setError("An unexpected error occurred.");
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

  const fetchAllTeamMembers = async (teamsToFetch: Team[]) => {
    if (teamsToFetch.length === 0) return;

    setMembersLoading(prev => {
      const newLoading = { ...prev };
      teamsToFetch.forEach(team => newLoading[team.id] = true);
      return newLoading;
    });

    const memberPromises = teamsToFetch.map(async (team) => ({
      teamId: team.id,
      members: await fetchTeamMembers(team.id),
    }));

    const results = await Promise.allSettled(memberPromises);
    const membersData: Record<string, UserProfile[]> = {};
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        membersData[result.value.teamId] = result.value.members;
      }
    });

    setTeamMembers(prev => ({ ...prev, ...membersData }));
    setMembersLoading(prev => {
      const newLoading = { ...prev };
      teamsToFetch.forEach(team => newLoading[team.id] = false);
      return newLoading;
    });
  };

  const fetchTeams = async () => {
    if (!user) return;
    setTeamsLoading(true);
    try {
      const response: ListTeamsResponse = await apiClient.getTeams();
      const fetchedTeams = response.teams || [];
      setTeams(fetchedTeams);
      if (fetchedTeams.length) {
        fetchAllTeamMembers(fetchedTeams);
      }
    } catch (error) {
      console.error("❌ Error fetching teams:", error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const retryLoading = useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, [setError]);

  if (loading) {
    return <DashboardLoadingState retryCount={retryCount} error={error} onRetry={retryLoading} />;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <DashboardHeader profile={profile} onSignOut={signOut} />
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
              <div className="text-sm text-slate-500">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
              </div>
            </div>
            
            {isProfileIncomplete ? (
              <div className="space-y-8">
                <DashboardWelcomeMessage
                  profile={profile}
                  profileLoading={profileLoading}
                />
                <div className="max-w-md mx-auto">
                  <ProfileForm user={user} profile={profile} onProfileUpdated={refreshProfile} />
                </div>
              </div>
            ) : (
              profile && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <DashboardTeamsSection
                    teams={teams}
                    teamMembers={teamMembers}
                    teamsLoading={teamsLoading}
                    membersLoading={membersLoading}
                    onRefreshTeams={fetchTeams}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}