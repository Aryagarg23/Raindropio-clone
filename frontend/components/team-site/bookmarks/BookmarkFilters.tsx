import React from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ChevronDown, ChevronRight, Search } from "lucide-react"

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
  return (
    <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-accent-900">Advanced Filters</h3>
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
        <span>{advancedFilteredBookmarks.length} bookmarks found</span>
        <span>{allTags.length} unique tags</span>
        <span>{collections.length} collections</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBookmarkFilters({
            searchQuery: '',
            selectedTags: [],
            selectedCollections: [],
            selectedCreators: [],
            dateRange: null,
            sortBy: 'created_at',
            sortOrder: 'desc'
          })}
          className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
        >
          Clear All Filters
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
              <Input
                placeholder="Search title, description, URL..."
                value={bookmarkFilters.searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBookmarkFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tags Filter with Autocomplete */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {bookmarkFilters.selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tag}
                    <button
                      onClick={() => setBookmarkFilters(prev => ({
                        ...prev,
                        selectedTags: prev.selectedTags.filter(t => t !== tag)
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
                  if (e.target.value && !bookmarkFilters.selectedTags.includes(e.target.value)) {
                    setBookmarkFilters(prev => ({
                      ...prev,
                      selectedTags: [...prev.selectedTags, e.target.value]
                    }))
                  }
                }}
                className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="">Select tags...</option>
                {allTags.filter(tag => !bookmarkFilters.selectedTags.includes(tag)).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Collections Filter with Autocomplete */}
          <div>
            <label className="block text-sm font-medium mb-2">Collections</label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {bookmarkFilters.selectedCollections.map(collectionId => {
                  const collection = collections.find(c => c.id === collectionId)
                  return (
                    <span key={collectionId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {collection?.name || 'Unknown'}
                      <button
                        onClick={() => setBookmarkFilters(prev => ({
                          ...prev,
                          selectedCollections: prev.selectedCollections.filter(c => c !== collectionId)
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
                  if (e.target.value && !bookmarkFilters.selectedCollections.includes(e.target.value)) {
                    setBookmarkFilters(prev => ({
                      ...prev,
                      selectedCollections: [...prev.selectedCollections, e.target.value]
                    }))
                  }
                }}
                className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="">Select collections...</option>
                {collections.filter(c => !bookmarkFilters.selectedCollections.includes(c.id)).map(collection => (
                  <option key={collection.id} value={collection.id}>{collection.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Creators Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Created By</label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {bookmarkFilters.selectedCreators.map(creator => (
                  <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {creator}
                    <button
                      onClick={() => setBookmarkFilters(prev => ({
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
                  if (e.target.value && !bookmarkFilters.selectedCreators.includes(e.target.value)) {
                    setBookmarkFilters(prev => ({
                      ...prev,
                      selectedCreators: [...prev.selectedCreators, e.target.value]
                    }))
                  }
                }}
                className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="">Select creators...</option>
                {allCreators.filter(creator => !bookmarkFilters.selectedCreators.includes(creator)).map(creator => (
                  <option key={creator} value={creator}>{creator}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <div className="flex gap-2">
              <select
                value={bookmarkFilters.sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBookmarkFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Modified</option>
                <option value="title">Title</option>
              </select>
              <select
                value={bookmarkFilters.sortOrder}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBookmarkFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="p-2 border border-grey-accent-300 rounded-md text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Date Range - Basic for now */}
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const date = e.target.value ? new Date(e.target.value) : null
                  setBookmarkFilters(prev => ({
                    ...prev,
                    dateRange: date ? { start: date, end: prev.dateRange?.end || date } : null
                  }))
                }}
                className="text-sm"
              />
              <Input
                type="date"
                placeholder="To"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const date = e.target.value ? new Date(e.target.value) : null
                  setBookmarkFilters(prev => ({
                    ...prev,
                    dateRange: prev.dateRange?.start && date ? { start: prev.dateRange.start, end: date } : null
                  }))
                }}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookmarkFilters