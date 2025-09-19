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

  return (
    <div className="w-96 bg-grey-accent-50 border-l border-grey-accent-200 flex flex-col">
      <div className="p-4 border-b border-grey-accent-200 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-grey-accent-600" />
          <h3 className="font-semibold text-grey-accent-900">General Comments</h3>
        </div>
        <p className="text-xs text-grey-accent-600 mb-3">
          Document-wide comments • Not linked to highlights
        </p>

        {/* Tag Management */}
        <BookmarkTagManager
          bookmarkTags={bookmarkTags}
          tagInput={tagInput}
          showTagSuggestions={showTagSuggestions}
          availableTags={availableTags}
          onUpdateTags={onUpdateTags}
          onSetTagInput={onSetTagInput}
          onSetShowTagSuggestions={onSetShowTagSuggestions}
        />

        {/* New General Comment Input */}
        <div className="space-y-2">
          <textarea
            value={newAnnotation}
            onChange={(e) => onSetNewAnnotation(e.target.value)}
            placeholder="Add a general comment (not tied to any highlight)..."
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
            <MessageCircle className="w-4 h-4 mr-2 inline" />
            Add General Comment
          </button>
        </div>
      </div>

      {/* General Annotations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Highlight-specific annotations */}
        {highlights.map((highlight) => {
          const highlightComments = annotations.filter(ann => ann.highlight_id === highlight.highlight_id)
          if (highlightComments.length === 0) return null

          return (
            <div key={highlight.highlight_id} className="bg-white rounded-lg shadow-sm border border-grey-accent-200 overflow-hidden">
              {/* Highlight preview */}
              <div className="p-4 border-b border-grey-accent-200">
                <div className="flex items-start gap-3">
                  <div
                    className="w-4 h-4 rounded mt-1 flex-shrink-0"
                    style={{ backgroundColor: highlight.color }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-grey-accent-900 line-clamp-3">
                      "{highlight.selected_text}"
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setIsExpanded(prev => ({ ...prev, [highlight.highlight_id]: !prev[highlight.highlight_id] }))}
                        className="flex items-center gap-1 text-xs text-grey-accent-600 hover:text-grey-accent-800"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 text-grey-accent-400 ${
                          isExpanded[highlight.highlight_id] ? 'rotate-180 text-blue-500' : ''
                        }`} />
                        {highlightComments.length} comment{highlightComments.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expandable chat-like conversation section */}
              {isExpanded[highlight.highlight_id] && (
                <div className="bg-gradient-to-b from-blue-50/50 to-white border-t border-blue-100">
                  {/* Conversation header */}
                  <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-grey-accent-900">
                        Team Discussion ({highlightComments.length})
                      </h5>
                      <div className="flex-1"></div>
                      <span className="text-xs text-grey-accent-500 bg-white px-2 py-1 rounded-full">
                        {highlightComments.length > 0 ? 'Active' : 'No comments yet'}
                      </span>
                    </div>
                  </div>

                  {/* Chat messages container */}
                  <div className="px-6 py-4 max-h-96 overflow-y-auto">
                    {highlightComments.length > 0 ? (
                      <div className="space-y-4">
                        {highlightComments
                          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                          .map((comment, index) => (
                            <div key={comment.annotation_id} className="flex gap-3 animate-fade-in">
                              <ProfileIcon
                                user={{
                                  avatar_url: comment.creator_avatar,
                                  full_name: comment.creator_name,
                                  email: comment.creator_id
                                }}
                                size="lg"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-grey-accent-100 relative">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-grey-accent-900 text-sm">{comment.creator_name}</span>
                                    <span className="text-grey-accent-400 text-xs">
                                      {new Date(comment.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-grey-accent-800 text-sm leading-relaxed">{comment.content}</p>

                                  {/* Chat bubble tail */}
                                  <div className="absolute left-0 top-4 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-white transform -translate-x-1"></div>
                                </div>
                                <div className="text-xs text-grey-accent-400 mt-1 ml-4">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-grey-accent-300 mx-auto mb-3" />
                        <p className="text-grey-accent-500 text-sm">No comments yet on this highlight</p>
                        <p className="text-grey-accent-400 text-xs mt-1">Be the first to start the discussion!</p>
                      </div>
                    )}
                  </div>

                  {/* Add comment input */}
                  <div className="px-6 py-4 border-t border-blue-100 bg-white">
                    <div className="flex gap-3">
                      <ProfileIcon
                        user={{
                          avatar_url: user?.user_metadata?.avatar_url,
                          full_name: user?.user_metadata?.full_name,
                          email: user?.email
                        }}
                        size="md"
                      />
                      <div className="flex-1">
                        <textarea
                          placeholder="Add to the discussion..."
                          className="w-full px-4 py-2 border border-grey-accent-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-grey-accent-50"
                          rows={2}
                          value={commentInputs[highlight.highlight_id] || ''}
                          onChange={(e) => onSetCommentInputs({
                            ...commentInputs,
                            [highlight.highlight_id]: e.target.value
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              const content = commentInputs[highlight.highlight_id]?.trim()
                              if (content) {
                                onCreateAnnotation(bookmark.id, content, highlight.highlight_id)
                                onSetCommentInputs({
                                  ...commentInputs,
                                  [highlight.highlight_id]: ''
                                })
                              }
                            }
                          }}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-grey-accent-400">
                            Press Enter to send, Shift+Enter for new line
                          </span>
                          <button
                            onClick={() => {
                              const content = commentInputs[highlight.highlight_id]?.trim()
                              if (content) {
                                onCreateAnnotation(bookmark.id, content, highlight.highlight_id)
                                onSetCommentInputs({
                                  ...commentInputs,
                                  [highlight.highlight_id]: ''
                                })
                              }
                            }}
                            disabled={!commentInputs[highlight.highlight_id]?.trim()}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Orphaned Annotations List */}
        <div className="space-y-4">
          {annotations
            .filter(ann => !ann.highlight_id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((annotation) => (
              <div key={annotation.annotation_id} className="bg-white rounded-lg p-3 shadow-sm border border-grey-accent-200">
                <div className="flex items-start gap-3">
                  <ProfileIcon
                    user={{
                      avatar_url: annotation.creator_avatar,
                      full_name: annotation.creator_name,
                      email: annotation.creator_id
                    }}
                    size="lg"
                  />
                  <div className="flex-1">
                    <p className="text-grey-accent-900 text-sm mb-2">{annotation.content}</p>
                    <div className="flex items-center gap-2 text-xs text-grey-accent-600">
                      <span>{annotation.creator_name}</span>
                      <span>•</span>
                      <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {annotations.filter(ann => !ann.highlight_id).length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-grey-accent-300 mx-auto mb-3" />
              <p className="text-grey-accent-600 text-sm">No general comments yet</p>
              <p className="text-grey-accent-500 text-xs">
                Add a general comment about this document!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}