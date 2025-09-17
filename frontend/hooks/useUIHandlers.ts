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
  updateBookmarkTags: (bookmarkId: string, newTags: string[]) => Promise<void>;
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
  updateBookmarkTags,
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

  const updateBookmarkTagsWrapper = useCallback(async (bookmarkId: string, newTags: string[]) => {
    await updateBookmarkTags(bookmarkId, newTags);
  }, [updateBookmarkTags])

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
    updateBookmarkTags: updateBookmarkTagsWrapper,
    updateSelectedBookmarkTags,
    handleCreateAction
  };
};