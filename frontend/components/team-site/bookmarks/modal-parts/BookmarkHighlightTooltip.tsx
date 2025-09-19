import React from 'react'

interface BookmarkHighlightTooltipProps {
  pendingSelection: {
    text: string
    startOffset: number
    endOffset: number
    xpathStart?: string
    xpathEnd?: string
    textBefore?: string
    textAfter?: string
  } | null
  tooltipPosition: { x: number; y: number }
  highlightColor: string
  newAnnotation: string
  colorOptions: string[]
  showHighlightTooltip?: boolean
  onSetHighlightColor: (color: string) => void
  onSetNewAnnotation: (annotation: string) => void
  onSetShowHighlightTooltip: (show: boolean) => void
  onSetPendingSelection: (selection: any) => void
  saveHighlight: () => Promise<any>
  onCreateAnnotation: (bookmarkId: string, annotation: string, highlightId: string) => Promise<void>
  bookmark: { id: string }
}

export const BookmarkHighlightTooltip: React.FC<BookmarkHighlightTooltipProps> = ({
  pendingSelection,
  tooltipPosition,
  highlightColor,
  newAnnotation,
  colorOptions,
  showHighlightTooltip = true,
  onSetHighlightColor,
  onSetNewAnnotation,
  onSetShowHighlightTooltip,
  onSetPendingSelection,
  saveHighlight,
  onCreateAnnotation,
  bookmark
}) => {
  if (!pendingSelection || !showHighlightTooltip) return null

  console.log('🎨 BookmarkHighlightTooltip rendering with:', { 
    pendingSelection: !!pendingSelection, 
    showHighlightTooltip,
    tooltipPosition,
    selectedText: pendingSelection?.text?.substring(0, 30) + '...'
  })

  return (
    <div
      className="fixed z-50 bg-white border border-grey-accent-300 rounded-lg shadow-lg p-4"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translateX(-50%)',
        minWidth: '300px',
        maxWidth: '400px'
      }}
    >
      <div className="space-y-3">
        {/* Selected text preview */}
        <div className="text-sm text-grey-accent-600 border-l-4 border-grey-accent-300 pl-3 py-1">
          <span className="font-medium">Selected: </span>
          "{pendingSelection.text.substring(0, 100)}{pendingSelection.text.length > 100 ? '...' : ''}"
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-sm font-medium text-grey-accent-700 mb-2">
            Highlight Color
          </label>
          <div className="flex gap-1 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => onSetHighlightColor(color)}
                className={`w-8 h-8 rounded-full border-2 ${
                  highlightColor === color ? 'border-grey-accent-600 scale-110' : 'border-grey-accent-300'
                } hover:scale-110 transition-all`}
                style={{ backgroundColor: color }}
                title={`Select ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Annotation input */}
        <div>
          <label className="block text-sm font-medium text-grey-accent-700 mb-2">
            Add Note (Optional)
          </label>
          <textarea
            value={newAnnotation}
            onChange={(e) => onSetNewAnnotation(e.target.value)}
            placeholder="Add a comment about this highlight..."
            className="w-full px-3 py-2 border border-grey-accent-300 rounded-md resize-none text-sm"
            rows={2}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={async () => {
              // First save the highlight and get the highlight ID
              const highlightResult = await saveHighlight()

              // If there's an annotation, save it linked to the highlight
              if (newAnnotation.trim() && highlightResult) {
                // The createHighlight returns raw database result with 'id' field
                // But the display system uses 'highlight_id' from the view
                const highlightId = highlightResult.id
                console.log('🔗 Linking annotation to highlight:', highlightId, 'Full result:', highlightResult)
                await onCreateAnnotation(bookmark.id, newAnnotation, highlightId)
                onSetNewAnnotation('')
              }
            }}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <span className="w-3 h-3 rounded inline-block mr-2" style={{ backgroundColor: highlightColor }}></span>
            Highlight {newAnnotation.trim() ? '& Comment' : ''}
          </button>
          <button
            onClick={() => {
              onSetShowHighlightTooltip(false)
              onSetPendingSelection(null)
              onSetNewAnnotation('')
            }}
            className="px-3 py-2 border border-grey-accent-300 text-grey-accent-700 rounded-md hover:bg-grey-accent-50 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}