import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import supabase from '../../modules/supabaseClient';
import { 
  Collection, 
  Bookmark, 
  TeamEvent, 
  Presence, 
  HighlightWithCreator, 
  AnnotationWithCreator,
  ActivityItem,
  UserProfile 
} from '../../types/api';

export default function TeamSitePage() {
  const router = useRouter();
  const { teamId } = router.query;
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Team site data
  const [collections, setCollections] = useState<Collection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  
  // UI state
  const [activeView, setActiveView] = useState<'collections' | 'bookmarks' | 'activity'>('collections');
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  useEffect(() => {
    if (teamId) {
      checkAuth();
    }
  }, [teamId]);

  // Set up periodic presence updates and cleanup
  useEffect(() => {
    if (!teamId || !user) return;

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      updatePresence();
    }, 30000);

    // Set offline status when leaving the page
    const handleBeforeUnload = async () => {
      if (user && teamId) {
        await supabase
          .from('presence')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('team_id', teamId)
          .eq('user_id', user.id);
      }
    };

    // Set offline when page visibility changes (tab switching, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBeforeUnload();
      } else {
        updatePresence();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Set offline status when component unmounts
      if (user && teamId) {
        supabase
          .from('presence')
          .update({ 
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('team_id', teamId)
          .eq('user_id', user.id);
      }
    };
  }, [user, teamId]);

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
        .eq('team_id', teamId)
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
      setupRealtimeSubscriptions();
      updatePresence();
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamSiteData = async () => {
    if (!teamId) return;
    
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
        .eq('team_id', teamId)
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
        .eq('team_id', teamId)
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
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (eventsError) throw eventsError;
      setTeamEvents(eventsData || []);
      
      // Load presence
      console.log('Loading presence for team:', teamId);
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

  const setupRealtimeSubscriptions = () => {
    if (!teamId) return;
    
    // Subscribe to collections changes with targeted updates
    const collectionsSubscription = supabase
      .channel(`team-${teamId}-collections`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'collections', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Collection inserted:', payload);
          // Fetch the full collection with profile data
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
        { event: 'UPDATE', schema: 'public', table: 'collections', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Collection updated:', payload);
          // Fetch updated collection with profile data
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
        { event: 'DELETE', schema: 'public', table: 'collections', filter: `team_id=eq.${teamId}` },
        (payload) => {
          console.log('Collection deleted:', payload);
          setCollections(prev => prev.filter(col => col.id !== payload.old.id));
        }
      )
      .subscribe();
    
    // Subscribe to bookmarks changes with targeted updates
    const bookmarksSubscription = supabase
      .channel(`team-${teamId}-bookmarks`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Bookmark inserted:', payload);
          // Fetch the full bookmark with profile and collection data
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
        { event: 'UPDATE', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Bookmark updated:', payload);
          // Fetch updated bookmark with profile and collection data
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
        { event: 'DELETE', schema: 'public', table: 'bookmarks', filter: `team_id=eq.${teamId}` },
        (payload) => {
          console.log('Bookmark deleted:', payload);
          setBookmarks(prev => prev.filter(bm => bm.id !== payload.old.id));
        }
      )
      .subscribe();
    
    // Subscribe to team events with optimized updates
    const eventsSubscription = supabase
      .channel(`team-${teamId}-events`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_events', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('New team event:', payload);
          // Fetch the full event with profile data
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
      .channel(`team-${teamId}-presence`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'presence', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Presence user joined:', payload);
          if (payload.new.is_online) {
            // Fetch presence with profile data
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
                // Remove existing presence for this user and add new one
                const filtered = prev.filter(p => p.user_id !== newPresence.user_id);
                return [newPresence, ...filtered];
              });
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'presence', filter: `team_id=eq.${teamId}` },
        async (payload) => {
          console.log('Presence updated:', payload);
          if (payload.new.is_online) {
            // User came online or updated presence
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
            // User went offline
            setPresence(prev => prev.filter(p => p.user_id !== payload.new.user_id));
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'presence', filter: `team_id=eq.${teamId}` },
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

  const updatePresence = async () => {
    if (!teamId || !user) {
      console.log('updatePresence skipped - missing teamId or user:', { teamId, userId: user?.id });
      return;
    }
    
    try {
      console.log('Updating presence for user:', user.id, 'in team:', teamId);
      const { data, error } = await supabase
        .from('presence')
        .upsert({
          team_id: teamId,
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

  const createCollection = async (name: string, description?: string, color?: string) => {
    if (!teamId || !user) return;
    
    try {
      // Create optimistic collection with full structure (including joined profile data)
      const optimisticCollection: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        team_id: typeof teamId === 'string' ? teamId : teamId[0],
        name,
        description: description || undefined,
        color: color || '#007acc',
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
      setShowCreateCollection(false);
      
      const { data, error } = await supabase
        .from('collections')
        .insert({
          team_id: teamId,
          name,
          description,
          color: color || '#007acc',
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
          team_id: teamId,
          event_type: 'collection.created',
          actor_id: user.id,
          data: {
            collection_id: data.id,
            collection_name: name,
            collection_color: data.color
          }
        });
      
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError('Failed to create collection');
      // Revert optimistic update on error
      setCollections(prev => prev.filter(col => !col.id.toString().startsWith('temp-')));
    }
  };

  const createBookmark = async (url: string, title?: string, collectionId?: string) => {
    if (!teamId || !user) return;
    
    try {
      // Find the collection for the optimistic update
      const selectedCollection = collectionId 
        ? collections.find(c => c.id === collectionId)
        : null;
      
      // Create optimistic bookmark with full structure
      const optimisticBookmark: any = {
        id: `temp-${Date.now()}`, // Temporary ID
        team_id: typeof teamId === 'string' ? teamId : teamId[0],
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
      setShowAddBookmark(false);
      
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          team_id: teamId,
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
          team_id: teamId,
          event_type: 'bookmark.created',
          actor_id: user.id,
          data: {
            bookmark_id: data.id,
            bookmark_title: data.title || url,
            bookmark_url: url,
            collection_id: collectionId,
            collection_name: selectedCollection?.name
          }
        });
      
    } catch (err) {
      console.error('Failed to create bookmark:', err);
      setError('Failed to add bookmark');
      // Revert optimistic update on error
      setBookmarks(prev => prev.filter(bm => !bm.id.toString().startsWith('temp-')));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading team workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b transition-all duration-200" style={{ 
        backgroundColor: 'var(--surface)', 
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-1"
                style={{ 
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--background)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px" style={{ backgroundColor: 'var(--border)' }}></div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Team Workspace
              </h1>
            </div>
            
            {/* Online members */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {presence.length === 0 ? 'No one online' : `${presence.length} online`}
                  </span>
                </div>
                
                {presence.length > 0 && (
                  <div className="flex -space-x-2">
                    {presence.slice(0, 5).map((p: any) => {
                      console.log('Presence item:', p); // Debug log
                      const displayName = p.profiles?.full_name || p.profiles?.user_id || 'Unknown User';
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                      
                      return (
                        <div
                          key={p.user_id}
                          className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold relative transition-all duration-200 hover:transform hover:-translate-y-1 hover:z-10"
                          style={{ 
                            borderColor: 'var(--surface)',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: 'var(--background)',
                            boxShadow: 'var(--shadow-md)'
                          }}
                          title={`${displayName} (Online)`}
                        >
                          {p.profiles?.avatar_url ? (
                            <img 
                              src={p.profiles.avatar_url} 
                              alt={displayName}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                console.log('Avatar failed to load for:', displayName);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                          {/* Online indicator */}
                          <div 
                            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
                            style={{ 
                              backgroundColor: '#10B981',
                              borderColor: 'var(--surface)'
                            }}
                          ></div>
                        </div>
                      );
                    })}
                    {presence.length > 5 && (
                      <div 
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                        style={{ 
                          borderColor: 'var(--surface)',
                          backgroundColor: 'var(--border)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        +{presence.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
            {[
              { key: 'collections', label: 'Collections', count: collections.length, icon: '📁' },
              { key: 'bookmarks', label: 'All Bookmarks', count: bookmarks.length, icon: '🔖' },
              { key: 'activity', label: 'Activity', count: teamEvents.length, icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className="flex items-center space-x-3 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 hover:transform hover:-translate-y-1"
                style={{
                  backgroundColor: activeView === tab.key ? 'var(--primary)' : 'transparent',
                  color: activeView === tab.key ? 'var(--background)' : 'var(--text-secondary)',
                  boxShadow: activeView === tab.key ? 'var(--shadow-lg)' : 'none'
                }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-semibold min-w-[24px] text-center"
                  style={{
                    backgroundColor: activeView === tab.key 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'var(--border)',
                    color: activeView === tab.key 
                      ? 'var(--background)' 
                      : 'var(--text-secondary)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Collections View */}
        {activeView === 'collections' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Collections
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Organize your bookmarks into collections
                </p>
              </div>
              <button
                onClick={() => setShowCreateCollection(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--background)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>New Collection</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="p-6 rounded-xl cursor-pointer transition-all duration-200 hover:transform hover:-translate-y-2 group"
                  style={{
                    backgroundColor: 'var(--surface)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border)'
                  }}
                  onClick={() => setSelectedCollection(collection)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-5 h-5 rounded-lg shadow-sm"
                        style={{ backgroundColor: collection.color }}
                      ></div>
                      <span className="text-2xl">📁</span>
                    </div>
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--background)'
                      }}
                    >
                      {bookmarks.filter(b => b.collection_id === collection.id).length} items
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 group-hover:text-opacity-80 transition-all" style={{ color: 'var(--text-primary)' }}>
                    {collection.name}
                  </h3>
                  
                  {collection.description && (
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Created {new Date(collection.created_at).toLocaleDateString()}
                    </div>
                    {(collection as any).profiles && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                          style={{ 
                            backgroundColor: 'var(--secondary)',
                            color: 'var(--background)'
                          }}
                        >
                          {(collection as any).profiles.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {collections.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No collections yet
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Create your first collection to organize bookmarks
                  </p>
                  <button
                    onClick={() => setShowCreateCollection(true)}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'var(--background)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    Create Collection
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookmarks View */}
        {activeView === 'bookmarks' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  All Bookmarks
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Your team's saved links and resources
                </p>
              </div>
              <button
                onClick={() => setShowAddBookmark(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--background)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Add Bookmark</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="p-6 rounded-xl transition-all duration-200 hover:transform hover:-translate-y-1 group"
                  style={{
                    backgroundColor: 'var(--surface)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {bookmark.favicon_url ? (
                          <img 
                            src={bookmark.favicon_url} 
                            alt="" 
                            className="w-5 h-5"
                          />
                        ) : (
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center text-xs"
                            style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
                          >
                            🔗
                          </div>
                        )}
                        {(bookmark as any).collections && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: (bookmark as any).collections.color,
                              color: 'var(--background)'
                            }}
                          >
                            {(bookmark as any).collections.name}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2 group-hover:text-opacity-80 transition-all">
                        <a 
                          href={bookmark.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {bookmark.title || bookmark.url}
                        </a>
                      </h3>
                      
                      {bookmark.description && (
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          {bookmark.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                          {bookmark.tags.length > 0 && (
                            <div className="flex space-x-2">
                              {bookmark.tags.slice(0, 3).map((tag, index) => (
                                <span 
                                  key={index}
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: 'var(--border)',
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  #{tag}
                                </span>
                              ))}
                              {bookmark.tags.length > 3 && (
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  +{bookmark.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {(bookmark as any).profiles && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ 
                                backgroundColor: 'var(--accent)',
                                color: 'var(--background)'
                              }}
                            >
                              {(bookmark as any).profiles.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      className="opacity-0 group-hover:opacity-100 ml-4 p-2 rounded-lg transition-all duration-200"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--border)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              {bookmarks.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔖</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No bookmarks yet
                  </h3>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Start saving useful links for your team
                  </p>
                  <button
                    onClick={() => setShowAddBookmark(true)}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
                    style={{
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--background)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    Add Bookmark
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity View */}
        {activeView === 'activity' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Recent Activity
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                See what your team has been working on
              </p>
            </div>
            
            <div className="space-y-4">
              {teamEvents.map((event) => {
                const getEventIcon = (eventType: string) => {
                  switch (eventType) {
                    case 'collection.created': return '📁';
                    case 'bookmark.created': return '🔖';
                    case 'highlight.created': return '✨';
                    case 'annotation.created': return '💬';
                    default: return '📝';
                  }
                };
                
                const getEventDescription = (eventType: string, data: any) => {
                  switch (eventType) {
                    case 'collection.created':
                      return `created collection "${data?.collection_name || 'Untitled'}"`;
                    case 'bookmark.created':
                      return `added bookmark "${data?.bookmark_title || data?.bookmark_url || 'Untitled'}"`;
                    case 'highlight.created':
                      return `highlighted text`;
                    case 'annotation.created':
                      return `added annotation`;
                    default:
                      return eventType.replace('.', ' ').replace('_', ' ');
                  }
                };

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl transition-all duration-200 hover:transform hover:-translate-y-1"
                    style={{
                      backgroundColor: 'var(--surface)',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--background)'
                          }}
                        >
                          {((event as any).profiles?.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="text-2xl">
                          {getEventIcon(event.event_type)}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-bold">
                            {(event as any).profiles?.full_name || 'Unknown User'}
                          </span>
                          {' '}
                          {getEventDescription(event.event_type, event.data)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                          
                          {event.data?.collection_name && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: event.data?.collection_color || 'var(--secondary)',
                                color: 'var(--background)'
                              }}
                            >
                              {event.data.collection_name}
                            </span>
                          )}
                        </div>
                        
                        {event.data?.bookmark_url && (
                          <div className="mt-2">
                            <a 
                              href={event.data.bookmark_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                              style={{ color: 'var(--primary)' }}
                            >
                              {event.data.bookmark_url}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {teamEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No activity yet
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Team activity will appear here as members create collections and bookmarks
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onCreate={createCollection}
        />
      )}

      {/* Add Bookmark Modal */}
      {showAddBookmark && (
        <AddBookmarkModal
          collections={collections}
          onClose={() => setShowAddBookmark(false)}
          onCreate={createBookmark}
        />
      )}
    </div>
  );
}

// Modal Components
function CreateCollectionModal({ 
  onClose, 
  onCreate 
}: { 
  onClose: () => void;
  onCreate: (name: string, description?: string, color?: string) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#A0D2EB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined, color);
    }
  };

  const colorOptions = [
    '#A0D2EB', '#E57373', '#C41230', '#81C784', '#FFB74D', 
    '#BA68C8', '#4FC3F7', '#FF8A65', '#9CCC65', '#F06292'
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div 
        className="w-full max-w-md rounded-2xl p-8 transition-all duration-300 transform"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create New Collection
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Organize your bookmarks with a custom collection
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Collection Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:transform focus:-translate-y-1"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter collection name"
              required
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:transform focus:-translate-y-1 resize-none"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Optional description"
              rows={3}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Collection Color
            </label>
            <div className="grid grid-cols-5 gap-3">
              {colorOptions.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className="w-12 h-12 rounded-xl transition-all duration-200 hover:transform hover:scale-110"
                  style={{
                    backgroundColor: colorOption,
                    border: color === colorOption ? '3px solid var(--text-primary)' : '2px solid var(--border)',
                    boxShadow: color === colorOption ? 'var(--shadow-lg)' : 'var(--shadow-md)'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                e.currentTarget.style.color = 'var(--background)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                boxShadow: 'var(--shadow-md)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBookmarkModal({ 
  collections,
  onClose, 
  onCreate 
}: { 
  collections: Collection[];
  onClose: () => void;
  onCreate: (url: string, title?: string, collectionId?: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onCreate(url.trim(), title.trim() || undefined, collectionId || undefined);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div 
        className="w-full max-w-md rounded-2xl p-8 transition-all duration-300 transform"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)'
        }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔖</div>
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Add New Bookmark
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Save a useful link for your team
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:transform focus:-translate-y-1"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="https://example.com"
              required
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--secondary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:transform focus:-translate-y-1"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Optional title"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--secondary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Collection
            </label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:transform focus:-translate-y-1"
              style={{
                backgroundColor: 'var(--background)',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--secondary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="">No collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  📁 {collection.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
                e.currentTarget.style.color = 'var(--background)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--background)',
                boxShadow: 'var(--shadow-md)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              Add Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}