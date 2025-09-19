import React, { useState } from 'react'
import { Plus, Check, X, Loader } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

interface InlineBookmarkInputProps {
  onCreate: (url: string) => Promise<void>
  disabled?: boolean
}

export function InlineBookmarkInput({ onCreate, disabled = false }: InlineBookmarkInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isSubmitting) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      await onCreate(url.trim())
      setSubmitStatus('success')
      setUrl('')
      // Auto-collapse after success
      setTimeout(() => {
        setIsExpanded(false)
        setSubmitStatus('idle')
      }, 1500)
    } catch (error) {
      console.error('Failed to create bookmark:', error)
      setSubmitStatus('error')
      // Keep expanded on error so user can try again
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setUrl('')
    setSubmitStatus('idle')
    setIsSubmitting(false)
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="flex items-center gap-1 text-grey-accent-600 hover:text-grey-accent-900 hover:bg-grey-accent-50"
        title="Add Bookmark"
      >
        <Plus className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-64 h-8 text-sm"
        disabled={isSubmitting}
        autoFocus
        required
      />

      <div className="flex items-center gap-1">
        {isSubmitting ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <Loader className="w-4 h-4 animate-spin text-grey-accent-600" />
          </div>
        ) : submitStatus === 'success' ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
        ) : submitStatus === 'error' ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <X className="w-4 h-4 text-red-600" />
          </div>
        ) : (
          <>
            <Button
              type="submit"
              size="sm"
              disabled={!url.trim() || isSubmitting}
              className="h-6 px-2 text-xs bg-grey-accent-700 hover:bg-grey-accent-800"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-6 px-2 text-xs text-grey-accent-600 hover:text-grey-accent-900"
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        )}
      </div>
    </form>
  )
}