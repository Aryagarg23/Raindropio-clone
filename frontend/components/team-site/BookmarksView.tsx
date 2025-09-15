import { useState } from 'react';
import { Bookmark, Collection } from '../../types/api';

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  selectedCollection: string | null;
  onCollectionFilter: (collectionId: string | null) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onCreateBookmark: (collectionId?: string) => void;
}

export default function BookmarksView({
  bookmarks,
  collections,
  selectedCollection,
  onCollectionFilter,
  onDeleteBookmark,
  onCreateBookmark
}: BookmarksViewProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  const filteredBookmarks = selectedCollection
    ? bookmarks.filter(b => b.collection_id === selectedCollection)
    : bookmarks;

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const getCollectionName = (collectionId?: string) => {
    if (!collectionId) return 'Uncategorized';
    const collection = collections.find(c => c.id === collectionId);
    return collection?.name || 'Unknown Collection';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          {/* Collection Filter */}
          <select
            value={selectedCollection || ''}
            onChange={(e) => onCollectionFilter(e.target.value || null)}
            className="rounded-lg border px-3 py-2 text-sm transition-all duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">All Collections</option>
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border px-3 py-2 text-sm transition-all duration-200"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title</option>
          </select>
        </div>

        <button
          onClick={() => onCreateBookmark(selectedCollection || undefined)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium hover:transform hover:-translate-y-1"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span>Add Bookmark</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {sortedBookmarks.length} bookmark{sortedBookmarks.length !== 1 ? 's' : ''}
          {selectedCollection && (
            <span> in {getCollectionName(selectedCollection)}</span>
          )}
        </p>
      </div>

      {/* Bookmarks Grid */}
      {sortedBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🔖</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No bookmarks found
          </h3>
          <p className="text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
            {selectedCollection 
              ? "This collection doesn't have any bookmarks yet."
              : "Start building your team's knowledge base by adding your first bookmark."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group rounded-xl p-4 transition-all duration-200 hover:transform hover:-translate-y-1"
              style={{ 
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Bookmark Header */}
              <div className="flex items-start space-x-3 mb-3">
                <img
                  src={getFavicon(bookmark.url) || '/favicon.ico'}
                  alt=""
                  className="w-6 h-6 rounded flex-shrink-0 mt-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
                    {bookmark.title || 'Untitled'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {getDomain(bookmark.url)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {bookmark.description && (
                <p className="text-sm line-clamp-3 mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {bookmark.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs mb-3">
                <span 
                  className="px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {getCollectionName(bookmark.collection_id)}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(bookmark.created_at)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{ 
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  <span>Visit</span>
                </a>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${bookmark.title || 'this bookmark'}"?`)) {
                      onDeleteBookmark(bookmark.id);
                    }
                  }}
                  className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}