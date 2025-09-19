import React, { useState, useEffect, useRef } from 'react'
import { Button } from "../../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { ExternalLink, RefreshCw, Archive, Globe, Shield, Clock } from 'lucide-react'

interface ImprovedProxyViewProps {
  url: string
  proxyContent?: string | null
  isLoadingProxy: boolean
  onFetchProxyContent: () => void
}

interface ArchiveResult {
  url: string
  timestamp: string
  status: 'available' | 'unavailable'
}

export function ImprovedProxyView({
  url,
  proxyContent,
  isLoadingProxy,
  onFetchProxyContent
}: ImprovedProxyViewProps) {
  const [proxyUrl, setProxyUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null)
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [attemptedStrategies, setAttemptedStrategies] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Create proxy URL using our backend
    const encodedUrl = encodeURIComponent(url)
    setProxyUrl(`/api/content/proxy?url=${encodedUrl}`)
    setAttemptedStrategies([])
    setShowArchive(false)
    setArchiveUrl(null)
    setError(null)
    
    // Auto-trigger proxy load if no content is available
    if (!proxyContent && !isLoadingProxy) {
      console.log('Auto-triggering proxy load for:', url)
      onFetchProxyContent()
    }
  }, [url])

  // Track when proxy loading finishes (success or failure)
  useEffect(() => {
    if (!isLoadingProxy && !attemptedStrategies.includes('proxy')) {
      // Mark proxy as attempted once loading is complete
      setAttemptedStrategies(prev => [...prev, 'proxy'])
    }
  }, [isLoadingProxy, attemptedStrategies])

  // Auto-trigger archive check when proxy fails
  useEffect(() => {
    // If proxy has been attempted but failed (no content), and we haven't tried archive yet
    if (!isLoadingProxy && !proxyContent && attemptedStrategies.includes('proxy') && !attemptedStrategies.includes('archive')) {
      // Automatically check for archive after proxy fails
      const timer = setTimeout(async () => {
        if (!proxyContent) {
          setError('Proxy failed to load content. Checking archive...')
          const archiveResult = await checkArchiveAvailability(url)
          if (archiveResult?.status === 'available') {
            setArchiveUrl(archiveResult.url)
            setShowArchive(true)
            setAttemptedStrategies(prev => [...prev, 'archive'])
            setError(null)
          } else {
            setError('No archived version found. You can try creating a new archive.')
            setAttemptedStrategies(prev => [...prev, 'archive'])
          }
        }
      }, 1000) // Small delay to avoid immediate fallback

      return () => clearTimeout(timer)
    }
  }, [isLoadingProxy, proxyContent, attemptedStrategies, url])

  const checkArchiveAvailability = async (targetUrl: string): Promise<ArchiveResult | null> => {
    try {
      setIsLoadingArchive(true)
      const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(targetUrl)}`)
      const data = await response.json()
      
      if (data.archived_snapshots?.closest?.available) {
        const snapshot = data.archived_snapshots.closest
        return {
          url: snapshot.url,
          timestamp: snapshot.timestamp,
          status: 'available'
        }
      }
      return { url: '', timestamp: '', status: 'unavailable' }
    } catch (error) {
      console.error('Archive check failed:', error)
      return null
    } finally {
      setIsLoadingArchive(false)
    }
  }

  const handleTryArchive = async () => {
    const archiveResult = await checkArchiveAvailability(url)
    if (archiveResult?.status === 'available') {
      setArchiveUrl(archiveResult.url)
      setShowArchive(true)
      setAttemptedStrategies(prev => [...prev, 'archive'])
    } else {
      setError('No archived version found. You can try creating a new archive.')
    }
  }

  const handleCreateArchive = () => {
    // Open Archive.today in a new tab to create a snapshot
    const archiveToday = `https://archive.today/?run=1&url=${encodeURIComponent(url)}`
    window.open(archiveToday, '_blank', 'noopener,noreferrer')
  }

  const handleOpenInNewTab = () => {
    if (showArchive && archiveUrl) {
      window.open(archiveUrl, '_blank', 'noopener,noreferrer')
    } else {
      window.open(proxyUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleRefreshProxy = () => {
    setError(null)
    setShowArchive(false)
    setArchiveUrl(null)
    setAttemptedStrategies(prev => {
      const newStrategies = [...prev]
      if (!newStrategies.includes('proxy')) {
        newStrategies.push('proxy')
      }
      return newStrategies
    })
    onFetchProxyContent()
  }

  const handleDirectEmbed = () => {
    setShowArchive(false)
    setAttemptedStrategies(prev => [...prev, 'direct'])
  }

  const formatArchiveDate = (timestamp: string) => {
    if (!timestamp || timestamp.length < 14) return 'Unknown date'
    const year = timestamp.substring(0, 4)
    const month = timestamp.substring(4, 6)
    const day = timestamp.substring(6, 8)
    const hour = timestamp.substring(8, 10)
    const minute = timestamp.substring(10, 12)
    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  if (isLoadingProxy || isLoadingArchive) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grey-accent-600 mb-4"></div>
          <p className="text-grey-accent-600">
            {isLoadingProxy ? 'Loading proxy content...' : 'Checking archive availability...'}
          </p>
          {attemptedStrategies.length > 0 && (
            <div className="mt-2 text-sm text-grey-accent-500">
              Attempted: {attemptedStrategies.join(', ')}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && !showArchive) {
    const isForbidden = error.includes('403') || error.includes('Forbidden')
    const isArchiveChecking = error.includes('Checking archive')
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">
            {isArchiveChecking ? '🔍' : isForbidden ? '🔒' : '⚠️'}
          </div>
          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
            {isArchiveChecking ? 'Checking Archive...' : 
             isForbidden ? 'Access Restricted' : 
             'Content Cannot Be Embedded'}
          </h3>
          <p className="text-grey-accent-600 mb-4">
            {error}
          </p>
          
          {isForbidden && (
            <div className="mb-4 text-left p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  This website blocks proxy access (HTTP 403). This is common for sites with security policies or paywalls.
                </span>
              </div>
            </div>
          )}

          {!isArchiveChecking && (
            <div className="space-y-2">
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRefreshProxy} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Proxy
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Original
                </Button>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button onClick={handleTryArchive} variant="default" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Try Archive Version
                </Button>
                <Button onClick={handleCreateArchive} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Create Archive
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!proxyContent && !showArchive) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
            Content Loading Options
          </h3>
          <p className="text-grey-accent-600 mb-4">
            Choose how you'd like to view this content
          </p>
          
          <div className="space-y-2">
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefreshProxy} variant="default" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                Load via Proxy
              </Button>
              <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Original
              </Button>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={handleTryArchive} variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Check Archive
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Proxy Controls */}
      <div className="border-b border-grey-accent-200 bg-grey-accent-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {showArchive ? (
                <Archive className="h-4 w-4 text-blue-600" />
              ) : (
                <Globe className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm text-grey-accent-600">
                {showArchive ? 'Archive View:' : 'Live Proxy:'}
              </span>
            </div>
            <span className="text-sm font-mono text-grey-accent-800 truncate max-w-md">
              {showArchive && archiveUrl ? new URL(archiveUrl).hostname : new URL(url).hostname}
            </span>
            {showArchive && archiveUrl && (
              <span className="text-xs text-grey-accent-500 bg-blue-100 px-2 py-1 rounded">
                {formatArchiveDate(archiveUrl.match(/\/(\d{14})\//)?.[1] || '')}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showArchive ? (
              <>
                <Button onClick={handleRefreshProxy} variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Try Live
                </Button>
                <Button onClick={handleCreateArchive} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  New Archive
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleTryArchive} variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button onClick={handleRefreshProxy} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </>
            )}
            <Button onClick={handleOpenInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Tab
            </Button>
          </div>
        </div>
        
        {attemptedStrategies.length > 0 && (
          <div className="mt-2 text-xs text-grey-accent-500">
            Attempted strategies: {attemptedStrategies.join(' → ')}
          </div>
        )}
      </div>

      {/* Content Display */}
      <div className="flex-1 relative">
        {showArchive && archiveUrl ? (
          <iframe
            ref={iframeRef}
            src={archiveUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
            title="Archived content"
            onError={() => setError('Failed to load archived content')}
            onLoad={() => setError(null)}
          />
        ) : proxyContent ? (
          <iframe
            ref={iframeRef}
            srcDoc={proxyContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
            title="Proxy content"
            onError={() => setError('Failed to load proxy content')}
            onLoad={() => setError(null)}
          />
        ) : (
          // Fallback: Direct embed (might be blocked by X-Frame-Options)
          <div className="w-full h-full flex flex-col">
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Attempting direct embed - may be blocked by website security policies
                </span>
              </div>
            </div>
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full flex-1 border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
              title="Direct content"
              onError={() => setError('Direct embedding blocked by website')}
              onLoad={() => setError(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
