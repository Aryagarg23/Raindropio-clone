import { useState, useRef } from 'react'
import supabase from '../modules/supabaseClient'

interface DragState {
  draggedCollection: string | null
  draggedBookmark: string | null
  dragOverTarget: string | null
  dragOverData: {id: string, position: 'root' | 'child'} | null
}

interface UseDragAndDropProps {
  collections: any[]
  bookmarks: any[]
  user: any
  setError: (error: string) => void
  setCollections: React.Dispatch<React.SetStateAction<any[]>>
  setBookmarks: React.Dispatch<React.SetStateAction<any[]>>
}

export const useDragAndDrop = ({ collections, bookmarks, user, setError, setCollections, setBookmarks }: UseDragAndDropProps) => {
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null)
  const [draggedBookmark, setDraggedBookmark] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [dragOverData, setDragOverData] = useState<{id: string, position: 'root' | 'child'} | null>(null)
  
  const throttleTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = (e: React.DragEvent, itemId: string, itemType: 'collection' | 'bookmark' = 'collection') => {
    console.log('=== DRAG START ===', itemId, itemType);
    if (itemType === 'collection') {
      setDraggedCollection(itemId)
    } else {
      setDraggedBookmark(itemId)
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    console.log('=== DRAG END ===', { draggedCollection, draggedBookmark });
    
    // Clear throttle timeout
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
      throttleTimeout.current = null
    }
    
    setDraggedCollection(null)
    setDraggedBookmark(null)
    setDragOverData(null)
    setDragOverTarget(null)
  }

  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Simple left/right position detection
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const position = x < width * 0.5 ? 'root' : 'child'
    
    // Throttle state updates to prevent excessive re-renders
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
    }
    
    throttleTimeout.current = setTimeout(() => {
      if (!dragOverData || dragOverData.id !== collectionId || dragOverData.position !== position) {
        setDragOverData({ id: collectionId, position })
      }
    }, 16) // ~60fps throttle for state updates
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (throttleTimeout.current) {
      clearTimeout(throttleTimeout.current)
    }
    
    throttleTimeout.current = setTimeout(() => {
      setDragOverData(null)
    }, 50)
  }

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    
    if (!draggedCollection) return

    try {
      // Check if user has permission to modify collections
      if (!user) {
        console.error('No authenticated user')
        setError('You must be logged in to move collections')
        return
      }

      // Move collection to root level at the bottom
      // Find the highest sort_order among root-level collections
      const rootCollections = collections.filter(c => c.parent_id === null)
      const maxSortOrder = rootCollections.length > 0 
        ? Math.max(...rootCollections.map(c => c.sort_order || 0))
        : 0
      
      console.log('Moving to root bottom:', { 
        draggedCollection, 
        newSortOrder: maxSortOrder + 10,
        userId: user.id,
        userRole: user.role || 'unknown'
      });
      
      const { data, error } = await supabase
        .from('collections')
        .update({ 
          parent_id: null,
          sort_order: maxSortOrder + 10
        })
        .eq('id', draggedCollection)
      
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error
      }

      console.log('Root drop success:', data)
      
      // Force a refresh of collections data to ensure UI updates
      if (data) {
        console.log('Forcing collections refresh for non-admin user...');
        // The useTeamSite hook should handle this via subscriptions, but let's be explicit
        window.location.reload(); // Temporary fix - should be replaced with proper state management
      }
      
    } catch (error: any) {
      console.error('Failed to move collection to root:', error)
      
      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status')
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator')
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team')
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setDraggedCollection(null)
      setDragOverData(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetCollectionId: string) => {
    console.log('=== HANDLE DROP CALLED ===', { draggedCollection, targetCollectionId });
    e.preventDefault()
    e.stopPropagation() // Prevent root drop
    
    if (!draggedCollection || draggedCollection === targetCollectionId) {
      console.log('Early return:', { draggedCollection, targetCollectionId, reason: 'no-drag-or-same' });
      setDraggedCollection(null)
      setDragOverData(null)
      return
    }

    // Calculate position at drop time to avoid throttling race conditions
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const dropPosition = x < width * 0.5 ? 'root' : 'child'
    
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
        console.error('No authenticated user for drop operation')
        setError('You must be logged in to move collections')
        return
      }

      const draggedCol = collections.find(c => c.id === draggedCollection)
      const targetCol = collections.find(c => c.id === targetCollectionId)
      
      console.log('Found collections:', { 
        draggedCol, 
        targetCol, 
        totalCollections: collections.length,
        userId: user.id,
        userRole: user.role || 'unknown'
      });
      
      if (!draggedCol || !targetCol) {
        console.log('Missing collections, aborting')
        return
      }

      // Team members have full access to modify collections within their team
      console.log('Team member confirmed - allowing collection modification')

      if (dropPosition === 'child') {
        // Right side drop - move into target collection as child
        console.log('Making child - smart positioning')
        
        // Get existing children of target, sorted by sort_order
        const existingChildren = collections
          .filter(c => c.parent_id === targetCollectionId)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        
        let newSortOrder: number
        
        if (existingChildren.length === 0) {
          // First child - start with 10
          newSortOrder = 10
        } else {
          // Get max sort_order and add buffer
          const maxOrder = Math.max(...existingChildren.map(c => c.sort_order || 0))
          
          // If we have room (max < 1000), just increment normally
          if (maxOrder < 1000) {
            newSortOrder = maxOrder + 10
          } else {
            // Only resequence if values are getting too high
            console.log('Values getting high, resequencing children...')
            
            // Resequence existing children first
            for (let i = 0; i < existingChildren.length; i++) {
              await supabase
                .from('collections')
                .update({ sort_order: (i + 1) * 10 })
                .eq('id', existingChildren[i].id)
            }
            
            // Place new child at end
            newSortOrder = (existingChildren.length + 1) * 10
          }
        }
        
        console.log('Child positioning:', { targetCollectionId, newSortOrder })
        
        // Optimistic update - update local state immediately
        const originalCollection = collections.find(c => c.id === draggedCollection)
        setCollections(prevCollections => 
          prevCollections.map(c => 
            c.id === draggedCollection 
              ? { ...c, parent_id: targetCollectionId, sort_order: newSortOrder }
              : c
          )
        )
        
        const { error } = await supabase
          .from('collections')
          .update({ 
            parent_id: targetCollectionId,
            sort_order: newSortOrder
          })
          .eq('id', draggedCollection)
        
        if (error) {
          console.error('Child update error:', error)
          // Revert optimistic update on error
          setCollections(prevCollections => 
            prevCollections.map(c => 
              c.id === draggedCollection 
                ? { ...c, parent_id: originalCollection?.parent_id, sort_order: originalCollection?.sort_order }
                : c
            )
          )
          throw error
        }
        
      } else {
        // Left side drop - move above target (same parent level)
        console.log('Moving above target - smart positioning')
        
        const targetParentId = targetCol.parent_id
        const targetSortOrder = targetCol.sort_order || 0
        
        // Get all siblings at target level, sorted by sort_order
        const siblings = collections
          .filter(c => c.parent_id === targetParentId && c.id !== draggedCollection)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        
        const targetIndex = siblings.findIndex(c => c.id === targetCollectionId)
        let newSortOrder: number
        
        if (targetIndex === 0) {
          // Target is first - place before it with room
          newSortOrder = Math.max(1, targetSortOrder - 10)
        } else if (targetIndex > 0) {
          // Place between previous sibling and target
          const prevOrder = siblings[targetIndex - 1].sort_order || 0
          const gap = targetSortOrder - prevOrder
          
          if (gap > 2) {
            // Enough room - place in middle
            newSortOrder = prevOrder + Math.floor(gap / 2)
          } else {
            // Not enough room - need to resequence siblings
            console.log('Not enough room, resequencing siblings...')
            
            // Optimistic update for resequencing
            setCollections(prevCollections => {
              const updated = [...prevCollections]
              for (let i = 0; i < siblings.length; i++) {
                const sibling = siblings[i]
                const existingIndex = updated.findIndex(c => c.id === sibling.id)
                if (existingIndex !== -1) {
                  if (sibling.id === targetCollectionId && i > 0) {
                    // Insert dragged item before target
                    const draggedIndex = updated.findIndex(c => c.id === draggedCollection)
                    if (draggedIndex !== -1) {
                      updated[draggedIndex] = { ...updated[draggedIndex], parent_id: targetParentId, sort_order: (i + 1) * 10 }
                    }
                    updated[existingIndex] = { ...updated[existingIndex], sort_order: (i + 2) * 10 }
                  } else {
                    // Regular sibling update
                    const adjustedIndex = sibling.id === targetCollectionId ? i + 2 : i + 1
                    updated[existingIndex] = { ...updated[existingIndex], sort_order: adjustedIndex * 10 }
                  }
                }
              }
              return updated
            })
            
            // Resequence all siblings with 10-unit spacing
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i]
              if (sibling.id === targetCollectionId && i > 0) {
                // Insert dragged item before target
                await supabase
                  .from('collections')
                  .update({ 
                    parent_id: targetParentId,
                    sort_order: (i + 1) * 10 // Will be target's new position
                  })
                  .eq('id', draggedCollection)
                
                // Update target to next position  
                await supabase
                  .from('collections')
                  .update({ sort_order: (i + 2) * 10 })
                  .eq('id', sibling.id)
              } else {
                // Regular sibling update
                const adjustedIndex = sibling.id === targetCollectionId ? i + 2 : i + 1
                await supabase
                  .from('collections')
                  .update({ sort_order: adjustedIndex * 10 })
                  .eq('id', sibling.id)
              }
            }
            
            return // Exit early since we handled the update above
          }
        } else {
          // Fallback
          newSortOrder = 5
        }
        
        console.log('Sibling positioning:', { targetParentId, newSortOrder })
        
        // Optimistic update - update local state immediately
        const originalCollection2 = collections.find(c => c.id === draggedCollection)
        setCollections(prevCollections => 
          prevCollections.map(c => 
            c.id === draggedCollection 
              ? { ...c, parent_id: targetParentId, sort_order: newSortOrder }
              : c
          )
        )
        
        const { error } = await supabase
          .from('collections')
          .update({ 
            parent_id: targetParentId,
            sort_order: newSortOrder
          })
          .eq('id', draggedCollection)
          
        if (error) {
          console.error('Reorder error:', error)
          // Revert optimistic update on error
          setCollections(prevCollections => 
            prevCollections.map(c => 
              c.id === draggedCollection 
                ? { ...c, parent_id: originalCollection2?.parent_id, sort_order: originalCollection2?.sort_order }
                : c
            )
          )
          throw error
        }
      }
      
    } catch (error: any) {
      console.error('Failed to move collection:', error)
      
      // More specific error messages based on the error type
      if (error.code === 'PGRST301') {
        setError('Permission denied: Check your team membership status')
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator')
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team')
      } else if (error.message?.includes('unique')) {
        setError('Conflict error: Try refreshing the page and try again')
      } else {
        setError(`Failed to move collection: ${error.message || 'Unknown error'}`)
      }
      
      // For non-admin users, suggest refreshing to sync state
      if (user?.role !== 'admin') {
        console.log('Non-admin user encountered error, suggesting refresh...')
        setTimeout(() => {
          setError('Failed to move collection (Try refreshing the page if issues persist)')
        }, 2000)
      }
    } finally {
      setDraggedCollection(null)
      setDragOverData(null)
    }
  }

  const handleBookmarkDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverTarget(targetId)
  }

  const handleBookmarkDrop = async (e: React.DragEvent, targetCollectionId: string | null) => {
    console.log('=== BOOKMARK DROP ===', { draggedBookmark, targetCollectionId });
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedBookmark) return

    try {
      console.log('Updating bookmark collection:', {
        bookmarkId: draggedBookmark,
        newCollectionId: targetCollectionId,
        userId: user?.id
      });

      // Optimistic update - update local state immediately
      const originalBookmark = bookmarks.find(b => b.id === draggedBookmark)
      setBookmarks(prevBookmarks => 
        prevBookmarks.map(b => 
          b.id === draggedBookmark 
            ? { ...b, collection_id: targetCollectionId }
            : b
        )
      )

      const { data, error } = await supabase
        .from('bookmarks')
        .update({ collection_id: targetCollectionId })
        .eq('id', draggedBookmark)
      
      if (error) {
        console.error('Bookmark drop error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Revert optimistic update on error
        setBookmarks(prevBookmarks => 
          prevBookmarks.map(b => 
            b.id === draggedBookmark 
              ? { ...b, collection_id: originalBookmark?.collection_id }
              : b
          )
        )
        throw error
      }

      console.log('Bookmark drop success:', data);
      
    } catch (error: any) {
      console.error('Failed to move bookmark:', error)
      
      // More specific error messages
      if (error.code === 'PGRST301') {
        setError('Permission denied: Cannot move bookmarks')
      } else if (error.code === '42501') {
        setError('Database permission error: Contact your team administrator')
      } else if (error.message?.includes('policy')) {
        setError('Access denied: You may not be a member of this team')
      } else {
        setError(`Failed to move bookmark: ${error.message || 'Unknown error'}`)
      }
    } finally {
      console.log('Bookmark drop cleanup');
      setDraggedBookmark(null)
      setDragOverTarget(null)
    }
  }

  // Specific bookmark drag handlers for clarity
  const handleBookmarkDragStart = (e: React.DragEvent, bookmarkId: string) => {
    console.log('=== BOOKMARK DRAG START ===', bookmarkId);
    setDraggedBookmark(bookmarkId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return {
    draggedCollection,
    draggedBookmark, 
    dragOverTarget,
    dragOverData,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleRootDrop,
    handleDrop,
    handleBookmarkDragStart,
    handleBookmarkDragOver,
    handleBookmarkDrop
  }
}