import { Collection, Bookmark } from '../../types/api';
import { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Search, ChevronDown, ChevronRight, Folder, Copy } from 'lucide-react';

interface CollectionFilters {
  searchQuery: string;
  selectedCreators: string[];
  selectedParents: string[];
  hasBookmarks: boolean | null;
  sortBy: 'created_at' | 'name' | 'bookmark_count';
  sortOrder: 'asc' | 'desc';
}

interface CollectionsViewProps {
  collections: Collection[];
  bookmarks: Bookmark[];
  onCollectionClick: (collectionId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onCreateBookmark: (collectionId: string) => void;
  onShowDirectoryModal: (collection: Collection) => void;
  onCopyDirectoryStructure: (collection: Collection) => void;
}

export default function CollectionsView({
  collections,
  bookmarks,
  onCollectionClick,
  onDeleteCollection,
  onCreateBookmark,
  onShowDirectoryModal,
  onCopyDirectoryStructure
}: CollectionsViewProps) {
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);
  
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilters>({
    searchQuery: '',
    selectedCreators: [],
    selectedParents: [],
    hasBookmarks: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Transform collections to include nested structure
  const allFlatCollections = useMemo(() => collections, [collections]);
  
  // Parent collections (collections without parent_id)
  const parentCollections = useMemo(() => {
    return collections.filter(c => !(c as any).parent_id);
  }, [collections]);

  // All collection creators
  const allCollectionCreators = useMemo(() => {
    const creatorSet = new Set<string>();
    collections.forEach(collection => {
      const creatorName = (collection as any).profiles?.full_name || 'Unknown';
      creatorSet.add(creatorName);
    });
    return Array.from(creatorSet).sort();
  }, [collections]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    let filtered = collections;

    // Search query
    if (collectionFilters.searchQuery.trim()) {
      const query = collectionFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(query) ||
        (collection.description?.toLowerCase().includes(query))
      );
    }

    // Creators filter
    if (collectionFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(collection => {
        const creatorName = (collection as any).profiles?.full_name || 'Unknown';
        return collectionFilters.selectedCreators.includes(creatorName);
      });
    }

    // Parent collections filter
    if (collectionFilters.selectedParents.length > 0) {
      filtered = filtered.filter(collection =>
        collectionFilters.selectedParents.includes((collection as any).parent_id || '')
      );
    }

    // Bookmark status filter
    if (collectionFilters.hasBookmarks !== null) {
      filtered = filtered.filter(collection => {
        const hasBookmarks = bookmarks.some(b => b.collection_id === collection.id);
        return collectionFilters.hasBookmarks ? hasBookmarks : !hasBookmarks;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (collectionFilters.sortBy) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'bookmark_count':
          const aCount = bookmarks.filter(bm => bm.collection_id === a.id).length;
          const bCount = bookmarks.filter(bm => bm.collection_id === b.id).length;
          comparison = aCount - bCount;
          break;
      }
      
      return collectionFilters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [collections, bookmarks, collectionFilters]);

  return (
    <div className="space-y-6">
      {/* Collection Filters Header */}
      <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-grey-accent-900">Collection Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollectionFilters(!showCollectionFilters)}
            className="flex items-center gap-2"
          >
            {showCollectionFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {showCollectionFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 text-sm text-grey-accent-600 mb-4">
          <span>{filteredCollections.length} collections found</span>
          <span>{allFlatCollections.length} total collections</span>
          <span>{parentCollections.length} root collections</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollectionFilters({
              searchQuery: '',
              selectedCreators: [],
              selectedParents: [],
              hasBookmarks: null,
              sortBy: 'created_at',
              sortOrder: 'desc'
            })}
            className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
          >
            Clear All Filters
          </Button>
        </div>

        {showCollectionFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Collections</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
                <Input
                  placeholder="Search collection name, description..."
                  value={collectionFilters.searchQuery}
                  onChange={(e) => setCollectionFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Creators Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Created By</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {collectionFilters.selectedCreators.map(creator => (
                    <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {creator}
                      <button
                        onClick={() => setCollectionFilters(prev => ({
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
                    if (e.target.value && !collectionFilters.selectedCreators.includes(e.target.value)) {
                      setCollectionFilters(prev => ({
                        ...prev,
                        selectedCreators: [...prev.selectedCreators, e.target.value]
                      }))
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select creators...</option>
                  {allCollectionCreators.filter(creator => !collectionFilters.selectedCreators.includes(creator)).map(creator => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent Collections Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Show Only Children Of</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {collectionFilters.selectedParents.map(parentId => {
                    const parent = parentCollections.find(c => c.id === parentId)
                    return (
                      <span key={parentId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {parent?.name || 'Unknown'}
                        <button
                          onClick={() => setCollectionFilters(prev => ({
                            ...prev,
                            selectedParents: prev.selectedParents.filter(p => p !== parentId)
                          }))}
                          className="text-blue-600 hover:text-blue-800"
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
                    if (e.target.value && !collectionFilters.selectedParents.includes(e.target.value)) {
                      setCollectionFilters(prev => ({
                        ...prev,
                        selectedParents: [...prev.selectedParents, e.target.value]
                      }))
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select parent collections...</option>
                  {parentCollections.filter(c => !collectionFilters.selectedParents.includes(c.id)).map(collection => (
                    <option key={collection.id} value={collection.id}>{collection.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bookmark Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Bookmark Status</label>
              <select
                value={collectionFilters.hasBookmarks === null ? 'all' : collectionFilters.hasBookmarks ? 'with' : 'empty'}
                onChange={(e) => {
                  const value = e.target.value === 'all' ? null : e.target.value === 'with'
                  setCollectionFilters(prev => ({ ...prev, hasBookmarks: value }))
                }}
                className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="all">All Collections</option>
                <option value="with">With Bookmarks</option>
                <option value="empty">Empty Collections</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={collectionFilters.sortBy}
                  onChange={(e) => setCollectionFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="created_at">Date Created</option>
                  <option value="name">Name</option>
                  <option value="bookmark_count">Bookmark Count</option>
                </select>
                <select
                  value={collectionFilters.sortOrder}
                  onChange={(e) => setCollectionFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  className="p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map((collection) => (
          <Card 
            key={collection.id} 
            className="hover:shadow-lg transition-all duration-200 bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer group"
            onClick={() => onShowDirectoryModal(collection)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: collection.color }}
                  />
                  <Folder className="w-5 h-5 text-muted-foreground group-hover:text-grey-accent-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                    {bookmarks.filter(b => b.collection_id === collection.id).length} items
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopyDirectoryStructure(collection)
                    }}
                    title="Copy directory structure"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-lg group-hover:text-grey-accent-800">{collection.name}</h3>
                {(collection as any).parent_id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">
                    Nested
                  </span>
                )}
              </div>
              
              {/* Parent hierarchy - more prominent */}
              {(collection as any).parent_id && (
                <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                  <div className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">
                      Parent: {(() => {
                        const parent = allFlatCollections.find(c => c.id === (collection as any).parent_id)
                        return parent?.name || 'Unknown Parent'
                      })()}
                    </span>
                  </div>
                </div>
              )}
              
              {collection.description && (
                <div className="mb-4 p-3 bg-grey-accent-50 border border-grey-accent-200 rounded">
                  <div className="text-xs font-medium text-grey-accent-600 mb-1">Description</div>
                  <p className="text-sm text-grey-accent-700 line-clamp-2">
                    {collection.description}
                  </p>
                </div>
              )}
              
              {/* Child count if has children */}
              {(collection as any).children && (collection as any).children.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {(collection as any).children.length} sub-collections
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-grey-accent-600">
                  Created {new Date(collection.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                    {((collection as any).profiles?.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-grey-accent-600">
                    {(collection as any).profiles?.full_name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Click hint */}
              <div className="mt-3 text-xs text-grey-accent-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view directory structure
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">No collections match your filters</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or clear some filters
          </p>
          <Button
            onClick={() => setCollectionFilters({
              searchQuery: '',
              selectedCreators: [],
              selectedParents: [],
              hasBookmarks: null,
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