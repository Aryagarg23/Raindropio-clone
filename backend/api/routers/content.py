"""
Content extraction and embedding utilities for bypassing iframe restrictions
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, HttpUrl
import newspaper
from newspaper import Article
import httpx
import asyncio
import datetime
from urllib.parse import urlparse
import logging
import time
from typing import Dict, Any

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

router = APIRouter(prefix="/content", tags=["content"])
logger = logging.getLogger(__name__)

class ContentExtractionRequest(BaseModel):
    url: HttpUrl

class ContentExtractionResponse(BaseModel):
    title: str
    description: str
    content: str
    meta_info: dict
    extracted_at: str
    success: bool

@router.post("/extract")
async def extract_content(request: ContentExtractionRequest):
    """
    Extract readable content from a web page using newspaper3k
    """
    url = str(request.url)
    
    # Clean up expired cache entries periodically
    cleanup_cache()
    
    # Check cache first
    cache_key = url
    if cache_key in extraction_cache:
        cached = extraction_cache[cache_key]
        if time.time() - cached.get('cached_at', 0) < CACHE_TTL:
            logger.info(f"Returning cached extraction for {url}")
            return cached['data']
    
    print(f"Extracting content for {request.url}")
    try:
        url = str(request.url)
        
        # Add a small delay to avoid hitting rate limits
        await asyncio.sleep(1)
        
        # Use newspaper3k for reliable content extraction
        article = Article(url)
        try:
            article.download()
            article.parse()
        except Exception as download_error:
            logger.warning(f"Failed to download/parse article {url}: {str(download_error)}")
            # Return cached result if available, otherwise failure
            if cache_key in extraction_cache:
                cached = extraction_cache[cache_key]
                if time.time() - cached.get('cached_at', 0) < CACHE_TTL * 24:  # Extend cache for failed requests
                    logger.info(f"Returning stale cached extraction for {url}")
                    return cached['data']
            raise
        
        # Extract meta info
        meta_info = {}
        
        # Get the top image
        if article.top_image:
            meta_info['image'] = article.top_image
        
        # Get additional metadata
        if article.authors:
            meta_info['authors'] = article.authors
        if article.publish_date:
            meta_info['publish_date'] = article.publish_date.isoformat() if hasattr(article.publish_date, 'isoformat') else str(article.publish_date)
        
        # Get site name
        parsed_url = urlparse(url)
        meta_info['site_name'] = parsed_url.netloc
        
        result = {
            "title": article.title or "Untitled",
            "description": article.meta_description or "",
            "content": article.text or "",
            "meta_info": meta_info,
            "extracted_at": datetime.datetime.now().isoformat(),
            "success": True
        }
        
        # Cache the result
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
            "meta_info": {},
            "extracted_at": datetime.datetime.now().isoformat(),
            "success": False
        }

@router.get("/proxy")
async def proxy_content(url: str):
    """
    Proxy content to bypass CORS restrictions
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            # Return the content with proper headers
            return Response(
                content=response.content,
                media_type=response.headers.get('content-type', 'text/html'),
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
            # Extract domain from URL for Referer header
            from urllib.parse import urlparse
            parsed_url = urlparse(url)
            referer = f"{parsed_url.scheme}://{parsed_url.netloc}/"
            
            headers = {
                'User-Agent': user_agent,
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,*',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': referer,
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, headers=headers, follow_redirects=True)
                response.raise_for_status()

                # Get content type from response
                content_type = response.headers.get('content-type', 'image/jpeg')

                # Return the image data with proper headers
                return Response(
                    content=response.content,
                    media_type=content_type,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET",
                        "Access-Control-Allow-Headers": "*",
                        "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
                    }
                )
        
        except Exception as e:
            last_error = e
            continue  # Try next User-Agent
    
    # If all User-Agents failed, raise the last error
    logger.error(f"Image proxy request failed for {url} with all User-Agents: {str(last_error)}")
    raise HTTPException(status_code=400, detail=f"Failed to proxy image: {str(last_error)}")
