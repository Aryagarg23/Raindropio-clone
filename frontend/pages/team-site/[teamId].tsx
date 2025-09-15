"use client"

import React, { useState, useRef, useMemo } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { useTeamSite } from "../../hooks/useTeamSite"
import { Collection } from "../../types/api"
import supabase from "../../modules/supabaseClient"
import { Search, Plus, Share2, Settings, Users, ChevronDown, ChevronRight, Folder, FolderOpen, Grid3X3, List, ExternalLink, Heart, GripVertical, Copy, X } from "lucide-react"


// Favicon component for bookmarks
const FaviconImage = ({ url, faviconUrl, size = "w-4 h-4" }: { url: string, faviconUrl?: string, size?: string }) => {
  const [imgSrc, setImgSrc] = useState(faviconUrl || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      // Try Google's favicon service as fallback
      if (imgSrc !== `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`) {
        setImgSrc(`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`)
      } else {
        setHasError(true)
      }
    }
  }

  if (hasError) {
    return <ExternalLink className={`${size} text-grey-accent-600`} />
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className={`${size} object-contain`}
      onError={handleError}
    />
  )
}

interface ExtendedCollection {
  id: string
  name: string
  description?: string
  color: string
  team_id: string
  created_at: string
  created_by: string
  profiles?: {
    user_id: string
    full_name?: string
    avatar_url?: string
  }
  bookmarkCount?: number
  children?: ExtendedCollection[]
  parentId?: string
}

