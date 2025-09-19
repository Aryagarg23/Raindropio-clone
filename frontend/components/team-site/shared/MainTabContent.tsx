import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Grid3X3, List, ExternalLink, Plus } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import { BookmarkGrid } from '../bookmarks/BookmarkGrid';
import { CollectionTreeRenderer } from '../collections/CollectionTreeRenderer';
import { OrphanedBookmarksList } from './DirectoryTreeView';
import { InlineBookmarkInput } from '../bookmarks/InlineBookmarkInput';
import AddBookmarkModal from '../bookmarks/AddBookmarkModal';
import { flattenCollections } from '../../../utils/collectionTreeUtils';
// ...existing code...

// Safe hostname resolver to avoid throwing during render when URL is invalid/missing
function safeHostname(url?: string) {
  if (!url) return 'site';
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || 'site';
  }
}

const getDomain = (url?: string) => {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
};

interface BookmarkListItemProps {
  bookmark: any;
  onBookmarkClick: (bookmark: any) => void;
  bookmarkFilters: any;
  onSetBookmarkFilters: (filters: any) => void;
  viewMode: 'grid' | 'list';
}

const BookmarkListItem: React.FC<BookmarkListItemProps> = ({ bookmark, onBookmarkClick, bookmarkFilters, onSetBookmarkFilters, viewMode }) => {
  const getPlaceholderUrl = (url: string) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
    // Use backend placeholder API for better placeholders
    const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://127.0.0.1:8000';
    return `${apiBase.replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent(domain)}`;
  };

  const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

  if (viewMode === 'list') {
    return (
      <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onBookmarkClick(bookmark)} compact>
        <CardContent className="px-4 py-2">
          <div className="flex items-center gap-4">
            {/* Large favicon on left, vertically centered */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded bg-white border border-grey-accent-100">
              <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-8 h-8" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Title on top */}
              <h3 className="font-medium text-grey-accent-900 truncate group-hover:text-blue-600 transition-colors text-sm">
                {bookmark.title || safeHostname(bookmark.url)}
              </h3>

              {/* Tags below title */}
              <div className="flex flex-wrap gap-1 mt-2">
                {bookmark.tags && bookmark.tags.length > 0 ? (
                  <>
                    {bookmark.tags.map((tag: string, i: number) => (
                      <span
                        key={tag + i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
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
                  </>
                ) : (
                  <span className="text-xs text-grey-accent-500">No tags</span>
                )}
              </div>
            </div>

            {/* Right metadata: creator stacked above date + persistent external link */}
            <div className="flex-shrink-0 flex flex-col items-end text-xs text-grey-accent-600">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-2">
                  <span className="cursor-pointer hover:text-purple-600"
                        onClick={(e) => {
                          e.stopPropagation();
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
                  <span className="text-xs text-grey-accent-600 mt-1">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                </div>

                {/* redirect button removed; grid image bubble handles redirect */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onBookmarkClick(bookmark)} compact>
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={bookmark.title || bookmark.url}
          className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}
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
              {bookmark.tags.map((tag: string, index: number) => (
                <span
                  key={tag + index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
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
  onCreateCollection: (parentId?: string) => void;
  onCreateBookmark: (url: string, collectionId?: string, color?: string) => Promise<void>;
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
  const [showAncestorsDropdown, setShowAncestorsDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const findCollectionPath = (nodes: any[], targetId: string, acc: any[] = []): any[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) return [...acc, node];
      if (node.children && node.children.length > 0) {
        const res = findCollectionPath(node.children, targetId, [...acc, node]);
        if (res) return res;
      }
    }
    return null;
  };

  const currentPath = selectedCollectionId ? (findCollectionPath(collections as any[], selectedCollectionId) || []) : [];
  const breadcrumbSegments = ['Collections', ...currentPath.map((p: any) => p.name)];
  return (
    <div className="space-y-8">
      {/* Collection Tree Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 min-h-[600px]">
        <div className="lg:col-span-1 lg:pr-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-grey-accent-900">
                <span className="flex items-center gap-2">
                  {/* Root crumb - always present */}
                  <button
                    onClick={() => onSetSelectedCollectionId(null)}
                    className="text-2xl font-bold text-grey-accent-900 cursor-pointer hover:text-blue-600 transition-colors"
                    title="Collections (home)"
                  >
                    Collections
                  </button>

                  {currentPath.map((p: any, idx: number) => (
                    <React.Fragment key={p.id}>
                      <span className="text-grey-accent-400">&gt;</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSetSelectedCollectionId(p.id)}
                          className="text-2xl font-bold text-grey-accent-900 cursor-pointer hover:text-blue-600 transition-colors"
                        >
                          {p.name}
                        </button>

                        {/* Only show '+' on the terminal (last) breadcrumb segment */}
                        {idx === currentPath.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCreateCollection(p.id)}
                            className="flex items-center gap-1 text-grey-accent-500 hover:text-grey-accent-800"
                            title={`Add collection inside ${p.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </span>
              </h2>
              {/* desktop add collection button (kept for parity) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateCollection(selectedCollectionId || undefined)}
                className="hidden lg:flex items-center gap-1 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
                title="Add Collection"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateCollection(selectedCollectionId || undefined)}
              className="flex items-center gap-1 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50 lg:hidden"
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
        <div className="lg:col-span-3 lg:pl-4 relative">
          <div className="flex items-center gap-2 justify-end ml-auto w-full">
            {/** Bookmark Add Input with loading spinner */}
            {(() => {
              const [inputValue, setInputValue] = React.useState('');
              const [loading, setLoading] = React.useState(false);

              return (
          <>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="add.bookmark-here.com"
                className="border border-grey-accent-200 bg-grey-accent-50 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200 transition placeholder:text-grey-accent-400 text-grey-accent-900"
                style={{
            boxShadow: '0 1px 2px 0 rgba(16,30,54,0.03)'
                }}
                onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const url = inputValue.trim();
              if (url && !loading) {
                setLoading(true);
                try {
                  await onCreateBookmark(url);
                  setInputValue('');
                } finally {
                  setLoading(false);
                }
              }
            }
                }}
                disabled={loading}
              />
              {loading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
              title="Add Bookmark"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
            >
              {viewMode === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
              <span className="capitalize">{viewMode}</span>
            </Button>
          </>
              );
            })()}
                      </div>
                      <div className="lg:pl-2 lg:pt-6">
                      {/* visual separator — absolutely positioned so it doesn't affect layout */}
                      <div className="hidden lg:block absolute left-0 top-16 bottom-0 w-px bg-grey-accent-200" aria-hidden="true" />
                    
                  
                          
                  
                   
                  
              
                
              
              
            

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
            // Use BookmarkGrid for list rendering parity with modal; keep main grid rendering as-is
            viewMode === 'grid' ? (
                <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`}>
                {advancedFilteredBookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer" onClick={() => onBookmarkClick(bookmark)} compact>
                    <div className="aspect-video relative overflow-hidden bg-muted rounded-t-xl">
                      <img
                        src={bookmark.preview_image || `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent((bookmark.url || '').replace(/^https?:\/\//, '').split('/')[0] || 'example.com')}`}
                        alt={bookmark.title || bookmark.url}
                        className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 rounded-t-xl"
                        style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}
                        data-debug-src={bookmark.preview_image}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { const el = e.currentTarget; el.src = `${(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent((bookmark.url || '').replace(/^https?:\/\//, '').split('/')[0] || 'example.com')}`; }}
                      />
                      <div className="absolute bottom-2 left-2">
                        <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
                          <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-5 h-5" />
                        </div>
                      </div>
                      {/* Domain bubble - bottom-right */}
                      <div className="absolute bottom-2 right-2">
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 hover:bg-white text-grey-accent-700 text-xs rounded-full shadow transition">
                          <span className="truncate max-w-[6rem]">{getDomain(bookmark.url)}</span>
                          <ExternalLink className="w-3 h-3 text-grey-accent-500" />
                        </a>
                      </div>
                      {/* image-level overlay removed; tags are rendered in CardContent to sit in the gap */}
                    </div>
                    <CardContent className="p-4">
                      {/* Tags row placed into the gap between image and title */}
                      {bookmark.tags && bookmark.tags.length > 0 && (
                        <div className="-mt-6 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {bookmark.tags.map((tag: string, i: number) => (
                              <span key={tag + i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <h3 className="font-medium text-sm line-clamp-2 mb-2">
                        {bookmark.title || bookmark.url}
                      </h3>
                      {bookmark.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {bookmark.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-grey-accent-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-grey-accent-600">{new Date(bookmark.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <BookmarkGrid
                bookmarks={advancedFilteredBookmarks}
                viewMode={viewMode}
                editingTags={null}
                tagInput={''}
                onBookmarkClick={onBookmarkClick}
                onUpdateTags={() => {}}
                onSetEditingTags={() => {}}
                onSetTagInput={() => {}}
                gridColsClass={'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}
                listColsClass={'grid-cols-1'}
              />
            )
          )}
          </div>
        </div>
      </div>
      {showAddModal && (
        <AddBookmarkModal
          collections={flattenCollections(collections as any) as any}
          onClose={() => setShowAddModal(false)}
          onCreate={async (url: string, collectionId?: string, color?: string) => {
            try {
              await onCreateBookmark(url, collectionId, color);
            } catch (e) {
              console.error('Failed to add bookmark from modal', e);
              throw e;
            }
          }}
        />
      )}
    </div>
  );
};