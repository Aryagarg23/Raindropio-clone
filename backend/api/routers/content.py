"""
Content extraction and embedding utilities for bypassing iframe restrictions
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, HttpUrl
import httpx
import asyncio
import datetime
from urllib.parse import urlparse
import logging
import time
from typing import Dict, Any
import json
from utils.html_to_markdown import html_to_markdown, sanitize_html_for_reader
import lxml.html as lxml_html
from services.content_extraction_service import ContentExtractionService

router = APIRouter(prefix="/api/content", tags=["content"])
logger = logging.getLogger(__name__)

# Enhanced in-memory cache for both extraction and proxy results
extraction_cache: Dict[str, Dict[str, Any]] = {}
proxy_cache: Dict[str, Dict[str, Any]] = {}
EXTRACTION_CACHE_TTL = 3600  # 1 hour for extraction
PROXY_CACHE_TTL = 7200  # 2 hours for proxy (longer since content is more stable)

# Cache size limits to prevent memory issues
MAX_CACHE_ENTRIES = 1000
MAX_PROXY_CACHE_SIZE = 50 * 1024 * 1024  # 50MB total for proxy cache

def cleanup_extraction_cache():
    """Clean up expired extraction cache entries"""
    current_time = time.time()
    expired_keys = [k for k, v in extraction_cache.items() 
                   if current_time - v.get('cached_at', 0) > EXTRACTION_CACHE_TTL]
    for key in expired_keys:
        del extraction_cache[key]
    if expired_keys:
        logger.info(f"Cleaned up {len(expired_keys)} expired extraction cache entries")

def cleanup_proxy_cache():
    """Clean up expired proxy cache entries and manage cache size"""
    current_time = time.time()
    
    # Remove expired entries
    expired_keys = [k for k, v in proxy_cache.items() 
                   if current_time - v.get('cached_at', 0) > PROXY_CACHE_TTL]
    for key in expired_keys:
        del proxy_cache[key]
    
    # Check total cache size and evict LRU if necessary
    total_size = sum(len(v.get('content', '').encode('utf-8')) for v in proxy_cache.values())
    
    if total_size > MAX_PROXY_CACHE_SIZE:
        # Sort by last access time (LRU eviction)
        sorted_items = sorted(proxy_cache.items(), 
                            key=lambda x: x[1].get('last_accessed', 0))
        
        # Remove oldest entries until we're under the limit
        removed_count = 0
        for key, value in sorted_items:
            if total_size <= MAX_PROXY_CACHE_SIZE * 0.8:  # Remove until 80% of limit
                break
            content_size = len(value.get('content', '').encode('utf-8'))
            total_size -= content_size
            del proxy_cache[key]
            removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Evicted {removed_count} LRU proxy cache entries to manage size")
    
    if expired_keys:
        logger.info(f"Cleaned up {len(expired_keys)} expired proxy cache entries")

def get_proxy_cache_stats():
    """Get proxy cache statistics"""
    current_time = time.time()
    valid_entries = [v for v in proxy_cache.values() 
                    if current_time - v.get('cached_at', 0) <= PROXY_CACHE_TTL]
    
    total_size = sum(len(v.get('content', '').encode('utf-8')) for v in valid_entries)
    total_hits = sum(v.get('hits', 0) for v in valid_entries)
    
    return {
        'total_entries': len(proxy_cache),
        'valid_entries': len(valid_entries),
        'total_size_mb': round(total_size / (1024 * 1024), 2),
        'total_hits': total_hits,
        'hit_rate': round(total_hits / max(len(valid_entries), 1), 2)
    }

def clear_cache():
    """Clear all cached results"""
    global extraction_cache, proxy_cache
    extraction_count = len(extraction_cache)
    proxy_count = len(proxy_cache)
    extraction_cache.clear()
    proxy_cache.clear()
    logger.info(f"Cleared {extraction_count} extraction and {proxy_count} proxy cache entries")
    return extraction_count + proxy_count

class ContentExtractionRequest(BaseModel):
    url: HttpUrl

class ContentExtractionResponse(BaseModel):
    title: str
    description: str
    content: str
    markdown: str
    meta_info: dict
    extracted_at: str
    success: bool

@router.post("/clear-cache")
async def clear_extraction_cache():
    """
    Clear all cached extraction results
    """
    count = clear_cache()
    return {"message": f"Cleared {count} cached results"}

@router.get("/cache-stats")
async def get_cache_stats():
    """
    Get cache statistics for monitoring
    """
    proxy_stats = get_proxy_cache_stats()
    
    # Extraction cache stats
    current_time = time.time()
    extraction_valid = [v for v in extraction_cache.values() 
                       if current_time - v.get('cached_at', 0) <= EXTRACTION_CACHE_TTL]
    
    return {
        "proxy_cache": proxy_stats,
        "extraction_cache": {
            "total_entries": len(extraction_cache),
            "valid_entries": len(extraction_valid)
        },
        "cache_limits": {
            "max_proxy_size_mb": round(MAX_PROXY_CACHE_SIZE / (1024 * 1024), 2),
            "max_entries": MAX_CACHE_ENTRIES,
            "proxy_ttl_hours": round(PROXY_CACHE_TTL / 3600, 1),
            "extraction_ttl_hours": round(EXTRACTION_CACHE_TTL / 3600, 1)
        }
    }

@router.post("/extract")
async def extract_content(request: ContentExtractionRequest):
    """
    Extract readable content from a web page using readability-lxml
    """
    url = str(request.url)
    
    # Clean up expired cache entries periodically
    cleanup_extraction_cache()
    
    cache_key = url
    if cache_key in extraction_cache:
        cached = extraction_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < EXTRACTION_CACHE_TTL:
            logger.info(f"Returning cached extraction for {url}")
            return cached['data']
    
    try:
        # Use the new content extraction service
        async with ContentExtractionService() as extraction_service:
            result = await extraction_service.extract_content(url)
        
        # Cache the result if successful
        if result.get('success'):
            extraction_cache[cache_key] = {
                'data': result,
                'cached_at': time.time()
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Content extraction failed for {request.url}: {str(e)}")
        return {
            "title": "",
            "description": "",
            "content": "",
            "reader_html": "",
            "markdown": "",
            "meta_info": {},
            "extracted_at": datetime.datetime.now().isoformat(),
            "success": False
        }


@router.post("/extract_markdown")
async def extract_markdown(request: ContentExtractionRequest):
    """
    Extract markdown content from a web page
    """
    url = str(request.url)

    # Clean up expired cache entries periodically
    cleanup_extraction_cache()

    cache_key = url
    if cache_key in extraction_cache:
        cached = extraction_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < EXTRACTION_CACHE_TTL:
            logger.info(f"Returning cached markdown for {url}")
            data = cached['data']
            return {
                "url": url,
                "title": data.get('title', ''),
                "markdown": data.get('markdown', ''),
                "extracted_at": data.get('extracted_at'),
                "success": True
            }

    # Not cached or expired — trigger extraction which populates the cache
    result = await extract_content(request)

    if result and result.get('success'):
        return {
            "url": url,
            "title": result.get('title', ''),
            "markdown": result.get('markdown', ''),
            "extracted_at": result.get('extracted_at'),
            "success": True
        }

    # Return a 200 response with success:false and a reason field instead of raising 400.
    # This prevents frontend hooks from throwing when the extraction fails and allows
    # the client to gracefully fall back to other sources.
    return {
        "url": url,
        "title": "",
        "markdown": "",
        "extracted_at": datetime.datetime.now().isoformat(),
        "success": False,
        "reason": f"Failed to extract markdown for {url}"
    }

@router.get("/proxy")
async def proxy_content(url: str):
    """
    Proxy content to bypass CORS restrictions with improved handling and fallback strategies
    """
    # Clean up proxy cache periodically
    cleanup_proxy_cache()
    
    # Check cache first
    cache_key = url
    if cache_key in proxy_cache:
        cached = proxy_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < PROXY_CACHE_TTL:
            # Update access time and hit count for LRU tracking
            cached['last_accessed'] = time.time()
            cached['hits'] = cached.get('hits', 0) + 1
            logger.info(f"Returning cached proxy content for {url} (hit #{cached['hits']})")
            
            return Response(
                content=cached['content'],
                media_type=cached.get('content_type', 'text/html'),
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "*",
                    "Cache-Control": "public, max-age=3600",
                    "X-Proxy-Strategy": cached.get('strategy', 'cached'),
                    "X-Original-URL": url,
                    "X-Cache-Status": "HIT",
                }
            )
    
    # List of user agents to try (mobile first for better success rate)
    user_agents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ]
    
    last_error = None
    
    for i, user_agent in enumerate(user_agents):
        try:
            headers = {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'DNT': '1',
            }
            
            timeout_duration = 30.0 if i == 0 else 20.0  # Longer timeout for first attempt
            
            async with httpx.AsyncClient(timeout=timeout_duration) as client:
                response = await client.get(url, headers=headers, follow_redirects=True)
                response.raise_for_status()
                
                # Get the content
                content = response.text
                content_type = response.headers.get('content-type', 'text/html')
                
                # Check if this looks like an actual webpage (not an error page)
                if len(content) < 100:
                    continue  # Too small, likely an error
                
                # Check for common blocking indicators
                if any(indicator in content.lower() for indicator in [
                    'access denied', 'blocked', 'forbidden', '403', 'unauthorized'
                ]):
                    continue  # Likely blocked content
                
                # If it's HTML, rewrite URLs to work with our proxy
                if 'text/html' in content_type:
                    content = await _rewrite_html_urls(content, url)
                    
                    # Inject some basic security and functionality improvements
                    content = await _enhance_html_content(content, url)
                
                # Cache the successful result
                proxy_cache[cache_key] = {
                    'content': content,
                    'content_type': content_type,
                    'strategy': f"user-agent-{i}",
                    'cached_at': time.time(),
                    'last_accessed': time.time(),
                    'hits': 1
                }
                
                logger.info(f"Cached proxy content for {url} ({len(content)} bytes, strategy: user-agent-{i})")
                
                # Return the content with proper headers
                return Response(
                    content=content,
                    media_type=content_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET",
                        "Access-Control-Allow-Headers": "*",
                        "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                        "X-Proxy-Strategy": f"user-agent-{i}",
                        "X-Original-URL": url,
                        "X-Cache-Status": "MISS",
                    }
                )
                
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
            if e.response.status_code == 403:
                last_error += " (Access forbidden - may require archive.org fallback)"
            elif e.response.status_code == 404:
                last_error += " (Page not found)"
            elif e.response.status_code >= 500:
                last_error += " (Server error)"
        except httpx.TimeoutException:
            last_error = "Request timeout - website too slow to respond"
        except Exception as e:
            last_error = str(e)
            
        logger.warning(f"Proxy attempt {i+1} failed for {url} with User-Agent {user_agent[:50]}...: {last_error}")
    
    # All attempts failed
    logger.error(f"All proxy attempts failed for {url}. Last error: {last_error}")
    
    # Provide a detailed error response that the frontend can use
    error_detail = {
        "message": "Failed to proxy content",
        "url": url,
        "last_error": last_error,
        "attempts": len(user_agents),
        "suggestions": [
            "Try the Archive.org version",
            "Open the original URL in a new tab",
            "The website may be blocking automated access"
        ]
    }
    
    raise HTTPException(status_code=400, detail=error_detail)

@router.get("/proxy/image")
async def proxy_image(url: str):
    """
    Proxy images to bypass CORS restrictions and support more formats
    """
    # Skip data URLs - they don't need proxying
    if url.startswith('data:'):
        raise HTTPException(status_code=400, detail="Data URLs do not need proxying")
    
    # Try different User-Agents in order of success rate
    user_agents = [
        # Mobile Safari (most successful)
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        # Desktop Chrome
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        # Desktop Firefox
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        # Googlebot (sometimes allowed by sites)
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    ]
    
    last_error = None
    
    for user_agent in user_agents:
        try:
            headers = {
                'User-Agent': user_agent,
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers, follow_redirects=True)
                response.raise_for_status()

                # Validate that this is actually an image
                content_type = response.headers.get('content-type', '').lower()
                if not any(img_type in content_type for img_type in ['image/', 'application/octet-stream']):
                    # If it's not an image, try to get it anyway (some servers don't set proper content-type)
                    if len(response.content) < 1024:  # Too small to be a real image
                        continue
                
                return Response(
                    content=response.content,
                    media_type=content_type or 'image/jpeg',
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET",
                        "Access-Control-Allow-Headers": "*",
                        "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                    }
                )
        
        except Exception as e:
            last_error = e
            logger.warning(f"Failed to fetch image with User-Agent {user_agent[:50]}...: {str(e)}")
            continue
    
    # If all User-Agents failed, raise the last error
    logger.error(f"All attempts to proxy image failed for {url}")
    raise HTTPException(status_code=400, detail=f"Failed to proxy image: {str(last_error)}")

async def _rewrite_html_urls(html_content: str, base_url: str) -> str:
    """
    Rewrite URLs in HTML content to work with our proxy
    """
    try:
        from bs4 import BeautifulSoup
        from urllib.parse import urljoin, urlparse
        
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Rewrite relative URLs to absolute
        for tag in soup.find_all(['a', 'img', 'link', 'script', 'iframe']):
            for attr in ['href', 'src', 'action']:
                if tag.get(attr):
                    original_url = tag[attr]
                    if original_url.startswith('//'):
                        # Protocol-relative URL
                        tag[attr] = f"https:{original_url}"
                    elif original_url.startswith('/'):
                        # Root-relative URL
                        parsed_base = urlparse(base_url)
                        tag[attr] = f"{parsed_base.scheme}://{parsed_base.netloc}{original_url}"
                    elif not original_url.startswith(('http://', 'https://', 'data:', 'mailto:', 'tel:', '#')):
                        # Relative URL
                        tag[attr] = urljoin(base_url, original_url)
        
        return str(soup)
        
    except Exception as e:
        logger.error(f"Failed to rewrite HTML URLs: {str(e)}")
        return html_content

async def _enhance_html_content(html_content: str, base_url: str) -> str:
    """
    Enhance HTML content with security and functionality improvements
    """
    try:
        from bs4 import BeautifulSoup
        from urllib.parse import urlparse
        
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Add a base tag to help with relative URLs
        if not soup.find('base'):
            if soup.head:
                base_tag = soup.new_tag('base', href=base_url)
                soup.head.insert(0, base_tag)
        
        # Add viewport meta tag for mobile compatibility
        if not soup.find('meta', attrs={'name': 'viewport'}):
            if soup.head:
                viewport_tag = soup.new_tag('meta', attrs={
                    'name': 'viewport',
                    'content': 'width=device-width, initial-scale=1.0'
                })
                soup.head.append(viewport_tag)
        
        # Remove potentially problematic scripts that might break in iframe
        for script in soup.find_all('script'):
            script_content = script.get_text()
            if script_content and any(pattern in script_content.lower() for pattern in [
                'window.top', 'parent.location', 'self.location', 'top.location',
                'framebusting', 'framebuster', 'x-frame-options'
            ]):
                script.decompose()
        
        # Proxy images through our own proxy to avoid CORS issues
        for img in soup.find_all('img'):
            if img.get('src') and img['src'].startswith(('http://', 'https://')):
                original_src = img['src']
                img['src'] = f"/api/content/proxy/image?url={original_src}"
                img['data-original-src'] = original_src
        
        # Add some basic styling to improve readability in iframe
        style_tag = soup.new_tag('style')
        style_tag.string = """
        /* Proxy view enhancements */
        body { 
            margin: 0 !important; 
            padding: 8px !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif !important;
        }
        /* Hide potential iframe-breaking elements */
        iframe[src*="ads"], iframe[src*="advertisement"], .ad, .ads, 
        div[id*="ad"], div[class*="ad"] { display: none !important; }
        """
        if soup.head:
            soup.head.append(style_tag)
        
        return str(soup)
        
    except Exception as e:
        logger.error(f"Failed to enhance HTML content: {str(e)}")
        return html_content
