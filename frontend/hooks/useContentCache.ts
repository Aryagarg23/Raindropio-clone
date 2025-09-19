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
  }
}

// Cache TTL: 1 hour (same as backend)
const CACHE_TTL = 60 * 60 * 1000

// Cache version - increment this to force cache clear for all users
const CACHE_VERSION = '1.0.2'

const CACHE_VERSION_KEY = 'bookmark_cache_version'

export const useContentCache = () => {
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const cacheRef = useRef<ContentCache>({})
  const proxyCacheRef = useRef<ProxyCache>({})

  // Check cache version and clear if outdated
  useEffect(() => {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (storedVersion !== CACHE_VERSION) {
      console.log(`🔄 Cache version changed from ${storedVersion} to ${CACHE_VERSION}, clearing cache`)
      cacheRef.current = {}
      proxyCacheRef.current = {}
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
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

  const getCachedProxyContent = useCallback((url: string): string | null => {
    const cached = proxyCacheRef.current[url]
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`Using cached proxy content for ${url}`)
      return cached.data
    }
    return null
  }, [isCacheValid])

  const setCachedProxyContent = useCallback((url: string, data: string): void => {
    proxyCacheRef.current[url] = {
      data,
      timestamp: Date.now()
    }
    console.log(`Cached proxy content for ${url}`)
  }, [])

  const getCacheStats = useCallback(() => {
    const contentEntries = Object.entries(cacheRef.current)
    const contentValidEntries = contentEntries.filter(([_, cached]) => isCacheValid(cached.timestamp))
    const contentExpiredEntries = contentEntries.filter(([_, cached]) => !isCacheValid(cached.timestamp))
    
    const proxyEntries = Object.entries(proxyCacheRef.current)
    const proxyValidEntries = proxyEntries.filter(([_, cached]) => isCacheValid(cached.timestamp))
    const proxyExpiredEntries = proxyEntries.filter(([_, cached]) => !isCacheValid(cached.timestamp))
    
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
        urls: proxyValidEntries.map(([url, _]) => url)
      }
    }
  }, [isCacheValid])

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
