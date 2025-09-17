import React from 'react';
import { GripVertical, ChevronDown, ChevronRight, FolderOpen, Folder, ExternalLink } from 'lucide-react';
import { FaviconImage } from '../shared/FaviconImage';

interface CollectionTreeRendererProps {
  collections: any[];
  level?: number;
  bookmarks: any[];
  expandedCollections: Set<string>;
  selectedCollectionId: string | null;
  dragOverData: any;
  draggedCollection: string | null;
  draggedBookmark: string | null;
  dragOverTarget: string | null;
  onToggleCollection: (collectionId: string) => void;
  onSetSelectedCollectionId: (id: string | null) => void;
  onHandleBookmarkClick: (bookmark: any) => void;
  onHandleDragStart: (e: any, collectionId: string) => void;
  onHandleDragEnd: () => void;
  onHandleDragOver: (e: any, collectionId: string) => void;
  onHandleDragLeave: (e: any) => void;
  onHandleDrop: (e: any, collectionId: string) => Promise<void>;
  onHandleBookmarkDragStart: (e: any, bookmarkId: string) => void;
  onHandleBookmarkDragOver: (e: any, collectionId: string) => void;
  onHandleBookmarkDrop: (e: any, collectionId: string) => void;
}

export const CollectionTreeRenderer: React.FC<CollectionTreeRendererProps> = ({
  collections,
  level = 0,
  bookmarks,
  expandedCollections,
  selectedCollectionId,
  dragOverData,
  draggedCollection,
  draggedBookmark,
  dragOverTarget,
  onToggleCollection,
  onSetSelectedCollectionId,
  onHandleBookmarkClick,
  onHandleDragStart,
  onHandleDragEnd,
  onHandleDragOver,
  onHandleDragLeave,
  onHandleDrop,
  onHandleBookmarkDragStart,
  onHandleBookmarkDragOver,
  onHandleBookmarkDrop,
}) => {
  return (
    <>
      {collections.map((collection, index) => {
        const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length;
        const hasChildren = collection.children && collection.children.length > 0;
        const hasBookmarks = bookmarkCount > 0;
        const isExpandable = hasChildren || hasBookmarks;

        return (
          <div key={collection.id} className="relative">
            {/* Left/Right drop zone indicators */}
            {dragOverData?.id === collection.id && draggedCollection && (
              <>
                {/* Left side - Root level drop */}
                {dragOverData?.position === 'root' && (
                  <>
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100 border-2 border-blue-300 border-dashed rounded-l-md z-10 opacity-80 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                        Drop for Root Level
                      </span>
                    </div>
                  </>
                )}

                {/* Right side - Child/Nest drop */}
                {dragOverData?.position === 'child' && (
                  <>
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-green-100 border-2 border-green-300 border-dashed rounded-r-md z-10 opacity-80 pointer-events-none" />
                    <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                        Drop to Nest
                      </span>
                    </div>
                  </>
                )}
              </>
            )}

            <div
              className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-100 transition-all duration-300 ease-out relative z-20 ${
                selectedCollectionId === collection.id ? "bg-grey-accent-100" : ""
              } ${
                dragOverData?.id === collection.id && draggedCollection && dragOverData?.position === 'child' ? "bg-grey-accent-100 scale-105 shadow-lg" : ""
              } ${
                dragOverTarget === collection.id && draggedBookmark ? "bg-blue-50 border border-blue-300" : ""
              } ${
                draggedCollection === collection.id ? "opacity-50 scale-95 rotate-2 blur-sm" : ""
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onSetSelectedCollectionId(collection.id)}
              draggable
              onDragStart={(e) => {
                onHandleDragStart(e, collection.id);
                e.stopPropagation(); // Prevent parent handlers from interfering
              }}
              onDragEnd={(e) => {
                onHandleDragEnd();
                e.stopPropagation();
              }}
              onDragOver={(e) => {
                e.preventDefault(); // CRITICAL: Always prevent default first
                e.stopPropagation(); // Stop event bubbling

                if (draggedCollection) {
                  onHandleDragOver(e, collection.id);
                } else if (draggedBookmark) {
                  onHandleBookmarkDragOver(e, collection.id);
                }
              }}
              onDragLeave={(e) => {
                e.stopPropagation();
                if (draggedCollection) {
                  onHandleDragLeave(e);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault(); // CRITICAL: Prevent default first
                e.stopPropagation(); // Stop event bubbling
                console.log('=== COLLECTION ON DROP ===', { draggedCollection, draggedBookmark, collectionId: collection.id });

                if (draggedCollection) {
                  await onHandleDrop(e, collection.id);
                } else if (draggedBookmark) {
                  onHandleBookmarkDrop(e, collection.id);
                }
              }}
            >
              <GripVertical
                className="w-3 h-3 text-grey-accent-400 hover:text-grey-accent-600"
                onDragStart={(e) => e.stopPropagation()}
              />
              {isExpandable ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCollection(collection.id)
                  }}
                  onDragStart={(e) => e.stopPropagation()}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {expandedCollections.has(collection.id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}

              {expandedCollections.has(collection.id) ? (
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Folder className="w-4 h-4 text-muted-foreground" />
              )}

              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: collection.color }}
                onDragStart={(e) => e.stopPropagation()}
              />
              <span
                className="text-sm font-medium truncate text-grey-accent-900"
                onDragStart={(e) => e.stopPropagation()}
              >
                {collection.name}
              </span>
              <span
                className="text-xs text-grey-accent-600 ml-auto"
                onDragStart={(e) => e.stopPropagation()}
              >
                {bookmarkCount}
              </span>
            </div>

            {expandedCollections.has(collection.id) && (
              <div>
                {/* Render child collections first */}
                {hasChildren && (
                  <CollectionTreeRenderer
                    collections={collection.children}
                    level={level + 1}
                    bookmarks={bookmarks}
                    expandedCollections={expandedCollections}
                    selectedCollectionId={selectedCollectionId}
                    dragOverData={dragOverData}
                    draggedCollection={draggedCollection}
                    draggedBookmark={draggedBookmark}
                    dragOverTarget={dragOverTarget}
                    onToggleCollection={onToggleCollection}
                    onSetSelectedCollectionId={onSetSelectedCollectionId}
                    onHandleBookmarkClick={onHandleBookmarkClick}
                    onHandleDragStart={onHandleDragStart}
                    onHandleDragEnd={onHandleDragEnd}
                    onHandleDragOver={onHandleDragOver}
                    onHandleDragLeave={onHandleDragLeave}
                    onHandleDrop={onHandleDrop}
                    onHandleBookmarkDragStart={onHandleBookmarkDragStart}
                    onHandleBookmarkDragOver={onHandleBookmarkDragOver}
                    onHandleBookmarkDrop={onHandleBookmarkDrop}
                  />
                )}

                {/* Render bookmarks in this collection */}
                {hasBookmarks && bookmarks
                  .filter(bookmark => bookmark.collection_id === collection.id)
                  .map((bookmark) => (
                    <div
                      key={`bookmark-${bookmark.id}`}
                      className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-50 transition-colors ${
                        selectedCollectionId === collection.id ? "bg-grey-accent-50" : ""
                      }`}
                      style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                      draggable
                      onDragStart={(e) => onHandleBookmarkDragStart(e, bookmark.id)}
                      onClick={() => {
                        onSetSelectedCollectionId(collection.id)
                        // Optional: scroll to bookmark in main view or open detail modal
                        onHandleBookmarkClick(bookmark)
                      }}
                    >
                      <div className="w-3 h-3" /> {/* Spacer for drag handle */}
                      <div className="w-4" /> {/* Spacer for expand button */}

                      {/* Favicon */}
                      <div className="w-4 h-4 flex items-center justify-center">
                        <FaviconImage
                          url={bookmark.url}
                          faviconUrl={bookmark.favicon_url}
                          size="w-3 h-3"
                        />
                      </div>

                      <span className="text-xs text-grey-accent-700 truncate flex-1">
                        {bookmark.title || new URL(bookmark.url).hostname}
                      </span>

                      {/* External link button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(bookmark.url, '_blank', 'noopener,noreferrer')
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-grey-accent-200 rounded transition-all"
                        title="Open link"
                      >
                        <ExternalLink className="w-3 h-3 text-grey-accent-500" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  );
};