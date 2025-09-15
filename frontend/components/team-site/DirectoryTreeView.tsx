import React from 'react'
import { Folder, ExternalLink } from 'lucide-react'
import { FaviconImage } from './FaviconImage'

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_by: string
  created_at: string
  updated_at: string
  parent_id?: string
  sort_order?: number
  creator_name?: string
  creator_avatar?: string
  level?: number
  path?: string[]
  children?: ExtendedCollection[]
}

interface DirectoryTreeViewProps {
  collection: ExtendedCollection
  bookmarks: any[]
  level?: number
}

export const DirectoryTreeView: React.FC<DirectoryTreeViewProps> = ({ 
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
        <div key={bookmark.id} className="flex items-center gap-2 mb-1 ml-6">
          <span className="text-grey-accent-500">{indent}  </span>
          <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} />
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            {bookmark.title || bookmark.url}
          </a>
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex gap-1">
              {bookmark.tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="text-xs bg-grey-accent-100 text-grey-accent-600 px-1 py-0.5 rounded"
                >
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