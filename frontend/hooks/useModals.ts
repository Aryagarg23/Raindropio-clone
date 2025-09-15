import { useState } from 'react'

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

export const useModals = () => {
  const [showCreateCollection, setShowCreateCollection] = useState(false)
  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [selectedDirectoryCollection, setSelectedDirectoryCollection] = useState<ExtendedCollection | null>(null)
  const [showDirectoryModal, setShowDirectoryModal] = useState(false)
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  const openCreateCollection = () => setShowCreateCollection(true)
  const closeCreateCollection = () => setShowCreateCollection(false)
  
  const openAddBookmark = () => setShowAddBookmark(true)
  const closeAddBookmark = () => setShowAddBookmark(false)

  const openDirectoryModal = (collection: ExtendedCollection) => {
    setSelectedDirectoryCollection(collection)
    setShowDirectoryModal(true)
  }
  
  const closeDirectoryModal = () => {
    setShowDirectoryModal(false)
    setSelectedDirectoryCollection(null)
  }

  const startEditingTags = (bookmarkId: string) => {
    setEditingTags(bookmarkId)
    setTagInput('')
  }
  
  const stopEditingTags = () => {
    setEditingTags(null)
    setTagInput('')
  }

  return {
    // Collection modal
    showCreateCollection,
    openCreateCollection,
    closeCreateCollection,
    
    // Bookmark modal
    showAddBookmark,
    openAddBookmark,
    closeAddBookmark,
    
    // Directory modal
    selectedDirectoryCollection,
    showDirectoryModal,
    openDirectoryModal,
    closeDirectoryModal,
    
    // Tag editing
    editingTags,
    tagInput,
    setTagInput,
    startEditingTags,
    stopEditingTags
  }
}