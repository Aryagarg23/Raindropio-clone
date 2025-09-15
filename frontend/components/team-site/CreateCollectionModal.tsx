import { useState } from 'react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; color: string }) => void;
}

export default function CreateCollectionModal({ isOpen, onClose, onSubmit }: CreateCollectionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1'
  });

  const predefinedColors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData({ name: '', description: '', color: '#6366f1' });
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', color: '#6366f1' });
    onClose();
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
        className="relative w-full max-w-md rounded-2xl p-6 transition-all duration-300 transform"
        style={{
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Create Collection
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
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Collection Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter collection name..."
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this collection is for..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              } as React.CSSProperties}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Collection Color
            </label>
            <div className="flex items-center space-x-3">
              {/* Color Preview */}
              <div
                className="w-10 h-10 rounded-lg border-2 border-white shadow-md"
                style={{ backgroundColor: formData.color }}
              ></div>
              
              {/* Predefined Colors */}
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                      formData.color === color ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? 'var(--background)' : 'transparent'
                    } as React.CSSProperties}
                  />
                ))}
              </div>
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
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}