"""
Content extraction and embedding utilities for bypassing iframe restrictions
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
import httpx
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re
import base64
from io import BytesIO
import logging

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

class ScreenshotRequest(BaseModel):
    url: HttpUrl
    width: int = 1200
    height: int = 800

@router.post("/extract", response_model=ContentExtractionResponse)
async def extract_content(request: ContentExtractionRequest):
    """
    Extract readable content from a web page using multiple strategies
    """
    try:
        url = str(request.url)
        
        # Strategy 1: Direct HTTP request with proper headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            
            html_content = response.text
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Extract title
            title = ""
            
            # Try different title sources in order of preference
            og_title = soup.find('meta', attrs={'property': 'og:title'})
            if og_title:
                title = og_title.get('content', '')
            
            if not title:
                twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
                if twitter_title:
                    title = twitter_title.get('content', '')
            
            if not title:
                title_tag = soup.find('title')
                if title_tag:
                    title = title_tag.get_text(strip=True)
            
            if not title:
                h1_tag = soup.find('h1')
                if h1_tag:
                    title = h1_tag.get_text(strip=True)
            
            # Extract description
            description = ""
            
            # Try different description sources
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                description = meta_desc.get('content', '')
            
            if not description:
                og_desc = soup.find('meta', attrs={'property': 'og:description'})
                if og_desc:
                    description = og_desc.get('content', '')
            
            if not description:
                twitter_desc = soup.find('meta', attrs={'name': 'twitter:description'})
                if twitter_desc:
                    description = twitter_desc.get('content', '')
            
            # Extract main content using multiple strategies
            content = ""
            
            # Strategy 1: Look for article/main content containers
            content_selectors = [
                'article',
                '[role="main"]',
                'main',
                '.post-content',
                '.article-content',
                '.entry-content',
                '.content',
                '.post-body',
                '#content',
                '.main-content'
            ]
            
            for selector in content_selectors:
                element = soup.select_one(selector)
                if element:
                    # Clean up the content
                    for unwanted in element.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside', 'advertisement']):
                        unwanted.decompose()
                    
                    content = str(element)
                    break
            
            # Strategy 2: If no main content found, extract from body
            if not content:
                body = soup.find('body')
                if body:
                    # Remove unwanted elements
                    for unwanted in body.find_all(['script', 'style', 'nav', 'header', 'footer', 'aside', 'advertisement']):
                        unwanted.decompose()
                    
                    # Get text content with some basic formatting
                    content = str(body)
            
            # Extract meta information
            meta_info = {
                'canonical_url': url,
                'image': '',
                'site_name': '',
                'author': '',
                'published_time': '',
                'word_count': len(re.findall(r'\w+', soup.get_text()))
            }
            
            # Extract image
            og_image = soup.find('meta', attrs={'property': 'og:image'})
            if og_image:
                meta_info['image'] = og_image.get('content', '')
                if meta_info['image']:
                    meta_info['image'] = urljoin(url, meta_info['image'])
            
            if not meta_info['image']:
                twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
                if twitter_image:
                    meta_info['image'] = twitter_image.get('content', '')
                    if meta_info['image']:
                        meta_info['image'] = urljoin(url, meta_info['image'])
            
            # Extract favicon
            favicon_url = ""
            
            # Try different favicon sources in order of preference
            icon_link = soup.find('link', attrs={'rel': 'icon'})
            if icon_link:
                favicon_url = icon_link.get('href', '')
            
            if not favicon_url:
                shortcut_icon = soup.find('link', attrs={'rel': 'shortcut icon'})
                if shortcut_icon:
                    favicon_url = shortcut_icon.get('href', '')
            
            if not favicon_url:
                apple_touch_icon = soup.find('link', attrs={'rel': 'apple-touch-icon'})
                if apple_touch_icon:
                    favicon_url = apple_touch_icon.get('href', '')
            
            # Convert relative URLs to absolute
            if favicon_url:
                favicon_url = urljoin(url, favicon_url)
            else:
                # Fallback to standard favicon location
                parsed_url = urlparse(url)
                favicon_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"
            
            meta_info['favicon'] = favicon_url
            
            # Extract site name
            site_name_el = soup.find('meta', attrs={'property': 'og:site_name'})
            if site_name_el:
                meta_info['site_name'] = site_name_el.get('content', '')
            else:
                parsed_url = urlparse(url)
                meta_info['site_name'] = parsed_url.netloc
            
            # Extract author
            author_meta = soup.find('meta', attrs={'name': 'author'})
            if author_meta:
                meta_info['author'] = author_meta.get('content', '')
            
            if not meta_info['author']:
                article_author = soup.find('meta', attrs={'property': 'article:author'})
                if article_author:
                    meta_info['author'] = article_author.get('content', '')
                    
            if not meta_info['author']:
                author_link = soup.find(attrs={'rel': 'author'})
                if author_link:
                    meta_info['author'] = author_link.get_text(strip=True)
            
            return ContentExtractionResponse(
                title=title or "Untitled",
                description=description,
                content=content,
                meta_info=meta_info,
                extracted_at=str(asyncio.get_event_loop().time()),
                success=True
            )
            
    except Exception as e:
        logger.error(f"Content extraction failed for {url}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to extract content: {str(e)}")

@router.post("/screenshot")
async def generate_screenshot(request: ScreenshotRequest):
    """
    Generate a screenshot of a web page (requires additional setup)
    This is a placeholder - you would need to integrate with a service like:
    - Puppeteer/Playwright
    - ScreenshotAPI
    - HTMLCSStoImage
    - etc.
    """
    try:
        # Placeholder implementation
        # In a real implementation, you would:
        # 1. Use Puppeteer/Playwright to take screenshots
        # 2. Or integrate with a screenshot service API
        # 3. Store the image and return the URL
        
        return {
            "success": False,
            "message": "Screenshot service not implemented yet",
            "url": str(request.url),
            "placeholder_image": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gIDxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+ICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlhYTBhNiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2NyZWVuc2hvdCBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
        }
        
    except Exception as e:
        logger.error(f"Screenshot generation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to generate screenshot: {str(e)}")

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
            
            # Return the content with proper headers for iframe embedding
            return {
                "content": response.text,
                "content_type": response.headers.get('content-type', 'text/html'),
                "status_code": response.status_code
            }
            
    except Exception as e:
        logger.error(f"Proxy request failed for {url}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to proxy content: {str(e)}")