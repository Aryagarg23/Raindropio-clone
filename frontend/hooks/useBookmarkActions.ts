import { useState, useEffect } from 'react';
import supabase from '../modules/supabaseClient';
import { stickyPalette } from '../utils/colors';
import { getApiBaseUrl, apiClient } from '../modules/apiClient';
import { useContentCache } from './useContentCache';
import { setGlobalCacheFunctions, clearGlobalCacheFunctions } from '../utils/cacheUtils';

interface UseBookmarkActionsProps {
  user: any;
  teamId: string;
  setError: (error: string | null) => void;
}

export const useBookmarkActions = ({ user, teamId, setError }: UseBookmarkActionsProps) => {
  const [bookmarkAnnotations, setBookmarkAnnotations] = useState<any[]>([]);
  const [bookmarkHighlights, setBookmarkHighlights] = useState<any[]>([]);
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [proxyContent, setProxyContent] = useState<string | null>(null);
  const [isLoadingProxy, setIsLoadingProxy] = useState(false);
  
  // Use the content caching system
  const {
    isLoadingContent,
    setIsLoadingContent,
    getCachedContent,
    setCachedContent,
    getCachedProxyContent,
    setCachedProxyContent,
    clearCache,
    cleanupExpiredCache,
    getCacheStats
  } = useContentCache();

  // Register global cache functions for debugging
  useEffect(() => {
    setGlobalCacheFunctions(clearCache, getCacheStats);
    
    return () => {
      clearGlobalCacheFunctions();
    };
  }, [clearCache, getCacheStats]);

  const API_BASE_URL = (() => {
    try {
      return getApiBaseUrl();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') throw e;
      return 'http://localhost:8000';
    }
  })();

  // Fetch highlights and annotations for a bookmark
  const fetchBookmarkData = async (bookmarkId: string) => {
    if (!bookmarkId || !user) {
      console.log('Skipping bookmark data fetch - missing bookmarkId or user');
      return;
    }

    try {
      // Fetch highlights using the database function
      const { data: highlights, error: highlightsError } = await supabase
        .rpc('get_bookmark_highlights', { bookmark_uuid: bookmarkId })

      if (highlightsError) {
        console.error('Error fetching highlights:', highlightsError)
        // Only show error for critical failures, not permission issues
        if (!highlightsError.message?.includes('permission') && !highlightsError.message?.includes('not found')) {
          setError('Failed to load highlights')
        }
      } else {
        setBookmarkHighlights(highlights || [])
      }

      // Fetch annotations using the database function
      const { data: annotations, error: annotationsError } = await supabase
        .rpc('get_annotations', { bookmark_uuid: bookmarkId })

      if (annotationsError) {
        console.error('Error fetching annotations:', annotationsError)
        // Only show error for critical failures, not permission issues
        if (!annotationsError.message?.includes('permission') && !annotationsError.message?.includes('not found')) {
          setError('Failed to load annotations')
        }
      } else {
        setBookmarkAnnotations(annotations || [])
      }
    } catch (error) {
      console.error('Error fetching bookmark data:', error)
      // Don't show generic errors to user - they might be expected
    }
  }

  // Create a new highlight
  const createHighlight = async (bookmarkId: string, selectedText: string, startOffset: number, endOffset: number, textBefore?: string, textAfter?: string, highlightColor?: string) => {
    if (!user) {
      setError('You must be logged in to create highlights')
      return
    }

    // Validate required parameters
    if (!bookmarkId) {
      console.error('❌ Missing bookmarkId')
      setError('Missing bookmark ID')
      return
    }

    if (!teamId) {
      console.error('❌ Missing teamId')
      setError('Missing team ID')
      return
    }

    console.log('🔍 Creating highlight with parameters:', {
      bookmarkId,
      teamId,
      selectedText: selectedText.substring(0, 50),
      textBefore,
      textAfter,
      startOffset,
      endOffset,
      highlightColor,
      userId: user.id
    })

    try {
      const insertData = {
        bookmark_id: bookmarkId,
        team_id: teamId,
        selected_text: selectedText,
        text_before: textBefore || null,
        text_after: textAfter || null,
        start_offset: startOffset,
        end_offset: endOffset,
  color: highlightColor || stickyPalette[0],
        created_by: user.id
      }

      console.log('📦 Insert data payload:', insertData)

      const { data, error } = await supabase
        .from('highlights')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Highlight created successfully in database:', data[0])

      // Refresh highlights
      fetchBookmarkData(bookmarkId)
      return data[0]
    } catch (error) {
      console.error('❌ Error creating highlight:', error)
      setError('Failed to create highlight')
    }
  }

  // Create a new annotation
  const createAnnotation = async (bookmarkId: string, content: string, highlightId?: string) => {
    if (!user) {
      setError('You must be logged in to create annotations')
      return
    }

    // Validate required parameters
    if (!bookmarkId) {
      console.error('❌ Missing bookmarkId for annotation')
      setError('Missing bookmark ID')
      return
    }

    if (!teamId) {
      console.error('❌ Missing teamId for annotation')
      setError('Missing team ID')
      return
    }

    console.log('🔍 Creating annotation with parameters:', {
      bookmarkId,
      teamId,
      content: content.substring(0, 100),
      highlightId: highlightId || 'null (general bookmark annotation)',
      userId: user.id
    })

    try {
      const insertData = {
        bookmark_id: bookmarkId,
        highlight_id: highlightId || null,
        team_id: teamId,
        content: content.trim(),
        annotation_type: 'comment',
        created_by: user.id
      }

      console.log('📦 Annotation insert data payload:', insertData)

      const { data, error } = await supabase
        .from('annotations')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ Database error details for annotation:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Annotation created successfully in database:', data[0])

      // Refresh annotations
      fetchBookmarkData(bookmarkId)
      return data[0]
    } catch (error) {
      console.error('❌ Error creating annotation:', error)
      setError('Failed to create annotation')
    }
  }

  // Toggle annotation reaction (like)
  const toggleAnnotationLike = async (annotationId: string, selectedBookmarkId?: string) => {
    if (!user) {
      setError('You must be logged in to react to annotations')
      return
    }

    try {
      // Check if user already liked this annotation
      const { data: existingReaction } = await supabase
        .from('annotation_reactions')
        .select()
        .eq('annotation_id', annotationId)
        .eq('created_by', user.id)
        .eq('reaction_type', 'like')
        .single()

      if (existingReaction) {
        // Remove like
        await supabase
          .from('annotation_reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // Add like
        await supabase
          .from('annotation_reactions')
          .insert({
            annotation_id: annotationId,
            team_id: teamId,
            reaction_type: 'like',
            created_by: user.id
          })
      }

      // Refresh annotations to update like counts
      if (selectedBookmarkId) {
        fetchBookmarkData(selectedBookmarkId)
      }
    } catch (error) {
      console.error('Error toggling annotation like:', error)
      setError('Failed to update reaction')
    }
  }

  // Delete annotation
  const deleteAnnotation = async (annotationId: string, selectedBookmarkId?: string) => {
    try {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', annotationId)

      if (error) throw error

      // Refresh annotations
      if (selectedBookmarkId) {
        fetchBookmarkData(selectedBookmarkId)
      }
    } catch (error) {
      console.error('Error deleting annotation:', error)
      setError('Failed to delete annotation')
    }
  }

  // Extract content from URL for reader mode
  const extractContent = async (url: string) => {
    // Check cache first
    const cachedContent = getCachedContent(url)
    if (cachedContent) {
      setExtractedContent(cachedContent)
      return
    }

    // Clean up expired cache entries periodically
    cleanupExpiredCache()

    setIsLoadingContent(true)
    try {
      // Try our backend content extraction service first
      try {
        const response = await fetch(`${API_BASE_URL}/content/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const contentData = {
              title: data.title,
              description: data.description,
              content: data.content,
              reader_html: data.reader_html || null,
              markdown: data.markdown,
              url,
              extractedAt: new Date().toISOString(),
              meta_info: data.meta_info
            }
            
            // Cache the successful result
            setCachedContent(url, contentData)
            setExtractedContent(contentData)
            return
          }
        }
      } catch (backendError) {
        console.log('Backend extraction failed, trying fallback:', backendError)
      }

      // Fallback to client-side extraction with CORS proxy
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (data.contents) {
        // Basic content extraction from HTML
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.contents, 'text/html')

        // Extract title, content, and meta information
        const title = doc.querySelector('title')?.textContent ||
                     doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                     doc.querySelector('h1')?.textContent || 'Untitled'

        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                           doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''

        // Try to extract main content
        const contentSelectors = [
          'article',
          '[role="main"]',
          '.post-content',
          '.article-content',
          '.content',
          'main',
          '.entry-content'
        ]

        let content = ''
        for (const selector of contentSelectors) {
          const element = doc.querySelector(selector)
          if (element) {
            content = element.innerHTML
            break
          }
        }

        // Fallback to body content if no specific content found
        if (!content) {
          // Remove script, style, nav, header, footer elements
          const bodyClone = doc.body?.cloneNode(true) as HTMLElement
          if (bodyClone) {
            bodyClone.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove())
            content = bodyClone.innerHTML
          }
        }

        const fallbackContentData = {
          title,
          description,
          content,
          reader_html: content,
          markdown: '',
          url,
          extractedAt: new Date().toISOString(),
          meta_info: {}
        }
        
        // Cache the fallback result too
        setCachedContent(url, fallbackContentData)
        setExtractedContent(fallbackContentData)
      }
    } catch (error) {
      console.error('Failed to extract content:', error)
      // Content extraction failed - user can still use proxy mode or view details
    } finally {
      setIsLoadingContent(false)
    }
  }

  // Fetch markdown-only extraction from the backend
  const extractMarkdown = async (url: string) => {
    setIsLoadingContent(true)
    try {
      const resp = await fetch(`${API_BASE_URL}/content/extract_markdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const json = await resp.json()
      if (json && json.success !== false) {
        setExtractedContent((prev: any) => ({
          ...(prev || {}),
          title: json.title || (prev && prev.title),
          markdown: json.markdown || '',
          reader_html: json.reader_html || prev?.reader_html || null,
          url,
          extractedAt: json.extracted_at || new Date().toISOString()
        }))
      }
    } catch (error) {
      console.error('Failed to extract markdown:', error)
    } finally {
      setIsLoadingContent(false)
    }
  }

  // Generate proxy URL to bypass iframe restrictions
  const getProxyUrl = (url: string) => {
    // Try our backend proxy service first
    const backendProxy = `${API_BASE_URL}/content/proxy?url=${encodeURIComponent(url)}`

    // Fallback CORS proxy services
    const corsProxies = [
      backendProxy,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`,
      `https://proxy.cors.sh/${url}`,
    ]

    return corsProxies[0] // Start with our backend proxy
  }

  // Fetch proxy content for rendering
  const fetchProxyContent = async (url: string) => {
    // Check cache first
    const cachedProxyContent = getCachedProxyContent(url)
    if (cachedProxyContent) {
      setProxyContent(cachedProxyContent)
      return
    }

    // Clean up expired cache entries periodically
    cleanupExpiredCache()

    setIsLoadingProxy(true)
    setProxyContent(null)

    try {
      const proxyUrl = getProxyUrl(url)
      const response = await fetch(proxyUrl)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check if response is JSON (from our backend) or raw HTML
      const contentType = response.headers.get('content-type')
      let htmlContent: string

      if (contentType?.includes('application/json')) {
        // Our backend returns JSON with content field
        const data = await response.json()
        htmlContent = data.content || data
      } else {
        // Raw HTML response from other proxy services
        htmlContent = await response.text()
      }

      // Clean up malformed HTML attributes (especially SVG attributes with escaped quotes)
      htmlContent = htmlContent
        .replace(/\\"/g, '"')  // Fix escaped quotes
        .replace(/\\'/g, "'")  // Fix escaped single quotes
        .replace(/(\w+)=\\"([^"]*)\\"(?=\s|>|\/)/g, '$1="$2"')  // Fix attribute formatting

      // Fix relative URLs to absolute URLs
      const baseUrl = new URL(url)
      htmlContent = htmlContent
        .replace(/src="\/([^"]*)"?/g, `src="${baseUrl.origin}/$1"`)
        .replace(/href="\/([^"]*)"?/g, `href="${baseUrl.origin}/$1"`)
        .replace(/src="([^"]*)"(?=\s|>)/g, (match, src) => {
          if (src.startsWith('http') || src.startsWith('data:')) return match
          return `src="${baseUrl.origin}/${src}"`
        })

      // Cache the successful result
      setCachedProxyContent(url, htmlContent)
      setProxyContent(htmlContent)
    } catch (error) {
      console.error('Failed to fetch proxy content:', error)
      // Proxy loading failed - user can still try reader mode or view details
    } finally {
      setIsLoadingProxy(false)
    }
  }

  // Update bookmark tags
  const updateBookmarkTags = async (bookmarkId: string, newTags: string[]) => {
    try {
      // Update bookmark tags via API
      const { data, error } = await supabase
        .from('bookmarks')
        .update({ tags: newTags })
        .eq('id', bookmarkId);

      if (error) throw error;

      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error('Failed to update tags:', error);
      setError('Failed to update bookmark tags');
    }
  }

  // Update bookmark basic information (title, description, preview_image)
  const updateBookmark = async (bookmarkId: string, updates: { title?: string; description?: string; preview_image?: string; image_file?: File; color?: string }) => {
    try {
      // Use the API client to update bookmark
      const response = await apiClient.updateBookmark(
        bookmarkId,
        updates.title || '',
        updates.description,
        updates.preview_image,
        updates.image_file,
        updates.color
      );

      // The real-time subscription will update the UI automatically
      return response.bookmark;
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      setError('Failed to update bookmark');
      throw error;
    }
  }

  // Clear extracted/proxy content
  const clearContent = () => {
    setExtractedContent(null)
    setProxyContent(null)
  }

  return {
    bookmarkAnnotations,
    bookmarkHighlights,
    extractedContent,
    isLoadingContent,
    proxyContent,
    isLoadingProxy,
    fetchBookmarkData,
    createHighlight,
    createAnnotation,
    toggleAnnotationLike,
    deleteAnnotation,
    extractContent,
    extractMarkdown,
    fetchProxyContent,
    clearContent,
    updateBookmarkTags,
    updateBookmark,
    clearContentCache: clearCache
  };
};