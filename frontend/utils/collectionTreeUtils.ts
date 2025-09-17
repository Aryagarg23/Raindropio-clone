import { Collection } from '../types/api';

export interface ExtendedCollection {
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

/**
 * Build nested collection tree from flat data
 */
export const buildCollectionTree = (collections: Collection[]): ExtendedCollection[] => {
  const collectionMap = new Map<string, ExtendedCollection>();
  const rootCollections: ExtendedCollection[] = [];

  // First pass: Create map of all collections
  collections.forEach(collection => {
    const extendedCollection: ExtendedCollection = {
      ...collection,
      children: [],
      bookmarkCount: 0, // Will be set later if needed
      profiles: (collection as any).profiles
    };
    collectionMap.set(collection.id, extendedCollection);
  });

  // Second pass: Build tree structure
  collections.forEach(collection => {
    const extendedCollection = collectionMap.get(collection.id);
    if (extendedCollection) {
      if (collection.parent_id && collectionMap.has(collection.parent_id)) {
        // Add to parent's children
        const parent = collectionMap.get(collection.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(extendedCollection);
        }
      } else {
        // Root level collection
        rootCollections.push(extendedCollection);
      }
    }
  });

  // Sort collections by sort_order then name
  const sortCollections = (collections: ExtendedCollection[]) => {
    collections.sort((a, b) => {
      const orderA = (a as any).sort_order || 0;
      const orderB = (b as any).sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    collections.forEach(collection => {
      if (collection.children && collection.children.length > 0) {
        sortCollections(collection.children);
      }
    });
  };

  sortCollections(rootCollections);
  return rootCollections;
};

/**
 * Flatten all collections (including nested children) for collections tab
 */
export const flattenCollections = (collections: ExtendedCollection[]): ExtendedCollection[] => {
  const flattened: ExtendedCollection[] = [];

  const addCollection = (collection: ExtendedCollection) => {
    flattened.push(collection);
    if (collection.children && collection.children.length > 0) {
      collection.children.forEach(child => addCollection(child));
    }
  };

  collections.forEach(collection => addCollection(collection));
  return flattened;
};

/**
 * Update bookmark counts for collections
 */
export const updateCollectionBookmarkCounts = (
  collections: ExtendedCollection[],
  bookmarks: any[]
): ExtendedCollection[] => {
  return collections.map(collection => ({
    ...collection,
    bookmarkCount: bookmarks.filter(b => b.collection_id === collection.id).length,
    children: collection.children
      ? updateCollectionBookmarkCounts(collection.children, bookmarks)
      : undefined
  }));
};