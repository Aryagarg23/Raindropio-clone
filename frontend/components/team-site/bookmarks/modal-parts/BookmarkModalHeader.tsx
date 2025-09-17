import React from "react"
import { Button } from "../../../ui/button"
import { ExternalLink, X } from "lucide-react"

interface BookmarkModalHeaderProps {
  bookmark: any
  onClose: () => void
}

export function BookmarkModalHeader({ bookmark, onClose }: BookmarkModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-white shadow flex items-center justify-center border border-grey-accent-200">
          <img
            src={bookmark.preview_image || '/api/placeholder/48/48'}
            alt={bookmark.title || bookmark.url}
            className="w-8 h-8 object-cover rounded"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-grey-accent-900 line-clamp-1">
            {bookmark.title || 'Untitled Bookmark'}
          </h2>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {bookmark.url}
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}