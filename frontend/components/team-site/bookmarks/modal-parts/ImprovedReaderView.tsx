import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Readability } from '@mozilla/readability'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Img } from 'react-image'
import { Button } from "../../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { HighlightsDiscussion } from "./HighlightsDiscussion"
import '../../../../utils/cacheDebug'

// Enhanced image component using react-image for better external image handling
const LazyImage = ({ src, alt, className, ...props }: any) => {
  console.log('🖼️ Loading image with react-image:', src)
  
  // Create fallback sources: try direct URL first, then proxy
  const fallbackSrc = props['data-fallback-src']
  const srcList = fallbackSrc ? [src, fallbackSrc] : [src]
  
  return (
    <Img
      {...props}
      src={srcList}
      alt={alt}
      className={`${className} transition-opacity duration-300`}
      loader={
        <span className="inline-block bg-grey-accent-100 rounded-lg flex items-center justify-center min-h-[200px] min-w-[200px]">
          <span className="animate-pulse text-grey-accent-400 text-sm">Loading...</span>
        </span>
      }
      unloader={
        <span className="inline-block bg-grey-accent-100 rounded-lg flex items-center justify-center min-h-[200px] min-w-[200px]">
          <span className="text-grey-accent-400 text-sm">Failed to load</span>
        </span>
      }
      onLoad={() => {
        console.log('✅ Image loaded successfully:', src)
      }}
      onError={(error: any) => {
        console.error('❌ Image failed to load:', src, error)
      }}
    />
  )
}

interface ImprovedReaderViewProps {
  url: string
  extractedContent?: any
  isLoadingContent: boolean
  onRetryExtraction: () => void
  
  // Highlighting props
  highlights?: any[]
  annotations?: any[]
  bookmark?: any
  user?: any
  teamId?: string
  commentInputs?: { [key: string]: string }
  onSetShowHighlightTooltip?: (show: boolean) => void
  onSetTooltipPosition?: (position: { x: number; y: number }) => void
  onSetPendingSelection?: (selection: { 
    text: string; 
    startOffset: number; 
    endOffset: number;
    xpathStart?: string;
    xpathEnd?: string;
    textBefore?: string;
    textAfter?: string;
  } | null) => void
  onCreateAnnotation?: (bookmarkId: string, content: string, highlightId?: string) => Promise<any>
  onToggleAnnotationLike?: (annotationId: string) => Promise<void>
  onDeleteAnnotation?: (annotationId: string) => Promise<void>
  onSetCommentInputs?: (inputs: { [key: string]: string }) => void
}

