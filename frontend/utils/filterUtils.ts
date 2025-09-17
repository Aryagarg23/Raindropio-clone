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

export interface BookmarkFilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedCollections: string[];
  selectedCreators: string[];
  dateRange: { start: Date; end: Date } | null;
  sortBy: 'created_at' | 'title' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

export interface CollectionFilterState {
  searchQuery: string;
  selectedCreators: string[];
  selectedParents: string[];
  hasBookmarks: boolean | null;
  sortBy: 'created_at' | 'name' | 'bookmark_count';
  sortOrder: 'asc' | 'desc';
}

export interface Bookmark {
  id: string;
  title?: string;
  description?: string;
  url: string;
  tags?: string[];
  collection_id?: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    full_name?: string;
  };
}

/**
 * Apply advanced filters to bookmarks
 */
export const filterBookmarks = (
  bookmarks: Bookmark[],
  filters: BookmarkFilterState
): Bookmark[] => {
  let filtered = bookmarks;

  // Text search
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(bookmark =>
      bookmark.title?.toLowerCase().includes(query) ||
      bookmark.description?.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // Tag filter
  if (filters.selectedTags.length > 0) {
    filtered = filtered.filter(bookmark =>
      filters.selectedTags.every(tag =>
        bookmark.tags?.includes(tag)
      )
    );
  }

  // Collection filter
  if (filters.selectedCollections.length > 0) {
    filtered = filtered.filter(bookmark =>
      bookmark.collection_id && filters.selectedCollections.includes(bookmark.collection_id)
    );
  }

  // Creator filter
  if (filters.selectedCreators.length > 0) {
    filtered = filtered.filter(bookmark => {
      const creatorName = bookmark.profiles?.full_name || 'Unknown';
      return filters.selectedCreators.includes(creatorName);
    });
  }

  // Date range filter
  if (filters.dateRange) {
    filtered = filtered.filter(bookmark => {
      const bookmarkDate = new Date(bookmark.created_at);
      return bookmarkDate >= filters.dateRange!.start &&
             bookmarkDate <= filters.dateRange!.end;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'title':
        comparison = (a.title || a.url).localeCompare(b.title || b.url);
        break;
      case 'updated_at':
        comparison = new Date(a.updated_at || a.created_at).getTime() -
                    new Date(b.updated_at || b.created_at).getTime();
        break;
      case 'created_at':
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }

    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });

  return filtered;
};

/**
 * Apply filters to collections
 */
export const filterCollections = (
  collections: ExtendedCollection[],
  filters: CollectionFilterState,
  bookmarks: Bookmark[]
): ExtendedCollection[] => {
  let filtered = collections;

  // Text search
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(collection =>
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  }

  // Creator filter
  if (filters.selectedCreators.length > 0) {
    filtered = filtered.filter(collection => {
      const creatorName = collection.profiles?.full_name || 'Unknown';
      return filters.selectedCreators.includes(creatorName);
    });
  }

  // Parent filter (show only children of selected parents)
  if (filters.selectedParents.length > 0) {
    filtered = filtered.filter(collection =>
      (collection as any).parent_id && filters.selectedParents.includes((collection as any).parent_id)
    );
  }

  // Bookmark count filter
  if (filters.hasBookmarks !== null) {
    filtered = filtered.filter(collection => {
      const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length;
      return filters.hasBookmarks ? bookmarkCount > 0 : bookmarkCount === 0;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'bookmark_count':
        const aCount = bookmarks.filter(b => b.collection_id === a.id).length;
        const bCount = bookmarks.filter(b => b.collection_id === b.id).length;
        comparison = aCount - bCount;
        break;
      case 'created_at':
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
    }

    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });

  return filtered;
};

/**
 * Get all unique tags from bookmarks
 */
export const getAllTags = (bookmarks: Bookmark[]): string[] => {
  const tagSet = new Set<string>();
  bookmarks.forEach(bookmark => {
    bookmark.tags?.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
};

/**
 * Get available tags with usage counts for tag suggestions
 */
export const getAvailableTags = (bookmarks: Bookmark[]): { tag: string; usage_count: number }[] => {
  const tagCounts: { [tag: string]: number } = {};
  bookmarks.forEach(bookmark => {
    bookmark.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts)
    .map(([tag, usage_count]) => ({ tag, usage_count }))
    .sort((a, b) => b.usage_count - a.usage_count);
};

/**
 * Get all unique creators from bookmarks
 */
export const getAllCreators = (bookmarks: Bookmark[]): string[] => {
  const creatorSet = new Set<string>();
  bookmarks.forEach(bookmark => {
    const creatorName = bookmark.profiles?.full_name || 'Unknown';
    creatorSet.add(creatorName);
  });
  return Array.from(creatorSet).sort();
};

/**
 * Get all unique collection creators
 */
export const getAllCollectionCreators = (collections: ExtendedCollection[]): string[] => {
  const creatorSet = new Set<string>();
  collections.forEach(collection => {
    const creatorName = collection.profiles?.full_name || 'Unknown';
    creatorSet.add(creatorName);
  });
  return Array.from(creatorSet).sort();
};

/**
 * Get parent collections for filter
 */
export const getParentCollections = (collections: ExtendedCollection[]): ExtendedCollection[] => {
  return collections.filter(c => !(c as any).parent_id || (c as any).parent_id === null);
};