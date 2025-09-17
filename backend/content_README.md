# Content Router Documentation (`api/routers/content.py`)

This file provides web content extraction functionality for the Raindropio-clone backend. It extracts readable content, metadata, and images from web pages to support bookmarking features. The file is 379 lines long and includes sophisticated web scraping and content processing.

## Overview

The content router (`/content`) contains endpoints for extracting and processing web content. This enables the application to create rich bookmarks with extracted titles, descriptions, and content previews.

## Endpoints

### Content Extraction

#### `POST /content/extract`
- **Purpose**: Extract readable content and metadata from a web page
- **Input**: `ContentExtractionRequest` with URL
- **Response**: `ContentExtractionResponse` with extracted data
- **Functionality**:
  - Fetches web page with proper headers
  - Extracts title from multiple sources (OpenGraph, Twitter, HTML)
  - Extracts description and meta information
  - Processes content for readability
  - Handles various content types and encodings

## Content Extraction Strategy

The extraction process uses multiple strategies in order of preference:

### Title Extraction
1. **OpenGraph**: `og:title` meta property
2. **Twitter Cards**: `twitter:title` meta name
3. **HTML Title**: `<title>` tag content
4. **Fallback**: URL or generic title

### Description Extraction
1. **OpenGraph**: `og:description`
2. **Twitter Cards**: `twitter:description`
3. **Meta Description**: `description` meta tag
4. **Content Summary**: First paragraph or summary

### Content Processing
- **BeautifulSoup Parsing**: HTML structure analysis
- **Content Cleaning**: Removes scripts, styles, navigation
- **Readability Optimization**: Extracts main content areas
- **Metadata Collection**: Gathers all relevant meta tags

### Image Extraction
- **Schema.org**: Structured data image fields
- **OpenGraph**: `og:image` properties
- **Twitter Cards**: `twitter:image`
- **Article Images**: Content images with fallbacks

## Key Features

### Robust Web Fetching
- **User Agent Spoofing**: Mimics real browser requests
- **Header Configuration**: Proper Accept headers for content negotiation
- **Redirect Handling**: Follows HTTP redirects automatically
- **Timeout Management**: 30-second timeout for requests
- **Encoding Detection**: Handles various character encodings

### Content Analysis
- **Schema.org Support**: Parses JSON-LD structured data
- **Meta Tag Processing**: Comprehensive meta information extraction
- **Content Type Detection**: Handles different web page types
- **Error Recovery**: Graceful handling of malformed pages

### Performance Optimization
- **Async Operations**: Non-blocking HTTP requests
- **Connection Pooling**: Efficient HTTP client usage
- **Memory Management**: Proper resource cleanup
- **Logging**: Comprehensive operation logging

## Data Models

### ContentExtractionRequest
```python
{
    "url": "https://example.com/article"  # HttpUrl validated
}
```

### ContentExtractionResponse
```python
{
    "title": "Article Title",
    "description": "Article summary...",
    "content": "Full extracted content...",
    "meta_info": {
        "author": "Author Name",
        "published": "2023-01-01",
        "site_name": "Example Site"
    },
    "extracted_at": "2023-01-01T12:00:00Z",
    "success": true
}
```

## Dependencies

- `httpx`: Async HTTP client for web requests
- `BeautifulSoup`: HTML parsing and content extraction
- `Pydantic`: URL validation and data models
- FastAPI: Web framework integration

## Usage Examples

### Extract Web Content
```python
# POST /content/extract
# Body: {"url": "https://example.com/article"}
# Response: {
#   "title": "Example Article",
#   "description": "This is an example...",
#   "content": "Full article content...",
#   "meta_info": {...},
#   "extracted_at": "2023-01-01T...",
#   "success": true
# }
```

## Error Handling

- **Network Errors**: Connection timeouts, DNS failures
- **HTTP Errors**: 4xx/5xx status codes
- **Parsing Errors**: Malformed HTML, encoding issues
- **Validation Errors**: Invalid URLs, missing content

## Security Considerations

- **Input Validation**: URL validation prevents malicious inputs
- **Resource Limits**: Timeout prevents resource exhaustion
- **Content Filtering**: Basic content sanitization
- **Logging**: Request logging for monitoring

## Performance Characteristics

- **Typical Response Time**: 2-5 seconds for content extraction
- **Memory Usage**: Scales with page size
- **Concurrent Requests**: Async design supports multiple extractions
- **Caching**: No built-in caching (can be added at higher level)

## Future Enhancements

- **Screenshot Generation**: Visual page previews
- **Content Summarization**: AI-powered summaries
- **Link Extraction**: Related content discovery
- **Content Archiving**: Historical content snapshots

## Notes

- Designed for bookmarking and content curation
- Handles modern web standards (OpenGraph, Schema.org)
- Robust error handling for unreliable web content
- Async implementation prevents blocking operations