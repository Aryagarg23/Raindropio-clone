import React from "react"
import CommonFilters from "../shared/CommonFilters"

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_at: string
  created_by: string
}

interface BookmarkFiltersProps {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  bookmarkFilters: {
    searchQuery: string
    selectedTags: string[]
    selectedCollections: string[]
    selectedCreators: string[]
    dateRange: { start: Date; end: Date } | null
    sortBy: 'created_at' | 'title' | 'updated_at'
    sortOrder: 'asc' | 'desc'
  }
  setBookmarkFilters: React.Dispatch<React.SetStateAction<{
    searchQuery: string
    selectedTags: string[]
    selectedCollections: string[]
    selectedCreators: string[]
    dateRange: { start: Date; end: Date } | null
    sortBy: 'created_at' | 'title' | 'updated_at'
    sortOrder: 'asc' | 'desc'
  }>>
  advancedFilteredBookmarks: any[]
  allTags: string[]
  collections: ExtendedCollection[]
  allCreators: string[]
}

const BookmarkFilters: React.FC<BookmarkFiltersProps> = ({
  showFilters,
  setShowFilters,
  bookmarkFilters,
  setBookmarkFilters,
  advancedFilteredBookmarks,
  allTags,
  collections,
  allCreators
}) => {
  const config = {
    showSearch: true,
    showTags: true,
    showCollections: true,
    showCreators: true,
    showDateRange: true,
    showSort: true,
    sortOptions: [
      { value: 'created_at', label: 'Date Created' },
      { value: 'updated_at', label: 'Date Modified' },
      { value: 'title', label: 'Title' }
    ]
  }

  const data = {
    allTags,
    collections: collections.map(c => ({ id: c.id, name: c.name })),
    allCreators,
    filteredCount: advancedFilteredBookmarks.length,
    additionalStats: [
      { label: 'unique tags', value: allTags.length },
      { label: 'collections', value: collections.length }
    ]
  }

  const handleClearAll = () => {
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

  return (
    <CommonFilters
      title="Advanced Filters"
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      filters={bookmarkFilters}
      setFilters={setBookmarkFilters}
      config={config}
      data={data}
      onClearAll={handleClearAll}
    />
  )
}

export default BookmarkFilters