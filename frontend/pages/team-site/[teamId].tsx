"use client"

import React, { useState, useRef, useMemo } from "react"
import Mark from 'mark.js'

// Extend window object for highlight clicking
declare global {
  interface Window {
    selectHighlightForAnnotation: (highlightId: string, selectedText: string) => void
  }
}
import { useRouter } from "next/router"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useTeamSite } from "../../hooks/useTeamSite"
import { useDragDrop } from "../../hooks/useDragDrop"
import { useBookmarkActions } from "../../hooks/useBookmarkActions"
import { useModalState } from "../../hooks/useModalState"
import { useUIHandlers } from "../../hooks/useUIHandlers"
import { useFilterState } from "../../hooks/useFilterState"
import { Collection } from "../../types/api"
import { filterBookmarks, filterCollections, getAllTags, getAvailableTags, getAllCreators, getAllCollectionCreators, getParentCollections, BookmarkFilterState, CollectionFilterState } from "../../utils/filterUtils"
import { generateDirectoryStructure, getCollectionDirectoryMarkdown, copyDirectoryStructure } from "../../utils/directoryUtils"
import { buildCollectionTree, flattenCollections, updateCollectionBookmarkCounts } from "../../utils/collectionTreeUtils"
import { getApiBaseUrl } from '../../modules/apiClient'
import { generateFallbackThumbnail } from '../../lib/utils'
import ProfileIcon from "../../components/ProfileIcon"
import { FaviconImage } from "../../components/team-site/shared/FaviconImage"
import CreateCollectionModal from "../../components/team-site/collections/CreateCollectionModal"
import { CollectionTreeRenderer } from "../../components/team-site/collections/CollectionTreeRenderer"
import { BookmarkDetailModal } from "../../components/team-site/bookmarks/BookmarkDetailModal"
import AddBookmarkModal from "../../components/team-site/bookmarks/AddBookmarkModal"
import { TeamSiteHeader } from "../../components/team-site/shared/TeamSiteHeader"
import { CollectionTree } from "../../components/team-site/shared/CollectionTree"
import { BookmarkGrid } from "../../components/team-site/bookmarks/BookmarkGrid"
import { DirectoryModal } from "../../components/team-site/shared/DirectoryModal";
import BookmarkFilters from "../../components/team-site/bookmarks/BookmarkFilters"
import { TeamSiteMainContent } from "../../components/team-site/shared/TeamSiteMainContent"
import { Search, Plus, Share2, Settings, Users, ChevronDown, ChevronRight, ChevronUp, Folder, FolderOpen, Grid3X3, List, ExternalLink, Heart, GripVertical, Copy, X, MessageCircle } from "lucide-react"

