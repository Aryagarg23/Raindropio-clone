import { useState, useEffect, useCallback } from 'react';
import supabase from '../modules/supabaseClient';
import {
  Collection,
  Bookmark,
  TeamEvent,
  Presence
} from '../types/api';

export function useTeamData(teamId: string, authUser?: any, authLoading?: boolean) {
  // Data state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load team site data with useCallback to prevent unnecessary re-renders
  const loadTeamSiteData = useCallback(async () => {
    if (!teamId) return;

    try {
      setDataLoading(true);
      setDataError(null);

      console.log('Loading team site data for:', teamId);

      // Load collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .eq('team_id', teamId)
        .order('sort_order', { ascending: true });

      if (collectionsError) {
        console.error('Collections loading failed:', collectionsError);
        setDataError('Failed to load collections');
      } else {
        console.log('Collections loaded:', collectionsData?.length || 0);
        setCollections(collectionsData || []);
      }

      // Load bookmarks
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select(`
          *,
          profiles:created_by (
            user_id,
            full_name,
            avatar_url
          ),
          collections (
            id,
            name,
            color
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (bookmarksError) {
        console.error('Bookmarks loading failed:', bookmarksError);
        setDataError('Failed to load bookmarks');
      } else {
        console.log('Bookmarks loaded:', bookmarksData?.length || 0);
        setBookmarks(bookmarksData || []);
      }

      // Load recent team events
      const { data: eventsData, error: eventsError } = await supabase
        .from('team_events')
        .select(`
          *,
          profiles:actor_id (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Team events loading failed:', eventsError);
      } else {
        console.log('Team events loaded:', eventsData?.length || 0);
        setTeamEvents(eventsData || []);
      }

      // Load current presence (compute online from last_seen only)
      const { data: presenceData, error: presenceError } = await supabase
        .from('presence')
        .select(`
          *,
          profiles:user_id (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('last_seen', { ascending: false });

      if (presenceError) {
        console.error('Presence loading failed:', presenceError);
      } else {
        console.log('Presence loaded:', presenceData?.length || 0);
        setPresence(presenceData || []);
      }

    } catch (err) {
      console.error('Data loading failed:', err);
      setDataError('Failed to load team data');
    } finally {
      setDataLoading(false);
    }
  }, [teamId]); // useCallback dependency

  useEffect(() => {
    // Only load data after auth is complete and user is available
    if (teamId && authUser && !authLoading) {
      loadTeamSiteData();
    }
  }, [teamId, authUser, authLoading, loadTeamSiteData]); // Wait for auth to complete

  return {
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
  };
}