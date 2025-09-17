import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Grid3X3, List, ExternalLink, Plus } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import { CollectionTreeRenderer } from '../collections/CollectionTreeRenderer';

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
  onSetSelectedCollectionId: (id: string) => void;
  onHandleDragStart: (e: any, collectionId: string) => void;
  onHandleDragEnd: () => void;
  onHandleDragOver: (e: any, collectionId: string) => void;
  onHandleDragLeave: (e: any) => void;
  onHandleDrop: (e: any, collectionId: string) => Promise<void>;
  onHandleBookmarkDragStart: (e: any, bookmarkId: string) => void;
  onHandleBookmarkDragOver: (e: any, collectionId: string) => void;
  onHandleBookmarkDrop: (e: any, collectionId: string) => void;
  onCreateCollection: () => void;
  onCreateBookmark: () => void;
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
  onCreateBookmark
}) => {
  return (
    <div className="space-y-8">
      {/* Collection Tree Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        <div className="lg:col-span-1 lg:pr-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-grey-accent-900">Collections</h2>
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
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
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
            </CardContent>
          </Card>
        </div>

        {/* Bookmarks Grid */}
        <div className="lg:col-span-3 lg:pl-6 lg:border-l lg:border-grey-accent-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-grey-accent-900">
                {selectedCollectionId
                  ? collections.find(c => c.id === selectedCollectionId)?.name || 'All Bookmarks'
                  : 'All Bookmarks'
                }
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateBookmark}
                className="flex items-center gap-1 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
                title="Add Bookmark"
              >
                <Plus className="w-4 h-4" />
              </Button>
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
            <div className="text-center py-12">
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
                <Card
                  key={bookmark.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => onBookmarkClick(bookmark)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FaviconImage
                          url={bookmark.url}
                          faviconUrl={bookmark.favicon_url}
                          size="w-5 h-5"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-grey-accent-900 truncate group-hover:text-blue-600 transition-colors">
                            {bookmark.title || new URL(bookmark.url).hostname}
                          </h3>
                          <p className="text-sm text-grey-accent-600 truncate">
                            {new URL(bookmark.url).hostname}
                          </p>
                        </div>
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
                      <p className="text-grey-accent-700 text-sm mb-4 line-clamp-2">
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
                              className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add tag to filter when clicked
                                if (!bookmarkFilters.selectedTags.includes(tag)) {
                                  onSetBookmarkFilters((prev: any) => ({
                                    ...prev,
                                    selectedTags: [...prev.selectedTags, tag]
                                  }));
                                }
                              }}
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
                        <span
                          className="cursor-pointer hover:text-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add creator to filter when clicked
                            const creatorName = (bookmark as any).profiles?.full_name || 'Unknown';
                            if (!bookmarkFilters.selectedCreators.includes(creatorName)) {
                              onSetBookmarkFilters((prev: any) => ({
                                ...prev,
                                selectedCreators: [...prev.selectedCreators, creatorName]
                              }));
                            }
                          }}
                        >
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};