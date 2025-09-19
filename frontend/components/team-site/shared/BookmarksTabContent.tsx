import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { ExternalLink, Grid3X3, List } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import { FaviconImage } from './FaviconImage';
import { BookmarkGrid } from '../bookmarks/BookmarkGrid';
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
  onViewModeChange: (mode: 'grid' | 'list') => void;
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
  ,onViewModeChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 w-full">
          <div className="min-w-0 w-full">
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
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <div>
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
      </div>

      <BookmarkGrid
        bookmarks={advancedFilteredBookmarks}
        viewMode={viewMode}
        editingTags={null}
        tagInput={''}
        onBookmarkClick={onBookmarkClick}
        onUpdateTags={() => {}}
        onSetEditingTags={() => {}}
        onSetTagInput={() => {}}
        gridColsClass={'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}
        listColsClass={'grid-cols-1 sm:grid-cols-2'}
      />

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