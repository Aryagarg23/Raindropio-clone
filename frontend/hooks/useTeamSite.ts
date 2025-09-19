import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTeamData } from './useTeamData';
import { useTeamActions } from './useTeamActions';
import { useRealtimeSubscriptions } from './useRealtimeSubscriptions';
import { usePresence } from './usePresence';

export function useTeamSite(teamId: string | string[] | undefined) {
  const actualTeamId = Array.isArray(teamId) ? teamId[0] : teamId;

  const [error, setError] = useState<string | null>(null);

  const { user, profile, loading: authLoading, checkAuth } = useAuth(actualTeamId);
  const {
    collections,
    bookmarks,
    teamEvents,
    presence,
    dataLoading,
    dataError,
    hasMoreEvents,
    loadMoreEvents,
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

  useRealtimeSubscriptions({
    teamId: actualTeamId || '',
    user,
    authLoading,
    setCollections,
    setBookmarks,
    setTeamEvents,
    setPresence
  });

  usePresence({
    teamId: actualTeamId || '',
    user,
    authLoading,
    dataLoading
  });

  const loading = authLoading || dataLoading || actionLoading;

  useEffect(() => {
    if (dataError) {
      setError(dataError);
    }
  }, [dataError]);

  return {
    user,
    profile,
    loading,
    error,
    collections,
    bookmarks,
    teamEvents,
    presence,
    hasMoreEvents,
    loadMoreEvents,
    setCollections,
    setBookmarks,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError
  };
}
