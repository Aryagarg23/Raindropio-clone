import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import supabase from '../modules/supabaseClient';
import { 
  Collection, 
  Bookmark, 
  TeamEvent, 
  Presence, 
  UserProfile 
} from '../types/api';

export function useTeamSite(teamId: string | string[] | undefined) {
  const router = useRouter();
  
  // Normalize teamId to string
  const actualTeamId = Array.isArray(teamId) ? teamId[0] : teamId;
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  
  // Refs for subscription cleanup and team tracking
  const subscriptionCleanupRef = useRef<(() => void) | null>(null);
  const membersMapRef = useRef<Map<string, any>>(new Map());
  const subscribedMembersRef = useRef<Set<string>>(new Set());
  const presenceMapRef = useRef<Map<string, any>>(new Map());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityHandlerRef = useRef<(() => void) | null>(null);
  const isOfflineRef = useRef(false);

  // Auth check and initialization
  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      
      // Verify team membership
      const { data: membership, error: membershipError } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', actualTeamId)
        .eq('user_id', user.id)
        .single();
      
      if (membershipError || !membership) {
        setError('You are not a member of this team');
        return;
      }
      
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
      
      await loadTeamSiteData();
      
      // Clean up any existing subscriptions
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
      }
      
      // Set up new subscriptions and store cleanup function
      const cleanup = setupRealtimeSubscriptions();
      subscriptionCleanupRef.current = cleanup;
      updatePresence();
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  // Load all team site data
  const loadTeamSiteData = async () => {
    if (!actualTeamId) return;
    
    try {
      // Load collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select(`
          *,
          profiles:created_by (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .eq('team_id', actualTeamId)
        .order('created_at', { ascending: false });
      
      if (collectionsError) throw collectionsError;
      setCollections(collectionsData || []);
      
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
        .eq('team_id', actualTeamId)
        .order('created_at', { ascending: false });
      
      if (bookmarksError) throw bookmarksError;
      setBookmarks(bookmarksData || []);
      
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
        .eq('team_id', actualTeamId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (eventsError) throw eventsError;
      setTeamEvents(eventsData || []);
      
      // Load presence
      console.log('Loading presence for team:', actualTeamId);
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
        .eq('team_id', actualTeamId)
        .eq('is_online', true);
      
      if (presenceError) {
        console.error('Presence loading error:', presenceError);
        throw presenceError;
      }
      
      console.log('Loaded presence data:', presenceData);
      setPresence(presenceData || []);
      
    } catch (err) {
      console.error('Failed to load team site data:', err);
      setError('Failed to load team data');
    }
  };

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = (): (() => void) | null => {
    if (!actualTeamId) return null;
    
    // Subscribe to collections changes with targeted updates
    const collectionsSubscription = supabase
      .channel(`team-${actualTeamId}-collections`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'collections', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
          console.log('Collection inserted:', payload);
          const { data: newCollection } = await supabase
            .from('collections')
            .select(`
              *,
              profiles:created_by (
                user_id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newCollection) {
            setCollections(prev => [newCollection, ...prev]);
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'collections', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
          console.log('Collection updated:', payload);
          const { data: updatedCollection } = await supabase
            .from('collections')
            .select(`
              *,
              profiles:created_by (
                user_id,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (updatedCollection) {
            setCollections(prev => prev.map(col => 
              col.id === updatedCollection.id ? updatedCollection : col
            ));
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'collections', filter: `team_id=eq.${actualTeamId}` },
        (payload) => {
          console.log('Collection deleted:', payload);
          setCollections(prev => prev.filter(col => col.id !== payload.old.id));
        }
      )
      .subscribe();
    
    // Subscribe to bookmarks changes with targeted updates
    const bookmarksSubscription = supabase
      .channel(`team-${actualTeamId}-bookmarks`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
          console.log('Bookmark inserted:', payload);
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
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
          console.log('Bookmark updated:', payload);
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
            setBookmarks(prev => prev.map(bm => 
              bm.id === updatedBookmark.id ? updatedBookmark : bm
            ));
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${actualTeamId}` },
        (payload) => {
          console.log('Bookmark deleted:', payload);
          setBookmarks(prev => prev.filter(bm => bm.id !== payload.old.id));
        }
      )
      .subscribe();
    
    // Subscribe to team events with optimized updates
    const eventsSubscription = supabase
      .channel(`team-${actualTeamId}-events`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_events', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
          console.log('New team event:', payload);
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
            setTeamEvents(prev => [newEvent, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();
    
    // Subscribe to presence changes with targeted updates
    const presenceSubscription = supabase
      .channel(`team-${actualTeamId}-presence`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'presence', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
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
                const filtered = prev.filter(p => p.user_id !== newPresence.user_id);
                return [newPresence, ...filtered];
              });
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'presence', filter: `team_id=eq.${actualTeamId}` },
        async (payload) => {
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
        { event: 'DELETE', schema: 'public', table: 'presence', filter: `team_id=eq.${actualTeamId}` },
        (payload) => {
          console.log('Presence deleted:', payload);
          setPresence(prev => prev.filter(p => p.user_id !== payload.old.user_id));
        }
      )
      .subscribe();
    
    // Cleanup subscriptions on unmount
    return () => {
      collectionsSubscription.unsubscribe();
      bookmarksSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
    };
  };

  // Update user presence
  const updatePresence = async () => {
    if (!actualTeamId || !user) {
      console.log('updatePresence skipped - missing actualTeamId or user:', { actualTeamId, userId: user?.id });
      return;
    }
    
    try {
      console.log('Updating presence for user:', user.id, 'in team:', actualTeamId);
      const { data, error } = await supabase
        .from('presence')
        .upsert({
          team_id: actualTeamId,
          user_id: user.id,
          current_page: 'team-overview',
          is_online: true,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'team_id,user_id'
        })
        .select();
      
      if (error) {
        console.error('Presence update error:', error);
      } else {
        console.log('Presence updated successfully:', data);
      }
    } catch (err) {
      console.error('Failed to update presence:', err);
    }
  };

  // Create collection with optimistic updates
  const createCollection = async (name: string, description?: string, color?: string) => {
    if (!actualTeamId || !user) return;
    
    try {
      // Create optimistic collection with full structure (including joined profile data)
      const optimisticCollection: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        team_id: actualTeamId,
        name,
        description: description || undefined,
        color: color || '#A0D2EB',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          user_id: user.id,
          full_name: profile?.full_name || 'You',
          avatar_url: profile?.avatar_url || null
        }
      };
      
      // Optimistic update first for immediate UI feedback
      setCollections(prev => [optimisticCollection, ...prev]);
      
      const { data, error } = await supabase
        .from('collections')
        .insert({
          team_id: actualTeamId,
          name,
          description,
          color: color || '#A0D2EB',
          created_by: user.id
        })
        .select(`
          *,
          profiles:created_by (
            user_id,
            full_name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Replace optimistic update with real data
      setCollections(prev => prev.map(col => 
        col.id === optimisticCollection.id ? data : col
      ));
      
      // Create team event for activity feed
      await supabase
        .from('team_events')
        .insert({
          team_id: actualTeamId,
          event_type: 'collection.created',
          actor_id: user.id,
          data: {
            collection_id: data.id,
            name: name,
            collection_name: name,
            collection_color: data.color,
            actor_name: profile?.full_name || 'Unknown User'
          }
        });
      
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError('Failed to create collection');
      // Revert optimistic update on error
      setCollections(prev => prev.filter(col => !col.id.toString().startsWith('temp-')));
    }
  };

  // Create bookmark with optimistic updates
  const createBookmark = async (url: string, title?: string, collectionId?: string) => {
    if (!actualTeamId || !user) return;
    
    try {
      // Find the collection for the optimistic update
      const selectedCollection = collectionId 
        ? collections.find(c => c.id === collectionId)
        : null;
      
      // Create optimistic bookmark with full structure
      const optimisticBookmark: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        team_id: actualTeamId,
        collection_id: collectionId || null,
        url,
        title: title || url,
        description: null,
        favicon_url: null,
        preview_image: null,
        tags: [],
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
          user_id: user.id,
          full_name: profile?.full_name || 'You',
          avatar_url: profile?.avatar_url || null
        },
        collections: selectedCollection ? {
          id: selectedCollection.id,
          name: selectedCollection.name,
          color: selectedCollection.color
        } : null
      };
      
      // Optimistic update first for immediate UI feedback
      setBookmarks(prev => [optimisticBookmark, ...prev]);
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          team_id: actualTeamId,
          collection_id: collectionId,
          url,
          title,
          created_by: user.id
        })
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
        .single();
      
      if (error) throw error;
      
      // Replace optimistic update with real data
      setBookmarks(prev => prev.map(bm => 
        bm.id === optimisticBookmark.id ? data : bm
      ));
      
      // Create team event for activity feed
      await supabase
        .from('team_events')
        .insert({
          team_id: actualTeamId,
          event_type: 'bookmark.created',
          actor_id: user.id,
          data: {
            bookmark_id: data.id,
            title: data.title || url,
            bookmark_title: data.title || url,
            bookmark_url: url,
            collection_id: collectionId,
            collection_name: selectedCollection?.name,
            actor_name: profile?.full_name || 'Unknown User'
          }
        });
      
    } catch (err) {
      console.error('Failed to create bookmark:', err);
      setError('Failed to add bookmark');
      // Revert optimistic update on error
      setBookmarks(prev => prev.filter(bm => !bm.id.toString().startsWith('temp-')));
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!actualTeamId || !user) return;
    
    try {
      // Optimistic update
      const collectionToDelete = collections.find(c => c.id === collectionId);
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
        .eq('team_id', actualTeamId);
        
      if (error) throw error;
      
      // Create team event
      await supabase
        .from('team_events')
        .insert({
          team_id: actualTeamId,
          event_type: 'collection.deleted',
          actor_id: user.id,
          data: {
            collection_id: collectionId,
            name: collectionToDelete?.name || 'Unknown Collection',
            collection_name: collectionToDelete?.name || 'Unknown Collection',
            actor_name: profile?.full_name || 'Unknown User'
          }
        });
        
    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError('Failed to delete collection');
      // Revert optimistic update on error
      loadTeamSiteData();
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    if (!actualTeamId || !user) return;
    
    try {
      // Optimistic update
      const bookmarkToDelete = bookmarks.find(b => b.id === bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('team_id', actualTeamId);
        
      if (error) throw error;
      
      // Create team event
      await supabase
        .from('team_events')
        .insert({
          team_id: actualTeamId,
          event_type: 'bookmark.deleted',
          actor_id: user.id,
          data: {
            bookmark_id: bookmarkId,
            title: bookmarkToDelete?.title || 'Unknown Bookmark',
            bookmark_title: bookmarkToDelete?.title || 'Unknown Bookmark',
            bookmark_url: bookmarkToDelete?.url || '',
            actor_name: profile?.full_name || 'Unknown User'
          }
        });
        
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
      setError('Failed to delete bookmark');
      // Revert optimistic update on error
      loadTeamSiteData();
    }
  };

  // Initialize on component mount
  useEffect(() => {
    if (teamId) {
      checkAuth();
    }
  }, [teamId]);

  // Handle authentication state changes (including logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        // User logged out or session expired - mark offline immediately
        if (user && actualTeamId) {
          await supabase
            .from('presence')
            .update({ 
              is_online: false,
              last_seen: new Date().toISOString()
            })
            .eq('team_id', actualTeamId)
            .eq('user_id', user.id);
        }
        
        // Clear local state
        setUser(null);
        setProfile(null);
        setPresence([]);
        
        // Clean up subscriptions
        if (subscriptionCleanupRef.current) {
          subscriptionCleanupRef.current();
          subscriptionCleanupRef.current = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, actualTeamId]);

  // Simple activity-based presence management
  useEffect(() => {
    if (!actualTeamId || !user) return;

    let lastActivityTime = Date.now();
    let isOnline = true;
    let activityCheckInterval: NodeJS.Timeout;
    let inactivityTimeout: NodeJS.Timeout;
    let isNavigatingAway = false; // Flag to prevent activity override during navigation

    // Update presence status
    const updatePresenceStatus = async (online: boolean) => {
      if (!user || !actualTeamId) return;
      
      console.log(`[PRESENCE] Attempting to mark user ${online ? 'ONLINE' : 'OFFLINE'} in team:`, actualTeamId);
      
      try {
        const { data, error } = await supabase
          .from('presence')
          .update({ 
            is_online: online,
            last_seen: new Date().toISOString()
          })
          .eq('team_id', actualTeamId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`[PRESENCE] Failed to mark ${online ? 'online' : 'offline'}:`, error);
        } else {
          console.log(`[PRESENCE] Successfully marked user ${online ? 'ONLINE' : 'OFFLINE'} in team:`, actualTeamId, data);
          isOnline = online;
        }
      } catch (error) {
        console.error(`[PRESENCE] Exception during ${online ? 'online' : 'offline'} update:`, error);
      }
    };

    // Reset activity timer
    const resetActivityTimer = () => {
      // Don't reset activity if we're navigating away
      if (isNavigatingAway) return;
      
      lastActivityTime = Date.now();
      
      // If user was offline, mark them online
      if (!isOnline) {
        updatePresenceStatus(true);
      }

      // Clear existing inactivity timeout
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }

      // Set new 5-minute inactivity timeout
      inactivityTimeout = setTimeout(() => {
        if (isOnline && !isNavigatingAway) {
          updatePresenceStatus(false);
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Debounced activity handler to prevent rapid firing
    let activityDebounceTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      // Ignore activity if we're navigating away
      if (isNavigatingAway) return;
      
      // Clear previous debounce timeout
      if (activityDebounceTimeout) {
        clearTimeout(activityDebounceTimeout);
      }
      
      // Debounce activity reset by 1 second
      activityDebounceTimeout = setTimeout(() => {
        resetActivityTimer();
      }, 1000);
    };

    // Activity events to track (reduced sensitivity to prevent flickering)
    const activityEvents = [
      'click',
      'keypress',
      'scroll'
    ];

    // Add activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Remove activity listeners helper
    const removeActivityListeners = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };

    // Handle page navigation away from team
    const handleRouteChangeStart = (url: string) => {
      const currentTeamPath = `/team-site/${actualTeamId}`;
      if (!url.startsWith(currentTeamPath)) {
        console.log(`[PRESENCE] Navigation detected away from team ${actualTeamId} to:`, url);
        
        // Set navigation flag to prevent activity interference
        isNavigatingAway = true;
        
        // Remove activity listeners immediately
        removeActivityListeners();
        
        // Clear any pending timeouts
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        
        // Immediate synchronous offline update - don't wait for async
        if (user && actualTeamId) {
          console.log(`[PRESENCE] IMMEDIATE offline update for navigation`);
          supabase
            .from('presence')
            .update({ 
              is_online: false,
              last_seen: new Date().toISOString()
            })
            .eq('team_id', actualTeamId)
            .eq('user_id', user.id)
            .then(({ data, error }) => {
              if (error) {
                console.error('[PRESENCE] Navigation offline update failed:', error);
              } else {
                console.log('[PRESENCE] Navigation offline update succeeded:', data);
              }
            });
        }
      }
    };

    // Handle page unload
    const handleBeforeUnload = () => {
      if (user && actualTeamId) {
        // Set navigation flag and remove listeners
        isNavigatingAway = true;
        removeActivityListeners();
        
        navigator.sendBeacon && navigator.sendBeacon('/api/presence-offline', JSON.stringify({
          team_id: actualTeamId,
          user_id: user.id
        })) || supabase
          .from('presence')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('team_id', actualTeamId)
          .eq('user_id', user.id);
      }
    };

    // Add navigation and unload listeners
    router.events.on('routeChangeStart', handleRouteChangeStart);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial setup
    updatePresence(); // Set initial online status
    resetActivityTimer(); // Start activity tracking

    // Periodic heartbeat (every 2 minutes) to update last_seen
    activityCheckInterval = setInterval(() => {
      if (isOnline) {
        supabase
          .from('presence')
          .update({ last_seen: new Date().toISOString() })
          .eq('team_id', actualTeamId)
          .eq('user_id', user.id);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      // Cleanup intervals and timeouts
      if (activityCheckInterval) clearInterval(activityCheckInterval);
      if (inactivityTimeout) clearTimeout(inactivityTimeout);

      // Remove activity listeners
      removeActivityListeners();

      // Remove navigation listeners
      router.events.off('routeChangeStart', handleRouteChangeStart);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Mark offline on cleanup
      if (user && actualTeamId) {
        console.log(`[PRESENCE] Component cleanup - marking offline in team:`, actualTeamId);
        supabase
          .from('presence')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('team_id', actualTeamId)
          .eq('user_id', user.id)
          .then(({ data, error }) => {
            if (error) {
              console.error('[PRESENCE] Cleanup offline update failed:', error);
            } else {
              console.log('[PRESENCE] Cleanup offline update succeeded:', data);
            }
          });
      }
    };
  }, [user, actualTeamId, router.events]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
  }, []);

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
    
    // Actions
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError
  };
}