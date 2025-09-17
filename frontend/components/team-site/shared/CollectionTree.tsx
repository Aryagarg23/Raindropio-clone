import React, { useRef } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, GripVertical } from "lucide-react";

interface ExtendedCollection {
  id: string;
  name: string;
  description?: string;
  color: string;
  team_id: string;
  created_at: string;
  created_by: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
  bookmarkCount?: number;
  children?: ExtendedCollection[];
  parentId?: string;
  parent_id?: string;
  sort_order?: number;
}

interface Bookmark {
  id: string;
  title?: string;
  description?: string;
  url: string;
  collection_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface CollectionTreeProps {
  collections: ExtendedCollection[];
  bookmarks: Bookmark[];
  expandedCollections: Set<string>;
  selectedCollectionId: string | null;
  draggedCollection: string | null;
  draggedBookmark: string | null;
  dragOverData: { id: string; position: 'root' | 'child' } | null;
  dragOverTarget: string | null;
  onToggleCollection: (collectionId: string) => void;
  onSelectCollection: (collectionId: string) => void;
  onDragStart: (e: React.DragEvent, collectionId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, collectionId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, collectionId: string) => void;
  onBookmarkDragOver: (e: React.DragEvent, targetId: string) => void;
  onBookmarkDrop: (e: React.DragEvent, targetCollectionId: string) => void;
}

export function CollectionTree({
  collections,
  bookmarks,
  expandedCollections,
  selectedCollectionId,
  draggedCollection,
  draggedBookmark,
  dragOverData,
  dragOverTarget,
  onToggleCollection,
  onSelectCollection,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onBookmarkDragOver,
  onBookmarkDrop
}: CollectionTreeProps) {
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const renderCollectionTree = (collections: ExtendedCollection[], level = 0) => {
    return collections.map((collection) => {
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
            onClick={() => onSelectCollection(collection.id)}
            draggable
            onDragStart={(e) => {
              onDragStart(e, collection.id);
              e.stopPropagation();
            }}
            onDragEnd={(e) => {
              onDragEnd();
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (draggedCollection) {
                onDragOver(e, collection.id);
              } else if (draggedBookmark) {
                onBookmarkDragOver(e, collection.id);
              }
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              if (draggedCollection) {
                onDragLeave(e);
              } else if (draggedBookmark) {
                // This would be handled by parent component
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();

              if (draggedCollection) {
                await onDrop(e, collection.id);
              } else if (draggedBookmark) {
                onBookmarkDrop(e, collection.id);
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
                  e.stopPropagation();
                  onToggleCollection(collection.id);
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
                <div>{renderCollectionTree(collection.children!, level + 1)}</div>
              )}

              {/* Render bookmarks in this collection */}
              {hasBookmarks && bookmarks
                .filter(bookmark => bookmark.collection_id === collection.id)
                .map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-50 transition-colors ml-4 ${
                      dragOverTarget === bookmark.id ? "bg-blue-50 border border-blue-300" : ""
                    }`}
                    style={{ paddingLeft: `${level * 16 + 32}px` }}
                    draggable
                    onDragStart={(e) => {
                      // This would be handled by parent component
                      e.stopPropagation();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBookmarkDragOver(e, bookmark.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onBookmarkDrop(e, collection.id);
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-grey-accent-300" />
                    <span className="text-sm truncate text-grey-accent-800">
                      {bookmark.title || bookmark.url}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    });
  };

  return <div>{renderCollectionTree(collections)}</div>;
}