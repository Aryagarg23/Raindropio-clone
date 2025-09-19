import React from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { Button } from "../../../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs"
import ProfileIcon from "../../../ProfileIcon"
import { ImprovedReaderView } from "./ImprovedReaderView"
import { ImprovedProxyView } from "./ImprovedProxyView"

interface BookmarkContentViewerProps {
  viewMode: 'reader' | 'proxy' | 'details'
  bookmark: any
  extractedContent: any
  isLoadingContent: boolean
  proxyContent: string | null
  isLoadingProxy: boolean
  highlights: any[]
  annotations: any[]
  user?: any
  teamId?: string
  commentInputs?: { [key: string]: string }
  onViewModeChange: (mode: 'reader' | 'proxy' | 'details') => void
  onExtractContent: (url: string) => Promise<void>
  onFetchProxyContent: (url: string) => Promise<void>
  
  // Highlighting props
  onSetShowHighlightTooltip?: (show: boolean) => void
  onSetTooltipPosition?: (position: { x: number; y: number }) => void
  onSetPendingSelection?: (selection: { text: string; startOffset: number; endOffset: number } | null) => void
  onCreateAnnotation?: (bookmarkId: string, content: string, highlightId?: string) => Promise<any>
  onToggleAnnotationLike?: (annotationId: string) => Promise<void>
  onDeleteAnnotation?: (annotationId: string) => Promise<void>
  onSetCommentInputs?: (inputs: { [key: string]: string }) => void
}

export function BookmarkContentViewer({
  viewMode,
  bookmark,
  extractedContent,
  isLoadingContent,
  proxyContent,
  isLoadingProxy,
  highlights,
  annotations,
  user,
  teamId,
  commentInputs,
  onViewModeChange,
  onExtractContent,
  onFetchProxyContent,
  onSetShowHighlightTooltip,
  onSetTooltipPosition,
  onSetPendingSelection,
  onCreateAnnotation,
  onToggleAnnotationLike,
  onDeleteAnnotation,
  onSetCommentInputs
}: BookmarkContentViewerProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* View mode tabs */}
      <div className="border-b border-grey-accent-200 bg-grey-accent-50 px-6 py-3">
        <Tabs value={viewMode} onValueChange={(value: string) => onViewModeChange(value as 'reader' | 'proxy' | 'details')}>
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="reader">Reader</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content display */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={viewMode} className="h-full">
          <TabsContent value="reader" className="h-full m-0">
            <ImprovedReaderView
              url={bookmark.url}
              extractedContent={extractedContent}
              isLoadingContent={isLoadingContent}
              onRetryExtraction={() => onExtractContent(bookmark.url)}
              highlights={highlights}
              annotations={annotations}
              bookmark={bookmark}
              user={user}
              teamId={teamId}
              commentInputs={commentInputs}
              onSetShowHighlightTooltip={onSetShowHighlightTooltip}
              onSetTooltipPosition={onSetTooltipPosition}
              onSetPendingSelection={onSetPendingSelection}
              onCreateAnnotation={onCreateAnnotation}
              onToggleAnnotationLike={onToggleAnnotationLike}
              onDeleteAnnotation={onDeleteAnnotation}
              onSetCommentInputs={onSetCommentInputs}
            />
          </TabsContent>

          <TabsContent value="proxy" className="h-full m-0">
            <ImprovedProxyView
              url={bookmark.url}
              proxyContent={proxyContent}
              isLoadingProxy={isLoadingProxy}
              onFetchProxyContent={() => onFetchProxyContent(bookmark.url)}
            />
          </TabsContent>

          <TabsContent value="details" className="h-full m-0 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Bookmark metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookmark Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-grey-accent-700 mb-1">
                      Title
                    </label>
                    <p className="text-grey-accent-900">{bookmark.title || 'No title'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-accent-700 mb-1">
                      URL
                    </label>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {bookmark.url}
                    </a>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-accent-700 mb-1">
                      Description
                    </label>
                    <p className="text-grey-accent-700">{bookmark.description || 'No description'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-grey-accent-700 mb-1">
                      Created
                    </label>
                    <p className="text-grey-accent-700">
                      {new Date(bookmark.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Highlights */}
              {highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Highlights ({highlights.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {highlights.map((highlight) => (
                        <div key={highlight.highlight_id} className="border-l-4 border-yellow-400 pl-4">
                          <div className="bg-yellow-50 p-3 rounded">
                            <p className="text-grey-accent-900 mb-2">"{highlight.selected_text}"</p>
                            <div className="flex items-center gap-2 text-xs text-grey-accent-600">
                              <span>Highlighted by {highlight.creator_name}</span>
                              <span>•</span>
                              <span>{new Date(highlight.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Annotations */}
              {annotations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Annotations ({annotations.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {annotations.map((annotation) => (
                        <div key={annotation.annotation_id} className="flex gap-3">
                          <ProfileIcon
                            user={{
                              avatar_url: annotation.creator_avatar,
                              full_name: annotation.creator_name,
                              email: annotation.creator_id
                            }}
                            size="md"
                          />
                          <div className="flex-1">
                            <p className="text-grey-accent-900 mb-1">{annotation.content}</p>
                            <div className="flex items-center gap-2 text-xs text-grey-accent-600">
                              <span>{annotation.creator_name}</span>
                              <span>•</span>
                              <span>{new Date(annotation.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}