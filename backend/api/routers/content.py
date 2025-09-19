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
import json
from utils.html_to_markdown import html_to_markdown, sanitize_html_for_reader
import lxml.html as lxml_html

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
    markdown: str
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
            # Try to fetch raw HTML with a browser user-agent and re-run parsing
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(url, headers=headers, follow_redirects=True)
                    resp.raise_for_status()
                    raw_html = resp.text

                # If we have HTML, feed it into newspaper's article and try parse
                if raw_html:
                    try:
                        article.set_html(raw_html)
                        article.parse()
                    except Exception:
                        # If newspaper still fails, fall through to other extractors
                        pass
            except Exception:
                # network or fetch failed — continue to other fallbacks
                raw_html = ''

            # If newspaper succeeded after set_html, continue normally
            if not getattr(article, 'text', None) and not getattr(article, 'title', None):
                # Try optional third-party extractors: trafilatura or readability-lxml
                try:
                    if not raw_html:
                        # attempt a synchronous fetch as a last-ditch
                        import requests
                        headers = {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        }
                        r = requests.get(url, headers=headers, timeout=20)
                        r.raise_for_status()
                        raw_html = r.text

                    # Try trafilatura if installed
                    try:
                        import trafilatura
                        tr_text = trafilatura.extract(raw_html, include_comments=False, deduplicate=True)
                        if tr_text:
                            article.title = article.title or ''
                            article.text = tr_text
                            logger.info(f"Trafilatura used for fallback extraction for {url}")
                    except Exception:
                        # Try readability-lxml as another fallback
                        try:
                            from readability import Document
                            doc = Document(raw_html)
                            summary_html = doc.summary()
                            summary_text = lxml_html.fromstring(summary_html).text_content()
                            if summary_text and not getattr(article, 'text', None):
                                article.text = summary_text
                                article.title = article.title or doc.short_title()
                                logger.info(f"readability-lxml used for fallback extraction for {url}")
                        except Exception:
                            # Last resort: strip tags to keep something
                            try:
                                stripped = lxml_html.fromstring(raw_html).text_content()
                                if stripped and not getattr(article, 'text', None):
                                    article.text = stripped
                                    logger.info(f"Plain text fallback used for {url}")
                            except Exception:
                                pass
                except Exception:
                    # Any failure here should not crash extraction — will rely on other fallbacks later
                    logger.debug(f"Fallback extraction attempts failed for {url}")

            # If after all fallbacks we still have nothing, return cached result if available
            if not getattr(article, 'text', None) and cache_key in extraction_cache:
                cached = extraction_cache[cache_key]
                if time.time() - cached.get('cached_at', 0) < CACHE_TTL * 24:  # Extend cache for failed requests
                    logger.info(f"Returning stale cached extraction for {url}")
                    return cached['data']
            # otherwise continue — later code will try other fallbacks (AMP, Playwright, etc.)
        
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
        
        # Prefer the top_node (main article node) HTML for better structure
        source_html = None
        try:
            if getattr(article, 'top_node', None):
                    try:
                        source_html = lxml_html.tostring(article.top_node, encoding='unicode', method='html')
                    except Exception:
                        source_html = str(article.top_node)
            elif getattr(article, 'html', None):
                source_html = article.html
            elif getattr(article, 'text', None):
                # Wrap plain text into paragraphs to improve markdown conversion
                text = article.text.strip()
                if text:
                    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
                    source_html = ''.join(f'<p>{p}</p>' for p in paragraphs)
        except Exception:
            source_html = article.text or article.html or ''

        # If newspaper extraction produced nothing useful, try fetching raw HTML
        # and locate article containers or JSON-LD. This helps with sites that
        # serve different content to automated downloaders.
        if not source_html or (not article.text and not article.title):
            try:
                raw_html = article.html or ''
                if not raw_html:
                    # fetch using httpx with a real browser UA
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    }
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.get(url, headers=headers, follow_redirects=True)
                        resp.raise_for_status()
                        raw_html = resp.text

                if raw_html:
                    doc = lxml_html.fromstring(raw_html)

                    # AMP fallback: look for an AMP URL which often contains server-rendered article body
                    try:
                        from urllib.parse import urljoin

                        found = False
                        amp_url = None

                        # <link rel="amphtml" href="...">
                        link_amp = doc.xpath('//link[@rel="amphtml"]')
                        if link_amp:
                            amp_href = link_amp[0].get('href')
                            if amp_href:
                                amp_url = urljoin(url, amp_href)

                        # Some pages expose an amphtml meta tag
                        if not amp_url:
                            meta_amp = doc.xpath('//meta[@name="amphtml"]')
                            if meta_amp:
                                amp_href = meta_amp[0].get('content')
                                if amp_href:
                                    amp_url = urljoin(url, amp_href)

                        # If not explicit, try adding ?amp=true to the original URL as a last-ditch
                        if not amp_url:
                            parsed = urlparse(url)
                            if parsed.query == '':
                                amp_guess = f"{url}?amp=true"
                            else:
                                amp_guess = f"{url}&amp=true"
                            amp_url = amp_guess

                        # Try fetching AMP page if we have an amp_url
                        if amp_url:
                            try:
                                async with httpx.AsyncClient(timeout=30.0) as client:
                                    headers = {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                    }
                                    amp_resp = await client.get(amp_url, headers=headers, follow_redirects=True)
                                    if amp_resp.status_code == 200 and amp_resp.text:
                                        try:
                                            amp_doc = lxml_html.fromstring(amp_resp.text)
                                        except Exception:
                                            amp_doc = None

                                        if amp_doc is not None:
                                            # AMP pages often use <article> or <main> with markup we can reuse
                                            amp_nodes = amp_doc.xpath('//article | //main | //*[@id="article-body"]')
                                            for n in amp_nodes:
                                                node_html = lxml_html.tostring(n, encoding='unicode', method='html')
                                                if node_html and len(node_html.strip()) > 50:
                                                    source_html = node_html
                                                    found = True
                                                    logger.info(f"AMP fallback used for {url} -> {amp_url}")
                                                    break

                                        # if no article node, but amp_resp contains body text, set as source
                                        if not found and amp_resp.text and len(amp_resp.text) > 500:
                                            source_html = amp_resp.text
                                            found = True
                                            logger.info(f"AMP raw response used for {url} -> {amp_url}")
                            except Exception:
                                # ignore AMP fetch failures and continue other fallbacks
                                pass
                    except Exception:
                        # Defensive: don't break main flow on AMP detection errors
                        pass

                    # Try to find common article containers
                    selectors = [
                        '//article',
                        '//*[@id="article-body"]',
                        '//*[@id="article-body-main"]',
                        '//*[contains(@class, "article-body")]',
                        '//*[contains(@class, "article") and .//p]',
                    ]
                    found = False
                    for sel in selectors:
                        nodes = doc.xpath(sel)
                        if nodes:
                            # prefer the first node with text
                            for n in nodes:
                                node_html = lxml_html.tostring(n, encoding='unicode', method='html')
                                if node_html and len(node_html.strip()) > 50:
                                    source_html = node_html
                                    found = True
                                    break
                            if found:
                                logger.info(f"Found article container with selector {sel} for {url}")
                                break

                    # If still not found, try JSON-LD scripts to get articleBody
                    if not found:
                        ld_scripts = doc.xpath('//script[@type="application/ld+json"]')
                        for s in ld_scripts:
                            try:
                                ld_text = s.text
                                if not ld_text:
                                    continue
                                parsed = json.loads(ld_text)
                                items = parsed if isinstance(parsed, list) else [parsed]
                                for item in items:
                                    # handle nested @graph entries
                                    if isinstance(item, dict) and '@graph' in item and isinstance(item['@graph'], list):
                                        for g in item['@graph']:
                                            if isinstance(g, dict):
                                                items.append(g)
                                for item in items:
                                    typ = item.get('@type') if isinstance(item, dict) else None
                                    if isinstance(typ, list):
                                        typ = ' '.join(typ)
                                    if isinstance(item, dict) and (('Article' in str(typ)) or item.get('articleBody') or item.get('headline')):
                                        title = item.get('headline') or item.get('name') or article.title or ''
                                        body = item.get('articleBody') or item.get('description') or ''
                                        if body:
                                            source_html = f"<article><h1>{title}</h1><div>{body}</div></article>"
                                            found = True
                                            logger.info(f"JSON-LD fallback used for {url}")
                                            break
                            except Exception:
                                continue
                        
            except Exception as e:
                logger.warning(f"Raw fetch / fallback parsing failed for {url}: {str(e)}")

        # If we still don't have useful HTML, try a headless-render fallback using Playwright.
        # This helps with JS-heavy sites (Next.js, React) where the article is assembled client-side.
        if not source_html or len((source_html or '').strip()) < 200:
            try:
                try:
                    import importlib
                    pw_mod = importlib.import_module('playwright.async_api')
                    async_playwright = getattr(pw_mod, 'async_playwright', None)
                except Exception:
                    async_playwright = None

                if async_playwright is not None:
                    logger.info(f"Attempting Playwright render fallback for {url}")
                    try:
                        pw = await async_playwright().start()
                        browser = await pw.chromium.launch(headless=True, args=["--no-sandbox"])
                        context = await browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36')
                        page = await context.new_page()
                        await page.goto(url, wait_until='networkidle', timeout=20000)
                        rendered = await page.content()
                        await browser.close()
                        await pw.stop()

                        if rendered and len(rendered) > 500:
                            try:
                                rendered_doc = lxml_html.fromstring(rendered)
                                nodes = rendered_doc.xpath('//article | //main | //*[@id="article-body"]')
                                if nodes:
                                    # prefer the first meaningful node
                                    node_html = lxml_html.tostring(nodes[0], encoding='unicode', method='html')
                                    if node_html and len(node_html.strip()) > 50:
                                        source_html = node_html
                                        logger.info(f"Playwright fallback used for {url}")
                            except Exception:
                                # fallback to using full rendered HTML
                                source_html = rendered
                    except Exception as e:
                        logger.warning(f"Playwright render failed for {url}: {str(e)}")
            except Exception:
                # Playwright not available or other error — ignore and continue
                pass

        markdown_value = html_to_markdown(source_html or '')

        # Produce a cleaned HTML suitable for reader view (preserves images via proxy)
        try:
            # Include images but sanitize and make them lazy-loaded for performance
            reader_html = sanitize_html_for_reader(source_html or '', base_url=url, keep_images=True)
        except Exception:
            reader_html = source_html or ''

        result = {
            "title": article.title or "Untitled",
            "description": article.meta_description or "",
            "content": article.text or "",
            "reader_html": reader_html,
            "markdown": markdown_value,
            "meta_info": meta_info,
            "extracted_at": datetime.datetime.now().isoformat(),
            "success": bool(article.text or source_html)
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
            "markdown": "",
            "meta_info": {},
            "extracted_at": datetime.datetime.now().isoformat(),
            "success": False
        }


@router.post("/extract_markdown")
async def extract_markdown(request: ContentExtractionRequest):
    """Return Markdown for a URL. Uses cache when available, otherwise triggers extraction."""
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
