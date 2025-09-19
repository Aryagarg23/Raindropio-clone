import React, { useState } from "react"
import { ChevronDown, Highlighter } from "lucide-react"
import ProfileIcon from "../../../ProfileIcon"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"

interface HighlightsDetailsViewProps {
  annotations: any[]
  highlights: any[]
}

export function HighlightsDetailsView({
  annotations,
  highlights
}: HighlightsDetailsViewProps) {
  const [isExpanded, setIsExpanded] = useState<{ [key: string]: boolean }>({})

  // Filter highlights that have annotations
  const highlightsWithAnnotations = highlights.filter(highlight => 
    annotations.some(ann => ann.highlight_id === highlight.highlight_id)
  )

  if (highlightsWithAnnotations.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Highlighter className="w-5 h-5 text-yellow-600" />
          Highlights & Annotations
          <span className="text-sm text-grey-accent-500 bg-grey-accent-100 px-2 py-1 rounded-full">
            {highlightsWithAnnotations.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {highlightsWithAnnotations.map((highlight) => {
            const highlightComments = annotations.filter(ann => ann.highlight_id === highlight.highlight_id)
            
            return (
              <div key={highlight.highlight_id} className="border border-grey-accent-200 rounded-lg overflow-hidden">
                {/* Highlight preview */}
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-12 bg-yellow-400 rounded-full flex-shrink-0"></div>
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
                              
                              {/* Like count (read-only) */}
                              {annotation.like_count > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-grey-accent-500">
                                  <span>❤️ {annotation.like_count}</span>
                                </div>
                              )}
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
