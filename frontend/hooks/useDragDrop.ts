import { useState, useRef, useCallback } from 'react';
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

export function useDragDrop({
  user,
  profile,
  collections,
  bookmarks,
  setCollections,
  setBookmarks,
  setError
}: UseDragDropProps) {
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null);
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverData, setDragOverData] = useState<{id: string, position: 'root' | 'child'} | null>(null);
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, collectionId: string) => {
    setDraggedCollection(collectionId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    console.log('=== DRAG END ===', { draggedCollection });
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
      throttleTimeout.current = null;
    }
    setDraggedCollection(null);
    setDragOverData(null);
  }, [draggedCollection]);

  const handleDragOver = useCallback((e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = x < rect.width * 0.5 ? 'root' : 'child';

    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }

    throttleTimeout.current = setTimeout(() => {
      if (!dragOverData || dragOverData.id !== collectionId || dragOverData.position !== position) {
        setDragOverData({ id: collectionId, position });
      }
    }, 16);
  }, [dragOverData]);

  const handleDragLeave = useCallback(() => {
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }
    throttleTimeout.current = setTimeout(() => {
      setDragOverData(null);
    }, 50);
  }, []);

  const handleRootDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCollection || !user) {
      setError('You must be logged in to move collections');
      return;
    }

    const originalCollection = collections.find(c => c.id === draggedCollection);
    const rootCollections = collections.filter(c => c.parent_id === null);
    const maxSortOrder = rootCollections.length > 0 ? Math.max(...rootCollections.map(c => c.sort_order || 0)) : 0;

    setCollections(prev => prev.map(c => c.id === draggedCollection ? { ...c, parent_id: null, sort_order: maxSortOrder + 10 } : c));

    try {
      const { error } = await supabase
        .from('collections')
        .update({ parent_id: null, sort_order: maxSortOrder + 10 })
        .eq('id', draggedCollection);

      if (error) throw error;
    } catch (error: any) {
      setError(`Failed to move collection: ${error.message}`);
      setCollections(prev => prev.map(c => c.id === draggedCollection ? originalCollection : c).filter(Boolean) as any[]);
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  }, [draggedCollection, user, collections, setCollections, setError]);

  const handleDrop = useCallback(async (e: React.DragEvent, targetCollectionId: string) => {
    e.preventDefault();
    if (!draggedCollection || !user) {
      setError('You must be logged in to move collections');
      return;
    }

    const targetCollection = collections.find(c => c.id === targetCollectionId);
    if (!targetCollection) return;

    let targetParentId = targetCollection.parent_id;
    let newSortOrder = 5;

    if (dragOverData?.position === 'child') {
      targetParentId = targetCollectionId;
      const siblings = collections.filter(c => c.parent_id === targetCollectionId);
      newSortOrder = (siblings.length > 0 ? Math.max(...siblings.map(c => c.sort_order || 0)) : 0) + 10;
    } else {
      const siblings = collections.filter(c => c.parent_id === targetCollection.parent_id);
      const targetIndex = siblings.findIndex(c => c.id === targetCollectionId);
      if (targetIndex >= 0) {
        const targetSortOrder = targetCollection.sort_order || (targetIndex + 1) * 10;
        const nextSibling = siblings[targetIndex + 1];
        newSortOrder = nextSibling ? targetSortOrder + Math.floor((nextSibling.sort_order - targetSortOrder) / 2) : targetSortOrder + 10;
      }
    }

    const originalCollection = collections.find(c => c.id === draggedCollection);
    setCollections(prev => prev.map(c => c.id === draggedCollection ? { ...c, parent_id: targetParentId, sort_order: newSortOrder } : c));

    try {
      const { error } = await supabase
        .from('collections')
        .update({ parent_id: targetParentId, sort_order: newSortOrder })
        .eq('id', draggedCollection);

      if (error) throw error;
    } catch (error: any) {
      setError(`Failed to move collection: ${error.message}`);
      setCollections(prev => prev.map(c => c.id === draggedCollection ? originalCollection : c).filter(Boolean) as any[]);
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  }, [draggedCollection, user, collections, dragOverData, setCollections, setError]);

  const handleBookmarkDragStart = useCallback((e: React.DragEvent, bookmarkId: string) => {
    setDraggedBookmark(bookmarkId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleBookmarkDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  }, []);

  const handleBookmarkDrop = useCallback(async (e: React.DragEvent, targetCollectionId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedBookmark) return;

    const originalBookmark = bookmarks.find(b => b.id === draggedBookmark);
    setBookmarks(prev => prev.map(b => b.id === draggedBookmark ? { ...b, collection_id: targetCollectionId || undefined } : b));

    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({ collection_id: targetCollectionId })
        .eq('id', draggedBookmark);

      if (error) throw error;
    } catch (error: any) {
      setError(`Failed to move bookmark: ${error.message}`);
      setBookmarks(prev => prev.map(b => b.id === draggedBookmark ? originalBookmark : b).filter(Boolean) as any[]);
    } finally {
      setDraggedBookmark(null);
      setDragOverTarget(null);
    }
  }, [draggedBookmark, bookmarks, setBookmarks, setError]);

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
}