export function ImprovedReaderView({
  url,
  extractedContent,
  isLoadingContent,
  onRetryExtraction,
  highlights = [],
  annotations = [],
  bookmark,
  user,
  teamId,
  commentInputs = {},
  onSetShowHighlightTooltip,
  onSetTooltipPosition,
  onSetPendingSelection,
  onCreateAnnotation,
  onToggleAnnotationLike,
  onDeleteAnnotation,
  onSetCommentInputs
}: ImprovedReaderViewProps) {
  // Debug highlights data
  console.log('🔍 ImprovedReaderView highlights data:', {
    highlightsCount: highlights?.length || 0,
    highlights: highlights,
    bookmarkId: bookmark?.id
  })
  const [clientSideContent, setClientSideContent] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const readerContentRef = useRef<HTMLDivElement>(null)

  // Helper function to apply highlight color styling
  const getHighlightStyle = (color: string) => {
    // Handle different color formats and edge cases
    let hex = color.replace('#', '')
    
    // Handle 3-digit hex colors
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    // Ensure we have a valid 6-digit hex
    if (hex.length !== 6) {
      console.warn('Invalid color format:', color, 'falling back to yellow')
      hex = 'ffeb3b' // Default yellow
    }
    
    try {
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        throw new Error('Invalid RGB values')
      }
      
      return `background-color: rgba(${r}, ${g}, ${b}, 0.3); border-left: 3px solid #${hex}; padding: 2px 4px; border-radius: 3px;`
    } catch (error) {
      console.warn('Color parsing error:', error, 'using fallback')
      return `background-color: rgba(255, 235, 59, 0.3); border-left: 3px solid #ffeb3b; padding: 2px 4px; border-radius: 3px;`
    }
  }

  // Function to apply highlights to the rendered DOM
  const applyHighlightsToDOM = () => {
    if (!highlights || highlights.length === 0 || !readerContentRef.current) {
      return
    }

    console.log('🎨 Applying highlights to DOM:', highlights.length, 'highlights')

    const contentElement = readerContentRef.current
    const textContent = contentElement.textContent || ''
    
    highlights.forEach((highlight, index) => {
      const startPos = highlight.start_offset || 0
      const endPos = highlight.end_offset || 0
      
      console.log(`🔍 Processing DOM highlight ${index + 1}:`, {
        startPos,
        endPos,
        text: highlight.selected_text,
        color: highlight.color
      })
      
      // Validate positions
      if (startPos < 0 || endPos <= startPos || endPos > textContent.length) {
        console.warn(`⚠️ Invalid highlight positions:`, { startPos, endPos, contentLength: textContent.length })
        return
      }

      // Find the text nodes and apply highlighting
      const walker = document.createTreeWalker(
        contentElement,
        NodeFilter.SHOW_TEXT,
        null
      )

      let currentPos = 0
      let startNode: Text | null = null
      let endNode: Text | null = null
      let startOffset = 0
      let endOffset = 0

      while (walker.nextNode()) {
        const node = walker.currentNode as Text
        const nodeLength = node.textContent?.length || 0

        if (!startNode && currentPos + nodeLength > startPos) {
          startNode = node
          startOffset = startPos - currentPos
        }

        if (!endNode && currentPos + nodeLength >= endPos) {
          endNode = node
          endOffset = endPos - currentPos
          break
        }

        currentPos += nodeLength
      }

      if (startNode && endNode) {
        try {
          // Create range and highlight
          const range = document.createRange()
          range.setStart(startNode, startOffset)
          range.setEnd(endNode, endOffset)

          // Create highlight element
          const highlightElement = document.createElement('mark')
          const highlightColor = highlight.color || '#ffeb3b'
          const style = getHighlightStyle(highlightColor)
          
          highlightElement.style.cssText = style
          highlightElement.className = 'px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-all'
          highlightElement.setAttribute('data-highlight-id', highlight.highlight_id || highlight.id)
          highlightElement.setAttribute('data-color', highlightColor)
          highlightElement.title = `Highlighted by ${highlight.creator_name || 'Unknown'}`

          // Add click handler to scroll to annotations section
          highlightElement.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            console.log('🎯 Highlight clicked, scrolling to annotations:', highlight.highlight_id || highlight.id)
            
            // Find the annotations section
            const annotationsSection = document.querySelector('[data-annotations-section]')
            if (annotationsSection) {
              annotationsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
              })
              
              // Optional: Highlight the specific annotation if it exists
              const highlightAnnotations = document.querySelectorAll(`[data-highlight-id="${highlight.highlight_id || highlight.id}"]`)
              highlightAnnotations.forEach((annotation) => {
                annotation.classList.add('animate-pulse')
                setTimeout(() => {
                  annotation.classList.remove('animate-pulse')
                }, 2000)
              })
            } else {
              console.warn('⚠️ Annotations section not found')
            }
          })

          // Apply the highlight
          range.surroundContents(highlightElement)
          
          console.log(`✅ DOM highlight ${index + 1} applied successfully`)
        } catch (error) {
          console.warn(`⚠️ Failed to apply DOM highlight ${index + 1}:`, error)
        }
      }
    })
  }

  // Client-side fallback using Mozilla Readability
  const processWithReadability = async () => {
    setIsProcessing(true)
    try {
      // Fetch the page content
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const html = await response.text()
      
      // Create a DOM document
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Use Mozilla Readability
      const reader = new Readability(doc)
      const article = reader.parse()
      
      if (article) {
        setClientSideContent({
          title: article.title,
          content: article.textContent,
          htmlContent: article.content,
          byline: article.byline,
          length: article.length,
          excerpt: article.excerpt,
          siteName: article.siteName
        })
      } else {
        throw new Error('Failed to extract readable content')
      }
    } catch (error) {
      console.error('Client-side readability failed:', error)
      // Try with CORS proxy
      try {
        const proxyResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
        const data = await proxyResponse.json()
        
        if (data.contents) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(data.contents, 'text/html')
          
          const reader = new Readability(doc)
          const article = reader.parse()
          
          if (article) {
            setClientSideContent({
              title: article.title,
              content: article.textContent,
              htmlContent: article.content,
              byline: article.byline,
              length: article.length,
              excerpt: article.excerpt,
              siteName: article.siteName
            })
          }
        }
      } catch (proxyError) {
        console.error('CORS proxy readability failed:', proxyError)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Helper function to generate XPath for a node
  const generateXPath = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode
      if (!parent) return ''
      
      const parentXPath = generateXPath(parent)
      const siblings = Array.from(parent.childNodes).filter(n => n.nodeType === Node.TEXT_NODE)
      const index = siblings.indexOf(node as ChildNode)
      
      return `${parentXPath}/text()[${index + 1}]`
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()
      
      // If element has an id, use that for a more stable XPath
      if (element.id) {
        return `//*[@id='${element.id}']`
      }
      
      // Otherwise, use position-based XPath
      const parent = element.parentNode
      if (!parent || parent.nodeType === Node.DOCUMENT_NODE) {
        return `/${tagName}`
      }
      
      const parentXPath = generateXPath(parent)
      const siblings = Array.from(parent.childNodes).filter(n => 
        n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName.toLowerCase() === tagName
      )
      const index = siblings.indexOf(element as ChildNode)
      
      return `${parentXPath}/${tagName}[${index + 1}]`
    }
    
    return ''
  }

  // Text selection handling for highlights
  const handleTextSelection = (event: MouseEvent) => {
    if (!onSetShowHighlightTooltip || !onSetTooltipPosition || !onSetPendingSelection) {
      return
    }

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return
    }

    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) {
      return
    }

    // Get the selected range
    const range = selection.getRangeAt(0)
    const readerContent = readerContentRef.current
    
    if (!readerContent || !readerContent.contains(range.commonAncestorContainer)) {
      return
    }

    // Calculate text offsets within the reader content
    const walker = document.createTreeWalker(
      readerContent,
      NodeFilter.SHOW_TEXT,
      null
    )

    let textOffset = 0
    let startOffset = 0
    let endOffset = 0
    let foundStart = false

    while (walker.nextNode()) {
      const node = walker.currentNode
      const nodeText = node.textContent || ''
      
      if (node === range.startContainer) {
        startOffset = textOffset + range.startOffset
        foundStart = true
      }
      
      if (node === range.endContainer) {
        endOffset = textOffset + range.endOffset
        break
      }
      
      textOffset += nodeText.length
    }

    if (!foundStart) {
      return
    }

    // Generate XPath for start and end nodes
    const xpathStart = generateXPath(range.startContainer)
    const xpathEnd = generateXPath(range.endContainer)

    // Get context text (before and after selection)
    const fullText = readerContent.textContent || ''
    const textBefore = fullText.substring(Math.max(0, startOffset - 50), startOffset)
    const textAfter = fullText.substring(endOffset, Math.min(fullText.length, endOffset + 50))

    // Position the tooltip
    const rect = range.getBoundingClientRect()
    const tooltipX = rect.left + (rect.width / 2)
    const tooltipY = rect.top - 10

    // Set the selection data with all required fields
    onSetPendingSelection({
      text: selectedText,
      startOffset,
      endOffset,
      xpathStart,
      xpathEnd,
      textBefore,
      textAfter
    })

    onSetTooltipPosition({ x: tooltipX, y: tooltipY })
    onSetShowHighlightTooltip(true)
  }

  // Mouse up event handler
  const handleMouseUp = (event: MouseEvent) => {
    // Small delay to ensure selection is complete
    setTimeout(() => handleTextSelection(event), 10)
  }

  // Add/remove event listeners
  useEffect(() => {
    const readerContent = readerContentRef.current
    if (!readerContent || !onSetShowHighlightTooltip) {
      return
    }

    readerContent.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      readerContent.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onSetShowHighlightTooltip])

  // Function to render existing highlights in content
  const renderContentWithHighlights = (content: string) => {
    console.log('🎨 renderContentWithHighlights called with:', {
      highlightsCount: highlights?.length || 0,
      highlights: highlights,
      contentLength: content?.length || 0
    })

    if (!highlights || highlights.length === 0) {
      console.log('📝 No highlights to render')
      return content
    }

    if (!content) {
      console.log('📝 No content to highlight')
      return ''
    }

    // Sort highlights by start offset to process them in order (reverse to avoid offset issues)
    const sortedHighlights = [...highlights].sort((a, b) => (b.start_offset || 0) - (a.start_offset || 0))
    
    let highlightedContent = content
    
    sortedHighlights.forEach((highlight, index) => {
      const startPos = highlight.start_offset || 0
      const endPos = highlight.end_offset || 0
      
      console.log(`🔍 Processing highlight ${index + 1}:`, {
        startPos,
        endPos,
        text: highlight.selected_text,
        color: highlight.color,
        highlightId: highlight.highlight_id
      })
      
      // Validate positions
      if (startPos < 0 || endPos <= startPos || endPos > highlightedContent.length) {
        console.warn(`⚠️ Invalid highlight positions:`, { startPos, endPos, contentLength: highlightedContent.length })
        return
      }
      
      const beforeText = highlightedContent.substring(0, startPos)
      const highlightText = highlightedContent.substring(startPos, endPos)
      const afterText = highlightedContent.substring(endPos)
      
      // Use the highlight color from database, fallback to yellow
      const highlightColor = highlight.color || '#ffeb3b'
      const highlightStyle = getHighlightStyle(highlightColor)
      
      console.log(`🎨 Applying highlight with color:`, highlightColor, 'style:', highlightStyle)
      
      const highlightSpan = `<mark class="px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-80 transition-all" style="${highlightStyle}" data-highlight-id="${highlight.highlight_id || highlight.id}" data-color="${highlightColor}" title="Highlighted by ${highlight.creator_name || 'Unknown'}" onclick="window.scrollToAnnotation('${highlight.highlight_id || highlight.id}')">${highlightText}</mark>`
      
      highlightedContent = beforeText + highlightSpan + afterText
      
      console.log(`✅ Highlight ${index + 1} applied successfully`)
    })
    
    console.log('🎨 Final highlighted content length:', highlightedContent.length)
    return highlightedContent
  }

  // Show client-side content if available and server-side failed
  const displayContent = clientSideContent || extractedContent
  const isContentAvailable = displayContent && (displayContent.success !== false)

  // Apply highlights to DOM after content renders
  useLayoutEffect(() => {
    if (displayContent && highlights && highlights.length > 0) {
      // Small delay to ensure ReactMarkdown has finished rendering
      const timer = setTimeout(() => {
        applyHighlightsToDOM()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [displayContent, highlights])

  // Set up global scroll function for HTML content highlights
  useEffect(() => {
    // Define global function for HTML content highlight clicks
    (window as any).scrollToAnnotation = (highlightId: string) => {
      console.log('🎯 HTML highlight clicked, scrolling to annotations:', highlightId)
      
      // Find the annotations section
      const annotationsSection = document.querySelector('[data-annotations-section]')
      if (annotationsSection) {
        annotationsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
        
        // Optional: Highlight the specific annotation if it exists
        const highlightAnnotations = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`)
        highlightAnnotations.forEach((annotation) => {
          annotation.classList.add('animate-pulse')
          setTimeout(() => {
            annotation.classList.remove('animate-pulse')
          }, 2000)
        })
      } else {
        console.warn('⚠️ Annotations section not found')
      }
    }

    // Cleanup function
    return () => {
      delete (window as any).scrollToAnnotation
    }
  }, [])

  if (isLoadingContent || isProcessing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grey-accent-600 mb-4"></div>
          <p className="text-grey-accent-600">
            {isProcessing ? 'Processing with Readability...' : 'Extracting content...'}
          </p>
        </div>
      </div>
    )
  }

  if (!isContentAvailable) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-grey-accent-900 mb-2">
            Failed to Extract Content
          </h3>
          <p className="text-grey-accent-600 mb-4">
            Unable to extract readable content from this page
          </p>
          <div className="space-x-2">
            <Button onClick={onRetryExtraction} variant="outline">
              Retry Server Extraction
            </Button>
            <Button onClick={processWithReadability} variant="default">
              Try Client-Side Processing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-grey-accent-900 mb-4 leading-tight">
            {displayContent.title || 'Untitled'}
          </h1>
          
          {(displayContent.byline || displayContent.siteName || displayContent.excerpt) && (
            <div className="text-grey-accent-600 space-y-2">
              {displayContent.byline && (
                <p className="text-lg font-medium">{displayContent.byline}</p>
              )}
              {displayContent.siteName && (
                <p className="text-sm">from {displayContent.siteName}</p>
              )}
              {displayContent.excerpt && (
                <p className="text-base italic border-l-4 border-grey-accent-300 pl-4">
                  {displayContent.excerpt}
                </p>
              )}
            </div>
          )}
        </header>

        {/* Article Content */}
        <article ref={readerContentRef} className="prose prose-lg prose-grey-accent max-w-none select-text">
          {displayContent.markdown ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: (props: any) => {
                  // Filter out the node prop to avoid hydration issues
                  const { node, ...cleanProps } = props
                  return (
                    <LazyImage
                      {...cleanProps}
                      className="mx-auto max-w-full max-h-[40rem] rounded-lg shadow-sm"
                    />
                  )
                },
                h1: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <h1 {...cleanProps} className="text-3xl font-bold text-grey-accent-900 mt-8 mb-4 first:mt-0">
                      {props.children}
                    </h1>
                  )
                },
                h2: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <h2 {...cleanProps} className="text-2xl font-bold text-grey-accent-800 mt-6 mb-3">
                      {props.children}
                    </h2>
                  )
                },
                h3: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <h3 {...cleanProps} className="text-xl font-semibold text-grey-accent-700 mt-5 mb-2">
                      {props.children}
                    </h3>
                  )
                },
                h4: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <h4 {...cleanProps} className="text-lg font-semibold text-grey-accent-600 mt-4 mb-2">
                      {props.children}
                    </h4>
                  )
                },
                p: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <p {...cleanProps} className="mb-4 leading-relaxed text-grey-accent-700">
                      {props.children}
                    </p>
                  )
                },
                blockquote: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <blockquote {...cleanProps} className="border-l-4 border-blue-500 pl-4 italic text-grey-accent-600 my-4">
                      {props.children}
                    </blockquote>
                  )
                },
                ul: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <ul {...cleanProps} className="list-disc list-inside mb-4 space-y-1">
                      {props.children}
                    </ul>
                  )
                },
                ol: (props: any) => {
                  const { node, ordered, ...cleanProps } = props
                  return (
                    <ol {...cleanProps} className="list-decimal list-inside mb-4 space-y-1">
                      {props.children}
                    </ol>
                  )
                },
                li: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <li {...cleanProps} className="text-grey-accent-700">
                      {props.children}
                    </li>
                  )
                },
                code: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <code {...cleanProps} className="bg-grey-accent-100 text-grey-accent-800 px-1 py-0.5 rounded text-sm font-mono">
                      {props.children}
                    </code>
                  )
                },
                pre: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <pre {...cleanProps} className="bg-grey-accent-900 text-grey-accent-100 p-4 rounded-lg overflow-x-auto my-4">
                      {props.children}
                    </pre>
                  )
                },
                a: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <a
                      {...cleanProps}
                      className="text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.children}
                    </a>
                  )
                },
                hr: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <hr {...cleanProps} className="border-grey-accent-300 my-8" />
                  )
                },
                table: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <div className="overflow-x-auto my-4">
                      <table {...cleanProps} className="min-w-full border-collapse border border-grey-accent-300">
                        {props.children}
                      </table>
                    </div>
                  )
                },
                th: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <th {...cleanProps} className="border border-grey-accent-300 px-4 py-2 bg-grey-accent-50 font-semibold text-left">
                      {props.children}
                    </th>
                  )
                },
                td: (props: any) => {
                  const { node, ...cleanProps } = props
                  return (
                    <td {...cleanProps} className="border border-grey-accent-300 px-4 py-2">
                      {props.children}
                    </td>
                  )
                }
              }}
            >
              {displayContent.markdown}
            </ReactMarkdown>
          ) : displayContent.reader_html ? (
            <div
              className="prose-img:mx-auto prose-img:max-w-full prose-img:max-h-[40rem] prose-img:rounded-lg prose-img:shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderContentWithHighlights(displayContent.reader_html) }}
            />
          ) : displayContent.htmlContent ? (
            <div
              className="prose-img:mx-auto prose-img:max-w-full prose-img:max-h-[40rem] prose-img:rounded-lg prose-img:shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderContentWithHighlights(displayContent.htmlContent) }}
            />
          ) : displayContent.content ? (
            <div className="whitespace-pre-wrap leading-relaxed text-grey-accent-700">
              <span dangerouslySetInnerHTML={{ __html: renderContentWithHighlights(displayContent.content) }} />
            </div>
          ) : (
            <div className="text-center text-grey-accent-500 py-8">
              No content available to display
            </div>
          )}
        </article>

        {/* Article Footer */}
        {displayContent.length && (
          <footer className="mt-8 pt-6 border-t border-grey-accent-200">
            <div className="flex items-center justify-between text-sm text-grey-accent-500">
              <span>~{displayContent.length.toLocaleString()} characters</span>
              {clientSideContent && (
                <span className="text-blue-600">Processed with Mozilla Readability</span>
              )}
            </div>
          </footer>
        )}

        {/* Highlights & Discussion Section */}
        {bookmark && user && onCreateAnnotation && onToggleAnnotationLike && onDeleteAnnotation && onSetCommentInputs && (
          <div data-annotations-section>
            <HighlightsDiscussion
              bookmark={bookmark}
              annotations={annotations}
              highlights={highlights}
              user={user}
              teamId={teamId || ''}
              commentInputs={commentInputs}
              onCreateAnnotation={onCreateAnnotation}
              onToggleAnnotationLike={onToggleAnnotationLike}
              onDeleteAnnotation={onDeleteAnnotation}
              onSetCommentInputs={onSetCommentInputs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
