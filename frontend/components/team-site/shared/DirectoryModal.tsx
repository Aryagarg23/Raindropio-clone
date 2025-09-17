import React from 'react';
import { Button } from '../../ui/button';
import { Folder, Copy, X } from 'lucide-react';

interface ExtendedCollection {
  id: string;
  name: string;
  description?: string;
  color: string;
  team_id: string;
  created_at: string;
  created_by: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
  bookmarkCount?: number;
  children?: ExtendedCollection[];
  parentId?: string;
}

interface DirectoryModalProps {
  isOpen: boolean;
  collection: ExtendedCollection | null;
  bookmarks: any[];
  onClose: () => void;
  onCopy: (collection: ExtendedCollection) => void;
}

export const DirectoryModal: React.FC<DirectoryModalProps> = ({
  isOpen,
  collection,
  bookmarks,
  onClose,
  onCopy
}) => {
  if (!isOpen || !collection) return null;

  // Generate directory structure in markdown format
  const generateDirectoryStructure = (collection: ExtendedCollection, level = 0): string => {
    const indent = '  '.repeat(level);
    const collectionBookmarks = bookmarks.filter(b => b.collection_id === collection.id);

    let structure = `${indent}- **${collection.name}**`;
    if (collection.description) {
      structure += ` - ${collection.description}`;
    }
    structure += '\n';

    // Add bookmarks in this collection
    collectionBookmarks.forEach(bookmark => {
      const bookmarkTitle = bookmark.title || bookmark.url;
      structure += `${indent}  - [${bookmarkTitle}](${bookmark.url})`;
      if (bookmark.tags && bookmark.tags.length > 0) {
        structure += ` \`${bookmark.tags.join('`, `')}\``;
      }
      structure += '\n';
    });

    // Add child collections
    if (collection.children && collection.children.length > 0) {
      collection.children.forEach(child => {
        structure += generateDirectoryStructure(child, level + 1);
      });
    }

    return structure;
  };

  // Generate full directory structure for a collection and its children
  const getCollectionDirectoryMarkdown = (collection: ExtendedCollection): string => {
    const header = `# ${collection.name} Directory Structure\n\n`;
    const createdInfo = `*Created by ${(collection as any).profiles?.full_name || 'Unknown'} on ${new Date(collection.created_at).toLocaleDateString()}*\n\n`;
    const structure = generateDirectoryStructure(collection);

    return header + createdInfo + structure;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
          <div className="flex items-center gap-3">
            <Folder className="w-6 h-6 text-grey-accent-600" />
            <div>
              <h2 className="text-xl font-semibold text-grey-accent-900">
                {collection.name} Directory Structure
              </h2>
              <p className="text-sm text-grey-accent-600">
                Created by {(collection as any)?.profiles?.full_name || 'Unknown'} on{' '}
                {new Date(collection.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopy(collection)}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Markdown
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="bg-grey-accent-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
            {getCollectionDirectoryMarkdown(collection)}
          </div>
        </div>
      </div>
    </div>
  );
};