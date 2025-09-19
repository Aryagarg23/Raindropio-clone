import React, { useState, useEffect } from 'react'
import { Button } from "../../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"

interface ImprovedProxyViewProps {
  url: string
  proxyContent?: string | null
  isLoadingProxy: boolean
  onFetchProxyContent: () => void
}

export function ImprovedProxyView({
  url,
  proxyContent,
  isLoadingProxy,
  onFetchProxyContent
}: ImprovedProxyViewProps) {
  const [proxyUrl, setProxyUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Create proxy URL using our backend
    const encodedUrl = encodeURIComponent(url)
    setProxyUrl(`/api/content/proxy?url=${encodedUrl}`)
  }, [url])

  const handleOpenInNewTab = () => {
    window.open(proxyUrl, '_blank', 'noopener,noreferrer')
  }

  const handleRefreshProxy = () => {
    setError(null)
    onFetchProxyContent()
  }

  if (isLoadingProxy) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grey-accent-600 mb-4"></div>
          <p className="text-grey-accent-600">Loading proxy content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
            Proxy Error
          </h3>
          <p className="text-grey-accent-600 mb-4">
            {error}
          </p>
          <div className="space-x-2">
            <Button onClick={handleRefreshProxy} variant="outline">
              Retry
            </Button>
            <Button onClick={handleOpenInNewTab} variant="default">
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!proxyContent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
            Proxy View Unavailable
          </h3>
          <p className="text-grey-accent-600 mb-4">
            Unable to load content through proxy
          </p>
          <div className="space-x-2">
            <Button onClick={handleRefreshProxy} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleOpenInNewTab} variant="default">
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Proxy Controls */}
      <div className="border-b border-grey-accent-200 bg-grey-accent-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-grey-accent-600">Proxy View:</span>
            <span className="text-sm font-mono text-grey-accent-800 truncate max-w-md">
              {url}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefreshProxy} variant="outline" size="sm">
              Refresh
            </Button>
            <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>

      {/* Proxy Content */}
      <div className="flex-1">
        <iframe
          srcDoc={proxyContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          title="Proxy content"
          onError={() => setError('Failed to load content in iframe')}
          onLoad={() => setError(null)}
        />
      </div>
    </div>
  )
}
