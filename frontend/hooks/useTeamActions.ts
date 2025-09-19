import { useState } from 'react';
import supabase from '../modules/supabaseClient';
import { getApiBaseUrl } from '../modules/apiClient';
import { stickyPalette } from '../utils/colors';

export function useTeamActions(teamId: string, user: any, profile: any, setError: (error: string | null) => void) {
  const [actionLoading, setActionLoading] = useState(false);

  // Create collection
  const createCollection = async (name: string, description?: string, color: string = stickyPalette[0], parentId?: string) => {
    if (!teamId || !user) return;

    try {
      // Get max sort_order for positioning
      const { data: existingCollections } = await supabase
        .from('collections')
        .select('sort_order')
        .eq('team_id', teamId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxOrder = existingCollections?.[0]?.sort_order || 0;
      const newSortOrder = maxOrder + 10;

      const { data, error } = await supabase
        .from('collections')
        .insert({
          team_id: teamId,
          name,
          description,
          color,
          parent_id: parentId,
          created_by: user.id,
          sort_order: newSortOrder
        })
        .select()
        .single();

      if (error) throw error;

      // Create team event for activity feed
      await supabase
        .from('team_events')
        .insert({
          team_id: teamId,
          event_type: 'collection.created',
          actor_id: user.id,
          data: {
            collection_id: data.id,
            name: name,
            collection_name: name,
            collection_color: color,
            actor_name: profile?.full_name || 'Unknown User'
          }
        });

      return data;
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError('Failed to create collection');
      throw err;
    }
  };

  // Delete collection
  const deleteCollection = async (collectionId: string) => {
    if (!teamId || !user) return;

    try {
      setActionLoading(true);

      // Optimistic update will be handled by the calling component
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)
        .eq('team_id', teamId);

      if (error) throw error;

      // Create team event
      await supabase
        .from('team_events')
        .insert({
          team_id: teamId,
          event_type: 'collection.deleted',
          actor_id: user.id,
          data: {
            collection_id: collectionId,
            // collection_name will be filled by the calling component
            actor_name: profile?.full_name || 'Unknown User'
          }
        });

    } catch (err) {
      console.error('Failed to delete collection:', err);
      setError('Failed to delete collection');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Create bookmark
  const createBookmark = async (url: string, title?: string, collectionId?: string, tags?: string[]) => {
    if (!teamId || !user) return;

    try {
      // Extract content and metadata from the URL
      let extractedData = null;
      try {
        const response = await fetch(`${getApiBaseUrl()}/content/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        });

        if (response.ok) {
          extractedData = await response.json();
        }
      } catch (error) {
        console.log('Content extraction failed, continuing without metadata:', error);
      }

      // Use extracted data or fallbacks
      const finalTitle = title || extractedData?.title || url;
      const extractedDescription = extractedData?.description || null;
      const extractedFavicon = extractedData?.meta_info?.favicon || null;

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          team_id: teamId,
          collection_id: collectionId,
          url,
          title: finalTitle,
          description: extractedDescription,
          favicon_url: extractedFavicon,
          tags: tags || [],
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

      // Create team event for activity feed
      await supabase
        .from('team_events')
        .insert({
          team_id: teamId,
          event_type: 'bookmark.created',
          actor_id: user.id,
          data: {
            bookmark_id: data.id,
            title: data.title || url,
            bookmark_title: data.title || url,
            bookmark_url: url,
            collection_id: collectionId,
            // collection_name will be filled by the calling component
            actor_name: profile?.full_name || 'Unknown User'
          }
        });

      return data;
    } catch (err) {
      console.error('Failed to create bookmark:', err);
      setError('Failed to add bookmark');
      throw err;
    }
  };

  // Delete bookmark
  const deleteBookmark = async (bookmarkId: string) => {
    if (!teamId || !user) return;

    try {
      setActionLoading(true);

      // Optimistic update will be handled by the calling component
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('team_id', teamId);

      if (error) throw error;

      // Create team event
      await supabase
        .from('team_events')
        .insert({
          team_id: teamId,
          event_type: 'bookmark.deleted',
          actor_id: user.id,
          data: {
            bookmark_id: bookmarkId,
            // bookmark_title will be filled by the calling component
            actor_name: profile?.full_name || 'Unknown User'
          }
        });

    } catch (err) {
      console.error('Failed to delete bookmark:', err);
      setError('Failed to delete bookmark');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    actionLoading,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark
  };
}