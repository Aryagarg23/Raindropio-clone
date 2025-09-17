import { useEffect, useRef } from 'react';
import supabase from '../modules/supabaseClient';

interface UseRealtimeSubscriptionsProps {
  teamId: string;
  user: any;
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  setBookmarks: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setPresence: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useRealtimeSubscriptions({
  teamId,
  user,
  setCollections,
  setBookmarks,
  setTeamEvents,
  setPresence
}: UseRealtimeSubscriptionsProps) {
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!teamId || !user) {
      console.log('❌ Skipping realtime setup - missing teamId or user:', { teamId, user: user?.id });
      return () => {};
    }

    console.log('✅ Setting up realtime subscriptions for team:', teamId, 'user:', user.id);

    // Subscribe to collections changes
    const collectionsSubscription = supabase
      .channel(`team-${teamId}-collections`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'collections', 
          filter: 'team_id=eq.' + teamId 
        },
        async (payload: any) => {
          console.log('📡 Collections realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            console.log('📡 Inserting collection:', payload.new);
            setCollections(prev => {
              console.log('📡 Current collections before insert:', prev.length);
              const newCollection = payload.new;
              // Insert at the correct position based on sort_order
              const insertIndex = prev.findIndex(c => (c.sort_order || 0) > (newCollection.sort_order || 0));
              const newCollections = insertIndex === -1 
                ? [...prev, newCollection]
                : [...prev.slice(0, insertIndex), newCollection, ...prev.slice(insertIndex)];
              console.log('📡 Collections after insert:', newCollections.length);
              return newCollections;
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('📡 Updating collection:', payload.new);
            setCollections(prev => {
              console.log('📡 Updating collection in state, prev length:', prev.length);
              const updated = prev.map(c => c.id === payload.new.id ? payload.new : c);
              console.log('📡 Collection updated, new length:', updated.length);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            console.log('📡 Deleting collection:', payload.old);
            setCollections(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Collections subscription status:', status);
      });

    // Subscribe to bookmarks changes
    const bookmarksSubscription = supabase
      .channel(`team-${teamId}-bookmarks`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks', filter: 'team_id=eq.' + teamId },
        async (payload: any) => {
          console.log('📡 Bookmarks realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            // Fetch the full bookmark with relations
            const { data: newBookmark } = await supabase
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
              .eq('id', payload.new.id)
              .single();

            if (newBookmark) {
              setBookmarks(prev => [newBookmark, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('📡 Updating bookmark:', payload.new);
            // Fetch the updated bookmark with full relations
            const { data: updatedBookmark } = await supabase
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
              .eq('id', payload.new.id)
              .single();

            if (updatedBookmark) {
              setBookmarks(prev => {
                console.log('📡 Updating bookmark in state, prev length:', prev.length);
                const updated = prev.map(b => b.id === updatedBookmark.id ? updatedBookmark : b);
                console.log('📡 Bookmark updated, new length:', updated.length);
                return updated;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('📡 Deleting bookmark:', payload.old);
            setBookmarks(prev => {
              console.log('📡 Deleting bookmark from state, prev length:', prev.length);
              const filtered = prev.filter(b => b.id !== payload.old.id);
              console.log('📡 Bookmark deleted, new length:', filtered.length);
              return filtered;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Bookmarks subscription status:', status);
      });

    // Subscribe to team events
    const eventsSubscription = supabase
      .channel(`team-${teamId}-events`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_events', filter: 'team_id=eq.' + teamId },
        async (payload: any) => {
          console.log('Team event:', payload);
          // Fetch the full event with profile
          const { data: newEvent } = await supabase
            .from('team_events')
            .select(`
              *,
              profiles:actor_id (
                user_id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newEvent) {
            setTeamEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep only 50 events
          }
        }
      )
      .subscribe();

    // Subscribe to presence changes with targeted updates
    const presenceSubscription = supabase
      .channel(`team-${teamId}-presence`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'presence', filter: 'team_id=eq.' + teamId },
        async (payload: any) => {
          console.log('Presence user joined:', payload);
          if (payload.new.is_online) {
            const { data: newPresence } = await supabase
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
              .eq('user_id', payload.new.user_id)
              .eq('is_online', true)
              .single();

            if (newPresence) {
              setPresence(prev => {
                // Check if presence for this user already exists
                const exists = prev.some(p => p.user_id === newPresence.user_id && p.team_id === newPresence.team_id);
                if (exists) {
                  console.log('Presence for user already exists, skipping duplicate insert');
                  return prev;
                }
                const filtered = prev.filter(p => p.user_id !== newPresence.user_id);
                return [newPresence, ...filtered];
              });
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'presence', filter: 'team_id=eq.' + teamId },
        async (payload: any) => {
          console.log('Presence updated:', payload);
          if (payload.new.is_online) {
            const { data: updatedPresence } = await supabase
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
              .eq('user_id', payload.new.user_id)
              .eq('is_online', true)
              .single();

            if (updatedPresence) {
              setPresence(prev => {
                const filtered = prev.filter(p => p.user_id !== updatedPresence.user_id);
                return [updatedPresence, ...filtered];
              });
            }
          } else {
            setPresence(prev => prev.filter(p => p.user_id !== payload.new.user_id));
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'presence', filter: 'team_id=eq.' + teamId },
        (payload: any) => {
          console.log('Presence deleted:', payload);
          setPresence(prev => prev.filter(p => p.user_id !== payload.old.user_id));
        }
      )
      .subscribe();

    // Log active channels for debugging
    try {
      const active = (supabase.getChannels && typeof supabase.getChannels === 'function')
        ? supabase.getChannels().map((c: any) => c.topic)
        : null;
      console.log('Realtime subscriptions created for team:', teamId, { activeChannels: active });
    } catch (err) {
      console.warn('Could not list active realtime channels:', err);
    }

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Unsubscribing realtime channels for team:', teamId);
      try { collectionsSubscription.unsubscribe(); } catch (e) { console.warn('Failed to unsubscribe collectionsSubscription', e); }
      try { bookmarksSubscription.unsubscribe(); } catch (e) { console.warn('Failed to unsubscribe bookmarksSubscription', e); }
      try { eventsSubscription.unsubscribe(); } catch (e) { console.warn('Failed to unsubscribe eventsSubscription', e); }
      try { presenceSubscription.unsubscribe(); } catch (e) { console.warn('Failed to unsubscribe presenceSubscription', e); }
    };
  };

  // Initialize subscriptions when dependencies change
  useEffect(() => {
    if (user && teamId) {
      // Clean up any existing subscriptions
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
      }

      // Set up new subscriptions and store cleanup function
      const cleanup = setupRealtimeSubscriptions();
      subscriptionCleanupRef.current = cleanup;
    }
  }, [user, teamId]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, []);
}