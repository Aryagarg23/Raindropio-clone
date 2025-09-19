import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import ProfileIcon from "../../../components/ProfileIcon"
import { ChevronDown, ChevronRight, MessageCircle, Heart, ExternalLink, X, Plus } from "lucide-react"
import { BookmarkModalHeader } from "./modal-parts/BookmarkModalHeader"
import { BookmarkContentViewer } from "./modal-parts/BookmarkContentViewer"
import { BookmarkTagManager } from "./modal-parts/BookmarkTagManager"
import { BookmarkAnnotationsSidebar } from "./modal-parts/BookmarkAnnotationsSidebar"
import { BookmarkHighlightTooltip } from "./modal-parts/BookmarkHighlightTooltip"

interface BookmarkDetailModalProps {
  bookmark: any
  viewMode: 'reader' | 'proxy' | 'details'
  annotations: any[]
  highlights: any[]
  newAnnotation: string
  highlightColor: string
  showHighlightTooltip: boolean
  tooltipPosition: { x: number; y: number }
  pendingSelection: { text: string; startOffset: number; endOffset: number } | null
  extractedContent: any
  isLoadingContent: boolean
  proxyContent: string | null
  isLoadingProxy: boolean
  user: any
  teamId: string
  bookmarkTags: string[]
  tagInput: string
  showTagSuggestions: boolean
  availableTags: { tag: string; usage_count: number }[]
  commentInputs: { [key: string]: string }
  onClose: () => void
  onViewModeChange: (mode: 'reader' | 'proxy' | 'details') => void
  onCreateHighlight: (bookmarkId: string, selectedText: string, startOffset: number, endOffset: number, textBefore?: string, textAfter?: string) => Promise<any>
  onCreateAnnotation: (bookmarkId: string, content: string, highlightId?: string) => Promise<any>
  onToggleAnnotationLike: (annotationId: string) => Promise<void>
  onDeleteAnnotation: (annotationId: string) => Promise<void>
  onExtractContent: (url: string) => Promise<void>
  onFetchProxyContent: (url: string) => Promise<void>
  onUpdateTags: (tags: string[]) => Promise<void>
  onSetNewAnnotation: (content: string) => void
  onSetHighlightColor: (color: string) => void
  onSetShowHighlightTooltip: (show: boolean) => void
  onSetTooltipPosition: (position: { x: number; y: number }) => void
  onSetPendingSelection: (selection: { text: string; startOffset: number; endOffset: number } | null) => void
  onSetTagInput: (input: string) => void
  onSetShowTagSuggestions: (show: boolean) => void
  onSetCommentInputs: (inputs: { [key: string]: string }) => void
  onEdit?: () => void
  onCopy?: () => void
}

import { stickyPalette } from '../../../utils/colors';

const colorOptions = stickyPalette;

export function BookmarkDetailModal({
  bookmark,
  viewMode,
  annotations,
  highlights,
  newAnnotation,
  highlightColor,
  showHighlightTooltip,
  tooltipPosition,
  pendingSelection,
  extractedContent,
  isLoadingContent,
  proxyContent,
  isLoadingProxy,
  user,
  teamId,
  bookmarkTags,
  tagInput,
  showTagSuggestions,
  availableTags,
  commentInputs,
  onClose,
  onViewModeChange,
  onCreateHighlight,
  onCreateAnnotation,
  onToggleAnnotationLike,
  onDeleteAnnotation,
  onExtractContent,
  onFetchProxyContent,
  onUpdateTags,
  onSetNewAnnotation,
  onSetHighlightColor,
  onSetShowHighlightTooltip,
  onSetTooltipPosition,
  onSetPendingSelection,
  onSetTagInput,
  onSetShowTagSuggestions,
  onSetCommentInputs,
  onEdit,
  onCopy
}: BookmarkDetailModalProps) {
  // Disable body scrolling when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  const saveHighlight = async () => {
    if (!pendingSelection) return null

    try {
      const result = await onCreateHighlight(
        bookmark.id,
        pendingSelection.text,
        pendingSelection.startOffset,
        pendingSelection.endOffset
      )

      onSetShowHighlightTooltip(false)
      onSetPendingSelection(null)
      return result
    } catch (error) {
      console.error('Failed to save highlight:', error)
      return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl h-[95vh] flex flex-col">
        <BookmarkModalHeader
          bookmark={bookmark}
          onClose={onClose}
          onEdit={onEdit}
          onCopy={onCopy}
        />

        <div className="flex-1 flex overflow-hidden">
          <BookmarkContentViewer
            viewMode={viewMode}
            extractedContent={extractedContent}
            isLoadingContent={isLoadingContent}
            proxyContent={proxyContent}
            isLoadingProxy={isLoadingProxy}
            highlights={highlights}
            annotations={annotations}
            bookmark={bookmark}
            user={user}
            teamId={teamId}
            commentInputs={commentInputs}
            onViewModeChange={onViewModeChange}
            onExtractContent={onExtractContent}
            onFetchProxyContent={onFetchProxyContent}
            onSetShowHighlightTooltip={onSetShowHighlightTooltip}
            onSetTooltipPosition={onSetTooltipPosition}
            onSetPendingSelection={onSetPendingSelection}
            onCreateAnnotation={onCreateAnnotation}
            onToggleAnnotationLike={onToggleAnnotationLike}
            onDeleteAnnotation={onDeleteAnnotation}
            onSetCommentInputs={onSetCommentInputs}
          />

          <BookmarkAnnotationsSidebar
            annotations={annotations}
            highlights={highlights}
            newAnnotation={newAnnotation}
            user={user}
            teamId={teamId}
            bookmarkTags={bookmarkTags}
            tagInput={tagInput}
            showTagSuggestions={showTagSuggestions}
            availableTags={availableTags}
            commentInputs={commentInputs}
            bookmark={bookmark}
            onCreateAnnotation={onCreateAnnotation}
            onToggleAnnotationLike={onToggleAnnotationLike}
            onDeleteAnnotation={onDeleteAnnotation}
            onSetNewAnnotation={onSetNewAnnotation}
            onUpdateTags={onUpdateTags}
            onSetTagInput={onSetTagInput}
            onSetShowTagSuggestions={onSetShowTagSuggestions}
            onSetCommentInputs={onSetCommentInputs}
          />
        </div>

        <BookmarkHighlightTooltip
          pendingSelection={pendingSelection}
          tooltipPosition={tooltipPosition}
          highlightColor={highlightColor}
          newAnnotation={newAnnotation}
          colorOptions={colorOptions}
          onSetHighlightColor={onSetHighlightColor}
          onSetNewAnnotation={onSetNewAnnotation}
          onSetShowHighlightTooltip={onSetShowHighlightTooltip}
          onSetPendingSelection={onSetPendingSelection}
          saveHighlight={saveHighlight}
          onCreateAnnotation={onCreateAnnotation}
          bookmark={bookmark}
        />
      </div>
    </div>
  )
}