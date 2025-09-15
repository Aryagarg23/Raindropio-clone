import { useState, useMemo } from 'react';
import { Bookmark, Collection } from '../../types/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Search, ChevronDown, ChevronRight, ExternalLink, Plus, Heart } from 'lucide-react';
import { FaviconImage } from './FaviconImage';

interface BookmarkFilters {
  searchQuery: string;
  selectedTags: string[];
  selectedCollections: string[];
  selectedCreators: string[];
  dateRange: { start: Date; end: Date } | null;
  sortBy: 'created_at' | 'updated_at' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  collections: Collection[];
  onDeleteBookmark: (bookmarkId: string) => void;
  onCreateBookmark: (collectionId?: string) => void;
  updateBookmarkTags: (bookmarkId: string, tags: string[]) => void;
}

export default function BookmarksView({
  bookmarks,
  collections,
  onDeleteBookmark,
  onCreateBookmark,
  updateBookmarkTags
}: BookmarksViewProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  const [bookmarkFilters, setBookmarkFilters] = useState<BookmarkFilters>({
    searchQuery: '',
    selectedTags: [],
    selectedCollections: [],
    selectedCreators: [],
    dateRange: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        bookmark.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [bookmarks]);

  // Extract all unique creators
  const allCreators = useMemo(() => {
    const creatorSet = new Set<string>();
    bookmarks.forEach(bookmark => {
      const creatorName = (bookmark as any).profiles?.full_name || 'Unknown';
      creatorSet.add(creatorName);
    });
    return Array.from(creatorSet).sort();
  }, [bookmarks]);

  // Advanced filtered bookmarks
  const advancedFilteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    // Search query
    if (bookmarkFilters.searchQuery.trim()) {
      const query = bookmarkFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        (bookmark.title?.toLowerCase().includes(query)) ||
        (bookmark.description?.toLowerCase().includes(query)) ||
        (bookmark.url.toLowerCase().includes(query))
      );
    }

    // Tags filter
    if (bookmarkFilters.selectedTags.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmark.tags && bookmarkFilters.selectedTags.some(tag => bookmark.tags.includes(tag))
      );
    }

    // Collections filter
    if (bookmarkFilters.selectedCollections.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmarkFilters.selectedCollections.includes(bookmark.collection_id || '')
      );
    }

    // Creators filter
    if (bookmarkFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(bookmark => {
        const creatorName = (bookmark as any).profiles?.full_name || 'Unknown';
        return bookmarkFilters.selectedCreators.includes(creatorName);
      });
    }

    // Date range filter
    if (bookmarkFilters.dateRange) {
      filtered = filtered.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.created_at);
        return bookmarkDate >= bookmarkFilters.dateRange!.start && 
               bookmarkDate <= bookmarkFilters.dateRange!.end;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (bookmarkFilters.sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime();
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }
      
      return bookmarkFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [bookmarks, bookmarkFilters]);

  return (
    <div className="space-y-6">
      {/* Advanced Filters Header */}
      <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-grey-accent-900">Advanced Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-sm text-grey-accent-600 mb-4">
          <span>{advancedFilteredBookmarks.length} bookmarks found</span>
          <span>{allTags.length} unique tags</span>
          <span>{collections.length} collections</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBookmarkFilters({
              searchQuery: '',
              selectedTags: [],
              selectedCollections: [],
              selectedCreators: [],
              dateRange: null,
              sortBy: 'created_at',
              sortOrder: 'desc'
            })}
            className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
          >
            Clear All Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
                <Input
                  placeholder="Search title, description, URL..."
                  value={bookmarkFilters.searchQuery}
                  onChange={(e) => setBookmarkFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tags Filter with Autocomplete */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {bookmarkFilters.selectedTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                      <button
                        onClick={() => setBookmarkFilters(prev => ({
                          ...prev,
                          selectedTags: prev.selectedTags.filter(t => t !== tag)
                        }))}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !bookmarkFilters.selectedTags.includes(e.target.value)) {
                      setBookmarkFilters(prev => ({
                        ...prev,
                        selectedTags: [...prev.selectedTags, e.target.value]
                      }))
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select tags...</option>
                  {allTags.filter(tag => !bookmarkFilters.selectedTags.includes(tag)).map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Collections Filter with Autocomplete */}
            <div>
              <label className="block text-sm font-medium mb-2">Collections</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {bookmarkFilters.selectedCollections.map(collectionId => {
                    const collection = collections.find(c => c.id === collectionId)
                    return (
                      <span key={collectionId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {collection?.name || 'Unknown'}
                        <button
                          onClick={() => setBookmarkFilters(prev => ({
                            ...prev,
                            selectedCollections: prev.selectedCollections.filter(c => c !== collectionId)
                          }))}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !bookmarkFilters.selectedCollections.includes(e.target.value)) {
                      setBookmarkFilters(prev => ({
                        ...prev,
                        selectedCollections: [...prev.selectedCollections, e.target.value]
                      }))
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select collections...</option>
                  {collections.filter(c => !bookmarkFilters.selectedCollections.includes(c.id)).map(collection => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Creators Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Created By</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {bookmarkFilters.selectedCreators.map(creator => (
                    <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {creator}
                      <button
                        onClick={() => setBookmarkFilters(prev => ({
                          ...prev,
                          selectedCreators: prev.selectedCreators.filter(c => c !== creator)
                        }))}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !bookmarkFilters.selectedCreators.includes(e.target.value)) {
                      setBookmarkFilters(prev => ({
                        ...prev,
                        selectedCreators: [...prev.selectedCreators, e.target.value]
                      }))
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select creators...</option>
                  {allCreators.filter(creator => !bookmarkFilters.selectedCreators.includes(creator)).map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={bookmarkFilters.sortBy}
                  onChange={(e) => setBookmarkFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Date Modified</option>
                  <option value="title">Title</option>
                </select>
                <select
                  value={bookmarkFilters.sortOrder}
                  onChange={(e) => setBookmarkFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  className="p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Date Range - Basic for now */}
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null
                    setBookmarkFilters(prev => ({
                      ...prev,
                      dateRange: date ? { start: date, end: prev.dateRange?.end || date } : null
                    }))
                  }}
                  className="text-sm"
                />
                <Input
                  type="date"
                  placeholder="To"
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null
                    setBookmarkFilters(prev => ({
                      ...prev,
                      dateRange: prev.dateRange?.start && date ? { start: prev.dateRange.start, end: date } : null
                    }))
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Bookmarks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {advancedFilteredBookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300">
            <div className="aspect-video relative overflow-hidden bg-muted">
              <img
                src={bookmark.preview_image || "/placeholder.svg"}
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
                    {bookmark.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                        onClick={() => {
                          // Add tag to filter when clicked
                          if (!bookmarkFilters.selectedTags.includes(tag)) {
                            setBookmarkFilters(prev => ({
                              ...prev,
                              selectedTags: [...prev.selectedTags, tag]
                            }))
                          }
                        }}
                      >
                        {tag}
                        {editingTags === bookmark.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBookmarkTags(bookmark.id, bookmark.tags.filter(t => t !== tag));
                            }}
                            className="text-grey-accent-500 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {bookmark.tags.length > 3 && (
                      <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                        +{bookmark.tags.length - 3}
                      </span>
                    )}
                  </>
                )}
                {editingTags === bookmark.id ? (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
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
              
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                  {((bookmark as any).profiles?.full_name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs text-grey-accent-600">
                  {(bookmark as any).profiles?.full_name || 'Unknown'}
                </span>
                <span className="text-xs text-grey-accent-400">•</span>
                <span className="text-xs text-grey-accent-600">
                  {new Date(bookmark.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
            <div className="flex items-center gap-2 p-4 pt-0">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Heart className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
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
            onClick={() => setBookmarkFilters({
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
}