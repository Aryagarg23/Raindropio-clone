import React from "react"
import { X, Plus } from "lucide-react"

interface BookmarkTagManagerProps {
  bookmarkTags: string[]
  tagInput: string
  showTagSuggestions: boolean
  availableTags: { tag: string; usage_count: number }[]
  onUpdateTags: (tags: string[]) => Promise<void>
  onSetTagInput: (input: string) => void
  onSetShowTagSuggestions: (show: boolean) => void
}

export function BookmarkTagManager({
  bookmarkTags,
  tagInput,
  showTagSuggestions,
  availableTags,
  onUpdateTags,
  onSetTagInput,
  onSetShowTagSuggestions
}: BookmarkTagManagerProps) {
  const addTag = (tag: string) => {
    if (!tag.trim()) return

    const newTags = [...bookmarkTags]
    if (!newTags.includes(tag.trim())) {
      newTags.push(tag.trim())
      onUpdateTags(newTags)
    }
    onSetTagInput('')
    onSetShowTagSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = bookmarkTags.filter(tag => tag !== tagToRemove)
    onUpdateTags(newTags)
  }

  const getFilteredSuggestions = () => {
    const input = tagInput.toLowerCase().trim()
    return availableTags
      .filter(({ tag }) => tag.toLowerCase().includes(input))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-grey-accent-700 mb-2">
        Bookmark Tags
      </label>

      {/* Existing Tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {bookmarkTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              title={`Remove ${tag} tag`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag Input with Autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => {
            onSetTagInput(e.target.value)
            onSetShowTagSuggestions(e.target.value.trim().length > 0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (tagInput.trim()) {
                addTag(tagInput)
              }
            } else if (e.key === 'Escape') {
              onSetShowTagSuggestions(false)
            }
          }}
          onFocus={() => onSetShowTagSuggestions(tagInput.trim().length > 0)}
          onBlur={() => {
            setTimeout(() => onSetShowTagSuggestions(false), 200)
          }}
          placeholder="Add tags (press Enter)..."
          className="w-full px-3 py-2 text-sm border border-grey-accent-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Tag Suggestions Dropdown */}
        {showTagSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-grey-accent-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {getFilteredSuggestions().length > 0 ? (
              <>
                {getFilteredSuggestions().map(({ tag, usage_count }) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="w-full px-3 py-2 text-left hover:bg-grey-accent-50 flex items-center justify-between text-sm border-b border-grey-accent-100 last:border-b-0"
                  >
                    <span className="font-medium text-grey-accent-900">{tag}</span>
                    <span className="text-xs text-grey-accent-500 bg-grey-accent-100 px-2 py-0.5 rounded-full">
                      {usage_count}
                    </span>
                  </button>
                ))}
                {/* Add option to create new tag */}
                {!availableTags.some(({ tag }) => tag.toLowerCase() === tagInput.toLowerCase()) && (
                  <button
                    onClick={() => addTag(tagInput)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600 text-sm border-t border-grey-accent-100"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-3 h-3" />
                      Create "{tagInput.trim()}"
                    </span>
                  </button>
                )}
              </>
            ) : tagInput.trim() ? (
              <button
                onClick={() => addTag(tagInput)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 text-blue-600 text-sm"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3 h-3" />
                  Create "{tagInput.trim()}"
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 text-sm text-grey-accent-500">
                Start typing to see suggestions...
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-grey-accent-500 mt-1">
        Press Enter to add tags • Tags help organize and find bookmarks
      </p>
    </div>
  )
}