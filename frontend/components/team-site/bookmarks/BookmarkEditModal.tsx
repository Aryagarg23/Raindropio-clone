import React, { useState, useEffect } from 'react'
import { X, Save, Loader } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface BookmarkEditModalProps {
  bookmark: any
  isOpen: boolean
  onClose: () => void
  onSave: (updatedBookmark: any) => Promise<void>
}

export function BookmarkEditModal({ bookmark, isOpen, onClose, onSave }: BookmarkEditModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [previewImage, setPreviewImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || '')
      setDescription(bookmark.description || '')
      setPreviewImage(bookmark.preview_image || '')
      setImageFile(null) // Reset file when bookmark changes
    }
  }, [bookmark])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedBookmark = {
        ...bookmark,
        title: title.trim(),
        description: description.trim(),
        preview_image: previewImage.trim(),
        image_file: imageFile
      }
      await onSave(updatedBookmark)
      onClose()
    } catch (error) {
      console.error('Failed to save bookmark:', error)
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !bookmark) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
          <h2 className="text-lg font-semibold text-grey-accent-900">Edit Bookmark</h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg hover:bg-grey-accent-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-grey-accent-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-grey-accent-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-grey-accent-300 rounded-lg focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent"
              placeholder="Enter bookmark title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-accent-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-grey-accent-300 rounded-lg focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent resize-none"
              placeholder="Enter bookmark description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-accent-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={previewImage}
              onChange={(e) => setPreviewImage(e.target.value)}
              className="w-full px-3 py-2 border border-grey-accent-300 rounded-lg focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-grey-accent-700 mb-2">
              Or Upload Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setImageFile(file)
                if (file) {
                  setPreviewImage('') // Clear URL if file is selected
                }
              }}
              className="w-full px-3 py-2 border border-grey-accent-300 rounded-lg focus:ring-2 focus:ring-grey-accent-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-grey-accent-100 file:text-grey-accent-700 hover:file:bg-grey-accent-200"
            />
            {imageFile && (
              <p className="mt-1 text-sm text-grey-accent-600">
                Selected: {imageFile.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-grey-accent-200">
          <Button
            onClick={onClose}
            disabled={isSaving}
            variant="outline"
            className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-grey-accent-700 hover:bg-grey-accent-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}