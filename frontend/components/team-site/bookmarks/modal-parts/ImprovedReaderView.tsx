import React, { useState, useEffect, useRef } from 'react'
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
  onSetPendingSelection?: (selection: { text: string; startOffset: number; endOffset: number } | null) => void
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
  const [clientSideContent, setClientSideContent] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const readerContentRef = useRef<HTMLDivElement>(null)

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

    // Position the tooltip
    const rect = range.getBoundingClientRect()
    const tooltipX = rect.left + (rect.width / 2)
    const tooltipY = rect.top - 10

    // Set the selection data
    onSetPendingSelection({
      text: selectedText,
      startOffset,
      endOffset
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
    if (!highlights || highlights.length === 0) {
      return content
    }

    // Sort highlights by start offset to process them in order
    const sortedHighlights = [...highlights].sort((a, b) => a.start_offset - b.start_offset)
    
    let highlightedContent = content
    let offset = 0
    
    sortedHighlights.forEach((highlight) => {
      const startPos = highlight.start_offset + offset
      const endPos = highlight.end_offset + offset
      const beforeText = highlightedContent.substring(0, startPos)
      const highlightText = highlightedContent.substring(startPos, endPos)
      const afterText = highlightedContent.substring(endPos)
      
      const highlightSpan = `<mark class="bg-yellow-200 border-l-2 border-yellow-400 px-1 py-0.5 rounded-sm cursor-pointer hover:bg-yellow-300 transition-colors" data-highlight-id="${highlight.highlight_id}" title="Highlighted by ${highlight.creator_name}">${highlightText}</mark>`
      
      highlightedContent = beforeText + highlightSpan + afterText
      offset += highlightSpan.length - highlightText.length
    })
    
    return highlightedContent
  }

  // Show client-side content if available and server-side failed
  const displayContent = clientSideContent || extractedContent
  const isContentAvailable = displayContent && (displayContent.success !== false)

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
        )}
      </div>
    </div>
  )
}
