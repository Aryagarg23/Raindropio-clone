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

// Generate directory structure in markdown format
export const generateDirectoryStructure = (collection: ExtendedCollection, level = 0): string => {
  const indent = '  '.repeat(level)
  const collectionBookmarks = [] // This would need to be passed in or accessed differently

  let structure = `${indent}- **${collection.name}**`
  if (collection.description) {
    structure += ` - ${collection.description}`
  }
  structure += '\n'

  // Add bookmarks in this collection
  // Note: bookmarks array would need to be passed as parameter
  // collectionBookmarks.forEach(bookmark => {
  //   const bookmarkTitle = bookmark.title || bookmark.url
  //   structure += `${indent}  - [${bookmarkTitle}](${bookmark.url})`
  //   if (bookmark.tags && bookmark.tags.length > 0) {
  //     structure += ` \`${bookmark.tags.join('`, `')}\``
  //   }
  //   structure += '\n'
  // })

  // Add child collections
  if (collection.children && collection.children.length > 0) {
    collection.children.forEach(child => {
      structure += generateDirectoryStructure(child, level + 1)
    })
  }

  return structure
}

// Generate full directory structure for a collection and its children
export const getCollectionDirectoryMarkdown = (collection: ExtendedCollection, bookmarks: any[] = []): string => {
  const header = `# ${collection.name} Directory Structure\n\n`
  const createdInfo = `*Created by ${(collection as any).profiles?.full_name || 'Unknown'} on ${new Date(collection.created_at).toLocaleDateString()}*\n\n`

  // Generate structure with bookmarks
  const generateStructureWithBookmarks = (collection: ExtendedCollection, level = 0): string => {
    const indent = '  '.repeat(level)
    const collectionBookmarks = bookmarks.filter(b => b.collection_id === collection.id)

    let structure = `${indent}- **${collection.name}**`
    if (collection.description) {
      structure += ` - ${collection.description}`
    }
    structure += '\n'

    // Add bookmarks in this collection
    collectionBookmarks.forEach(bookmark => {
      const bookmarkTitle = bookmark.title || bookmark.url
      structure += `${indent}  - [${bookmarkTitle}](${bookmark.url})`
      if (bookmark.tags && bookmark.tags.length > 0) {
        structure += ` \`${bookmark.tags.join('`, `')}\``
      }
      structure += '\n'
    })

    // Add child collections
    if (collection.children && collection.children.length > 0) {
      collection.children.forEach(child => {
        structure += generateStructureWithBookmarks(child, level + 1)
      })
    }

    return structure
  }

  const structure = generateStructureWithBookmarks(collection)
  return header + createdInfo + structure
}

// Copy directory structure to clipboard
export const copyDirectoryStructure = async (collection: ExtendedCollection, bookmarks: any[] = []): Promise<void> => {
  const markdown = getCollectionDirectoryMarkdown(collection, bookmarks)
  try {
    await navigator.clipboard.writeText(markdown)
    console.log('Directory structure copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    throw new Error('Failed to copy to clipboard')
  }
}