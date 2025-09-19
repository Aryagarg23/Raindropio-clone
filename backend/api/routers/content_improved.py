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

router = APIRouter(prefix="/content", tags=["content"])
logger = logging.getLogger(__name__)

# Simple in-memory cache for extraction results
extraction_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 3600  # 1 hour

def cleanup_cache():
    """Clean up expired cache entries"""
    current_time = time.time()
    expired_keys = [k for k, v in extraction_cache.items() 
                   if current_time - v.get('cached_at', 0) > CACHE_TTL]
    for key in expired_keys:
        del extraction_cache[key]
    if expired_keys:
        logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")

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

@router.post("/extract")
async def extract_content(request: ContentExtractionRequest):
    """
    Extract readable content from a web page using readability-lxml
    """
    url = str(request.url)
    
    # Clean up expired cache entries periodically
    cleanup_cache()
    
    cache_key = url
    if cache_key in extraction_cache:
        cached = extraction_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < CACHE_TTL:
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
    cleanup_cache()

    cache_key = url
    if cache_key in extraction_cache:
        cached = extraction_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < CACHE_TTL:
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
    Proxy content to bypass CORS restrictions with improved handling
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            # Get the content
            content = response.text
            content_type = response.headers.get('content-type', 'text/html')
            
            # If it's HTML, rewrite URLs to work with our proxy
            if 'text/html' in content_type:
                content = await _rewrite_html_urls(content, url)
            
            # Return the content with proper headers
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "*",
                    "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                }
            )
            
    except Exception as e:
        logger.error(f"Proxy request failed for {url}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to proxy content: {str(e)}")

@router.get("/proxy/image")
async def proxy_image(url: str):
    """
    Proxy images to bypass CORS restrictions and support more formats
    """
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
