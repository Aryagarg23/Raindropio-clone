import React, { useState, useEffect } from "react"
import { Button } from "../../../ui/button"
import { ExternalLink, X, Folder, Edit, Copy } from "lucide-react"

interface BookmarkModalHeaderProps {
  bookmark: any
  onClose: () => void
  onEdit?: () => void
  onCopy?: () => void
}

export function BookmarkModalHeader({ bookmark, onClose, onEdit, onCopy }: BookmarkModalHeaderProps) {
  const [imageError, setImageError] = useState(false)

  // Extract domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url
    }
  }

  // Get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    } catch {
      return null
    }
  }

  const faviconUrl = getFaviconUrl(bookmark.url)
  const fallbackImage = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#6b7280" rx="4"/><text x="16" y="20" font-family="system-ui" font-size="12" text-anchor="middle" fill="#ffffff">?</text></svg>')}`

  const handleLeftSideClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url)
    // You could add a toast notification here
  }

  return (
    <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
      <div 
        className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer hover:bg-grey-accent-50 rounded-lg p-2 -m-2 transition-colors"
        onClick={handleLeftSideClick}
      >
        <div className="w-12 h-12 rounded-lg bg-white shadow flex items-center justify-center border border-grey-accent-200 flex-shrink-0">
          <img
            src={imageError || !faviconUrl ? fallbackImage : faviconUrl}
            alt={bookmark.title || bookmark.url}
            className="w-8 h-8 object-cover rounded"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-grey-accent-900 hover:text-blue-600 transition-colors">
            {bookmark.title || 'Untitled Bookmark'}
          </h2>
          {bookmark.collections && (
            <div className="flex items-center gap-2 mt-2">
              <Folder className="w-4 h-4 text-grey-accent-600" />
              <span className="text-sm text-grey-accent-700 font-medium">
                {bookmark.collections.name || 'No Collection'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {onCopy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCopyUrl()
            }}
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            title="Edit bookmark"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}