import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Folder, ChevronDown, ChevronRight, Search, Copy } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';

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

interface CollectionsTabContentProps {
  filteredCollections: ExtendedCollection[];
  collectionFilters: any;
  showCollectionFilters: boolean;
  allCollectionCreators: string[];
  parentCollections: ExtendedCollection[];
  allFlatCollections: ExtendedCollection[];
  bookmarks: any[];
  onSetShowCollectionFilters: (show: boolean) => void;
  onSetCollectionFilters: (filters: any) => void;
  onSetSelectedDirectoryCollection: (collection: ExtendedCollection | null) => void;
  onSetShowDirectoryModal: (show: boolean) => void;
  onCopyDirectoryStructure: (collection: ExtendedCollection) => void;
}

export const CollectionsTabContent: React.FC<CollectionsTabContentProps> = ({
  filteredCollections,
  collectionFilters,
  showCollectionFilters,
  allCollectionCreators,
  parentCollections,
  allFlatCollections,
  bookmarks,
  onSetShowCollectionFilters,
  onSetCollectionFilters,
  onSetSelectedDirectoryCollection,
  onSetShowDirectoryModal,
  onCopyDirectoryStructure
}) => {
  return (
    <div className="space-y-6">
      {/* Collection Filters Header */}
      <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-grey-accent-900">Collection Filters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetShowCollectionFilters(!showCollectionFilters)}
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
            onClick={() => onSetCollectionFilters({
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
                  onChange={(e) => onSetCollectionFilters((prev: any) => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Creators Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Created By</label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {collectionFilters.selectedCreators.map((creator: string) => (
                    <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {creator}
                      <button
                        onClick={() => onSetCollectionFilters((prev: any) => ({
                          ...prev,
                          selectedCreators: prev.selectedCreators.filter((c: string) => c !== creator)
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
                      onSetCollectionFilters((prev: any) => ({
                        ...prev,
                        selectedCreators: [...prev.selectedCreators, e.target.value]
                      }));
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select creators...</option>
                  {allCollectionCreators.filter((creator: string) => !collectionFilters.selectedCreators.includes(creator)).map((creator: string) => (
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
                  {collectionFilters.selectedParents.map((parentId: string) => {
                    const parent = parentCollections.find((c: ExtendedCollection) => c.id === parentId);
                    return (
                      <span key={parentId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {parent?.name || 'Unknown'}
                        <button
                          onClick={() => onSetCollectionFilters((prev: any) => ({
                            ...prev,
                            selectedParents: prev.selectedParents.filter((p: string) => p !== parentId)
                          }))}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !collectionFilters.selectedParents.includes(e.target.value)) {
                      onSetCollectionFilters((prev: any) => ({
                        ...prev,
                        selectedParents: [...prev.selectedParents, e.target.value]
                      }));
                    }
                  }}
                  className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="">Select parent collections...</option>
                  {parentCollections.filter((c: ExtendedCollection) => !collectionFilters.selectedParents.includes(c.id)).map((collection: ExtendedCollection) => (
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
                  const value = e.target.value === 'all' ? null : e.target.value === 'with';
                  onSetCollectionFilters((prev: any) => ({ ...prev, hasBookmarks: value }));
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
                  onChange={(e) => onSetCollectionFilters((prev: any) => ({ ...prev, sortBy: e.target.value }))}
                  className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
                >
                  <option value="created_at">Date Created</option>
                  <option value="name">Name</option>
                  <option value="bookmark_count">Bookmark Count</option>
                </select>
                <select
                  value={collectionFilters.sortOrder}
                  onChange={(e) => onSetCollectionFilters((prev: any) => ({ ...prev, sortOrder: e.target.value }))}
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
            onClick={() => {
              onSetSelectedDirectoryCollection(collection);
              onSetShowDirectoryModal(true);
            }}
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
                    {bookmarks.filter((b: any) => b.collection_id === collection.id).length} items
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyDirectoryStructure(collection);
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
                        const parent = allFlatCollections.find((c: ExtendedCollection) => c.id === (collection as any).parent_id);
                        return parent?.name || 'Unknown Parent';
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
              {collection.children && collection.children.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {collection.children.length} sub-collections
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-grey-accent-600">
                  Created {new Date(collection.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <ProfileIcon
                    user={{
                      avatar_url: (collection as any).profiles?.avatar_url,
                      full_name: (collection as any).profiles?.full_name,
                      email: (collection as any).profiles?.user_id
                    }}
                    size="md"
                  />
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
            onClick={() => onSetCollectionFilters({
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
};