import { useState, useMemo } from 'react'

interface BookmarkFilters {
  searchQuery: string
  selectedTags: string[]
  selectedCollections: string[]
  selectedCreators: string[]
  dateRange: { start: Date; end: Date } | null
  sortBy: 'created_at' | 'title' | 'updated_at'
  sortOrder: 'asc' | 'desc'
}

interface CollectionFilters {
  searchQuery: string
  selectedCreators: string[]
  selectedParents: string[]
  hasBookmarks: boolean | null // null = all, true = with bookmarks, false = empty
  sortBy: 'created_at' | 'name' | 'bookmark_count'
  sortOrder: 'asc' | 'desc'
}

interface UseFiltersProps {
  bookmarks: any[]
  collections: any[]
  profiles: any[]
}

export const useFilters = ({ bookmarks, collections, profiles }: UseFiltersProps) => {
  const [bookmarkFilters, setBookmarkFilters] = useState<BookmarkFilters>({
    searchQuery: '',
    selectedTags: [],
    selectedCollections: [],
    selectedCreators: [],
    dateRange: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [collectionFilters, setCollectionFilters] = useState<CollectionFilters>({
    searchQuery: '',
    selectedCreators: [],
    selectedParents: [],
    hasBookmarks: null,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const [showBookmarkFilters, setShowBookmarkFilters] = useState(false)
  const [showCollectionFilters, setShowCollectionFilters] = useState(false)

  // Get all unique values for filter options
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    bookmarks.forEach(bookmark => {
      bookmark.tags?.forEach((tag: string) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [bookmarks])

  const allBookmarkCreators = useMemo(() => {
    const creatorSet = new Set<string>()
    bookmarks.forEach(bookmark => {
      if (bookmark.creator_name) {
        creatorSet.add(bookmark.creator_name)
      }
    })
    return Array.from(creatorSet).sort()
  }, [bookmarks])

  const allCollectionCreators = useMemo(() => {
    const creatorSet = new Set<string>()
    collections.forEach(collection => {
      if (collection.creator_name) {
        creatorSet.add(collection.creator_name)
      }
    })
    return Array.from(creatorSet).sort()
  }, [collections])

  const allCollectionNames = useMemo(() => {
    return collections.map(c => c.name).sort()
  }, [collections])

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = [...bookmarks]

    // Apply filters
    if (bookmarkFilters.searchQuery) {
      const query = bookmarkFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(bookmark => 
        bookmark.title?.toLowerCase().includes(query) ||
        bookmark.url?.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query)
      )
    }

    if (bookmarkFilters.selectedTags.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmark.tags?.some((tag: string) => bookmarkFilters.selectedTags.includes(tag))
      )
    }

    if (bookmarkFilters.selectedCollections.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmark.collection_id && bookmarkFilters.selectedCollections.includes(bookmark.collection_id)
      )
    }

    if (bookmarkFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmark.creator_name && bookmarkFilters.selectedCreators.includes(bookmark.creator_name)
      )
    }

    if (bookmarkFilters.dateRange) {
      filtered = filtered.filter(bookmark => {
        const createdAt = new Date(bookmark.created_at)
        return createdAt >= bookmarkFilters.dateRange!.start && createdAt <= bookmarkFilters.dateRange!.end
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (bookmarkFilters.sortBy) {
        case 'title':
          aValue = a.title || a.url || ''
          bValue = b.title || b.url || ''
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        default: // created_at
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }

      if (typeof aValue === 'string') {
        return bookmarkFilters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return bookmarkFilters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    return filtered
  }, [bookmarks, bookmarkFilters])

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = [...collections]

    // Apply filters
    if (collectionFilters.searchQuery) {
      const query = collectionFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(collection => 
        collection.name?.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
      )
    }

    if (collectionFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(collection =>
        collection.creator_name && collectionFilters.selectedCreators.includes(collection.creator_name)
      )
    }

    if (collectionFilters.selectedParents.length > 0) {
      filtered = filtered.filter(collection =>
        collection.parent_id && collectionFilters.selectedParents.includes(collection.parent_id)
      )
    }

    if (collectionFilters.hasBookmarks !== null) {
      filtered = filtered.filter(collection => {
        const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length
        return collectionFilters.hasBookmarks ? bookmarkCount > 0 : bookmarkCount === 0
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (collectionFilters.sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'bookmark_count':
          aValue = bookmarks.filter(b => b.collection_id === a.id).length
          bValue = bookmarks.filter(b => b.collection_id === b.id).length
          break
        default: // created_at
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }

      if (typeof aValue === 'string') {
        return collectionFilters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return collectionFilters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    return filtered
  }, [collections, collectionFilters, bookmarks])

  // Clear all filters
  const clearBookmarkFilters = () => {
    setBookmarkFilters({
      searchQuery: '',
      selectedTags: [],
      selectedCollections: [],
      selectedCreators: [],
      dateRange: null,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  const clearCollectionFilters = () => {
    setCollectionFilters({
      searchQuery: '',
      selectedCreators: [],
      selectedParents: [],
      hasBookmarks: null,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  return {
    // Filters state
    bookmarkFilters,
    collectionFilters,
    setBookmarkFilters,
    setCollectionFilters,
    
    // UI state
    showBookmarkFilters,
    showCollectionFilters,
    setShowBookmarkFilters,
    setShowCollectionFilters,
    
    // Filter options
    allTags,
    allBookmarkCreators,
    allCollectionCreators,
    allCollectionNames,
    
    // Filtered results
    filteredBookmarks,
    filteredCollections,
    
    // Helper functions
    clearBookmarkFilters,
    clearCollectionFilters
  }
}