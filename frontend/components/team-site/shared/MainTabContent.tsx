import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Grid3X3, List, ExternalLink, Plus, Heart } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import { CollectionTreeRenderer } from '../collections/CollectionTreeRenderer';
import { OrphanedBookmarksList } from './DirectoryTreeView';
import { InlineBookmarkInput } from '../bookmarks/InlineBookmarkInput';

// Safe hostname resolver to avoid throwing during render when URL is invalid/missing
function safeHostname(url?: string) {
  if (!url) return 'site';
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || 'site';
  }
}

interface BookmarkListItemProps {
  bookmark: any;
  onBookmarkClick: (bookmark: any) => void;
  bookmarkFilters: any;
  onSetBookmarkFilters: (filters: any) => void;
}

const BookmarkListItem: React.FC<BookmarkListItemProps> = ({ bookmark, onBookmarkClick, bookmarkFilters, onSetBookmarkFilters }) => {
  const getPlaceholderUrl = (url: string) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
    // Use backend placeholder API for better placeholders
    const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://127.0.0.1:8000';
    return `${apiBase.replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent(domain)}`;
  };

  const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

  return (
    <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onBookmarkClick(bookmark)} compact>
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={bookmark.title || bookmark.url}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          data-debug-src={imageSrc}
          crossOrigin="anonymous"
          onLoad={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const el = e.currentTarget;
            console.debug('BookmarkListItem image loaded', bookmark.id, el.src, el.naturalWidth, el.naturalHeight);
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            const el = e.currentTarget;
            console.warn('BookmarkListItem image error', bookmark.id, el.src);
            el.src = getPlaceholderUrl(bookmark.url);
            el.removeAttribute('crossorigin');
          }}
        />

        {/* Favicon overlay - bottom-left */}
        <div className="absolute bottom-2 left-2">
          <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
            <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-5 h-5" />
          </div>
        </div>
      </div>

      <CardContent className="p-3 pt-3 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pl-0">
            <h3 className="font-semibold text-grey-accent-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {bookmark.title || safeHostname(bookmark.url)}
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              window.open(bookmark.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {bookmark.description && (
          <p className="text-grey-accent-700 text-sm mb-3 line-clamp-2">
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
                  className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {bookmark.tags.length > 3 && (
                <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                  +{bookmark.tags.length - 3}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-grey-accent-600">
          <div className="flex items-center gap-2">
            <ProfileIcon
              user={{
                avatar_url: (bookmark as any).profiles?.avatar_url,
                full_name: (bookmark as any).profiles?.full_name,
                email: (bookmark as any).profiles?.user_id
              }}
              size="sm"
            />
            <span>
              {(bookmark as any).profiles?.full_name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-grey-accent-500 hover:text-grey-accent-700" asChild>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          
        </div>
        </div>
      </CardContent>
    </Card>
  );
};
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
}

interface MainTabContentProps {
  viewMode: 'grid' | 'list';
  collections: ExtendedCollection[];
  selectedCollectionId: string | null;
  advancedFilteredBookmarks: any[];
  bookmarkFilters: any;
  expandedCollections: Set<string>;
  bookmarks: any[];
  dragOverData: any;
  draggedCollection: string | null;
  draggedBookmark: string | null;
  dragOverTarget: string | null;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onBookmarkClick: (bookmark: any) => void;
  onSetBookmarkFilters: (filters: any) => void;
  onToggleCollection: (collectionId: string) => void;
  onSetSelectedCollectionId: (id: string | null) => void;
  onHandleDragStart: (e: any, collectionId: string) => void;
  onHandleDragEnd: () => void;
  onHandleDragOver: (e: any, collectionId: string) => void;
  onHandleDragLeave: (e: any) => void;
  onHandleDrop: (e: any, collectionId: string) => Promise<void>;
  onHandleBookmarkDragStart: (e: any, bookmarkId: string) => void;
  onHandleBookmarkDragOver: (e: any, collectionId: string) => void;
  onHandleBookmarkDrop: (e: any, collectionId: string) => void;
  onCreateCollection: () => void;
  onCreateBookmark: (url: string) => Promise<void>;
  orphanedBookmarks: any[];
}

export const MainTabContent: React.FC<MainTabContentProps> = ({
  viewMode,
  collections,
  selectedCollectionId,
  advancedFilteredBookmarks,
  bookmarkFilters,
  onViewModeChange,
  onBookmarkClick,
  onSetBookmarkFilters,
  expandedCollections,
  bookmarks,
  dragOverData,
  draggedCollection,
  draggedBookmark,
  dragOverTarget,
  onToggleCollection,
  onSetSelectedCollectionId,
  onHandleDragStart,
  onHandleDragEnd,
  onHandleDragOver,
  onHandleDragLeave,
  onHandleDrop,
  onHandleBookmarkDragStart,
  onHandleBookmarkDragOver,
  onHandleBookmarkDrop,
  onCreateCollection,
  onCreateBookmark,
  orphanedBookmarks
}) => {
  return (
    <div className="space-y-8">
      {/* Collection Tree Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 min-h-[600px]">
        <div className="lg:col-span-1 lg:pr-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-grey-accent-900">Directory</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateCollection}
              className="flex items-center gap-1 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
              title="Add Collection"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Card className="flex-1">
            <CardContent className="p-0 h-full">
              <div className="p-4 h-full flex flex-col">
                {/* Collections Section */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-grey-accent-800 mb-3">Collections</h3>
                  <CollectionTreeRenderer
                    collections={collections}
                    bookmarks={bookmarks}
                    expandedCollections={expandedCollections}
                    selectedCollectionId={selectedCollectionId}
                    dragOverData={dragOverData}
                    draggedCollection={draggedCollection}
                    draggedBookmark={draggedBookmark}
                    dragOverTarget={dragOverTarget}
                    onToggleCollection={onToggleCollection}
                    onSetSelectedCollectionId={onSetSelectedCollectionId}
                    onHandleBookmarkClick={onBookmarkClick}
                    onHandleDragStart={onHandleDragStart}
                    onHandleDragEnd={onHandleDragEnd}
                    onHandleDragOver={onHandleDragOver}
                    onHandleDragLeave={onHandleDragLeave}
                    onHandleDrop={onHandleDrop}
                    onHandleBookmarkDragStart={onHandleBookmarkDragStart}
                    onHandleBookmarkDragOver={onHandleBookmarkDragOver}
                    onHandleBookmarkDrop={onHandleBookmarkDrop}
                  />
                </div>
                
                {/* Orphaned Bookmarks - directly after collections */}
                <OrphanedBookmarksList
                  orphanedBookmarks={orphanedBookmarks}
                  onBookmarkClick={onBookmarkClick}
                  onBookmarkDragStart={onHandleBookmarkDragStart}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks Grid */}
        <div className="lg:col-span-3 lg:pl-6 lg:border-l lg:border-grey-accent-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 
                className="text-2xl font-bold text-grey-accent-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onSetSelectedCollectionId(null)}
              >
                {selectedCollectionId
                  ? collections.find(c => c.id === selectedCollectionId)?.name || 'All Bookmarks'
                  : 'All Bookmarks'
                }
              </h2>
              <InlineBookmarkInput onCreate={onCreateBookmark} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-2 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
              >
                {viewMode === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                <span className="capitalize">{viewMode}</span>
              </Button>
            </div>
          </div>

          {advancedFilteredBookmarks.length === 0 ? (
            <div className="text-left py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No bookmarks found</h3>
              <p className="text-muted-foreground">
                {selectedCollectionId
                  ? 'This collection is empty. Add some bookmarks to get started.'
                  : 'No bookmarks match your current filters.'
                }
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {advancedFilteredBookmarks.map((bookmark) => (
                <BookmarkListItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onBookmarkClick={onBookmarkClick}
                  bookmarkFilters={bookmarkFilters}
                  onSetBookmarkFilters={onSetBookmarkFilters}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};