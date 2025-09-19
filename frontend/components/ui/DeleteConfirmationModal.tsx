import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning'
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger'
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-grey-accent-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <h2 className="text-lg font-semibold text-grey-accent-900">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-grey-accent-100 rounded-md transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-grey-accent-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-grey-accent-700 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-grey-accent-200 bg-grey-accent-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isLoading ? 'Deleting...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
