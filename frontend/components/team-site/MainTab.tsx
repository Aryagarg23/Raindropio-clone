import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Folder, Users, ExternalLink, Plus, Heart, GripVertical } from 'lucide-react'
import { FaviconImage } from './FaviconImage'
import { generateFallbackThumbnail } from '../../lib/utils'

interface MainTabProps {
  selectedCollectionId: string | null
  setSelectedCollectionId: (id: string | null) => void
  nestedCollections: any[]
  displayedBookmarks: any[]
  bookmarks: any[]
  viewMode: 'grid' | 'list'
  editingTags: string | null
  tagInput: string
  setTagInput: (value: string) => void
  setEditingTags: (id: string | null) => void
  renderCollectionTree: (collections: any[], level?: number) => React.ReactNode
  updateBookmarkTags: (bookmarkId: string, tags: string[]) => void
  draggedCollection: string | null
  draggedBookmark: string | null
  dragOverTarget: string | null
  handleRootDrop: (e: React.DragEvent) => void
  handleDragStart: (e: React.DragEvent, itemId: string, itemType?: 'collection' | 'bookmark') => void
  handleDragEnd: () => void
  handleBookmarkDragOver: (e: React.DragEvent, targetId: string) => void
  handleBookmarkDrop: (e: React.DragEvent, targetCollectionId: string | null) => void
}

export const MainTab: React.FC<MainTabProps> = ({
  selectedCollectionId,
  setSelectedCollectionId,
  nestedCollections,
  displayedBookmarks,
  bookmarks,
  viewMode,
  editingTags,
  tagInput,
  setTagInput,
  setEditingTags,
  renderCollectionTree,
  updateBookmarkTags,
  draggedCollection,
  draggedBookmark,
  dragOverTarget,
  handleRootDrop,
  handleDragStart,
  handleDragEnd,
  handleBookmarkDragOver,
  handleBookmarkDrop
}) => {
  return (
    <div className="flex gap-6">
      {/* Sidebar with collections */}
      <div className="w-64 flex-shrink-0">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Collections</CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1">
            <div
              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedCollectionId === null ? "bg-muted" : ""
              }`}
              onClick={() => setSelectedCollectionId(null)}
            >
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">All Bookmarks</span>
              <span className="text-xs text-muted-foreground ml-auto">{bookmarks.length}</span>
            </div>
            
            {renderCollectionTree(nestedCollections)}
            
            {/* Root-level drop zone for collections */}
            <div
              className={`mt-2 p-3 rounded-md border-2 border-dashed transition-all ${
                draggedCollection ? "border-grey-accent-400 bg-grey-accent-50" : "border-grey-accent-200"
              }`}
              onDrop={handleRootDrop}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
            >
              <div className="text-xs text-grey-accent-500 text-center">
                {draggedCollection ? "Drop here to move to root level" : "Drag collections here to organize"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {/* Collection header if one is selected */}
        {selectedCollectionId && (
          <div className="mb-4">
            {(() => {
              const selectedCollection = nestedCollections.find(c => c.id === selectedCollectionId) ||
                                      nestedCollections.flatMap(c => c.children || []).find(c => c.id === selectedCollectionId)
              
              if (!selectedCollection) return null
              
              return (
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: selectedCollection.color || '#3B82F6' }}
                    />
                    <div>
                      <h2 className="font-semibold text-lg">{selectedCollection.name}</h2>
                      {selectedCollection.description && (
                        <p className="text-sm text-muted-foreground">{selectedCollection.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })()}
          </div>
        )}

        {/* Bookmarks display */}
        {displayedBookmarks.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📑</div>
              <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedCollectionId 
                  ? "This collection doesn't have any bookmarks yet."
                  : "Start by adding your first bookmark to this workspace."
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Bookmark
              </Button>
            </div>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {displayedBookmarks.map((bookmark) => (
              <Card 
                key={bookmark.id} 
                className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                  draggedBookmark === bookmark.id ? "opacity-50 scale-95" : ""
                } ${
                  dragOverTarget === bookmark.id ? "ring-2 ring-blue-400" : ""
                }`}
                onClick={() => window.open(bookmark.url, '_blank')}
                draggable
                onDragStart={(e) => handleDragStart(e, bookmark.id, 'bookmark')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleBookmarkDragOver(e, bookmark.id)}
                onDrop={(e) => handleBookmarkDrop(e, selectedCollectionId)}
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img
                        src={bookmark.preview_image || generateFallbackThumbnail(bookmark.url, bookmark.title)}
                        alt={bookmark.title || bookmark.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {/* Favicon overlay */}
                      <div className="absolute bottom-2 left-2">
                        <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
                          <FaviconImage 
                            url={bookmark.url} 
                            faviconUrl={bookmark.favicon_url} 
                            size="w-5 h-5" 
                          />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {bookmark.title || bookmark.url}
                      </h3>
                      {bookmark.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {bookmark.description}
                        </p>
                      )}
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3 items-center">
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <>
                            {bookmark.tags.slice(0, 3).map((tag: string, index: number) => (
                              <span 
                                key={tag} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 rounded-full text-xs"
                              >
                                {tag}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTags = bookmark.tags.filter((_: string, i: number) => i !== index);
                                    updateBookmarkTags(bookmark.id, newTags);
                                  }}
                                  className="text-grey-accent-500 hover:text-grey-accent-700 ml-1"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            {bookmark.tags.length > 3 && (
                              <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                                +{bookmark.tags.length - 3}
                              </span>
                            )}
                          </>
                        )}
                        
                        {/* Add tag button */}
                        {editingTags === bookmark.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                    updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                  }
                                  setTagInput('');
                                  setEditingTags(null);
                                } else if (e.key === 'Escape') {
                                  setTagInput('');
                                  setEditingTags(null);
                                }
                              }}
                              onBlur={() => {
                                if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                  updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                }
                                setTagInput('');
                                setEditingTags(null);
                              }}
                              placeholder="Add tag..."
                              className="w-20 h-6 text-xs px-2 py-1 border border-grey-accent-300 rounded"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTags(bookmark.id);
                            }}
                            className="w-5 h-5 rounded-full bg-grey-accent-200 hover:bg-grey-accent-300 flex items-center justify-center text-grey-accent-600 hover:text-grey-accent-800 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {bookmark.creator_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="w-3 h-3" />
                          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  // List view
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <FaviconImage 
                          url={bookmark.url} 
                          faviconUrl={bookmark.favicon_url} 
                          size="w-6 h-6" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate mb-1">
                          {bookmark.title || bookmark.url}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {bookmark.url}
                        </p>
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {bookmark.tags.slice(0, 5).map((tag: string) => (
                              <span 
                                key={tag} 
                                className="px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {bookmark.creator_name || 'Unknown'}
                        </span>
                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
