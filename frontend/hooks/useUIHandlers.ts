import { useCallback } from 'react';

interface UseUIHandlersProps {
  setSelectedCollectionId: (id: string | null) => void;
  setExpandedCollections: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedBookmark: (bookmark: any) => void;
  setBookmarkViewMode: (mode: 'proxy' | 'reader' | 'details') => void;
  setShowCreateCollection: (show: boolean) => void;
  setShowAddBookmark: (show: boolean) => void;
  fetchBookmarkData: (bookmarkId: string) => Promise<void>;
  activeTab: string;
  supabase: any;
  setError: (error: string | null) => void;
  selectedBookmark: any;
}

export const useUIHandlers = ({
  setSelectedCollectionId,
  setExpandedCollections,
  setSelectedBookmark,
  setBookmarkViewMode,
  setShowCreateCollection,
  setShowAddBookmark,
  fetchBookmarkData,
  activeTab,
  supabase,
  setError,
  selectedBookmark
}: UseUIHandlersProps) => {

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }, [setExpandedCollections])

  const handleBookmarkClick = useCallback(async (bookmark: any) => {
    setSelectedBookmark(bookmark)
    setBookmarkViewMode('proxy') // Default to proxy view since it works well
    await fetchBookmarkData(bookmark.id)
  }, [setSelectedBookmark, setBookmarkViewMode, fetchBookmarkData])

  const updateBookmarkTags = useCallback(async (bookmarkId: string, newTags: string[]) => {
    try {
      // Update bookmark tags via API
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ tags: newTags })
        .eq('id', bookmarkId);

      if (error) throw error;

      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error('Failed to update tags:', error);
      setError('Failed to update bookmark tags');
    }
  }, [supabase, setError])

  // Wrapper function for BookmarkDetailModal that uses selectedBookmark
  const updateSelectedBookmarkTags = useCallback(async (tags: string[], bookmarkId?: string) => {
    const targetBookmarkId = bookmarkId || selectedBookmark?.id;
    if (targetBookmarkId) {
      await updateBookmarkTags(targetBookmarkId, tags);
    }
  }, [updateBookmarkTags, selectedBookmark])

  const handleCreateAction = useCallback(() => {
    if (activeTab === "collections") {
      setShowCreateCollection(true);
    } else {
      setShowAddBookmark(true);
    }
  }, [activeTab, setShowCreateCollection, setShowAddBookmark]);

  return {
    toggleCollection,
    handleBookmarkClick,
    updateBookmarkTags,
    updateSelectedBookmarkTags,
    handleCreateAction
  };
};