import React from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { ChevronDown, ChevronRight, Search } from "lucide-react"

interface FilterOption {
  id: string
  name: string
  color?: string
}

interface FilterConfig {
  showSearch?: boolean
  showTags?: boolean
  showCollections?: boolean
  showCreators?: boolean
  showParents?: boolean
  showBookmarkStatus?: boolean
  showDateRange?: boolean
  showSort?: boolean
  sortOptions?: Array<{ value: string; label: string }>
  customFilters?: React.ReactNode
}

interface CommonFiltersProps {
  title: string
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  filters: {
    searchQuery: string
    selectedTags?: string[]
    selectedCollections?: string[]
    selectedCreators?: string[]
    selectedParents?: string[]
    hasBookmarks?: boolean | null
    dateRange?: { start: Date; end: Date } | null
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }
  setFilters: React.Dispatch<React.SetStateAction<any>>
  config: FilterConfig
  data: {
    allTags?: string[]
    collections?: FilterOption[]
    allCreators?: string[]
    parentCollections?: FilterOption[]
    filteredCount: number
    totalCount?: number
    additionalStats?: Array<{ label: string; value: string | number }>
  }
  onClearAll: () => void
}

const CommonFilters: React.FC<CommonFiltersProps> = ({
  title,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  config,
  data,
  onClearAll
}) => {
  const renderTagFilter = () => {
    if (!config.showTags || !data.allTags) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(filters.selectedTags || []).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tag}
                <button
                  onClick={() => setFilters((prev: any) => ({
                    ...prev,
                    selectedTags: prev.selectedTags?.filter((t: string) => t !== tag) || []
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
              if (e.target.value && !(filters.selectedTags || []).includes(e.target.value)) {
                setFilters((prev: any) => ({
                  ...prev,
                  selectedTags: [...(prev.selectedTags || []), e.target.value]
                }))
              }
            }}
            className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            <option value="">Select tags...</option>
            {data.allTags.filter(tag => !(filters.selectedTags || []).includes(tag)).map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  const renderCollectionsFilter = () => {
    if (!config.showCollections || !data.collections) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Collections</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(filters.selectedCollections || []).map(collectionId => {
              const collection = data.collections?.find(c => c.id === collectionId)
              return (
                <span key={collectionId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {collection?.name || 'Unknown'}
                  <button
                    onClick={() => setFilters((prev: any) => ({
                      ...prev,
                      selectedCollections: prev.selectedCollections?.filter((c: string) => c !== collectionId) || []
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
              if (e.target.value && !(filters.selectedCollections || []).includes(e.target.value)) {
                setFilters((prev: any) => ({
                  ...prev,
                  selectedCollections: [...(prev.selectedCollections || []), e.target.value]
                }))
              }
            }}
            className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            <option value="">Select collections...</option>
            {data.collections.filter(c => !(filters.selectedCollections || []).includes(c.id)).map(collection => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  const renderCreatorsFilter = () => {
    if (!config.showCreators || !data.allCreators) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Created By</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(filters.selectedCreators || []).map(creator => (
              <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {creator}
                <button
                  onClick={() => setFilters((prev: any) => ({
                    ...prev,
                    selectedCreators: prev.selectedCreators?.filter((c: string) => c !== creator) || []
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
              if (e.target.value && !(filters.selectedCreators || []).includes(e.target.value)) {
                setFilters((prev: any) => ({
                  ...prev,
                  selectedCreators: [...(prev.selectedCreators || []), e.target.value]
                }))
              }
            }}
            className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            <option value="">Select creators...</option>
            {data.allCreators.filter(creator => !(filters.selectedCreators || []).includes(creator)).map(creator => (
              <option key={creator} value={creator}>{creator}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  const renderParentsFilter = () => {
    if (!config.showParents || !data.parentCollections) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Show Only Children Of</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {(filters.selectedParents || []).map(parentId => {
              const parent = data.parentCollections?.find(c => c.id === parentId)
              return (
                <span key={parentId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {parent?.name || 'Unknown'}
                  <button
                    onClick={() => setFilters((prev: any) => ({
                      ...prev,
                      selectedParents: prev.selectedParents?.filter((p: string) => p !== parentId) || []
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
              if (e.target.value && !(filters.selectedParents || []).includes(e.target.value)) {
                setFilters((prev: any) => ({
                  ...prev,
                  selectedParents: [...(prev.selectedParents || []), e.target.value]
                }))
              }
            }}
            className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            <option value="">Select parent collections...</option>
            {data.parentCollections.filter(c => !(filters.selectedParents || []).includes(c.id)).map(collection => (
              <option key={collection.id} value={collection.id}>{collection.name}</option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  const renderBookmarkStatusFilter = () => {
    if (!config.showBookmarkStatus) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Bookmark Status</label>
        <select
          value={filters.hasBookmarks === null ? 'all' : filters.hasBookmarks ? 'with' : 'empty'}
          onChange={(e) => {
            const value = e.target.value === 'all' ? null : e.target.value === 'with'
            setFilters((prev: any) => ({ ...prev, hasBookmarks: value }))
          }}
          className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
        >
          <option value="all">All Collections</option>
          <option value="with">With Bookmarks</option>
          <option value="empty">Empty Collections</option>
        </select>
      </div>
    )
  }

  const renderSortFilter = () => {
    if (!config.showSort) return null
    
    const sortOptions = config.sortOptions || [
      { value: 'created_at', label: 'Date Created' },
      { value: 'updated_at', label: 'Date Modified' },
      { value: 'title', label: 'Title' },
      { value: 'name', label: 'Name' }
    ]
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy || 'created_at'}
            onChange={(e) => setFilters((prev: any) => ({ ...prev, sortBy: e.target.value }))}
            className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => setFilters((prev: any) => ({ ...prev, sortOrder: e.target.value }))}
            className="p-2 border border-grey-accent-300 rounded-md text-sm"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    )
  }

  const renderDateRangeFilter = () => {
    if (!config.showDateRange) return null
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Date Range</label>
        <div className="flex gap-2">
          <Input
            type="date"
            placeholder="From"
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null
              setFilters((prev: any) => ({
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
              setFilters((prev: any) => ({
                ...prev,
                dateRange: prev.dateRange?.start && date ? { start: prev.dateRange.start, end: date } : null
              }))
            }}
            className="text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-accent-900">{title}</h3>
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
        <span>{data.filteredCount} items found</span>
        {data.totalCount && <span>{data.totalCount} total items</span>}
        {data.additionalStats?.map((stat, index) => (
          <span key={index}>{stat.value} {stat.label}</span>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
        >
          Clear All Filters
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          {config.showSearch !== false && (
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
                <Input
                  placeholder="Search..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev: any) => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {renderTagFilter()}
          {renderCollectionsFilter()}
          {renderCreatorsFilter()}
          {renderParentsFilter()}
          {renderBookmarkStatusFilter()}
          {renderSortFilter()}
          {renderDateRangeFilter()}
          
          {/* Custom filters */}
          {config.customFilters}
        </div>
      )}
    </div>
  )
}

export default CommonFilters