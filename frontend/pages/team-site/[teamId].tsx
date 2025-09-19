"use client"

import React, { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/router"
import { useTeamSite } from "../../hooks/useTeamSite"
import { useDragDrop } from "../../hooks/useDragDrop"
import { useBookmarkActions } from "../../hooks/useBookmarkActions"
import { useModalState } from "../../hooks/useModalState"
import { useUIHandlers } from "../../hooks/useUIHandlers"
import { useFilterState } from "../../hooks/useFilterState"
import { 
  filterBookmarks, 
  filterCollections, 
  getAllTags, 
  getAvailableTags, 
  getAllCreators, 
  getAllCollectionCreators, 
  getParentCollections 
} from "../../utils/filterUtils"
import { copyDirectoryStructure, getCollectionDirectoryMarkdown } from "../../utils/directoryUtils"
import { Button } from "../../components/ui/button"
import { buildCollectionTree, flattenCollections, updateCollectionBookmarkCounts } from "../../utils/collectionTreeUtils"
import { getApiBaseUrl } from '../../modules/apiClient'
import CreateCollectionModal from "../../components/team-site/collections/CreateCollectionModal"
import { BookmarkDetailModal } from "../../components/team-site/bookmarks/BookmarkDetailModal"
import AddBookmarkModal from "../../components/team-site/bookmarks/AddBookmarkModal"
import { TeamSiteHeader } from "../../components/team-site/shared/TeamSiteHeader"
import { TeamSiteMainContent } from "../../components/team-site/shared/TeamSiteMainContent"
import { DirectoryModal } from "../../components/team-site/shared/DirectoryModal"
import { GlobalLoadingState } from "../../components/shared/GlobalLoadingState"

declare global {
  interface Window {
    selectHighlightForAnnotation: (highlightId: string, selectedText: string) => void
  }
}

const API_BASE_URL = (() => {
  try {
    return getApiBaseUrl();
  } catch (e) {
    if (process.env.NODE_ENV === 'production') throw e;
    return 'http://localhost:8000';
  }
})();

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_at: string
  created_by: string
  profiles?: {
    user_id: string
    full_name?: string
    avatar_url?: string
  }
  bookmarkCount?: number
  children?: ExtendedCollection[]
  parentId?: string
}