// API configuration (resolved at runtime)
const API_BASE_URL = (() => {
  try {
    return getApiBaseUrl();
  } catch (e) {
    // If getApiBaseUrl throws in production (missing env), rethrow
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

  // Normalize teamId to string for consistent usage and guard against literal 'undefined'/'null'
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
    selectedBookmark
  })

  // Get all unique tags from bookmarks
  const allTags = useMemo(() => getAllTags(bookmarks), [bookmarks])

  // Get available tags with usage counts for tag suggestions
  const availableTags = useMemo(() => getAvailableTags(bookmarks), [bookmarks])

  // Get all unique creators
  const allCreators = useMemo(() => getAllCreators(bookmarks), [bookmarks])

  // Apply advanced filters to bookmarks
  const advancedFilteredBookmarks = useMemo(() => filterBookmarks(bookmarks, bookmarkFilters), [bookmarks, bookmarkFilters]);

  const nestedCollections = useMemo(() => {
    const tree = buildCollectionTree(collections);
    return updateCollectionBookmarkCounts(tree, bookmarks);
  }, [collections, bookmarks]);

  const allFlatCollections = useMemo(() => flattenCollections(nestedCollections), [nestedCollections]);

  // Get all unique collection creators
  const allCollectionCreators = useMemo(() => getAllCollectionCreators(allFlatCollections), [allFlatCollections])

  // Get parent collections for filter
  const parentCollections = useMemo(() => getParentCollections(allFlatCollections), [allFlatCollections])

  // Apply filters to collections
  const filteredCollections = useMemo(() => filterCollections(allFlatCollections, collectionFilters, bookmarks), [allFlatCollections, collectionFilters, bookmarks])

  // Generate directory structure in markdown format
  const generateDirectoryStructure = (collection: ExtendedCollection): string => {
    return getCollectionDirectoryMarkdown(collection, bookmarks)
  }

  // Copy directory structure to clipboard
  const copyDirectoryStructureToClipboard = async (collection: ExtendedCollection) => {
    await copyDirectoryStructure(collection, bookmarks)
  }

  // Get orphaned bookmarks (bookmarks without a collection or with invalid collection_id)
  const orphanedBookmarks = bookmarks.filter(bookmark => 
    !bookmark.collection_id || !collections.some(col => col.id === bookmark.collection_id)
  );

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-grey-accent-600 mb-4"></div>
          <p className="text-grey-accent-600">Loading team workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <Button onClick={() => router.push('/admin')} className="bg-grey-accent-600 hover:bg-grey-accent-700 text-white">
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100">
      <TeamSiteHeader
        presence={presence}
        bookmarksCount={bookmarks.length}
        collectionsCount={collections.length}
        activeTab={activeTab}
        searchQuery={searchQuery}
        viewMode={viewMode}
        onActiveTabChange={setActiveTab}
        onSearchQueryChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onCreateAction={handleCreateAction}
      />

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
        selectedDirectoryCollection={selectedDirectoryCollection}
        showDirectoryModal={showDirectoryModal}
        onActiveTabChange={setActiveTab}
        onSearchQueryChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onToggleCollection={toggleCollection}
        onSelectCollection={setSelectedCollectionId}
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
      />

      {/* Bookmark Detail View Modal */}
      {selectedBookmark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden flex">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-grey-accent-200 bg-grey-accent-50">
                <div className="flex items-center gap-3">
                  <FaviconImage 
                    url={selectedBookmark.url} 
                    faviconUrl={selectedBookmark.favicon_url} 
                    size="w-6 h-6" 
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-grey-accent-900 truncate max-w-lg">
                      {selectedBookmark.title || selectedBookmark.url}
                    </h2>
                    <p className="text-sm text-grey-accent-600 truncate max-w-lg">
                      {selectedBookmark.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-grey-accent-200 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setBookmarkViewMode('proxy')
                        if (selectedBookmark) {
                          fetchProxyContent(selectedBookmark.url)
                        }
                      }}
                      className={`px-2 py-1 text-sm rounded-md transition-all ${
                        bookmarkViewMode === 'proxy' 
                          ? 'bg-white text-grey-accent-900 shadow-sm' 
                          : 'text-grey-accent-600 hover:text-grey-accent-900'
                      }`}
                    >
                      Proxy
                    </button>
                    <button
                      onClick={() => {
                        setBookmarkViewMode('reader')
                        if (!extractedContent && selectedBookmark) {
                          extractContent(selectedBookmark.url)
                        }
                      }}
                      className={`px-2 py-1 text-sm rounded-md transition-all ${
                        bookmarkViewMode === 'reader' 
                          ? 'bg-white text-grey-accent-900 shadow-sm' 
                          : 'text-grey-accent-600 hover:text-grey-accent-900'
                      }`}
                    >
                      Reader
                    </button>
                    <button
                      onClick={() => setBookmarkViewMode('details')}
                      className={`px-2 py-1 text-sm rounded-md transition-all ${
                        bookmarkViewMode === 'details' 
                          ? 'bg-white text-grey-accent-900 shadow-sm' 
                          : 'text-grey-accent-600 hover:text-grey-accent-900'
                      }`}
                    >
                      Details
                    </button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedBookmark.url, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBookmark(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content View */}
              <div className="flex-1 overflow-hidden">
                {bookmarkViewMode === 'proxy' ? (
                  <div className="h-full w-full relative">
                    {isLoadingProxy ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grey-accent-600 mx-auto mb-4"></div>
                          <p className="text-grey-accent-600">Loading proxy content...</p>
                        </div>
                      </div>
                    ) : proxyContent ? (
                      <div className="h-full w-full overflow-auto bg-white">
                        <iframe
                          srcDoc={proxyContent || undefined}
                          className="w-full h-full border-0"
                          sandbox="allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                          onError={() => {
                            console.error('Failed to render proxy content')
                          }}
                          onLoad={() => {
                            // Proxy iframe loaded successfully
                            console.log('Proxy content loaded')
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full mt-8">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🌐</div>
                          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
                            Proxy Service Unavailable
                          </h3>
                          <p className="text-grey-accent-600 mb-6">
                            Unable to load content through proxy server.
                          </p>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => fetchProxyContent(selectedBookmark.url)}
                              variant="outline"
                            >
                              🔄 Try Again
                            </Button>
                            <Button
                              onClick={() => setBookmarkViewMode('reader')}
                              variant="outline"
                            >
                              📖 Try Reader Mode
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : bookmarkViewMode === 'reader' ? (
                  <div className="h-full overflow-auto bg-grey-accent-25 p-6">
                    {isLoadingContent ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grey-accent-600 mx-auto mb-4"></div>
                          <p className="text-grey-accent-600">Extracting content...</p>
                        </div>
                      </div>
                    ) : extractedContent ? (
                      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-sm">
                        <div className="prose prose-lg max-w-none">
                          <h1 className="text-3xl font-bold text-grey-accent-900 mb-4">
                            {extractedContent.title}
                          </h1>
                          
                          {extractedContent.description && (
                            <p className="text-xl text-grey-accent-600 mb-8 italic">
                              {extractedContent.description}
                            </p>
                          )}
                          
                          <div className="border-b border-grey-accent-200 pb-4 mb-8">
                            <div className="flex items-center gap-2 text-sm text-grey-accent-500">
                              <span>📅 Extracted {new Date(extractedContent.extractedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <a 
                                href={extractedContent.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View Original →
                              </a>
                            </div>
                          </div>
                          
                          <div 
                            className="reader-content user-select-text relative"
                            dangerouslySetInnerHTML={{ __html: extractedContent.content }}
                            style={{
                              lineHeight: '1.8',
                              fontSize: '16px',
                              color: '#374151',
                              userSelect: 'text',
                              WebkitUserSelect: 'text',
                              MozUserSelect: 'text',
                              msUserSelect: 'text'
                            }}
                            onMouseUp={(e) => {
                              const selection = window.getSelection()
                              if (selection && selection.toString().trim() && selectedBookmark) {
                                const selectedText = selection.toString().trim()
                                
                                if (selectedText.length > 3) { // Minimum selection length
                                  const range = selection.getRangeAt(0)
                                  const rect = range.getBoundingClientRect()
                                  
                                  // Set tooltip position and show it
                                  setTooltipPosition({
                                    x: rect.right + window.scrollX,
                                    y: rect.top + window.scrollY - 10
                                  })
                                  
                                  setPendingSelection({
                                    text: selectedText,
                                    startOffset: range.startOffset,
                                    endOffset: range.endOffset
                                  })
                                  
                                  setShowHighlightTooltip(true)
                                }
                              } else {
                                setShowHighlightTooltip(false)
                                setPendingSelection(null)
                              }
                            }}
                            onClick={() => {
                              setShowHighlightTooltip(false)
                              setPendingSelection(null)
                            }}
                          />
                          
                          {/* Highlights Section in Reader Mode */}
                          {bookmarkHighlights.length > 0 && (
                            <div className="mt-8 border-t border-grey-accent-200 pt-6">
                              <h4 className="font-semibold text-grey-accent-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                Team Highlights ({bookmarkHighlights.length})
                              </h4>
                              <div className="space-y-3">
                                {bookmarkHighlights.map((highlight) => (
                                  <div key={highlight.highlight_id} className="group">
                                    <div 
                                      className="p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow"
                                      style={{ 
                                        backgroundColor: `${highlight.color}20`,
                                        borderLeftColor: highlight.color 
                                      }}
                                    >
                                      <p className="text-grey-accent-900 font-medium mb-2 leading-relaxed">
                                        "{highlight.selected_text}"
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-grey-accent-600">
                                        <div className="flex items-center gap-1">
                                          <ProfileIcon
                                            user={{
                                              avatar_url: highlight.creator_avatar,
                                              full_name: highlight.creator_name,
                                              email: highlight.creator_id
                                            }}
                                            size="xs"
                                          />
                                          <span>{highlight.creator_name}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                                        <button 
                                          className="opacity-0 group-hover:opacity-100 text-grey-accent-500 hover:text-blue-600 transition-all ml-auto"
                                          onClick={() => {
                                            // Add annotation to this highlight
                                            const annotationText = `Regarding: "${highlight.selected_text.substring(0, 50)}${highlight.selected_text.length > 50 ? '...' : ''}"`
                                            setNewAnnotation(annotationText)
                                          }}
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📄</div>
                          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
                            Reader Mode Unavailable
                          </h3>
                          <p className="text-grey-accent-600 mb-6">
                            Unable to extract readable content from this page.
                          </p>
                          <Button
                            onClick={() => extractContent(selectedBookmark.url)}
                            variant="outline"
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full overflow-auto p-6 bg-grey-accent-25">
                    <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-sm">
                      <div 
                        className="prose prose-grey max-w-none user-select-text relative"
                        style={{ 
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text'
                        }}
                        onMouseUp={(e) => {
                          const selection = window.getSelection()
                          if (selection && selection.toString().trim() && selectedBookmark) {
                            const selectedText = selection.toString().trim()
                            
                            if (selectedText.length > 3) { // Minimum selection length
                              const range = selection.getRangeAt(0)
                              const rect = range.getBoundingClientRect()
                              
                              // Set tooltip position and show it
                              setTooltipPosition({
                                x: rect.right + window.scrollX,
                                y: rect.top + window.scrollY - 10
                              })
                              
                              setPendingSelection({
                                text: selectedText,
                                startOffset: range.startOffset,
                                endOffset: range.endOffset
                              })
                              
                              setShowHighlightTooltip(true)
                            }
                          } else {
                            setShowHighlightTooltip(false)
                            setPendingSelection(null)
                          }
                        }}
                        onClick={() => {
                          setShowHighlightTooltip(false)
                          setPendingSelection(null)
                        }}
                      >
                        <h1 className="text-2xl font-bold text-grey-accent-900 mb-4">
                          {selectedBookmark.title || 'Bookmark Details'}
                        </h1>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <p className="text-blue-800 text-sm mb-2">📎 Link:</p>
                          <a 
                            href={selectedBookmark.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {selectedBookmark.url}
                          </a>
                        </div>

                        {selectedBookmark.description && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-grey-accent-800 mb-2">Description</h3>
                            <p className="text-grey-accent-700 leading-relaxed">
                              {selectedBookmark.description}
                            </p>
                          </div>
                        )}

                        {selectedBookmark.tags && selectedBookmark.tags.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-grey-accent-800 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedBookmark.tags.map((tag: string) => (
                                <span 
                                  key={tag} 
                                  className="px-3 py-1 bg-grey-accent-100 text-grey-accent-700 text-sm rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="border-t border-grey-accent-200 pt-4 mt-6">
                          <div className="flex items-center gap-3 text-sm text-grey-accent-600">
                            <div className="flex items-center gap-2">
                              <ProfileIcon
                                user={{
                                  avatar_url: (selectedBookmark as any).profiles?.avatar_url,
                                  full_name: (selectedBookmark as any).profiles?.full_name,
                                  email: (selectedBookmark as any).profiles?.user_id
                                }}
                                size="md"
                              />
                              <span>Added by {(selectedBookmark as any).profiles?.full_name || 'Unknown'}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(selectedBookmark.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Highlights Section */}
                        {bookmarkHighlights.length > 0 && (
                          <div className="mt-8 border-t border-grey-accent-200 pt-6">
                            <h4 className="font-semibold text-grey-accent-800 mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                              Team Highlights ({bookmarkHighlights.length})
                            </h4>
                            <div className="space-y-3">
                              {bookmarkHighlights.map((highlight) => (
                                <div key={highlight.highlight_id} className="group">
                                  <div 
                                    className="p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow"
                                    style={{ 
                                      backgroundColor: `${highlight.color}20`,
                                      borderLeftColor: highlight.color 
                                    }}
                                  >
                                    <p className="text-grey-accent-900 font-medium mb-2 leading-relaxed">
                                      "{highlight.selected_text}"
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-grey-accent-600">
                                      <div className="flex items-center gap-1">
                                        <ProfileIcon
                                          user={{
                                            avatar_url: highlight.creator_avatar,
                                            full_name: highlight.creator_name,
                                            email: highlight.creator_id
                                          }}
                                          size="xs"
                                        />
                                        <span>{highlight.creator_name}</span>
                                      </div>
                                      <span>•</span>
                                      <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                                      <button 
                                        className="opacity-0 group-hover:opacity-100 text-grey-accent-500 hover:text-blue-600 transition-all ml-auto"
                                        onClick={() => {
                                          // Add annotation to this highlight
                                          const annotationText = `Regarding: "${highlight.selected_text.substring(0, 50)}${highlight.selected_text.length > 50 ? '...' : ''}"`
                                          setNewAnnotation(annotationText)
                                        }}
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Highlight Tooltip */}
              {showHighlightTooltip && pendingSelection && (
                <div 
                  className="absolute z-10 bg-white border border-grey-accent-200 rounded-lg shadow-lg p-3"
                  style={{
                    left: tooltipPosition.x,
                    top: tooltipPosition.y,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-grey-accent-800">Highlight this text?</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {['#ffeb3b', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            if (selectedBookmark && pendingSelection) {
                              setHighlightColor(color)
                              createHighlight(
                                selectedBookmark.id, 
                                pendingSelection.text, 
                                pendingSelection.startOffset, 
                                pendingSelection.endOffset
                              )
                              setShowHighlightTooltip(false)
                              setPendingSelection(null)
                              window.getSelection()?.removeAllRanges()
                            }
                          }}
                          className={`w-6 h-6 rounded-full border-2 ${
                            highlightColor === color ? 'border-grey-accent-600' : 'border-grey-accent-300'
                          } hover:scale-110 transition-transform`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowHighlightTooltip(false)
                        setPendingSelection(null)
                        window.getSelection()?.removeAllRanges()
                      }}
                      className="text-grey-accent-500 hover:text-grey-accent-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Annotations Sidebar */}
            <div className="w-96 border-l border-grey-accent-200 bg-grey-accent-25 flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-grey-accent-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-grey-accent-900">Team Discussion</h3>
                  <span className="text-xs text-grey-accent-600 bg-grey-accent-100 px-2 py-1 rounded-full">
                    {bookmarkAnnotations.length} comment{bookmarkAnnotations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Highlight Color Picker */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-grey-accent-600">Highlight Color:</span>
                  <div className="flex gap-1">
                    {['#ffeb3b', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setHighlightColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          highlightColor === color ? 'border-grey-accent-600' : 'border-grey-accent-300'
                        } hover:scale-110 transition-transform`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* New Annotation Input */}
                <div className="space-y-2">
                  <textarea
                    value={newAnnotation}
                    onChange={(e) => setNewAnnotation(e.target.value)}
                    placeholder="Add a comment or question about this bookmark..."
                    className="w-full px-3 py-2 border border-grey-accent-300 rounded-md resize-none text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={() => {
                      if (newAnnotation.trim() && selectedBookmark) {
                        createAnnotation(selectedBookmark.id, newAnnotation)
                      }
                    }}
                    disabled={!newAnnotation.trim()}
                    size="sm"
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Annotations List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {bookmarkAnnotations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-grey-accent-300 mx-auto mb-3" />
                    <p className="text-grey-accent-600 text-sm">No comments yet</p>
                    <p className="text-grey-accent-500 text-xs">
                      Be the first to start a discussion!
                    </p>
                  </div>
                ) : (
                  bookmarkAnnotations.map((annotation) => (
                    <div key={annotation.annotation_id} className="bg-white rounded-lg p-3 shadow-sm border border-grey-accent-200">
                      <div className="flex items-start gap-3">
                        <ProfileIcon
                          user={{
                            avatar_url: annotation.creator_avatar,
                            full_name: annotation.creator_name,
                            email: annotation.creator_id
                          }}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-grey-accent-900 text-sm">
                              {annotation.creator_name || 'Unknown'}
                            </span>
                            {user?.id === annotation.creator_id && (
                              <button
                                onClick={() => deleteAnnotation(annotation.annotation_id)}
                                className="text-grey-accent-400 hover:text-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-grey-accent-800 text-sm leading-relaxed mb-2">
                            {annotation.content}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-grey-accent-500">
                            <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
                            <button 
                              onClick={() => toggleAnnotationLike(annotation.annotation_id)}
                              className={`flex items-center gap-1 transition-colors ${
                                annotation.user_liked 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${annotation.user_liked ? 'fill-current' : ''}`} />
                              {annotation.like_count || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Structure Modal */}
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

      {/* Create Collection Modal - You'll need to implement these modals */}
      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onCreate={createCollection}
          collections={collections}
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

      {/* Bookmark Detail Modal */}
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
    </div>
  )
}

