import React, { useState } from "react"
import { MessageCircle, ChevronDown, Heart, Highlighter } from "lucide-react"
import ProfileIcon from "../../../ProfileIcon"

interface HighlightsDiscussionProps {
  bookmark: any
  annotations: any[]
  highlights: any[]
  user: any
  teamId: string
  commentInputs: { [key: string]: string }
  onCreateAnnotation: (bookmarkId: string, content: string, highlightId?: string) => Promise<any>
  onToggleAnnotationLike: (annotationId: string) => Promise<void>
  onDeleteAnnotation: (annotationId: string) => Promise<void>
  onSetCommentInputs: (inputs: { [key: string]: string }) => void
}

export function HighlightsDiscussion({
  bookmark,
  annotations,
  highlights,
  user,
  teamId,
  commentInputs,
  onCreateAnnotation,
  onToggleAnnotationLike,
  onDeleteAnnotation,
  onSetCommentInputs
}: HighlightsDiscussionProps) {
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({})
  const [localCommentInputs, setLocalCommentInputs] = useState<{ [key: string]: string }>({})

  // Primary state management - use local state and sync with parent when available
  const handleCommentInputChange = (newInputs: { [key: string]: string }) => {
    console.log('🔧 handleCommentInputChange called with:', newInputs)
    setLocalCommentInputs(newInputs)
    
    // Also try to update parent state if available
    if (onSetCommentInputs) {
      try {
        onSetCommentInputs(newInputs)
      } catch (error) {
        console.error('🔧 Error calling parent onSetCommentInputs:', error)
      }
    }
  }

  console.log('🔧 HighlightsDiscussion state:', {
    propsCommentInputs: commentInputs,
    localCommentInputs,
    onSetCommentInputs: typeof onSetCommentInputs,
    highlightsCount: highlights.length,
    annotationsCount: annotations.length
  })

  // Filter highlights that have annotations
  const highlightsWithAnnotations = highlights.filter(highlight => 
    annotations.some(ann => ann.highlight_id === highlight.highlight_id)
  )

  if (highlightsWithAnnotations.length === 0) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-grey-accent-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Highlighter className="w-6 h-6 text-yellow-600" />
          <h2 className="text-2xl font-bold text-grey-accent-900">
            Highlights & Discussion
          </h2>
          <span className="text-sm text-grey-accent-500 bg-grey-accent-100 px-2 py-1 rounded-full">
            {highlightsWithAnnotations.length}
          </span>
        </div>

        <div className="space-y-6">
          {highlightsWithAnnotations.map((highlight) => {
            const highlightComments = annotations.filter(ann => ann.highlight_id === highlight.highlight_id)
            
            return (
              <div key={highlight.highlight_id} className="bg-white rounded-lg shadow-sm border border-grey-accent-200 overflow-hidden">
                {/* Highlight preview */}
                <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-16 bg-yellow-400 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-grey-accent-900 font-medium leading-relaxed mb-3">
                        "{highlight.selected_text}"
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-grey-accent-600">
                          <ProfileIcon 
                            user={{
                              avatar_url: highlight.creator_avatar,
                              full_name: highlight.creator_name,
                            }}
                            size="xs" 
                          />
                          <span>Highlighted by {highlight.creator_name}</span>
                          <span>•</span>
                          <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => setIsExpanded(prev => ({ 
                            ...prev, 
                            [highlight.highlight_id]: !prev[highlight.highlight_id] 
                          }))}
                          className="flex items-center gap-2 text-sm text-grey-accent-600 hover:text-grey-accent-800 bg-white px-3 py-1.5 rounded-full border border-grey-accent-200 hover:border-grey-accent-300 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{highlightComments.length} comment{highlightComments.length !== 1 ? 's' : ''}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                            isExpanded[highlight.highlight_id] ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable discussion section */}
                {isExpanded[highlight.highlight_id] && (
                  <div className="bg-gradient-to-b from-blue-50/30 to-white">
                    {/* Discussion header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100">
                      <h3 className="text-lg font-semibold text-grey-accent-800 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Discussion
                      </h3>
                    </div>

                    {/* Comments */}
                    <div className="p-6 space-y-4">
                      {highlightComments
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((annotation) => (
                          <div key={annotation.annotation_id} className="flex gap-3">
                            <ProfileIcon 
                              user={{
                                avatar_url: annotation.creator_avatar,
                                full_name: annotation.creator_name,
                              }}
                              size="sm" 
                            />
                            <div className="flex-1">
                              <div className="bg-grey-accent-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm text-grey-accent-900">
                                    {annotation.creator_name}
                                  </span>
                                  <span className="text-xs text-grey-accent-500">
                                    {new Date(annotation.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-grey-accent-700 text-sm leading-relaxed">
                                  {annotation.content}
                                </p>
                              </div>
                              
                              {/* Like button */}
                              <div className="flex items-center gap-2 mt-2">
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
                                
                                {/* Delete button for own comments */}
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
                        ))}

                      {/* Add comment form */}
                      <div className="flex gap-3 pt-4 border-t border-grey-accent-100">
                        <ProfileIcon user={user} size="sm" />
                        <div className="flex-1">
                          <textarea
                            placeholder="Add to the discussion..."
                            className="w-full px-4 py-3 border border-grey-accent-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-grey-accent-50"
                            rows={3}
                            value={localCommentInputs[highlight.highlight_id] || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              console.log('🔧 Textarea onChange:', {
                                highlightId: highlight.highlight_id,
                                newValue,
                                currentLocalValue: localCommentInputs[highlight.highlight_id]
                              })
                              
                              handleCommentInputChange({
                                ...localCommentInputs,
                                [highlight.highlight_id]: newValue
                              })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                const content = localCommentInputs[highlight.highlight_id]?.trim()
                                if (content && onCreateAnnotation) {
                                  onCreateAnnotation(bookmark.id, content, highlight.highlight_id)
                                  handleCommentInputChange({
                                    ...localCommentInputs,
                                    [highlight.highlight_id]: ''
                                  })
                                }
                              }
                            }}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-grey-accent-500">
                              Press Enter to send, Shift+Enter for new line
                            </span>
                            <button
                              onClick={() => {
                                console.log('🔧 Button onClick:', {
                                  highlightId: highlight.highlight_id,
                                  localCommentInputs,
                                  content: localCommentInputs[highlight.highlight_id]?.trim()
                                })
                                
                                const content = localCommentInputs[highlight.highlight_id]?.trim()
                                if (content && onCreateAnnotation) {
                                  onCreateAnnotation(bookmark.id, content, highlight.highlight_id)
                                  handleCommentInputChange({
                                    ...localCommentInputs,
                                    [highlight.highlight_id]: ''
                                  })
                                }
                              }}
                              disabled={!localCommentInputs[highlight.highlight_id]?.trim()}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Comment
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
        </div>
      </div>
    </div>
  )
}
