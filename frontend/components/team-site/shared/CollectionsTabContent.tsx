import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Folder, Copy } from 'lucide-react';
import ProfileIcon from '../../ProfileIcon';
import CollectionFilters from '../collections/CollectionFilters';

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
  filteredCollections: any[];
  collectionFilters: any;
  showCollectionFilters: boolean;
  allCollectionCreators: any[];
  parentCollections: any[];
  allFlatCollections: any[];
  bookmarks: any[];
  onSetShowCollectionFilters: (show: boolean) => void;
  onSetCollectionFilters: (filters: any) => void;
  onSetSelectedDirectoryCollection: (collection: any) => void;
  onSetShowDirectoryModal: (show: boolean) => void;
  onCopyDirectoryStructure: (collection: any) => void;
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
      <CollectionFilters
        showCollectionFilters={showCollectionFilters}
        setShowCollectionFilters={onSetShowCollectionFilters}
        collectionFilters={collectionFilters}
        setCollectionFilters={onSetCollectionFilters}
        filteredCollections={filteredCollections}
        allCollectionCreators={allCollectionCreators}
        parentCollections={parentCollections}
        allFlatCollections={allFlatCollections}
      />

      {/* Collections Grid */}
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
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: collection.color || '#6B7280' }}
                  >
                    <Folder className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-grey-accent-900 group-hover:text-grey-accent-700 transition-colors">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-grey-accent-500">
                      {bookmarks.filter(bookmark => bookmark.collection_id === collection.id).length} bookmarks
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyDirectoryStructure(collection);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {collection.description && (
                <p className="text-sm text-grey-accent-600 mb-4 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {collection.profiles && (
                    <ProfileIcon
                      user={{
                        avatar_url: collection.profiles.avatar_url,
                        full_name: collection.profiles.full_name,
                        email: collection.profiles.user_id
                      }}
                      size="sm"
                    />
                  )}
                  <span className="text-xs text-grey-accent-500">
                    {collection.profiles?.full_name || 'Unknown User'}
                  </span>
                </div>
                <span className="text-xs text-grey-accent-400">
                  {new Date(collection.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCollections.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Folder className="w-12 h-12 text-grey-accent-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-grey-accent-600 mb-2">No collections found</h3>
            <p className="text-grey-accent-500">
              Try adjusting your filters or create a new collection to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
