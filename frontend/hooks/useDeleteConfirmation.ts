import { useState, useCallback } from 'react'

interface DeleteConfirmationState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  variant?: 'danger' | 'warning'
}

export function useDeleteConfirmation() {
  const [confirmationState, setConfirmationState] = useState<DeleteConfirmationState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const showConfirmation = useCallback((config: Omit<DeleteConfirmationState, 'isOpen'>) => {
    setConfirmationState({
      ...config,
      isOpen: true
    })
  }, [])

  const hideConfirmation = useCallback(() => {
    setConfirmationState(null)
    setIsLoading(false)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!confirmationState) return

    setIsLoading(true)
    try {
      await confirmationState.onConfirm()
      hideConfirmation()
    } catch (error) {
      console.error('Delete operation failed:', error)
      setIsLoading(false)
      // Keep modal open on error so user can retry
    }
  }, [confirmationState, hideConfirmation])

  return {
    confirmationState,
    isLoading,
    showConfirmation,
    hideConfirmation,
    handleConfirm
  }
}
