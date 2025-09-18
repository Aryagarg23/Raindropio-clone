import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTeamData } from './useTeamData';
import { useTeamActions } from './useTeamActions';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { usePresence } from './usePresence';

export function useTeamSite(teamId: string | string[] | undefined) {
  const actualTeamId = Array.isArray(teamId) ? teamId[0] : teamId;

  // Error state shared across hooks
  const [error, setError] = useState<string | null>(null);

  // Use the smaller hooks
  const { user, profile, loading: authLoading, checkAuth } = useAuth(actualTeamId);
  const {
    collections,
    bookmarks,
    teamEvents,
    presence,
    dataLoading,
    dataError,
    setCollections,
    setBookmarks,
    setTeamEvents,
    setPresence,
    loadTeamSiteData
  } = useTeamData(actualTeamId || '', user, authLoading);

  const { actionLoading, createCollection, deleteCollection, createBookmark, deleteBookmark } = useTeamActions(
    actualTeamId || '',
    user,
    profile,
    setError
  );

  // Use realtime subscriptions hook
  useRealtimeSubscriptions({
    teamId: actualTeamId || '',
    user,
    authLoading,
    setCollections,
    setBookmarks,
    setTeamEvents,
    setPresence
  });

  // Use presence hook
  usePresence({
    teamId: actualTeamId || '',
    user,
    authLoading,
    dataLoading
  });

  // Combined loading state
  const loading = authLoading || dataLoading || actionLoading;

  // Combined error state
  useEffect(() => {
    if (dataError) {
      setError(dataError);
    }
  }, [dataError]);

  return {
    // State
    user,
    profile,
    loading,
    error,
    collections,
    bookmarks,
    teamEvents,
    presence,

    // State setters (for optimistic updates)
    setCollections,
    setBookmarks,

    // Actions
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError
  };
}