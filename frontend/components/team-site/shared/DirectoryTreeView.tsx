import React from "react"
import { Folder } from "lucide-react"
import { FaviconImage } from "../shared/FaviconImage"

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_at: string
  created_by: string
  children?: ExtendedCollection[]
}

interface DirectoryTreeViewProps {
  collection: ExtendedCollection
  bookmarks: any[]
  level?: number
}

const DirectoryTreeView: React.FC<DirectoryTreeViewProps> = ({
  collection,
  bookmarks,
  level = 0
}) => {
  const indent = '  '.repeat(level)
  const collectionBookmarks = bookmarks.filter(b => b.collection_id === collection.id)

  return (
    <div className="text-left">
      {/* Collection name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-grey-accent-500">{indent}</span>
        <Folder className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-grey-accent-900">{collection.name}</span>
        {collection.description && (
          <span className="text-grey-accent-600 text-xs">- {collection.description}</span>
        )}
      </div>

      {/* Bookmarks in this collection */}
      {collectionBookmarks.map(bookmark => (
        <div key={bookmark.id} className="flex items-center gap-2 mb-1 ml-4">
          <span className="text-grey-accent-500">{indent}  </span>
          <div className="w-3 h-3 rounded bg-white shadow flex items-center justify-center border border-grey-accent-200">
            <FaviconImage
              url={bookmark.url}
              faviconUrl={bookmark.favicon_url}
              size="w-2 h-2"
            />
          </div>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            {bookmark.title || bookmark.url}
          </a>
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex gap-1 ml-2">
              {bookmark.tags.map((tag: string) => (
                <span key={tag} className="px-1 py-0.5 bg-grey-accent-200 text-grey-accent-700 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Child collections */}
      {collection.children && collection.children.length > 0 && (
        <div className="ml-4 mt-2">
          {collection.children.map(child => (
            <DirectoryTreeView
              key={child.id}
              collection={child}
              bookmarks={bookmarks}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DirectoryTreeView