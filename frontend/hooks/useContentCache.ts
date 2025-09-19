import { useState, useCallback, useRef, useEffect } from 'react'

interface CachedContent {
  title: string
  description: string
  content: string
  reader_html: string | null
  markdown: string
  url: string
  extractedAt: string
  meta_info: any
}

interface ContentCache {
  [url: string]: {
    data: CachedContent
    timestamp: number
  }
}

interface ProxyCache {
  [url: string]: {
    data: string
    timestamp: number
    size: number // Track content size for cache management
    hits: number // Track how often this entry is accessed
  }
}

// Cache TTL: 2 hours for proxy content (longer since it's static)
const CACHE_TTL = 2 * 60 * 60 * 1000

// Cache version - increment this to force cache clear for all users
const CACHE_VERSION = '1.0.3'

const CACHE_VERSION_KEY = 'bookmark_cache_version'
const PROXY_CACHE_KEY = 'bookmark_proxy_cache'

// Max cache size in localStorage (5MB)
const MAX_CACHE_SIZE = 5 * 1024 * 1024

export const useContentCache = () => {
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const cacheRef = useRef<ContentCache>({})
  const proxyCacheRef = useRef<ProxyCache>({})

  // Load proxy cache from localStorage and check cache version
  useEffect(() => {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (storedVersion !== CACHE_VERSION) {
      console.log(`🔄 Cache version changed from ${storedVersion} to ${CACHE_VERSION}, clearing cache`)
      cacheRef.current = {}
      proxyCacheRef.current = {}
      localStorage.removeItem(PROXY_CACHE_KEY)
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
    } else {
      // Load proxy cache from localStorage
      try {
        const storedProxyCache = localStorage.getItem(PROXY_CACHE_KEY)
        if (storedProxyCache) {
          const parsedCache = JSON.parse(storedProxyCache)
          // Filter out expired entries on load
          const now = Date.now()
          const validEntries = Object.entries(parsedCache).filter(
            ([_, cached]: [string, any]) => now - cached.timestamp < CACHE_TTL
          )
          proxyCacheRef.current = Object.fromEntries(validEntries)
          console.log(`📦 Loaded ${validEntries.length} valid proxy cache entries from localStorage`)
        }
      } catch (error) {
        console.warn('Failed to load proxy cache from localStorage:', error)
        localStorage.removeItem(PROXY_CACHE_KEY)
      }
    }
  }, [])
  
  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_TTL
  }, [])

  const getCachedContent = useCallback((url: string): CachedContent | null => {
    const cached = cacheRef.current[url]
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`Using cached content for ${url}`)
      return cached.data
    }
    return null
  }, [isCacheValid])

  const setCachedContent = useCallback((url: string, data: CachedContent): void => {
    cacheRef.current[url] = {
      data,
      timestamp: Date.now()
    }
    console.log(`Cached content for ${url}`)
  }, [])

  const clearCache = useCallback((url?: string): void => {
    if (url) {
      delete cacheRef.current[url]
      delete proxyCacheRef.current[url]
      console.log(`Cleared cache for ${url}`)
    } else {
      cacheRef.current = {}
      proxyCacheRef.current = {}
      console.log('Cleared all content cache')
    }
  }, [])

  // Calculate current cache size
  const getCurrentCacheSize = useCallback((): number => {
    return Object.values(proxyCacheRef.current).reduce((total, cached) => total + cached.size, 0)
  }, [])

  // Remove least recently used items to make space
  const evictLRUEntries = useCallback((spaceNeeded: number): void => {
    const entries = Object.entries(proxyCacheRef.current)
    if (entries.length === 0) return

    // Sort by hits (ascending) and timestamp (ascending) - least used first
    entries.sort(([, a], [, b]) => {
      if (a.hits !== b.hits) return a.hits - b.hits
      return a.timestamp - b.timestamp
    })

    let freedSpace = 0
    const urlsToRemove: string[] = []

    for (const [url, cached] of entries) {
      urlsToRemove.push(url)
      freedSpace += cached.size
      if (freedSpace >= spaceNeeded) break
    }

    urlsToRemove.forEach(url => {
      delete proxyCacheRef.current[url]
    })

    console.log(`🗑️ Evicted ${urlsToRemove.length} LRU entries, freed ${freedSpace} bytes`)
  }, [])

  // Save proxy cache to localStorage with size management
  const saveProxyCacheToStorage = useCallback(() => {
    try {
      const cacheData = JSON.stringify(proxyCacheRef.current)
      const cacheSize = new Blob([cacheData]).size

      if (cacheSize > MAX_CACHE_SIZE) {
        console.warn(`Cache size (${cacheSize}) exceeds max size (${MAX_CACHE_SIZE}), not saving to localStorage`)
        return
      }

      localStorage.setItem(PROXY_CACHE_KEY, cacheData)
      console.log(`💾 Saved proxy cache to localStorage (${cacheSize} bytes, ${Object.keys(proxyCacheRef.current).length} entries)`)
    } catch (error) {
      console.warn('Failed to save proxy cache to localStorage:', error)
      // If localStorage is full, try to clear some space
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        evictLRUEntries(1024 * 1024) // Free 1MB
        try {
          localStorage.setItem(PROXY_CACHE_KEY, JSON.stringify(proxyCacheRef.current))
        } catch (retryError) {
          console.error('Failed to save cache even after eviction:', retryError)
        }
      }
    }
  }, [evictLRUEntries])

  const getCachedProxyContent = useCallback((url: string): string | null => {
    const cached = proxyCacheRef.current[url]
    if (cached && isCacheValid(cached.timestamp)) {
      // Increment hit counter for LRU tracking
      cached.hits++
      console.log(`📋 Using cached proxy content for ${url} (${cached.hits} hits)`)
      return cached.data
    }
    return null
  }, [isCacheValid])

  const setCachedProxyContent = useCallback((url: string, data: string): void => {
    const contentSize = new Blob([data]).size
    const currentSize = getCurrentCacheSize()

    // Check if we need to make space
    if (currentSize + contentSize > MAX_CACHE_SIZE) {
      const spaceNeeded = (currentSize + contentSize) - MAX_CACHE_SIZE + (1024 * 1024) // Extra 1MB buffer
      evictLRUEntries(spaceNeeded)
    }

    proxyCacheRef.current[url] = {
      data,
      timestamp: Date.now(),
      size: contentSize,
      hits: 1
    }

    console.log(`💾 Cached proxy content for ${url} (${contentSize} bytes)`)

    // Save to localStorage asynchronously
    setTimeout(saveProxyCacheToStorage, 0)
  }, [getCurrentCacheSize, evictLRUEntries, saveProxyCacheToStorage])

  const getCacheStats = useCallback(() => {
    const contentEntries = Object.entries(cacheRef.current)
    const contentValidEntries = contentEntries.filter(([_, cached]) => isCacheValid(cached.timestamp))
    const contentExpiredEntries = contentEntries.filter(([_, cached]) => !isCacheValid(cached.timestamp))
    
    const proxyEntries = Object.entries(proxyCacheRef.current)
    const proxyValidEntries = proxyEntries.filter(([_, cached]) => isCacheValid(cached.timestamp))
    const proxyExpiredEntries = proxyEntries.filter(([_, cached]) => !isCacheValid(cached.timestamp))
    
    const proxySize = getCurrentCacheSize()
    const proxyHits = Object.values(proxyCacheRef.current).reduce((total, cached) => total + cached.hits, 0)
    
    return {
      content: {
        total: contentEntries.length,
        valid: contentValidEntries.length,
        expired: contentExpiredEntries.length,
        urls: contentValidEntries.map(([url, _]) => url)
      },
      proxy: {
        total: proxyEntries.length,
        valid: proxyValidEntries.length,
        expired: proxyExpiredEntries.length,
        urls: proxyValidEntries.map(([url, _]) => url),
        totalSize: proxySize,
        totalHits: proxyHits,
        averageSize: proxyValidEntries.length > 0 ? Math.round(proxySize / proxyValidEntries.length) : 0
      }
    }
  }, [isCacheValid, getCurrentCacheSize])

  // Clean up expired entries periodically
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now()
    
    // Clean content cache
    const expiredContentUrls = Object.entries(cacheRef.current)
      .filter(([_, cached]) => now - cached.timestamp >= CACHE_TTL)
      .map(([url, _]) => url)
    
    expiredContentUrls.forEach(url => {
      delete cacheRef.current[url]
    })
    
    // Clean proxy cache
    const expiredProxyUrls = Object.entries(proxyCacheRef.current)
      .filter(([_, cached]) => now - cached.timestamp >= CACHE_TTL)
      .map(([url, _]) => url)
    
    expiredProxyUrls.forEach(url => {
      delete proxyCacheRef.current[url]
    })
    
    const totalExpired = expiredContentUrls.length + expiredProxyUrls.length
    if (totalExpired > 0) {
      console.log(`Cleaned up ${totalExpired} expired cache entries (${expiredContentUrls.length} content, ${expiredProxyUrls.length} proxy)`)
    }
  }, [])

  return {
    isLoadingContent,
    setIsLoadingContent,
    getCachedContent,
    setCachedContent,
    getCachedProxyContent,
    setCachedProxyContent,
    clearCache,
    getCacheStats,
    cleanupExpiredCache
  }
}
