import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { ExternalLink } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import BookmarkFilters from '../bookmarks/BookmarkFilters';

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

interface BookmarksTabContentProps {
  viewMode: 'grid' | 'list';
  advancedFilteredBookmarks: any[];
  bookmarkFilters: any;
  showFilters: boolean;
  allTags: string[];
  collections: ExtendedCollection[];
  allCreators: string[];
  onBookmarkClick: (bookmark: any) => void;
  onSetBookmarkFilters: (filters: any) => void;
  onSetShowFilters: (show: boolean) => void;
}

export const BookmarksTabContent: React.FC<BookmarksTabContentProps> = ({
  viewMode,
  advancedFilteredBookmarks,
  bookmarkFilters,
  showFilters,
  allTags,
  collections,
  allCreators,
  onBookmarkClick,
  onSetBookmarkFilters,
  onSetShowFilters
}) => {
  return (
    <div className="space-y-6">
      <BookmarkFilters
        showFilters={showFilters}
        setShowFilters={onSetShowFilters}
        bookmarkFilters={bookmarkFilters}
        setBookmarkFilters={onSetBookmarkFilters}
        advancedFilteredBookmarks={advancedFilteredBookmarks}
        allTags={allTags}
        collections={collections}
        allCreators={allCreators}
      />

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

      {advancedFilteredBookmarks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No bookmarks match your filters</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or clear some filters
          </p>
          <Button
            onClick={() => onSetBookmarkFilters({
              searchQuery: '',
              selectedTags: [],
              selectedCollections: [],
              selectedCreators: [],
              dateRange: null,
              sortBy: 'created_at',
              sortOrder: 'desc'
            })}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};