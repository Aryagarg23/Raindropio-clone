import { useState } from 'react';

export interface FilterState {
  // View state
  viewMode: 'grid' | 'list';
  searchQuery: string;
  activeTab: string;

  // Bookmark filters
  bookmarkFilters: BookmarkFilterState;
  showFilters: boolean;

  // Collection filters
  collectionFilters: CollectionFilterState;
  showCollectionFilters: boolean;
}

export interface FilterActions {
  // View state
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;

  // Bookmark filters
  setBookmarkFilters: (filters: BookmarkFilterState) => void;
  setShowFilters: (show: boolean) => void;

  // Collection filters
  setCollectionFilters: (filters: CollectionFilterState) => void;
  setShowCollectionFilters: (show: boolean) => void;
}

interface BookmarkFilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedCollections: string[];
  selectedCreators: string[];
  dateRange: { start: Date; end: Date } | null;
  sortBy: 'created_at' | 'title' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

interface CollectionFilterState {
  searchQuery: string;
  selectedCreators: string[];
  selectedParents: string[];
  hasBookmarks: boolean | null;
  sortBy: 'created_at' | 'name' | 'bookmark_count';
  sortOrder: 'asc' | 'desc';
}

export const useFilterState = (): FilterState & FilterActions => {
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('main');

  // Bookmark filters
  const [bookmarkFilters, setBookmarkFilters] = useState<BookmarkFilterState>({
    searchQuery: '',
    selectedTags: [],
    selectedCollections: [],
    selectedCreators: [],
    dateRange: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Collection filters
  const [collectionFilters, setCollectionFilters] = useState<CollectionFilterState>({
    searchQuery: '',
    selectedCreators: [],
    selectedParents: [],
    hasBookmarks: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [showCollectionFilters, setShowCollectionFilters] = useState(false);

  return {
    // State
    viewMode,
    searchQuery,
    activeTab,
    bookmarkFilters,
    showFilters,
    collectionFilters,
    showCollectionFilters,

    // Actions
    setViewMode,
    setSearchQuery,
    setActiveTab,
    setBookmarkFilters,
    setShowFilters,
    setCollectionFilters,
    setShowCollectionFilters,
  };
};