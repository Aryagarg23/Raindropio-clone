import { useEffect, useRef } from 'react';
import supabase from '../modules/supabaseClient';

interface UseRealtimeSubscriptionsProps {
  teamId: string;
  user: any;
  authLoading: boolean;
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  setBookmarks: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setPresence: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useRealtimeSubscriptions({
  teamId,
  user,
  authLoading,
  setCollections,
  setBookmarks,
  setTeamEvents,
  setPresence
}: UseRealtimeSubscriptionsProps) {
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);
  
  const setCollectionsRef = useRef(setCollections);
  const setBookmarksRef = useRef(setBookmarks);
  const setTeamEventsRef = useRef(setTeamEvents);
  const setPresenceRef = useRef(setPresence);
  
  setCollectionsRef.current = setCollections;
  setBookmarksRef.current = setBookmarks;
  setTeamEventsRef.current = setTeamEvents;
  setPresenceRef.current = setPresence;

  const setupRealtimeSubscriptions = () => {
    if (!teamId || teamId === '' || !user) {
      console.log('❌ Skipping realtime setup - missing teamId or user:', { teamId, user: user?.id });
      return () => {};
    }

    console.log('✅ Setting up single realtime channel for team:', teamId, 'user:', user.id);

    const channel = supabase.channel(`team-${teamId}`, {
      config: {
        broadcast: {
          self: true,
        },
      },
    });

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collections', filter: `team_id=eq.${teamId}` }, async (payload: any) => {
        console.log('📡 Collections realtime event:', payload);
        if (payload.new && payload.new.team_id !== teamId) return;
        try {
          if (payload.eventType === 'INSERT') {
            setCollectionsRef.current(prev => {
              const newCollection = payload.new;
              const insertIndex = prev.findIndex(c => (c.sort_order || 0) > (newCollection.sort_order || 0));
              return insertIndex === -1 ? [...prev, newCollection] : [...prev.slice(0, insertIndex), newCollection, ...prev.slice(insertIndex)];
            });
          } else if (payload.eventType === 'UPDATE') {
            setCollectionsRef.current(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
          } else if (payload.eventType === 'DELETE') {
            setCollectionsRef.current(prev => prev.filter(c => c.id !== payload.old.id));
          }
        } catch (err) {
          console.error('📡 Error handling collections realtime event:', err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${teamId}` }, async (payload: any) => {
        console.log('📡 Bookmarks realtime event:', payload);
        if (payload.new && payload.new.team_id !== teamId) return;
        try {
          if (payload.eventType === 'INSERT') {
            const { data: newBookmark, error } = await supabase.from('bookmarks').select('*, profiles:created_by(user_id, full_name, avatar_url), collections(id, name, color)').eq('id', payload.new.id).single();
            if (error) return console.error('📡 Failed to fetch new bookmark:', error);
            if (newBookmark) setBookmarksRef.current(prev => [newBookmark, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedBookmark, error } = await supabase.from('bookmarks').select('*, profiles:created_by(user_id, full_name, avatar_url), collections(id, name, color)').eq('id', payload.new.id).single();
            if (error) return console.error('📡 Failed to fetch updated bookmark:', error);
            if (updatedBookmark) setBookmarksRef.current(prev => prev.map(b => b.id === updatedBookmark.id ? updatedBookmark : b));
          } else if (payload.eventType === 'DELETE') {
            setBookmarksRef.current(prev => prev.filter(b => b.id !== payload.old.id));
          }
        } catch (err) {
          console.error('📡 Error handling bookmarks realtime event:', err);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_events', filter: `team_id=eq.${teamId}` }, async (payload: any) => {
        console.log('📡 Team event:', payload);
        if (payload.new && payload.new.team_id !== teamId) return;
        const { data: newEvent } = await supabase.from('team_events').select('*, profiles:actor_id(user_id, full_name, avatar_url)').eq('id', payload.new.id).single();
        if (newEvent) setTeamEventsRef.current(prev => [newEvent, ...prev.slice(0, 49)]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence', filter: `team_id=eq.${teamId}` }, async (payload: any) => {
        console.log('📡 Presence change:', payload);
        if (payload.new && payload.new.team_id !== teamId) return;
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const { data: presence } = await supabase.from('presence').select('*, profiles:user_id(user_id, full_name, avatar_url)').eq('team_id', teamId).eq('user_id', payload.new.user_id).single();
          if (presence) {
            setPresenceRef.current(prev => {
              const filtered = prev.filter(p => p.user_id !== presence.user_id);
              return [presence, ...filtered];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setPresenceRef.current(prev => prev.filter(p => p.user_id !== payload.old.user_id));
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime channel subscribed for team ${teamId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Realtime channel error for team ${teamId}:`, err);
        } else {
          console.log(`📡 Realtime channel status for team ${teamId}: ${status}`);
        }
      });

    return () => {
      console.log('Unsubscribing realtime channel for team:', teamId);
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    const setup = async () => {
      if (user?.id && teamId && teamId !== '' && !authLoading) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('❌ Realtime subscription setup failed: No session found.');
          return;
        }
        
        console.log('🔑 Manually setting realtime auth token.');
        supabase.realtime.setAuth(session.access_token);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🔄 Setting up realtime subscriptions:', { userId: user.id, teamId, authLoading });
        
        if (subscriptionCleanupRef.current) {
          console.log('🧹 Cleaning up existing subscriptions');
          subscriptionCleanupRef.current();
        }

        const cleanup = setupRealtimeSubscriptions();
        subscriptionCleanupRef.current = cleanup;
      } else {
        console.log('⏸️ Not setting up subscriptions:', { userId: user?.id, teamId, authLoading });
      }
    }

    setup();

    return () => {
      if (subscriptionCleanupRef.current) {
        console.log('🧹 Cleaning up subscriptions on component unmount');
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, [user?.id, teamId, authLoading]);

  useEffect(() => {
    return () => {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, []);
}