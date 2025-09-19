import { useState, useEffect, useCallback } from 'react';
import supabase from '../modules/supabaseClient';
import {
  Collection,
  Bookmark,
  TeamEvent,
  Presence
} from '../types/api';

const EVENTS_PER_PAGE = 20;

export function useTeamData(teamId: string, authUser?: any, authLoading?: boolean) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [eventsPage, setEventsPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadTeamSiteData = useCallback(async () => {
    if (!teamId) return;
    try {
      setDataLoading(true);
      setDataError(null);

      const [collectionsRes, bookmarksRes, eventsRes, presenceRes] = await Promise.all([
        supabase.from('collections').select('*').eq('team_id', teamId).order('sort_order', { ascending: true }),
        supabase.from('bookmarks').select('*, profiles:created_by(user_id, full_name, avatar_url), collections(id, name, color)').eq('team_id', teamId).order('created_at', { ascending: false }),
        supabase.from('team_events').select('*, profiles:actor_id(user_id, full_name, avatar_url)').eq('team_id', teamId).order('created_at', { ascending: false }).limit(EVENTS_PER_PAGE),
        supabase.from('presence').select('*, profiles:user_id(user_id, full_name, avatar_url)').eq('team_id', teamId).order('last_seen', { ascending: false })
      ]);

      if (collectionsRes.error) throw collectionsRes.error;
      setCollections(collectionsRes.data || []);

      if (bookmarksRes.error) throw bookmarksRes.error;
      setBookmarks(bookmarksRes.data || []);

      if (eventsRes.error) throw eventsRes.error;
      setTeamEvents(eventsRes.data || []);
      setHasMoreEvents(eventsRes.data.length === EVENTS_PER_PAGE);
      setEventsPage(1);

      if (presenceRes.error) throw presenceRes.error;
      setPresence(presenceRes.data || []);

    } catch (err: any) {
      console.error('Data loading failed:', err);
      setDataError('Failed to load team data');
    } finally {
      setDataLoading(false);
    }
  }, [teamId]);

  const loadMoreEvents = useCallback(async () => {
    if (!hasMoreEvents) return;

    const from = eventsPage * EVENTS_PER_PAGE;
    const to = from + EVENTS_PER_PAGE - 1;

    const { data: newEvents, error } = await supabase
      .from('team_events')
      .select('*, profiles:actor_id(user_id, full_name, avatar_url)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to load more events:', error);
      return;
    }

    if (newEvents) {
      setTeamEvents(prev => [...prev, ...newEvents]);
      setEventsPage(prev => prev + 1);
      setHasMoreEvents(newEvents.length === EVENTS_PER_PAGE);
    }
  }, [teamId, eventsPage, hasMoreEvents]);

  useEffect(() => {
    if (teamId && authUser && !authLoading) {
      loadTeamSiteData();
    }
  }, [teamId, authUser, authLoading, loadTeamSiteData]);

  return {
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
  };
}