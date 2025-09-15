import React, { useState } from 'react';
import { Bookmark, Collection } from '../../types/api';

interface MainContentProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  selectedCollection: string | null;
  onBookmarkAdd: () => void;
  searchQuery?: string;
  className?: string;
}

export default function MainContent({
  bookmarks,
  collections,
  selectedCollection,
  onBookmarkAdd,
  searchQuery = '',
  className = ''
}: MainContentProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'url'>('date');

  // Filter bookmarks based on selected collection
  const filteredBookmarks = selectedCollection 
    ? bookmarks.filter(bookmark => bookmark.collection_id === selectedCollection)
    : bookmarks;

  // Get collection name for header
  const selectedCollectionName = selectedCollection 
    ? collections.find(c => c.id === selectedCollection)?.name || 'Unknown Collection'
    : 'All Bookmarks';

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {selectedCollectionName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'url')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="url">Sort by URL</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">⊞</span>Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">☰</span>List
                </button>
              </div>

              {/* Add Bookmark Button */}
              <button
                onClick={onBookmarkAdd}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <span className="mr-2">+</span>
                Add Bookmark
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredBookmarks.length === 0 ? (
          <EmptyState
            selectedCollection={selectedCollection}
            selectedCollectionName={selectedCollectionName}
            onBookmarkAdd={onBookmarkAdd}
          />
        ) : (
          <BookmarksList
            bookmarks={filteredBookmarks}
            viewMode={viewMode}
            sortBy={sortBy}
          />
        )}
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  selectedCollection: string | null;
  selectedCollectionName: string;
  onBookmarkAdd: () => void;
}

function EmptyState({ selectedCollection, selectedCollectionName, onBookmarkAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">📚</span>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {selectedCollection ? `No bookmarks in ${selectedCollectionName}` : 'No bookmarks yet'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {selectedCollection 
          ? `Start building your ${selectedCollectionName} collection by adding your first bookmark.`
          : 'Start building your bookmark collection by adding your first bookmark.'
        }
      </p>
      
      <button
        onClick={onBookmarkAdd}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
      >
        <span className="mr-2">+</span>
        Add Your First Bookmark
      </button>
    </div>
  );
}

// Bookmarks List Component
interface BookmarksListProps {
  bookmarks: Bookmark[];
  viewMode: 'grid' | 'list';
  sortBy: 'date' | 'title' | 'url';
}

function BookmarksList({ bookmarks, viewMode, sortBy }: BookmarksListProps) {
  // Sort bookmarks
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'url':
        return a.url.localeCompare(b.url);
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedBookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedBookmarks.map((bookmark) => (
        <BookmarkListItem key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}

// Bookmark Card Component (Grid View)
interface BookmarkCardProps {
  bookmark: Bookmark;
}

function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const domain = new URL(bookmark.url).hostname.replace('www.', '');
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-sm">
            {domain.charAt(0).toUpperCase()}
          </span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity">
          <span>⋯</span>
        </button>
      </div>
      
      <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
        {bookmark.title}
      </h3>
      
      {bookmark.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {bookmark.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="truncate">{domain}</span>
        <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// Bookmark List Item Component (List View)
interface BookmarkListItemProps {
  bookmark: Bookmark;
}

function BookmarkListItem({ bookmark }: BookmarkListItemProps) {
  const domain = new URL(bookmark.url).hostname.replace('www.', '');
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group">
      <div className="flex items-start space-x-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold">
            {domain.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 truncate">
                {bookmark.title}
              </h3>
              {bookmark.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                  {bookmark.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{domain}</span>
                <span>•</span>
                <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity ml-4">
              <span>⋯</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}