export default function TeamSitePage() {
  const router = useRouter()
  const { teamId } = router.query

  const normalizedTeamId = (() => {
    let id: string | undefined;
    if (typeof teamId === 'string') id = teamId;
    else if (Array.isArray(teamId) && teamId.length > 0) id = teamId[0];
    else id = undefined;

    if (id === 'undefined' || id === 'null' || id === '') return undefined;
    return id;
  })();
  
  const {
    user,
    profile,
    loading,
    error,
    collections,
    bookmarks,
    teamEvents,
    presence,
    hasMoreEvents,
    loadMoreEvents,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError,
    setCollections,
    setBookmarks
  } = useTeamSite(normalizedTeamId)

  const {
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
  } = useDragDrop({
    user,
    profile,
    collections,
    bookmarks,
    setCollections,
    setBookmarks,
    setError
  })

  const {
    fetchBookmarkData,
    createHighlight,
    createAnnotation,
    toggleAnnotationLike,
    deleteAnnotation,
    extractContent,
    fetchProxyContent,
    updateBookmarkTags,
    bookmarkAnnotations,
    bookmarkHighlights,
    extractedContent,
    isLoadingContent,
    proxyContent,
    isLoadingProxy
  } = useBookmarkActions({
    user,
    teamId: normalizedTeamId || '',
    setError
  })

  const {
    showDirectoryModal,
    selectedDirectoryCollection,
    showCreateCollection,
    showAddBookmark,
    selectedBookmark,
    bookmarkViewMode,
    showHighlightTooltip,
    tooltipPosition,
    pendingSelection,
    newAnnotation,
    highlightColor,
    tagInput,
    showTagSuggestions,
    commentInputs,
    setShowDirectoryModal,
    setSelectedDirectoryCollection,
    setShowCreateCollection,
    setShowAddBookmark,
    setSelectedBookmark,
    setBookmarkViewMode,
    setShowHighlightTooltip,
    setTooltipPosition,
    setPendingSelection,
    setNewAnnotation,
    setHighlightColor,
    setTagInput,
    setShowTagSuggestions,
    setCommentInputs,
    resetBookmarkModal,
    resetHighlightState
  } = useModalState()

  const {
    viewMode,
    searchQuery,
    activeTab,
    bookmarkFilters,
    showFilters,
    collectionFilters,
    showCollectionFilters,
    setViewMode,
    setSearchQuery,
    setActiveTab,
    setBookmarkFilters,
    setShowFilters,
    setCollectionFilters,
    setShowCollectionFilters
  } = useFilterState()

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [editingTags, setEditingTags] = useState<string | null>(null)

  const {
    toggleCollection,
    handleCollectionSelect,
    handleBookmarkClick,
    updateSelectedBookmarkTags,
    handleCreateAction
  } = useUIHandlers({
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
    selectedBookmark,
    setBookmarkFilters,
    bookmarkFilters
  })

  const allTags = useMemo(() => getAllTags(bookmarks), [bookmarks])
  const availableTags = useMemo(() => getAvailableTags(bookmarks), [bookmarks])
  const allCreators = useMemo(() => getAllCreators(bookmarks), [bookmarks])
  const advancedFilteredBookmarks = useMemo(() => filterBookmarks(bookmarks, bookmarkFilters), [bookmarks, bookmarkFilters]);
  const nestedCollections = useMemo(() => {
    const tree = buildCollectionTree(collections);
    return updateCollectionBookmarkCounts(tree, bookmarks);
  }, [collections, bookmarks]);

  const allFlatCollections = useMemo(() => flattenCollections(nestedCollections), [nestedCollections]);
  const allCollectionCreators = useMemo(() => getAllCollectionCreators(allFlatCollections), [allFlatCollections])
  const parentCollections = useMemo(() => getParentCollections(allFlatCollections), [allFlatCollections])
  const filteredCollections = useMemo(() => filterCollections(allFlatCollections, collectionFilters, bookmarks), [allFlatCollections, collectionFilters, bookmarks])

  const generateDirectoryStructure = useCallback((collection: ExtendedCollection): string => {
    return getCollectionDirectoryMarkdown(collection, bookmarks)
  }, [bookmarks])

  const copyDirectoryStructureToClipboard = useCallback(async (collection: ExtendedCollection) => {
    await copyDirectoryStructure(collection, bookmarks)
  }, [bookmarks])

  const orphanedBookmarks = useMemo(() => bookmarks.filter(bookmark => 
    !bookmark.collection_id || !collections.some(col => col.id === bookmark.collection_id)
  ), [bookmarks, collections]);

  const filteredBookmarks = useMemo(() => bookmarks.filter(
    (bookmark) =>
      bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [bookmarks, searchQuery]);

  if (loading) {
    return (
      <GlobalLoadingState
        message="Loading team workspace..."
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
        <div className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="card-subtle p-8">
              <div className="text-center space-y-6">
                <div className="p-6 rounded-xl border-2 bg-red-50 border-red-200" style={{ boxShadow: '0 6px 18px rgba(16,24,40,0.04)' }}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-200">
                        <span className="text-sm text-red-700">⚠️</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-grey-accent-100 hover:bg-grey-accent-200 text-grey-accent-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Refresh Page
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gradient-to-r from-grey-accent-700 to-grey-accent-800 hover:from-grey-accent-800 hover:to-grey-accent-900 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] border border-grey-accent-600"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-white text-foreground font-sans">
      <TeamSiteHeader
        presence={presence}
        bookmarksCount={bookmarks.length}
        collectionsCount={collections.length}
        onSettingsAction={handleCreateAction}
      />

      <div className="container mx-auto px-4 pt-8 pb-12">
        <div className="card-subtle p-6">
            <TeamSiteMainContent
              activeTab={activeTab}
              viewMode={viewMode}
              searchQuery={searchQuery}
              collections={collections}
              bookmarks={bookmarks}
              nestedCollections={nestedCollections}
              expandedCollections={expandedCollections}
              selectedCollectionId={selectedCollectionId}
              advancedFilteredBookmarks={advancedFilteredBookmarks}
              bookmarkFilters={bookmarkFilters}
              showFilters={showFilters}
              filteredCollections={filteredCollections}
              collectionFilters={collectionFilters}
              showCollectionFilters={showCollectionFilters}
              allTags={allTags}
              allCreators={allCreators}
              allCollectionCreators={allCollectionCreators}
              parentCollections={parentCollections}
              allFlatCollections={allFlatCollections}
              teamEvents={teamEvents}
              onLoadMoreEvents={loadMoreEvents}
              selectedDirectoryCollection={selectedDirectoryCollection}
              showDirectoryModal={showDirectoryModal}
              onActiveTabChange={setActiveTab}
              onSearchQueryChange={setSearchQuery}
              onViewModeChange={setViewMode}
              onToggleCollection={toggleCollection}
              onSelectCollection={handleCollectionSelect}
              onBookmarkClick={handleBookmarkClick}
              onSetBookmarkFilters={setBookmarkFilters}
              onSetShowFilters={setShowFilters}
              onSetCollectionFilters={setCollectionFilters}
              onSetShowCollectionFilters={setShowCollectionFilters}
              onSetSelectedDirectoryCollection={setSelectedDirectoryCollection}
              onSetShowDirectoryModal={setShowDirectoryModal}
              onCopyDirectoryStructure={copyDirectoryStructure}
              dragOverData={dragOverData}
              draggedCollection={draggedCollection}
              draggedBookmark={draggedBookmark}
              dragOverTarget={dragOverTarget}
              onHandleDragStart={handleDragStart}
              onHandleDragEnd={handleDragEnd}
              onHandleDragOver={handleDragOver}
              onHandleDragLeave={handleDragLeave}
              onHandleDrop={handleDrop}
              onHandleBookmarkDragStart={handleBookmarkDragStart}
              onHandleBookmarkDragOver={handleBookmarkDragOver}
              onHandleBookmarkDrop={handleBookmarkDrop}
              onCreateCollection={() => setShowCreateCollection(true)}
              onCreateBookmark={() => setShowAddBookmark(true)}
              orphanedBookmarks={orphanedBookmarks}
            />
          </div>
      </div>

      <DirectoryModal
        isOpen={showDirectoryModal}
        collection={selectedDirectoryCollection}
        bookmarks={bookmarks}
        onClose={() => {
          setShowDirectoryModal(false);
          setSelectedDirectoryCollection(null);
        }}
        onCopy={copyDirectoryStructure}
      />

      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onCreate={createCollection}
          collections={collections}
        />
      )}

      {showAddBookmark && (
        <AddBookmarkModal
          collections={collections}
          onClose={() => setShowAddBookmark(false)}
          onCreate={createBookmark}
        />
      )}

      {selectedBookmark && (
        <BookmarkDetailModal
          bookmark={selectedBookmark}
          viewMode={bookmarkViewMode}
          annotations={bookmarkAnnotations}
          highlights={bookmarkHighlights}
          newAnnotation={newAnnotation}
          highlightColor={highlightColor}
          showHighlightTooltip={showHighlightTooltip}
          tooltipPosition={tooltipPosition}
          pendingSelection={pendingSelection}
          extractedContent={extractedContent}
          isLoadingContent={isLoadingContent}
          proxyContent={proxyContent}
          isLoadingProxy={isLoadingProxy}
          user={user}
          teamId={normalizedTeamId || ''}
          bookmarkTags={selectedBookmark.tags || []}
          tagInput={tagInput}
          showTagSuggestions={showTagSuggestions}
          availableTags={availableTags}
          commentInputs={commentInputs}
          onClose={() => setSelectedBookmark(null)}
          onViewModeChange={setBookmarkViewMode}
          onCreateHighlight={createHighlight}
          onCreateAnnotation={createAnnotation}
          onToggleAnnotationLike={toggleAnnotationLike}
          onDeleteAnnotation={deleteAnnotation}
          onExtractContent={extractContent}
          onFetchProxyContent={fetchProxyContent}
          onUpdateTags={updateSelectedBookmarkTags}
          onSetNewAnnotation={setNewAnnotation}
          onSetHighlightColor={setHighlightColor}
          onSetShowHighlightTooltip={setShowHighlightTooltip}
          onSetTooltipPosition={setTooltipPosition}
          onSetPendingSelection={setPendingSelection}
          onSetTagInput={setTagInput}
          onSetShowTagSuggestions={setShowTagSuggestions}
          onSetCommentInputs={() => {}} // TODO: Implement
        />
      )}
    </main>
  )
}