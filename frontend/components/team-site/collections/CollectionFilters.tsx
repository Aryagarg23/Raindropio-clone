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
  profiles?: {
    user_id: string
    full_name?: string
    avatar_url?: string
  }
  bookmarkCount?: number
  children?: ExtendedCollection[]
  parentId?: string
}

interface CollectionFiltersProps {
  showCollectionFilters: boolean
  setShowCollectionFilters: (show: boolean) => void
  collectionFilters: {
    searchQuery: string
    selectedCreators: string[]
    selectedParents: string[]
    hasBookmarks: boolean | null
    dateRange: { start: Date; end: Date } | null
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  setCollectionFilters: React.Dispatch<React.SetStateAction<{
    searchQuery: string
    selectedCreators: string[]
    selectedParents: string[]
    hasBookmarks: boolean | null
    dateRange: { start: Date; end: Date } | null
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }>>
  filteredCollections: ExtendedCollection[]
  allCollectionCreators: string[]
  parentCollections: ExtendedCollection[]
  allFlatCollections: ExtendedCollection[]
}

const CollectionFilters: React.FC<CollectionFiltersProps> = ({
  showCollectionFilters,
  setShowCollectionFilters,
  collectionFilters,
  setCollectionFilters,
  filteredCollections,
  allCollectionCreators,
  parentCollections,
  allFlatCollections
}) => {
  const config = {
    showSearch: true,
    showCreators: true,
    showParents: true,
    showBookmarkStatus: true,
    showDateRange: true,
    showSort: true,
    sortOptions: [
      { value: 'created_at', label: 'Date Created' },
      { value: 'updated_at', label: 'Date Modified' },
      { value: 'name', label: 'Name' }
    ]
  }

  const data = {
    allCreators: allCollectionCreators,
    parentCollections: parentCollections.map(c => ({ id: c.id, name: c.name })),
    filteredCount: filteredCollections.length,
    totalCount: allFlatCollections.length,
    additionalStats: [
      { label: 'root collections', value: parentCollections.length }
    ]
  }

  const handleClearAll = () => {
    setCollectionFilters({
      searchQuery: '',
      selectedCreators: [],
      selectedParents: [],
      hasBookmarks: null,
      dateRange: null,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  return (
    <CommonFilters
      title="Collection Filters"
      showFilters={showCollectionFilters}
      setShowFilters={setShowCollectionFilters}
      filters={collectionFilters}
      setFilters={setCollectionFilters}
      config={config}
      data={data}
      onClearAll={handleClearAll}
    />
  )
}

export default CollectionFilters