import { useState, useEffect } from 'react';
import { Collection } from '../../types/api';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    url: string; 
    title: string; 
    description: string; 
    collection_id?: string; 
    tags: string[] 
  }) => void;
  collections: Collection[];
  defaultCollectionId?: string;
}

export default function AddBookmarkModal({
  isOpen,
  onClose,
  onSubmit,
  collections,
  defaultCollectionId
}: AddBookmarkModalProps) {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    collection_id: defaultCollectionId || '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (defaultCollectionId) {
      setFormData(prev => ({ ...prev, collection_id: defaultCollectionId }));
    }
  }, [defaultCollectionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.url.trim()) {
      onSubmit({
        ...formData,
        collection_id: formData.collection_id || undefined
      });
      setFormData({
        url: '',
        title: '',
        description: '',
        collection_id: defaultCollectionId || '',
        tags: []
      });
      setTagInput('');
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      url: '',
      title: '',
      description: '',
      collection_id: defaultCollectionId || '',
      tags: []
    });
    setTagInput('');
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 transition-all duration-300 transform max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Add Bookmark
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all duration-200 hover:transform hover:scale-110"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--background-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              } as React.CSSProperties}
              required
              autoFocus
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter a custom title..."
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              } as React.CSSProperties}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this bookmark..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              } as React.CSSProperties}
            />
          </div>

          {/* Collection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Collection
            </label>
            <select
              value={formData.collection_id}
              onChange={(e) => setFormData({ ...formData, collection_id: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              } as React.CSSProperties}
            >
              <option value="">No Collection (Uncategorized)</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)'
                  }}
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-200"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--background)'
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg transition-all duration-200 font-medium"
              style={{ 
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg transition-all duration-200 font-medium hover:transform hover:-translate-y-1"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                boxShadow: 'var(--shadow-md)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
            >
              Add Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}