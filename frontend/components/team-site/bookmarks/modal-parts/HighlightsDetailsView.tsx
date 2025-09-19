import React, { useState } from "react"
import { ChevronDown, Highlighter, Trash2, Heart } from "lucide-react"
import ProfileIcon from "../../../ProfileIcon"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { DeleteConfirmationModal } from "../../../ui/DeleteConfirmationModal"
import { useDeleteConfirmation } from "../../../../hooks/useDeleteConfirmation"

// Helper function to create highlight color styles
const getHighlightStyles = (color: string) => {
  // Handle different color formats and edge cases
  let hex = color.replace('#', '')
  
  // Handle 3-digit hex colors
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Ensure we have a valid 6-digit hex
  if (hex.length !== 6) {
    console.warn('Invalid color format:', color, 'falling back to yellow')
    hex = 'ffeb3b' // Default yellow
  }
  
  try {
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error('Invalid RGB values')
    }
    
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      accentColor: `rgb(${r}, ${g}, ${b})`
    }
  } catch (error) {
    console.warn('Color parsing error:', error, 'using fallback')
    return {
      backgroundColor: 'rgba(255, 235, 59, 0.1)',
      borderColor: 'rgba(255, 235, 59, 0.3)',
      accentColor: 'rgb(255, 235, 59)'
    }
  }
}

interface HighlightsDetailsViewProps {
  annotations: any[]
  highlights: any[]
  bookmark?: any
  user?: any
  onDeleteAnnotation?: (annotationId: string) => Promise<void>
  onDeleteHighlight?: (highlightId: string, selectedBookmarkId?: string) => Promise<void>
}

export function HighlightsDetailsView({
  annotations,
  highlights,
  bookmark,
  user,
  onDeleteAnnotation,
  onDeleteHighlight
}: HighlightsDetailsViewProps) {
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({})
  const { confirmationState, isLoading, showConfirmation, hideConfirmation, handleConfirm } = useDeleteConfirmation()

  // Show all highlights in details view (not just those with annotations)
  const highlightsToShow = highlights

  if (highlightsToShow.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Highlighter className="w-5 h-5 text-yellow-600" />
          Highlights & Annotations
          <span className="text-sm text-grey-accent-500 bg-grey-accent-100 px-2 py-1 rounded-full">
            {highlightsToShow.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {highlightsToShow.map((highlight) => {
            const highlightComments = annotations.filter(ann => ann.highlight_id === highlight.highlight_id)
            const highlightColor = highlight.color || '#ffeb3b'
            const colorStyles = getHighlightStyles(highlightColor)
            
            return (
              <div key={highlight.highlight_id} className="border border-grey-accent-200 rounded-lg overflow-hidden">
                {/* Highlight preview */}
                <div 
                  className="p-4 border-b"
                  style={{
                    backgroundColor: colorStyles.backgroundColor,
                    borderBottomColor: colorStyles.borderColor
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-1 h-12 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: colorStyles.accentColor
                      }}
                    ></div>
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
                        <div className="flex items-center gap-2">
                          {highlightComments.length > 0 && (
                            <button
                              onClick={() => setIsExpanded(prev => ({ 
                                ...prev, 
                                [highlight.highlight_id]: !prev[highlight.highlight_id] 
                              }))}
                              className="flex items-center gap-2 text-sm text-grey-accent-600 hover:text-grey-accent-800 bg-white px-3 py-1.5 rounded-full border border-grey-accent-200 hover:border-grey-accent-300 transition-all"
                            >
                              <span>{highlightComments.length} annotation{highlightComments.length !== 1 ? 's' : ''}</span>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                                isExpanded[highlight.highlight_id] ? 'rotate-180' : ''
                              }`} />
                            </button>
                          )}
                          
                          {/* Delete highlight button */}
                          {user && highlight.creator_id === user.id && onDeleteHighlight && (
                            <button
                              onClick={() => {
                                showConfirmation({
                                  title: 'Delete Highlight',
                                  message: `Are you sure you want to delete this highlight${highlightComments.length > 0 ? `? This will convert ${highlightComments.length} annotation${highlightComments.length !== 1 ? 's' : ''} to general comments.` : '?'}`,
                                  confirmText: 'Delete Highlight',
                                  variant: 'danger',
                                  onConfirm: () => onDeleteHighlight(highlight.highlight_id, bookmark?.id)
                                })
                              }}
                              className="flex items-center gap-1 text-sm text-grey-accent-500 hover:text-red-600 bg-white px-2 py-1.5 rounded-full border border-grey-accent-200 hover:border-red-300 transition-all"
                              title="Delete highlight"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable annotations section */}
                {highlightComments.length > 0 && isExpanded[highlight.highlight_id] && (
                  <div className="bg-gradient-to-b from-blue-50/30 to-white">
                    {/* Annotations header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100">
                      <h4 className="text-sm font-semibold text-grey-accent-800">
                        Annotations ({highlightComments.length})
                      </h4>
                    </div>

                    {/* Annotations list */}
                    <div className="p-4 space-y-3">
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
                              
                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-2">
                                {/* Like count (read-only) */}
                                {annotation.like_count > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-grey-accent-500">
                                    <Heart className="w-3 h-3 fill-current text-red-500" />
                                    <span>{annotation.like_count}</span>
                                  </div>
                                )}
                                
                                {/* Delete button for own annotations */}
                                {user && annotation.creator_id === user.id && onDeleteAnnotation && (
                                  <button
                                    onClick={() => {
                                      showConfirmation({
                                        title: 'Delete Annotation',
                                        message: 'Are you sure you want to delete this annotation? This action cannot be undone.',
                                        confirmText: 'Delete Annotation',
                                        variant: 'danger',
                                        onConfirm: () => onDeleteAnnotation(annotation.annotation_id)
                                      })
                                    }}
                                    className="text-xs text-grey-accent-500 hover:text-red-600 px-2 py-1 rounded-full hover:bg-red-50 transition-colors ml-auto"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
