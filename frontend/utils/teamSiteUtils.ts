// Utility functions for team site functionality

/**
 * Formats a date string into a readable format
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Formats a timestamp for activity log display
 */
export const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else if (diffInHours < 168) { // 7 days
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

/**
 * Builds a hierarchical collection tree from a flat array
 */
export const buildCollectionTree = (collections: any[]): any[] => {
  const collectionMap = new Map()
  const rootCollections: any[] = []
  
  // Create a map of all collections
  collections.forEach(collection => {
    collectionMap.set(collection.id, {
      ...collection,
      children: []
    })
  })
  
  // Build the tree structure
  collections.forEach(collection => {
    const collectionWithChildren = collectionMap.get(collection.id)
    
    if (collection.parent_id) {
      const parent = collectionMap.get(collection.parent_id)
      if (parent) {
        parent.children.push(collectionWithChildren)
      }
    } else {
      rootCollections.push(collectionWithChildren)
    }
  })
  
  // Sort collections by sort_order
  const sortCollections = (collections: any[]) => {
    collections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    collections.forEach(collection => {
      if (collection.children.length > 0) {
        sortCollections(collection.children)
      }
    })
  }
  
  sortCollections(rootCollections)
  return rootCollections
}

/**
 * Generates markdown representation of collection directory structure
 */
export const generateDirectoryMarkdown = (collection: any, bookmarks: any[], level = 0): string => {
  const indent = '  '.repeat(level)
  let markdown = `${indent}- 📁 **${collection.name}**`
  
  if (collection.description) {
    markdown += ` - ${collection.description}`
  }
  markdown += '\n'
  
  // Add bookmarks in this collection
  const collectionBookmarks = bookmarks.filter(b => b.collection_id === collection.id)
  collectionBookmarks.forEach(bookmark => {
    markdown += `${indent}  - 🔖 [${bookmark.title || bookmark.url}](${bookmark.url})`
    if (bookmark.tags && bookmark.tags.length > 0) {
      markdown += ` (${bookmark.tags.join(', ')})`
    }
    markdown += '\n'
  })
  
  // Add child collections
  if (collection.children && collection.children.length > 0) {
    collection.children.forEach((child: any) => {
      markdown += generateDirectoryMarkdown(child, bookmarks, level + 1)
    })
  }
  
  return markdown
}

/**
 * Copies text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text to clipboard:', err)
    return false
  }
}

/**
 * Extracts domain from URL for favicon and display purposes
 */
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * Smart resequencing for sort_order values
 */
export const shouldResequence = (collections: any[]): boolean => {
  const sortOrders = collections.map(c => c.sort_order || 0)
  const maxValue = Math.max(...sortOrders)
  const gaps = sortOrders.filter((order, index, arr) => {
    const nextOrder = arr[index + 1]
    return nextOrder && (nextOrder - order) < 2
  })
  
  return maxValue > 1000 || gaps.length > collections.length * 0.1
}

/**
 * Resequence collections with proper spacing
 */
export const resequenceCollections = (collections: any[]): any[] => {
  return collections
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((collection, index) => ({
      ...collection,
      sort_order: (index + 1) * 10
    }))
}