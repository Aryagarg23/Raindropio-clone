import { useState, useRef } from 'react';
import supabase from '../modules/supabaseClient';

interface UseDragDropProps {
  user: any;
  profile: any;
  collections: any[];
  bookmarks: any[];
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  setBookmarks: React.Dispatch<React.SetStateAction<any[]>>;
  setError: (error: string | null) => void;
}

export const useDragDrop = ({
  user,
  profile,
  collections,
  bookmarks,
  setCollections,
  setBookmarks,
  setError
}: UseDragDropProps) => {
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverData, setDragOverData] = useState<{id: string, position: 'root' | 'child'} | null>(null);
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = (e: React.DragEvent, collectionId: string) => {
    console.log('=== DRAG START ===', collectionId);
    setDraggedCollection(collectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    console.log('=== DRAG END ===', { draggedCollection });

    // Clear throttle timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
      throttleTimeout.current = null;
    }

    setDraggedCollection(null);
    setDragOverData(null);
  };

  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Simple left/right position detection
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const position = x < width * 0.5 ? 'root' : 'child';

    // Throttle state updates to prevent excessive re-renders while keeping visuals smooth
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      // Only update state if actually different
      if (!dragOverData || dragOverData.id !== collectionId || dragOverData.position !== position) {
        setDragOverData({ id: collectionId, position });
      }
    }, 16); // ~60fps throttle for state updates
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Clear state with slight delay to prevent flicker when moving between elements
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      setDragOverData(null);
    }, 50);
  };

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedCollection) return;

    try {
      // Check if user has permission to modify collections
      if (!user) {
        console.error('No authenticated user');
        setError('You must be logged in to move collections');
        return;
      }

      // Move collection to root level at the bottom
      // Find the highest sort_order among root-level collections
      const rootCollections = collections.filter(c => c.parent_id === null);
      const maxSortOrder = rootCollections.length > 0
        ? Math.max(...rootCollections.map(c => c.sort_order || 0))
        : 0;

      console.log('Moving to root bottom:', {
        draggedCollection,
        newSortOrder: maxSortOrder + 10,
        userId: user.id,
        userRole: profile?.role || 'unknown'
      });

      // Optimistic update - update local state immediately
      const originalCollection = collections.find(c => c.id === draggedCollection);
      setCollections(prevCollections =>
        prevCollections.map(c =>
          c.id === draggedCollection
            ? { ...c, parent_id: null, sort_order: maxSortOrder + 10 }
            : c
        )
      );

      const { error } = await supabase
        .from('collections')
        .update({
          parent_id: null,
          sort_order: maxSortOrder + 10
        })
        .eq('id', draggedCollection);

      if (error) {
        console.error('Root drop error:', error);
        // Revert optimistic update on error
        setCollections(prevCollections =>
          prevCollections.map(c =>
            c.id === draggedCollection
              ? { ...c, parent_id: originalCollection?.parent_id, sort_order: originalCollection?.sort_order }
              : c
          )
        );
        throw error;
      }

    } catch (error: any) {
      console.error('Failed to move collection to root:', error);

      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status');
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator');
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team');
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCollectionId: string) => {
    e.preventDefault();

    if (!draggedCollection) return;

    try {
      // Check if user has permission to modify collections
      if (!user) {
        console.error('No authenticated user');
        setError('You must be logged in to move collections');
        return;
      }

      const targetCollection = collections.find(c => c.id === targetCollectionId);
      if (!targetCollection) {
        console.error('Target collection not found');
        setError('Target collection not found');
        return;
      }

      // Determine target parent and position based on dragOverData
      let targetParentId = targetCollection.parent_id;
      let newSortOrder = 5; // Default fallback

      if (dragOverData?.position === 'child') {
        // Nesting: make targetCollection the parent
        targetParentId = targetCollectionId;

        // Find the highest sort_order among children of targetCollection
        const siblings = collections.filter(c => c.parent_id === targetCollectionId);
        const maxSortOrder = siblings.length > 0
          ? Math.max(...siblings.map(c => c.sort_order || 0))
          : 0;

        newSortOrder = maxSortOrder + 10;
      } else {
        // Sibling positioning: same parent as target
        const siblings = collections.filter(c => c.parent_id === targetCollection.parent_id);
        const targetIndex = siblings.findIndex(c => c.id === targetCollectionId);

        if (targetIndex >= 0) {
          // Calculate space between target and next sibling
          const nextSibling = siblings[targetIndex + 1];
          const targetSortOrder = targetCollection.sort_order || (targetIndex + 1) * 10;

          if (nextSibling) {
            const nextSortOrder = nextSibling.sort_order || (targetIndex + 2) * 10;
            const space = nextSortOrder - targetSortOrder;

            if (space > 1) {
              // Enough room - place between target and next
              newSortOrder = targetSortOrder + Math.floor(space / 2);
            } else {
              // Not enough room - need to resequence siblings
              console.log('Not enough room, resequencing siblings...');

              // Simplified resequencing - just place at end for now
              newSortOrder = Math.max(...siblings.map(c => c.sort_order || 0)) + 10;
            }
          } else {
            // No next sibling - place after target
            newSortOrder = targetSortOrder + 10;
          }
        }
      }

      console.log('Moving collection:', {
        draggedCollection,
        targetCollectionId,
        targetParentId,
        newSortOrder,
        position: dragOverData?.position
      });

      // Optimistic update - update local state immediately
      const originalCollection = collections.find(c => c.id === draggedCollection);
      setCollections(prevCollections =>
        prevCollections.map(c =>
          c.id === draggedCollection
            ? { ...c, parent_id: targetParentId, sort_order: newSortOrder }
            : c
        )
      );

      const { error } = await supabase
        .from('collections')
        .update({
          parent_id: targetParentId,
          sort_order: newSortOrder
        })
        .eq('id', draggedCollection);

      if (error) {
        console.error('Drop error:', error);
        // Revert optimistic update on error
        setCollections(prevCollections =>
          prevCollections.map(c =>
            c.id === draggedCollection
              ? { ...c, parent_id: originalCollection?.parent_id, sort_order: originalCollection?.sort_order }
              : c
          )
        );
        throw error;
      }

    } catch (error: any) {
      console.error('Failed to move collection:', error);

      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status');
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator');
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team');
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  };

  // Bookmark drag handlers
  const handleBookmarkDragStart = (e: React.DragEvent, bookmarkId: string) => {
    setDraggedBookmark(bookmarkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBookmarkDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleBookmarkDrop = async (e: React.DragEvent, targetCollectionId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedBookmark) return;

    try {
      // Optimistic update - update local state immediately
      const originalBookmark = bookmarks.find(b => b.id === draggedBookmark);
      setBookmarks(prevBookmarks =>
        prevBookmarks.map(b =>
          b.id === draggedBookmark
            ? { ...b, collection_id: targetCollectionId || undefined }
            : b
        )
      );

      const { data, error } = await supabase
        .from('bookmarks')
        .update({ collection_id: targetCollectionId })
        .eq('id', draggedBookmark);

      if (error) {
        // Revert optimistic update on error
        setBookmarks(prevBookmarks =>
          prevBookmarks.map(b =>
            b.id === draggedBookmark
              ? { ...b, collection_id: originalBookmark?.collection_id }
              : b
          )
        );
        throw error;
      }

    } catch (error) {
      console.error('Failed to move bookmark:', error);
      setError('Failed to move bookmark');
    } finally {
      setDraggedBookmark(null);
      setDragOverTarget(null);
    }
  };

  return {
    draggedCollection,
    draggedBookmark,
    dragOverTarget,
    dragOverData,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleRootDrop,
    handleDrop,
    handleBookmarkDragStart,
    handleBookmarkDragOver,
    handleBookmarkDrop
  };
};