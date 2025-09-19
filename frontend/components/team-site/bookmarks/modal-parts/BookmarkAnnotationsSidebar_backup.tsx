import React, { useState } from "react"
import { MessageCircle, ChevronDown, Heart } from "lucide-react"
import ProfileIcon from "../../../ProfileIcon"
import { BookmarkTagManager } from "./BookmarkTagManager"

interface BookmarkAnnotationsSidebarProps {
  bookmark: any
  annotations: any[]
  highlights: any[]
  newAnnotation: string
  user: any
  teamId: string
  bookmarkTags: string[]
  tagInput: string
  showTagSuggestions: boolean
  availableTags: { tag: string; usage_count: number }[]
  commentInputs: { [key: string]: string }
  onCreateAnnotation: (bookmarkId: string, content: string, highlightId?: string) => Promise<any>
  onToggleAnnotationLike: (annotationId: string) => Promise<void>
  onDeleteAnnotation: (annotationId: string) => Promise<void>
  onUpdateTags: (tags: string[]) => Promise<void>
  onSetNewAnnotation: (content: string) => void
  onSetTagInput: (input: string) => void
  onSetShowTagSuggestions: (show: boolean) => void
  onSetCommentInputs: (inputs: { [key: string]: string }) => void
}

export function BookmarkAnnotationsSidebar({
  bookmark,
  annotations,
  highlights,
  newAnnotation,
  user,
  teamId,
  bookmarkTags,
  tagInput,
  showTagSuggestions,
  availableTags,
  commentInputs,
  onCreateAnnotation,
  onToggleAnnotationLike,
  onDeleteAnnotation,
  onUpdateTags,
  onSetNewAnnotation,
  onSetTagInput,
  onSetShowTagSuggestions,
  onSetCommentInputs
}: BookmarkAnnotationsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({})

  // Filter to only general annotations (not linked to highlights)
  const generalAnnotations = annotations.filter(ann => !ann.highlight_id)

  return (
    <div className="w-96 bg-grey-accent-50 border-l border-grey-accent-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-grey-accent-200 bg-white">
        <h3 className="text-lg font-semibold text-grey-accent-900 mb-2">General Discussion</h3>
        <p className="text-sm text-grey-accent-600">
          Comments and notes about this bookmark
        </p>
      </div>

      {/* Tags Section */}
      <div className="p-4 border-b border-grey-accent-200 bg-white">
        <BookmarkTagManager
          bookmarkTags={bookmarkTags}
          tagInput={tagInput}
          showTagSuggestions={showTagSuggestions}
          availableTags={availableTags}
          onUpdateTags={onUpdateTags}
          onSetTagInput={onSetTagInput}
          onSetShowTagSuggestions={onSetShowTagSuggestions}
        />
      </div>

      {/* Add General Comment */}
      <div className="p-4 border-b border-grey-accent-200 bg-white">
        <div className="space-y-3">
          <textarea
            value={newAnnotation}
            onChange={(e) => onSetNewAnnotation(e.target.value)}
            placeholder="Add a general comment about this bookmark..."
            className="w-full px-3 py-2 border border-grey-accent-300 rounded-md resize-none text-sm"
            rows={3}
          />
          <button
            onClick={() => {
              if (newAnnotation.trim()) {
                onCreateAnnotation(bookmark.id, newAnnotation)
                onSetNewAnnotation('')
              }
            }}
            disabled={!newAnnotation.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add General Comment
          </button>
        </div>
      </div>

      {/* General Annotations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-4">
          {generalAnnotations
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((annotation) => (
              <div key={annotation.annotation_id} className="bg-white rounded-lg p-3 shadow-sm border border-grey-accent-200">
                <div className="flex items-start gap-3">
                  <ProfileIcon
                    user={{
                      avatar_url: annotation.creator_avatar,
                      full_name: annotation.creator_name,
                    }}
                    userId={annotation.creator_id}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-grey-accent-900">
                        {annotation.creator_name}
                      </span>
                      <span className="text-xs text-grey-accent-500">
                        {new Date(annotation.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-grey-accent-700 text-sm mb-3 leading-relaxed">
                      {annotation.content}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleAnnotationLike(annotation.annotation_id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                          annotation.user_has_liked 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                            : 'text-grey-accent-600 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${annotation.user_has_liked ? 'fill-current' : ''}`} />
                        <span>{annotation.like_count || 0}</span>
                      </button>
                      {annotation.creator_id === user.id && (
                        <button
                          onClick={() => onDeleteAnnotation(annotation.annotation_id)}
                          className="text-xs text-grey-accent-500 hover:text-red-600 px-2 py-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {generalAnnotations.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-grey-accent-300 mx-auto mb-3" />
              <p className="text-grey-accent-600 text-sm">No general comments yet</p>
              <p className="text-grey-accent-500 text-xs">
                Add a general comment about this bookmark!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