// Component to render directory tree structure
const DirectoryTreeView = ({ 
  collection, 
  bookmarks, 
  level = 0 
}: { 
  collection: ExtendedCollection
  bookmarks: any[]
  level: number 
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

export default function TeamSitePage() {
  const router = useRouter()
  const { teamId } = router.query
  
  const {
    user,
    profile,
    loading,
    error,
    collections,
    bookmarks,
    teamEvents,
    presence,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    setError
  } = useTeamSite(teamId)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("main")
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null)
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  // Simplified drag state - only track what's absolutely necessary
  const [dragOverData, setDragOverData] = useState<{id: string, position: 'root' | 'child'} | null>(null)
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  // Advanced bookmark filters
  const [bookmarkFilters, setBookmarkFilters] = useState({
    searchQuery: '',
    selectedTags: [] as string[],
    selectedCollections: [] as string[],
    selectedCreators: [] as string[],
    dateRange: null as { start: Date; end: Date } | null,
    sortBy: 'created_at' as 'created_at' | 'title' | 'updated_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDirectoryCollection, setSelectedDirectoryCollection] = useState<ExtendedCollection | null>(null)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)

  // Collection-specific filters
  const [collectionFilters, setCollectionFilters] = useState({
    searchQuery: '',
    selectedCreators: [] as string[],
    selectedParents: [] as string[],
    hasBookmarks: null as boolean | null, // null = all, true = with bookmarks, false = empty
    sortBy: 'created_at' as 'created_at' | 'name' | 'bookmark_count',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [showCollectionFilters, setShowCollectionFilters] = useState(false)

  // Get all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    bookmarks.forEach(bookmark => {
      bookmark.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [bookmarks])

  // Get all unique creators
  const allCreators = useMemo(() => {
    const creatorSet = new Set<string>()
    bookmarks.forEach(bookmark => {
      const creatorName = (bookmark as any).profiles?.full_name || 'Unknown'
      creatorSet.add(creatorName)
    })
    return Array.from(creatorSet).sort()
  }, [bookmarks])

  // Apply advanced filters to bookmarks
  const advancedFilteredBookmarks = useMemo(() => {
    let filtered = bookmarks

    // Text search
    if (bookmarkFilters.searchQuery) {
      const query = bookmarkFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(bookmark =>
        bookmark.title?.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Tag filter
    if (bookmarkFilters.selectedTags.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmarkFilters.selectedTags.every(tag =>
          bookmark.tags?.includes(tag)
        )
      )
    }

    // Collection filter
    if (bookmarkFilters.selectedCollections.length > 0) {
      filtered = filtered.filter(bookmark =>
        bookmark.collection_id && bookmarkFilters.selectedCollections.includes(bookmark.collection_id)
      )
    }

    // Creator filter
    if (bookmarkFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(bookmark => {
        const creatorName = (bookmark as any).profiles?.full_name || 'Unknown'
        return bookmarkFilters.selectedCreators.includes(creatorName)
      })
    }

    // Date range filter
    if (bookmarkFilters.dateRange) {
      filtered = filtered.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.created_at)
        return bookmarkDate >= bookmarkFilters.dateRange!.start && 
               bookmarkDate <= bookmarkFilters.dateRange!.end
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (bookmarkFilters.sortBy) {
        case 'title':
          comparison = (a.title || a.url).localeCompare(b.title || b.url)
          break
        case 'updated_at':
          comparison = new Date(a.updated_at || a.created_at).getTime() - 
                      new Date(b.updated_at || b.created_at).getTime()
          break
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return bookmarkFilters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [bookmarks, bookmarkFilters])

  // Build nested collection tree from flat data
  const buildCollectionTree = (collections: Collection[]): ExtendedCollection[] => {
    const collectionMap = new Map<string, ExtendedCollection>();
    const rootCollections: ExtendedCollection[] = [];

    // First pass: Create map of all collections
    collections.forEach(collection => {
      const extendedCollection: ExtendedCollection = {
        ...collection,
        children: [],
        bookmarkCount: bookmarks.filter(b => b.collection_id === collection.id).length,
        profiles: (collection as any).profiles
      };
      collectionMap.set(collection.id, extendedCollection);
    });

    // Second pass: Build tree structure
    collections.forEach(collection => {
      const extendedCollection = collectionMap.get(collection.id);
      if (extendedCollection) {
        if (collection.parent_id && collectionMap.has(collection.parent_id)) {
          // Add to parent's children
          const parent = collectionMap.get(collection.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(extendedCollection);
          }
        } else {
          // Root level collection
          rootCollections.push(extendedCollection);
        }
      }
    });

    // Sort collections by sort_order then name
    const sortCollections = (collections: ExtendedCollection[]) => {
      collections.sort((a, b) => {
        const orderA = (a as any).sort_order || 0;
        const orderB = (b as any).sort_order || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
      
      collections.forEach(collection => {
        if (collection.children && collection.children.length > 0) {
          sortCollections(collection.children);
        }
      });
    };

    sortCollections(rootCollections);
    return rootCollections;
  };

  const nestedCollections = buildCollectionTree(collections);

  // Flatten all collections (including nested children) for collections tab
  const getAllCollections = (collections: ExtendedCollection[]): ExtendedCollection[] => {
    const flattened: ExtendedCollection[] = []
    
    const addCollection = (collection: ExtendedCollection) => {
      flattened.push(collection)
      if (collection.children && collection.children.length > 0) {
        collection.children.forEach(child => addCollection(child))
      }
    }
    
    collections.forEach(collection => addCollection(collection))
    return flattened
  }

  const allFlatCollections = getAllCollections(nestedCollections)

  // Get all unique collection creators
  const allCollectionCreators = useMemo(() => {
    const creatorSet = new Set<string>()
    allFlatCollections.forEach(collection => {
      const creatorName = (collection as any).profiles?.full_name || 'Unknown'
      creatorSet.add(creatorName)
    })
    return Array.from(creatorSet).sort()
  }, [allFlatCollections])

  // Get parent collections for filter
  const parentCollections = useMemo(() => {
    return allFlatCollections.filter(c => !(c as any).parent_id || (c as any).parent_id === null)
  }, [allFlatCollections])

  // Apply filters to collections
  const filteredCollections = useMemo(() => {
    let filtered = allFlatCollections

    // Text search
    if (collectionFilters.searchQuery) {
      const query = collectionFilters.searchQuery.toLowerCase()
      filtered = filtered.filter(collection =>
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
      )
    }

    // Creator filter
    if (collectionFilters.selectedCreators.length > 0) {
      filtered = filtered.filter(collection => {
        const creatorName = (collection as any).profiles?.full_name || 'Unknown'
        return collectionFilters.selectedCreators.includes(creatorName)
      })
    }

    // Parent filter (show only children of selected parents)
    if (collectionFilters.selectedParents.length > 0) {
      filtered = filtered.filter(collection =>
        (collection as any).parent_id && collectionFilters.selectedParents.includes((collection as any).parent_id)
      )
    }

    // Bookmark count filter
    if (collectionFilters.hasBookmarks !== null) {
      filtered = filtered.filter(collection => {
        const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length
        return collectionFilters.hasBookmarks ? bookmarkCount > 0 : bookmarkCount === 0
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (collectionFilters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'bookmark_count':
          const aCount = bookmarks.filter(b => b.collection_id === a.id).length
          const bCount = bookmarks.filter(b => b.collection_id === b.id).length
          comparison = aCount - bCount
          break
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return collectionFilters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [allFlatCollections, collectionFilters, bookmarks])

  // Generate directory structure in markdown format
  const generateDirectoryStructure = (collection: ExtendedCollection, level = 0): string => {
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
        structure += generateDirectoryStructure(child, level + 1)
      })
    }
    
    return structure
  }

  // Generate full directory structure for a collection and its children
  const getCollectionDirectoryMarkdown = (collection: ExtendedCollection): string => {
    const header = `# ${collection.name} Directory Structure\n\n`
    const createdInfo = `*Created by ${(collection as any).profiles?.full_name || 'Unknown'} on ${new Date(collection.created_at).toLocaleDateString()}*\n\n`
    const structure = generateDirectoryStructure(collection)
    
    return header + createdInfo + structure
  }

  // Copy directory structure to clipboard
  const copyDirectoryStructure = async (collection: ExtendedCollection) => {
    const markdown = getCollectionDirectoryMarkdown(collection)
    try {
      await navigator.clipboard.writeText(markdown)
      // You could add a toast notification here
      console.log('Directory structure copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Get orphaned bookmarks (bookmarks without a collection or with invalid collection_id)
  const orphanedBookmarks = bookmarks.filter(bookmark => 
    !bookmark.collection_id || !collections.some(col => col.id === bookmark.collection_id)
  );

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const updateBookmarkTags = async (bookmarkId: string, newTags: string[]) => {
    try {
      // Update bookmark tags via API
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ tags: newTags })
        .eq('id', bookmarkId);
      
      if (error) throw error;
      
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error('Failed to update tags:', error);
      setError('Failed to update bookmark tags');
    }
  }

  const handleDragStart = (e: React.DragEvent, collectionId: string) => {
    console.log('=== DRAG START ===', collectionId);
    setDraggedCollection(collectionId);
    e.dataTransfer.effectAllowed = 'move';
  }

  const handleDragEnd = () => {
    console.log('=== DRAG END ===', { draggedCollection });
    
    // Clear throttle timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
      throttleTimeout.current = null;
    }
    
    setDraggedCollection(null);
    setDragOverData(null);
  }

  // Throttled drag over handler using industry standard approach
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Simple left/right position detection
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const position = x < width * 0.5 ? 'root' : 'child';
    
    // Throttle state updates to prevent excessive re-renders while keeping visuals smooth
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }
    
    throttleTimeout.current = setTimeout(() => {
      // Only update state if actually different
      if (!dragOverData || dragOverData.id !== collectionId || dragOverData.position !== position) {
        setDragOverData({ id: collectionId, position });
      }
    }, 16); // ~60fps throttle for state updates
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Clear state with slight delay to prevent flicker when moving between elements
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current);
    }
    
    throttleTimeout.current = setTimeout(() => {
      setDragOverData(null);
    }, 50);
  }

  // Handle dropping on root area (outside any collection)
  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedCollection) return;

    try {
      // Check if user has permission to modify collections
      if (!user) {
        console.error('No authenticated user');
        setError('You must be logged in to move collections');
        return;
      }

      // Move collection to root level at the bottom
      // Find the highest sort_order among root-level collections
      const rootCollections = collections.filter(c => c.parent_id === null);
      const maxSortOrder = rootCollections.length > 0 
        ? Math.max(...rootCollections.map(c => c.sort_order || 0))
        : 0;
      
      console.log('Moving to root bottom:', { 
        draggedCollection, 
        newSortOrder: maxSortOrder + 10,
        userId: user.id,
        userRole: profile?.role || 'unknown'
      });
      
      const { data, error } = await supabase
        .from('collections')
        .update({ 
          parent_id: null,
          sort_order: maxSortOrder + 10
        })
        .eq('id', draggedCollection);
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Root drop success:', data);
      
      // Force a refresh of collections data to ensure UI updates
      if (data) {
        console.log('Forcing collections refresh for non-admin user...');
        // The useTeamSite hook should handle this via subscriptions, but let's be explicit
        window.location.reload(); // Temporary fix - should be replaced with proper state management
      }
      
    } catch (error: any) {
      console.error('Failed to move collection to root:', error);
      
      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status');
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator');
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team');
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  }

  const handleDrop = async (e: React.DragEvent, targetCollectionId: string) => {
    console.log('=== HANDLE DROP CALLED ===', { draggedCollection, targetCollectionId });
    e.preventDefault();
    e.stopPropagation(); // Prevent root drop
    
    if (!draggedCollection || draggedCollection === targetCollectionId) {
      console.log('Early return:', { draggedCollection, targetCollectionId, reason: 'no-drag-or-same' });
      setDraggedCollection(null);
      setDragOverData(null);
      return;
    }

    // Calculate position at drop time to avoid throttling race conditions
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const dropPosition = x < width * 0.5 ? 'root' : 'child';
    
    console.log('Drop operation:', {
      draggedCollection,
      targetCollectionId,
      dropPosition,
      mouseX: x,
      elementWidth: width,
      dragOverData
    });

    try {
      // Check if user has permission to modify collections
      if (!user) {
        console.error('No authenticated user for drop operation');
        setError('You must be logged in to move collections');
        return;
      }

      const draggedCol = collections.find(c => c.id === draggedCollection);
      const targetCol = collections.find(c => c.id === targetCollectionId);
      
      console.log('Found collections:', { 
        draggedCol, 
        targetCol, 
        totalCollections: collections.length,
        userId: user.id,
        userRole: profile?.role || 'unknown'
      });
      
      if (!draggedCol || !targetCol) {
        console.log('Missing collections, aborting');
        return;
      }

      // Team members have full access to modify collections within their team
      console.log('Team member confirmed - allowing collection modification');

      if (dropPosition === 'child') {
        // Right side drop - move into target collection as child
        console.log('Making child - smart positioning');
        
        // Get existing children of target, sorted by sort_order
        const existingChildren = collections
          .filter(c => c.parent_id === targetCollectionId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        let newSortOrder: number;
        
        if (existingChildren.length === 0) {
          // First child - start with 10
          newSortOrder = 10;
        } else {
          // Get max sort_order and add buffer
          const maxOrder = Math.max(...existingChildren.map(c => c.sort_order || 0));
          
          // If we have room (max < 1000), just increment normally
          if (maxOrder < 1000) {
            newSortOrder = maxOrder + 10;
          } else {
            // Only resequence if values are getting too high
            console.log('Values getting high, resequencing children...');
            
            // Resequence existing children first
            for (let i = 0; i < existingChildren.length; i++) {
              await supabase
                .from('collections')
                .update({ sort_order: (i + 1) * 10 })
                .eq('id', existingChildren[i].id);
            }
            
            // Place new child at end
            newSortOrder = (existingChildren.length + 1) * 10;
          }
        }
        
        console.log('Child positioning:', { targetCollectionId, newSortOrder });
        
        const { error } = await supabase
          .from('collections')
          .update({ 
            parent_id: targetCollectionId,
            sort_order: newSortOrder
          })
          .eq('id', draggedCollection);
        
        if (error) {
          console.error('Child update error:', error);
          throw error;
        }
        
      } else {
        // Left side drop - move above target (same parent level)
        console.log('Moving above target - smart positioning');
        
        const targetParentId = targetCol.parent_id;
        const targetSortOrder = targetCol.sort_order || 0;
        
        // Get all siblings at target level, sorted by sort_order
        const siblings = collections
          .filter(c => c.parent_id === targetParentId && c.id !== draggedCollection)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        const targetIndex = siblings.findIndex(c => c.id === targetCollectionId);
        let newSortOrder: number;
        
        if (targetIndex === 0) {
          // Target is first - place before it with room
          newSortOrder = Math.max(1, targetSortOrder - 10);
        } else if (targetIndex > 0) {
          // Place between previous sibling and target
          const prevOrder = siblings[targetIndex - 1].sort_order || 0;
          const gap = targetSortOrder - prevOrder;
          
          if (gap > 2) {
            // Enough room - place in middle
            newSortOrder = prevOrder + Math.floor(gap / 2);
          } else {
            // Not enough room - need to resequence siblings
            console.log('Not enough room, resequencing siblings...');
            
            // Resequence all siblings with 10-unit spacing
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i];
              if (sibling.id === targetCollectionId && i > 0) {
                // Insert dragged item before target
                await supabase
                  .from('collections')
                  .update({ 
                    parent_id: targetParentId,
                    sort_order: (i + 1) * 10 // Will be target's new position
                  })
                  .eq('id', draggedCollection);
                
                // Update target to next position  
                await supabase
                  .from('collections')
                  .update({ sort_order: (i + 2) * 10 })
                  .eq('id', sibling.id);
              } else {
                // Regular sibling update
                const adjustedIndex = sibling.id === targetCollectionId ? i + 2 : i + 1;
                await supabase
                  .from('collections')
                  .update({ sort_order: adjustedIndex * 10 })
                  .eq('id', sibling.id);
              }
            }
            
            return; // Exit early since we handled the update above
          }
        } else {
          // Fallback
          newSortOrder = 5;
        }
        
        console.log('Sibling positioning:', { targetParentId, newSortOrder });
        
        const { error } = await supabase
          .from('collections')
          .update({ 
            parent_id: targetParentId,
            sort_order: newSortOrder
          })
          .eq('id', draggedCollection);
          
        if (error) {
          console.error('Reorder error:', error);
          throw error;
        }
      }
      
    } catch (error: any) {
      console.error('Failed to move collection:', error);
      
      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status');
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator');
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team');
      } else if (error.message?.includes('unique')) {
        setError('Conflict error: Try refreshing the page and try again');
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`);
      }
      
      // For non-admin users, suggest refreshing to sync state
      if (profile?.role !== 'admin') {
        console.log('Non-admin user encountered error, suggesting refresh...');
        setTimeout(() => {
          setError(prev => prev + ' (Try refreshing the page if issues persist)');
        }, 2000);
      }
    } finally {
      setDraggedCollection(null);
      setDragOverData(null);
    }
  }

  // Bookmark drag handlers
  const handleBookmarkDragStart = (e: React.DragEvent, bookmarkId: string) => {
    setDraggedBookmark(bookmarkId);
    e.dataTransfer.effectAllowed = 'move';
  }

  const handleBookmarkDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  }

  const handleBookmarkDrop = async (e: React.DragEvent, targetCollectionId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedBookmark) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ collection_id: targetCollectionId })
        .eq('id', draggedBookmark);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Failed to move bookmark:', error);
      setError('Failed to move bookmark');
    } finally {
      setDraggedBookmark(null);
      setDragOverTarget(null);
    }
  }

  const renderCollectionTree = (collections: any[], level = 0) => {
    return collections.map((collection, index) => {
      const bookmarkCount = bookmarks.filter(b => b.collection_id === collection.id).length
      
      return (
        <div key={collection.id} className="relative">
          {/* Left/Right drop zone indicators */}
          {dragOverData?.id === collection.id && draggedCollection && (
            <>
              {/* Left side - Root level drop */}
              {dragOverData?.position === 'root' && (
                <>
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-blue-100 border-2 border-blue-300 border-dashed rounded-l-md z-10 opacity-80 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                      Drop for Root Level
                    </span>
                  </div>
                </>
              )}
              
              {/* Right side - Child/Nest drop */}
              {dragOverData?.position === 'child' && (
                <>
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-green-100 border-2 border-green-300 border-dashed rounded-r-md z-10 opacity-80 pointer-events-none" />
                  <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full shadow-lg whitespace-nowrap">
                      Drop to Nest
                    </span>
                  </div>
                </>
              )}
            </>
          )}
          
          <div
            className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-100 transition-all duration-300 ease-out relative z-20 ${
              selectedCollectionId === collection.id ? "bg-grey-accent-100" : ""
            } ${
              dragOverData?.id === collection.id && draggedCollection && dragOverData?.position === 'child' ? "bg-grey-accent-100 scale-105 shadow-lg" : ""
            } ${
              dragOverTarget === collection.id && draggedBookmark ? "bg-blue-50 border border-blue-300" : ""
            } ${
              draggedCollection === collection.id ? "opacity-50 scale-95 rotate-2 blur-sm" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => setSelectedCollectionId(collection.id)}
            draggable
            onDragStart={(e) => {
              handleDragStart(e, collection.id);
              e.stopPropagation(); // Prevent parent handlers from interfering
            }}
            onDragEnd={(e) => {
              handleDragEnd();
              e.stopPropagation();
            }}
            onDragOver={(e) => {
              e.preventDefault(); // CRITICAL: Always prevent default first
              e.stopPropagation(); // Stop event bubbling
              
              if (draggedCollection) {
                handleDragOver(e, collection.id);
              } else if (draggedBookmark) {
                handleBookmarkDragOver(e, collection.id);
              }
            }}
            onDragLeave={(e) => {
              e.stopPropagation();
              if (draggedCollection) {
                handleDragLeave(e);
              } else if (draggedBookmark) {
                setDragOverTarget(null);
              }
            }}
            onDrop={async (e) => {
              e.preventDefault(); // CRITICAL: Prevent default first
              e.stopPropagation(); // Stop event bubbling
              console.log('=== COLLECTION ON DROP ===', { draggedCollection, draggedBookmark, collectionId: collection.id });
              
              if (draggedCollection) {
                await handleDrop(e, collection.id);
              } else if (draggedBookmark) {
                handleBookmarkDrop(e, collection.id);
              }
            }}
          >
            <GripVertical 
              className="w-3 h-3 text-grey-accent-400 hover:text-grey-accent-600" 
              onDragStart={(e) => e.stopPropagation()} 
            />
            {collection.children && collection.children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCollection(collection.id)
                }}
                onDragStart={(e) => e.stopPropagation()}
                className="p-0.5 hover:bg-muted rounded"
              >
                {expandedCollections.has(collection.id) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}

            {expandedCollections.has(collection.id) ? (
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Folder className="w-4 h-4 text-muted-foreground" />
            )}

            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: collection.color }}
              onDragStart={(e) => e.stopPropagation()}
            />
            <span 
              className="text-sm font-medium truncate text-grey-accent-900"
              onDragStart={(e) => e.stopPropagation()}
            >
              {collection.name}
            </span>
            <span 
              className="text-xs text-grey-accent-600 ml-auto"
              onDragStart={(e) => e.stopPropagation()}
            >
              {bookmarkCount}
            </span>
          </div>

          {expandedCollections.has(collection.id) && (
            <div>
              {/* Render child collections */}
              {collection.children && collection.children.length > 0 && (
                <div>{renderCollectionTree(collection.children, level + 1)}</div>
              )}
              
              {/* Render bookmarks in this collection */}
              {bookmarks
                .filter(bookmark => bookmark.collection_id === collection.id)
                .map((bookmark) => (
                  <div
                    key={`bookmark-${bookmark.id}`}
                    className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-50 transition-colors ${
                      selectedCollectionId === collection.id ? "bg-grey-accent-50" : ""
                    }`}
                    style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                    draggable
                    onDragStart={(e) => handleBookmarkDragStart(e, bookmark.id)}
                    onClick={() => {
                      setSelectedCollectionId(collection.id)
                      // Optional: scroll to bookmark in main view
                    }}
                  >
                    <div className="w-3 h-3" /> {/* Spacer for drag handle */}
                    <div className="w-4" /> {/* Spacer for expand button */}
                    
                    {/* Favicon */}
                    <div className="w-4 h-4 flex items-center justify-center">
                      <FaviconImage 
                        url={bookmark.url} 
                        faviconUrl={bookmark.favicon_url} 
                        size="w-3 h-3" 
                      />
                    </div>
                    
                    <span className="text-xs text-grey-accent-700 truncate flex-1">
                      {bookmark.title || new URL(bookmark.url).hostname}
                    </span>
                    
                    {/* External link button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(bookmark.url, '_blank', 'noopener,noreferrer')
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-grey-accent-200 rounded transition-all"
                      title="Open link"
                    >
                      <ExternalLink className="w-3 h-3 text-grey-accent-500" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )
    })
  }

  const displayedBookmarks = selectedCollectionId
    ? filteredBookmarks.filter((bookmark) => bookmark.collection_id === selectedCollectionId)
    : filteredBookmarks

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-grey-accent-600 mb-4"></div>
          <p className="text-grey-accent-600">Loading team workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <Button onClick={() => router.push('/admin')} className="bg-grey-accent-600 hover:bg-grey-accent-700 text-white">
            Back to Admin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-accent-50 to-grey-accent-100">
      {/* Header */}
      <header className="border-b border-grey-accent-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin')}
                className="mr-2 text-grey-accent-700 hover:text-grey-accent-900 hover:bg-grey-accent-100"
              >
                ← Back to Dashboard
              </Button>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-grey-accent-900">Team Workspace</h1>
                <p className="text-sm text-grey-accent-600">Collaborative bookmark management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online members */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-grey-accent-600">
                    {presence.length === 0 ? 'No one online' : `${presence.length} online`}
                  </span>
                </div>
                
                {presence.length > 0 && (
                  <div className="flex -space-x-2">
                    {presence.slice(0, 5).map((p: any) => {
                      const displayName = p.profiles?.full_name || p.profiles?.user_id || 'Unknown User'
                      const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                      
                      return (
                        <div
                          key={p.user_id}
                          className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 text-white shadow-md"
                          title={`${displayName} (Online)`}
                        >
                          {p.profiles?.avatar_url ? (
                            <img 
                              src={p.profiles.avatar_url} 
                              alt={displayName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" className="border-grey-accent-300 text-grey-accent-700 hover:bg-grey-accent-100 hover:border-grey-accent-400">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="border-grey-accent-300 text-grey-accent-700 hover:bg-grey-accent-100 hover:border-grey-accent-400">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm text-grey-accent-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {presence.length} members online
            </div>
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              {bookmarks.length} bookmarks
            </div>
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              {collections.length} collections
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {activeTab === "main" && (
                <div className="flex items-center gap-1 border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Button size="sm" onClick={() => {
                if (activeTab === "collections") {
                  setShowCreateCollection(true)
                } else {
                  setShowAddBookmark(true)
                }
              }}>
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === "collections" ? "Add Collection" : "Add Bookmark"}
              </Button>
            </div>
          </div>

          <TabsContent value="main" className="space-y-6">
            <div className="flex gap-6">
              {/* Sidebar with collections */}
              <div className="w-64 flex-shrink-0">
                <Card className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Collections</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 space-y-1">
                    <div
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedCollectionId === null ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedCollectionId(null)}
                    >
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">All Bookmarks</span>
                      <span className="text-xs text-muted-foreground ml-auto">{bookmarks.length}</span>
                    </div>
                    
                    {renderCollectionTree(nestedCollections)}
                    
                    {/* Root-level drop zone for collections */}
                    <div
                      className={`mt-2 p-3 rounded-md border-2 border-dashed transition-all ${
                        draggedCollection 
                          ? 'border-blue-400 bg-blue-50 opacity-100' 
                          : 'border-transparent opacity-0'
                      }`}
                      onDragOver={(e) => {
                        if (draggedCollection) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }
                      }}
                      onDrop={handleRootDrop}
                    >
                      <div className="text-xs text-blue-600 text-center font-medium">
                        Drop here to move to root level
                      </div>
                    </div>
                    
                    {/* Orphaned Bookmarks Section */}
                    {orphanedBookmarks.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-grey-accent-200">
                        <div className="mb-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-grey-accent-600 uppercase tracking-wide">
                            <ExternalLink className="w-3 h-3" />
                            Uncategorized ({orphanedBookmarks.length})
                          </div>
                        </div>
                        
                        {/* Drop zone for orphaned bookmarks */}
                        <div
                          className={`min-h-[60px] rounded-md border-2 border-dashed transition-all ${
                            dragOverTarget === 'orphaned' 
                              ? 'border-blue-400 bg-blue-50' 
                              : 'border-grey-accent-200 hover:border-grey-accent-300'
                          } ${draggedBookmark ? 'border-grey-accent-300' : ''}`}
                          onDragOver={(e) => {
                            if (draggedBookmark) {
                              e.preventDefault();
                              setDragOverTarget('orphaned');
                            }
                          }}
                          onDragLeave={() => setDragOverTarget(null)}
                          onDrop={(e) => handleBookmarkDrop(e, null)}
                        >
                          <div className="p-2 space-y-1">
                            {orphanedBookmarks.length === 0 && draggedBookmark ? (
                              <div className="text-xs text-grey-accent-500 text-center py-4">
                                Drop bookmark here to remove from collection
                              </div>
                            ) : (
                              orphanedBookmarks.map((bookmark) => (
                                <div
                                  key={`orphaned-${bookmark.id}`}
                                  className="group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-grey-accent-50 transition-colors"
                                  draggable
                                  onDragStart={(e) => handleBookmarkDragStart(e, bookmark.id)}
                                  onClick={() => setSelectedCollectionId(null)}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <FaviconImage 
                                      url={bookmark.url} 
                                      faviconUrl={bookmark.favicon_url} 
                                      size="w-3 h-3" 
                                    />
                                  </div>
                                  
                                  <span className="text-xs text-grey-accent-700 truncate flex-1">
                                    {bookmark.title || new URL(bookmark.url).hostname}
                                  </span>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-grey-accent-200 rounded transition-all"
                                    title="Open link"
                                  >
                                    <ExternalLink className="w-3 h-3 text-grey-accent-500" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main content area */}
              <div className="flex-1">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedBookmarks.map((bookmark) => (
                      <Card
                        key={bookmark.id}
                        className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300"
                      >
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={bookmark.preview_image || "/placeholder.svg"}
                            alt={bookmark.title || bookmark.url}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {/* Favicon overlay */}
                          <div className="absolute bottom-2 left-2">
                            <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
                              <FaviconImage 
                                url={bookmark.url} 
                                faviconUrl={bookmark.favicon_url} 
                                size="w-5 h-5" 
                              />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm line-clamp-2 mb-2">
                            {bookmark.title || bookmark.url}
                          </h3>
                          {bookmark.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {bookmark.description}
                            </p>
                          )}
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3 items-center">
                            {bookmark.tags && bookmark.tags.length > 0 && (
                              <>
                                {bookmark.tags.slice(0, 3).map((tag, index) => (
                                  <span 
                                    key={tag} 
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 rounded-full text-xs"
                                  >
                                    {tag}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newTags = bookmark.tags.filter((_, i) => i !== index);
                                        updateBookmarkTags(bookmark.id, newTags);
                                      }}
                                      className="text-grey-accent-500 hover:text-grey-accent-700 ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                {bookmark.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                                    +{bookmark.tags.length - 3}
                                  </span>
                                )}
                              </>
                            )}
                            
                            {/* Add tag button */}
                            {editingTags === bookmark.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="text"
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                        updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                      }
                                      setTagInput('');
                                      setEditingTags(null);
                                    } else if (e.key === 'Escape') {
                                      setTagInput('');
                                      setEditingTags(null);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                      updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                    }
                                    setTagInput('');
                                    setEditingTags(null);
                                  }}
                                  placeholder="Add tag..."
                                  className="w-20 h-6 text-xs px-2 py-1 border border-grey-accent-300 rounded"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTags(bookmark.id);
                                }}
                                className="w-5 h-5 rounded-full bg-grey-accent-200 hover:bg-grey-accent-300 flex items-center justify-center text-grey-accent-600 hover:text-grey-accent-800 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-grey-accent-600">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                                {((bookmark as any).profiles?.full_name || 'U')[0].toUpperCase()}
                              </div>
                              <span>{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <Heart className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedBookmarks.map((bookmark) => (
                      <Card key={bookmark.id} className="hover:shadow-md transition-all duration-200 bg-white border-grey-accent-200 hover:border-grey-accent-300">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={bookmark.preview_image || "/placeholder.svg"}
                                alt={bookmark.title || bookmark.url}
                                className="w-16 h-12 object-cover rounded border border-grey-accent-200"
                              />
                              {/* Favicon */}
                              <div className="absolute -bottom-1 -right-1">
                                <div className="w-6 h-6 rounded bg-white shadow-md flex items-center justify-center border border-grey-accent-200">
                                  <FaviconImage 
                                    url={bookmark.url} 
                                    faviconUrl={bookmark.favicon_url} 
                                    size="w-4 h-4" 
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate text-grey-accent-900">
                                {bookmark.title || bookmark.url}
                              </h3>
                              {bookmark.description && (
                                <p className="text-xs text-grey-accent-600 truncate">
                                  {bookmark.description}
                                </p>
                              )}
                              
                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mt-1 items-center">
                                {bookmark.tags && bookmark.tags.length > 0 && (
                                  <>
                                    {bookmark.tags.slice(0, 4).map((tag, index) => (
                                      <span 
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full"
                                      >
                                        {tag}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newTags = bookmark.tags.filter((_, i) => i !== index);
                                            updateBookmarkTags(bookmark.id, newTags);
                                          }}
                                          className="text-grey-accent-500 hover:text-grey-accent-700 ml-1"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                    {bookmark.tags.length > 4 && (
                                      <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                                        +{bookmark.tags.length - 4}
                                      </span>
                                    )}
                                  </>
                                )}
                                
                                {/* Add tag button */}
                                {editingTags === bookmark.id ? (
                                  <Input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                          updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                        }
                                        setTagInput('');
                                        setEditingTags(null);
                                      } else if (e.key === 'Escape') {
                                        setTagInput('');
                                        setEditingTags(null);
                                      }
                                    }}
                                    onBlur={() => {
                                      if (tagInput.trim() && !bookmark.tags.includes(tagInput.trim())) {
                                        updateBookmarkTags(bookmark.id, [...bookmark.tags, tagInput.trim()]);
                                      }
                                      setTagInput('');
                                      setEditingTags(null);
                                    }}
                                    placeholder="Add tag..."
                                    className="w-20 h-6 text-xs px-2 py-1 border border-grey-accent-300 rounded"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTags(bookmark.id);
                                    }}
                                    className="w-5 h-5 rounded-full bg-grey-accent-200 hover:bg-grey-accent-300 flex items-center justify-center text-grey-accent-600 hover:text-grey-accent-800 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                                  {((bookmark as any).profiles?.full_name || 'U')[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-grey-accent-600">
                                  {(bookmark as any).profiles?.full_name || 'Unknown'}
                                </span>
                                <span className="text-xs text-grey-accent-400">•</span>
                                <span className="text-xs text-grey-accent-600">
                                  {new Date(bookmark.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Heart className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {displayedBookmarks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔖</div>
                    <h3 className="text-xl font-semibold mb-2">No bookmarks found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery ? 'Try adjusting your search' : 'Start saving useful links for your team'}
                    </p>
                    <Button onClick={() => setShowAddBookmark(true)}>
                      Add Bookmark
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            {/* Advanced Filters Header */}
            <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-grey-accent-900">Advanced Filters</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  {showFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-sm text-grey-accent-600 mb-4">
                <span>{advancedFilteredBookmarks.length} bookmarks found</span>
                <span>{allTags.length} unique tags</span>
                <span>{collections.length} collections</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBookmarkFilters({
                    searchQuery: '',
                    selectedTags: [],
                    selectedCollections: [],
                    selectedCreators: [],
                    dateRange: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })}
                  className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
                >
                  Clear All Filters
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
                      <Input
                        placeholder="Search title, description, URL..."
                        value={bookmarkFilters.searchQuery}
                        onChange={(e) => setBookmarkFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Tags Filter with Autocomplete */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {bookmarkFilters.selectedTags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                            <button
                              onClick={() => setBookmarkFilters(prev => ({
                                ...prev,
                                selectedTags: prev.selectedTags.filter(t => t !== tag)
                              }))}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !bookmarkFilters.selectedTags.includes(e.target.value)) {
                            setBookmarkFilters(prev => ({
                              ...prev,
                              selectedTags: [...prev.selectedTags, e.target.value]
                            }))
                          }
                        }}
                        className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="">Select tags...</option>
                        {allTags.filter(tag => !bookmarkFilters.selectedTags.includes(tag)).map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Collections Filter with Autocomplete */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Collections</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {bookmarkFilters.selectedCollections.map(collectionId => {
                          const collection = collections.find(c => c.id === collectionId)
                          return (
                            <span key={collectionId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {collection?.name || 'Unknown'}
                              <button
                                onClick={() => setBookmarkFilters(prev => ({
                                  ...prev,
                                  selectedCollections: prev.selectedCollections.filter(c => c !== collectionId)
                                }))}
                                className="text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !bookmarkFilters.selectedCollections.includes(e.target.value)) {
                            setBookmarkFilters(prev => ({
                              ...prev,
                              selectedCollections: [...prev.selectedCollections, e.target.value]
                            }))
                          }
                        }}
                        className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="">Select collections...</option>
                        {collections.filter(c => !bookmarkFilters.selectedCollections.includes(c.id)).map(collection => (
                          <option key={collection.id} value={collection.id}>{collection.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Creators Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Created By</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {bookmarkFilters.selectedCreators.map(creator => (
                          <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {creator}
                            <button
                              onClick={() => setBookmarkFilters(prev => ({
                                ...prev,
                                selectedCreators: prev.selectedCreators.filter(c => c !== creator)
                              }))}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !bookmarkFilters.selectedCreators.includes(e.target.value)) {
                            setBookmarkFilters(prev => ({
                              ...prev,
                              selectedCreators: [...prev.selectedCreators, e.target.value]
                            }))
                          }
                        }}
                        className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="">Select creators...</option>
                        {allCreators.filter(creator => !bookmarkFilters.selectedCreators.includes(creator)).map(creator => (
                          <option key={creator} value={creator}>{creator}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={bookmarkFilters.sortBy}
                        onChange={(e) => setBookmarkFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                        className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="created_at">Date Created</option>
                        <option value="updated_at">Date Modified</option>
                        <option value="title">Title</option>
                      </select>
                      <select
                        value={bookmarkFilters.sortOrder}
                        onChange={(e) => setBookmarkFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                        className="p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                      </select>
                    </div>
                  </div>

                  {/* Date Range - Basic for now */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="From"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          setBookmarkFilters(prev => ({
                            ...prev,
                            dateRange: date ? { start: date, end: prev.dateRange?.end || date } : null
                          }))
                        }}
                        className="text-sm"
                      />
                      <Input
                        type="date"
                        placeholder="To"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null
                          setBookmarkFilters(prev => ({
                            ...prev,
                            dateRange: prev.dateRange?.start && date ? { start: prev.dateRange.start, end: date } : null
                          }))
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtered Bookmarks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedFilteredBookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={bookmark.preview_image || "/placeholder.svg"}
                      alt={bookmark.title || bookmark.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Favicon overlay */}
                    <div className="absolute bottom-2 left-2">
                      <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
                        <FaviconImage 
                          url={bookmark.url} 
                          faviconUrl={bookmark.favicon_url} 
                          size="w-5 h-5" 
                        />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                      {bookmark.title || bookmark.url}
                    </h3>
                    {bookmark.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {bookmark.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3 items-center">
                      {bookmark.tags && bookmark.tags.length > 0 && (
                        <>
                          {bookmark.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                              onClick={() => {
                                // Add tag to filter when clicked
                                if (!bookmarkFilters.selectedTags.includes(tag)) {
                                  setBookmarkFilters(prev => ({
                                    ...prev,
                                    selectedTags: [...prev.selectedTags, tag]
                                  }))
                                }
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {bookmark.tags.length > 3 && (
                            <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                              +{bookmark.tags.length - 3}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-grey-accent-600">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                          {((bookmark as any).profiles?.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <span 
                          className="cursor-pointer hover:text-purple-600"
                          onClick={() => {
                            // Add creator to filter when clicked
                            const creatorName = (bookmark as any).profiles?.full_name || 'Unknown'
                            if (!bookmarkFilters.selectedCreators.includes(creatorName)) {
                              setBookmarkFilters(prev => ({
                                ...prev,
                                selectedCreators: [...prev.selectedCreators, creatorName]
                              }))
                            }
                          }}
                        >
                          {(bookmark as any).profiles?.full_name || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-grey-accent-500 hover:text-grey-accent-700" asChild>
                          <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {advancedFilteredBookmarks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No bookmarks match your filters</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or clear some filters
                </p>
                <Button
                  onClick={() => setBookmarkFilters({
                    searchQuery: '',
                    selectedTags: [],
                    selectedCollections: [],
                    selectedCreators: [],
                    dateRange: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            {/* Collection Filters Header */}
            <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-grey-accent-900">Collection Filters</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCollectionFilters(!showCollectionFilters)}
                  className="flex items-center gap-2"
                >
                  {showCollectionFilters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {showCollectionFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 text-sm text-grey-accent-600 mb-4">
                <span>{filteredCollections.length} collections found</span>
                <span>{allFlatCollections.length} total collections</span>
                <span>{parentCollections.length} root collections</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCollectionFilters({
                    searchQuery: '',
                    selectedCreators: [],
                    selectedParents: [],
                    hasBookmarks: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })}
                  className="text-xs text-grey-accent-500 hover:text-grey-accent-700"
                >
                  Clear All Filters
                </Button>
              </div>

              {showCollectionFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Collections</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-grey-accent-400" />
                      <Input
                        placeholder="Search collection name, description..."
                        value={collectionFilters.searchQuery}
                        onChange={(e) => setCollectionFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Creators Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Created By</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {collectionFilters.selectedCreators.map(creator => (
                          <span key={creator} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {creator}
                            <button
                              onClick={() => setCollectionFilters(prev => ({
                                ...prev,
                                selectedCreators: prev.selectedCreators.filter(c => c !== creator)
                              }))}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !collectionFilters.selectedCreators.includes(e.target.value)) {
                            setCollectionFilters(prev => ({
                              ...prev,
                              selectedCreators: [...prev.selectedCreators, e.target.value]
                            }))
                          }
                        }}
                        className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="">Select creators...</option>
                        {allCollectionCreators.filter(creator => !collectionFilters.selectedCreators.includes(creator)).map(creator => (
                          <option key={creator} value={creator}>{creator}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Parent Collections Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Show Only Children Of</label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {collectionFilters.selectedParents.map(parentId => {
                          const parent = parentCollections.find(c => c.id === parentId)
                          return (
                            <span key={parentId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {parent?.name || 'Unknown'}
                              <button
                                onClick={() => setCollectionFilters(prev => ({
                                  ...prev,
                                  selectedParents: prev.selectedParents.filter(p => p !== parentId)
                                }))}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !collectionFilters.selectedParents.includes(e.target.value)) {
                            setCollectionFilters(prev => ({
                              ...prev,
                              selectedParents: [...prev.selectedParents, e.target.value]
                            }))
                          }
                        }}
                        className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="">Select parent collections...</option>
                        {parentCollections.filter(c => !collectionFilters.selectedParents.includes(c.id)).map(collection => (
                          <option key={collection.id} value={collection.id}>{collection.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bookmark Status Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Bookmark Status</label>
                    <select
                      value={collectionFilters.hasBookmarks === null ? 'all' : collectionFilters.hasBookmarks ? 'with' : 'empty'}
                      onChange={(e) => {
                        const value = e.target.value === 'all' ? null : e.target.value === 'with'
                        setCollectionFilters(prev => ({ ...prev, hasBookmarks: value }))
                      }}
                      className="w-full p-2 border border-grey-accent-300 rounded-md text-sm"
                    >
                      <option value="all">All Collections</option>
                      <option value="with">With Bookmarks</option>
                      <option value="empty">Empty Collections</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={collectionFilters.sortBy}
                        onChange={(e) => setCollectionFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                        className="flex-1 p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="created_at">Date Created</option>
                        <option value="name">Name</option>
                        <option value="bookmark_count">Bookmark Count</option>
                      </select>
                      <select
                        value={collectionFilters.sortOrder}
                        onChange={(e) => setCollectionFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                        className="p-2 border border-grey-accent-300 rounded-md text-sm"
                      >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtered Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection) => (
                <Card 
                  key={collection.id} 
                  className="hover:shadow-lg transition-all duration-200 bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer group"
                  onClick={() => {
                    setSelectedDirectoryCollection(collection)
                    setShowDirectoryModal(true)
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: collection.color }}
                        />
                        <Folder className="w-5 h-5 text-muted-foreground group-hover:text-grey-accent-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                          {bookmarks.filter(b => b.collection_id === collection.id).length} items
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyDirectoryStructure(collection)
                          }}
                          title="Copy directory structure"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-bold text-lg group-hover:text-grey-accent-800">{collection.name}</h3>
                      {(collection as any).parent_id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200">
                          Nested
                        </span>
                      )}
                    </div>
                    
                    {/* Parent hierarchy - more prominent */}
                    {(collection as any).parent_id && (
                      <div className="mb-3 p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r">
                        <div className="flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-800">
                            Parent: {(() => {
                              const parent = allFlatCollections.find(c => c.id === (collection as any).parent_id)
                              return parent?.name || 'Unknown Parent'
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {collection.description && (
                      <div className="mb-4 p-3 bg-grey-accent-50 border border-grey-accent-200 rounded">
                        <div className="text-xs font-medium text-grey-accent-600 mb-1">Description</div>
                        <p className="text-sm text-grey-accent-700 line-clamp-2">
                          {collection.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Child count if has children */}
                    {collection.children && collection.children.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {collection.children.length} sub-collections
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-grey-accent-600">
                        Created {new Date(collection.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 flex items-center justify-center text-white text-xs font-semibold">
                          {((collection as any).profiles?.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-grey-accent-600">
                          {(collection as any).profiles?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Click hint */}
                    <div className="mt-3 text-xs text-grey-accent-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view directory structure
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold mb-2">No collections match your filters</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or clear some filters
                </p>
                <Button
                  onClick={() => setCollectionFilters({
                    searchQuery: '',
                    selectedCreators: [],
                    selectedParents: [],
                    hasBookmarks: null,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            {/* Activity Header */}
            <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
              <h3 className="text-lg font-semibold text-grey-accent-900 mb-2">Team Activity Log</h3>
              <p className="text-sm text-grey-accent-600">
                Real-time activity feed showing all team member actions • {teamEvents.length} events
              </p>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg border border-grey-accent-200 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {teamEvents.map((event, index) => {
                  const getEventIcon = (eventType: string) => {
                    switch (eventType) {
                      case 'collection.created': return { icon: '📁', color: 'text-blue-600', bg: 'bg-blue-50' }
                      case 'bookmark.created': return { icon: '🔖', color: 'text-green-600', bg: 'bg-green-50' }
                      case 'highlight.created': return { icon: '✨', color: 'text-yellow-600', bg: 'bg-yellow-50' }
                      case 'annotation.created': return { icon: '💬', color: 'text-purple-600', bg: 'bg-purple-50' }
                      default: return { icon: '📝', color: 'text-grey-accent-600', bg: 'bg-grey-accent-50' }
                    }
                  }
                  
                  const getVerboseDescription = (eventType: string, data: any, event: any) => {
                    const timestamp = new Date(event.created_at)
                    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    const dateStr = timestamp.toLocaleDateString()
                    const userName = (event as any).profiles?.full_name || 'Unknown User'
                    
                    switch (eventType) {
                      case 'collection.created':
                        return {
                          action: `Created collection "${data?.collection_name || 'Untitled'}"`,
                          details: data?.collection_description ? `Description: "${data.collection_description}"` : 'No description provided',
                          metadata: `Collection ID: ${data?.collection_id || 'Unknown'}`
                        }
                      case 'bookmark.created':
                        return {
                          action: `Added bookmark "${data?.bookmark_title || data?.bookmark_url || 'Untitled'}"`,
                          details: data?.bookmark_url ? `URL: ${data.bookmark_url}` : 'No URL provided',
                          metadata: `${data?.collection_name ? `To collection: "${data.collection_name}"` : 'Uncategorized'} • Bookmark ID: ${data?.bookmark_id || 'Unknown'}`
                        }
                      case 'highlight.created':
                        return {
                          action: 'Created text highlight',
                          details: data?.highlight_text ? `"${data.highlight_text.substring(0, 100)}${data.highlight_text.length > 100 ? '...' : ''}"` : 'No highlight text',
                          metadata: `Source: ${data?.source_url || 'Unknown'}`
                        }
                      case 'annotation.created':
                        return {
                          action: 'Added annotation',
                          details: data?.annotation_text ? `"${data.annotation_text}"` : 'No annotation text',
                          metadata: `Target: ${data?.target_type || 'Unknown'}`
                        }
                      default:
                        return {
                          action: eventType.replace('.', ' ').replace('_', ' '),
                          details: 'System event',
                          metadata: `Event type: ${eventType}`
                        }
                    }
                  }

                  const eventStyle = getEventIcon(event.event_type)
                  const description = getVerboseDescription(event.event_type, event.data, event)
                  const timestamp = new Date(event.created_at)
                  const now = new Date()
                  const diffMs = now.getTime() - timestamp.getTime()
                  const diffMins = Math.floor(diffMs / (1000 * 60))
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                  
                  const getRelativeTime = () => {
                    if (diffMins < 1) return 'Just now'
                    if (diffMins < 60) return `${diffMins}m ago`
                    if (diffHours < 24) return `${diffHours}h ago`
                    if (diffDays < 7) return `${diffDays}d ago`
                    return timestamp.toLocaleDateString()
                  }

                  return (
                    <div 
                      key={event.id} 
                      className={`border-l-4 p-4 hover:bg-grey-accent-25 transition-colors ${
                        index !== teamEvents.length - 1 ? 'border-b border-grey-accent-100' : ''
                      } ${eventStyle.bg} border-l-current`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Timestamp column */}
                        <div className="w-20 flex-shrink-0 text-right">
                          <div className="text-xs font-mono text-grey-accent-500">
                            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-grey-accent-400">
                            {getRelativeTime()}
                          </div>
                        </div>
                        
                        {/* Icon and user */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 text-white flex items-center justify-center text-xs font-semibold">
                            {((event as any).profiles?.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm">{eventStyle.icon}</span>
                        </div>
                        
                        {/* Event details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-grey-accent-900 text-sm">
                              {(event as any).profiles?.full_name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-grey-accent-500 bg-grey-accent-100 px-2 py-0.5 rounded-full">
                              {event.event_type}
                            </span>
                          </div>
                          
                          <div className="text-sm text-grey-accent-800 mb-1">
                            {description.action}
                          </div>
                          
                          <div className="text-xs text-grey-accent-600 mb-1">
                            {description.details}
                          </div>
                          
                          <div className="text-xs text-grey-accent-500 font-mono">
                            {description.metadata}
                          </div>
                        </div>
                        
                        {/* Full timestamp on hover */}
                        <div className="text-xs text-grey-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {teamEvents.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Team activity will appear here as members create collections and bookmarks
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Directory Structure Modal */}
      {showDirectoryModal && selectedDirectoryCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
              <div className="flex items-center gap-3">
                <Folder className="w-6 h-6 text-grey-accent-600" />
                <div>
                  <h2 className="text-xl font-semibold text-grey-accent-900">
                    {selectedDirectoryCollection.name} Directory Structure
                  </h2>
                  <p className="text-sm text-grey-accent-600">
                    Created by {(selectedDirectoryCollection as any).profiles?.full_name || 'Unknown'} on{' '}
                    {new Date(selectedDirectoryCollection.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDirectoryStructure(selectedDirectoryCollection)}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Markdown
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDirectoryModal(false)
                    setSelectedDirectoryCollection(null)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-grey-accent-50 rounded-lg p-4 font-mono text-sm">
                <DirectoryTreeView collection={selectedDirectoryCollection} bookmarks={bookmarks} level={0} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal - You'll need to implement these modals */}
      {showCreateCollection && (
        <CreateCollectionModal
          onClose={() => setShowCreateCollection(false)}
          onCreate={createCollection}
          collections={collections}
        />
      )}

      {/* Add Bookmark Modal */}
      {showAddBookmark && (
        <AddBookmarkModal
          collections={collections}
          onClose={() => setShowAddBookmark(false)}
          onCreate={createBookmark}
        />
      )}
    </div>
  )
}

// Modal Components - keeping the existing ones from your original code
function CreateCollectionModal({ 
  onClose, 
  onCreate,
  collections = []
}: { 
  onClose: () => void;
  onCreate: (name: string, description?: string, color?: string, parentId?: string) => void;
  collections?: Collection[];
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#A0D2EB')
  const [parentId, setParentId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined, color, parentId || undefined)
    }
  }

  const colorOptions = [
    '#A0D2EB', '#E57373', '#C41230', '#81C784', '#FFB74D', 
    '#BA68C8', '#4FC3F7', '#FF8A65', '#9CCC65', '#F06292'
  ]

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Collection Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter collection name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Collection</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Root Level (No Parent)</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    📁 {collection.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Collection Color</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded border-2 ${color === colorOption ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create Collection
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AddBookmarkModal({ 
  collections,
  onClose, 
  onCreate 
}: { 
  collections: any[];
  onClose: () => void;
  onCreate: (url: string, title?: string, collectionId?: string, tags?: string[]) => void;
}) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onCreate(url.trim(), title.trim() || undefined, collectionId || undefined, tags.length > 0 ? tags : undefined)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Bookmark</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Collection</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    📁 {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const tag = tagInput.trim()
                      if (tag && !tags.includes(tag)) {
                        setTags([...tags, tag])
                        setTagInput('')
                      }
                    }
                  }}
                  placeholder="Add tags (press Enter or comma to add)"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="text-grey-accent-500 hover:text-grey-accent-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Bookmark
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}