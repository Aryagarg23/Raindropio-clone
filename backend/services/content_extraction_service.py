"""
Enhanced content extraction service using readability-lxml and other established libraries
"""
import logging
import time
from typing import Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import asyncio
import httpx
from readability import parse
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class ContentExtractionService:
    """Service for extracting readable content from web pages using established libraries"""
    
    def __init__(self):
        self.session = None
        
    async def __aenter__(self):
        self.session = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            follow_redirects=True
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.aclose()
    
    async def extract_content(self, url: str) -> Dict[str, Any]:
        """
        Extract readable content from a URL using readability-lxml
        
        Args:
            url: The URL to extract content from
            
        Returns:
            Dict containing extracted content information
        """
        try:
            logger.info(f"Extracting content from {url}")
            
            if not self.session:
                raise RuntimeError("ContentExtractionService must be used as async context manager")
            
            # Fetch the page
            response = await self.session.get(url)
            response.raise_for_status()
            
            html_content = response.text
            base_url = str(response.url)
            
            # Parse with readability
            article = parse(html_content)
            
            # Extract main content
            title = article.title
            readable_content = article.content
            
            # If readability failed to extract content, try fallback methods
            if not readable_content or len(readable_content.strip()) < 100:
                logger.warning(f"Readability extraction failed for {url}, trying fallback")
                readable_content = await self._fallback_extraction(html_content, base_url)
            
            # Clean and process the content for better markdown conversion
            cleaned_content = self._clean_content_for_markdown(readable_content, base_url)
            
            # Extract metadata
            metadata = self._extract_metadata(html_content, title, base_url)
            
            # Convert to markdown with proper image handling
            markdown_content = self._html_to_markdown_with_images(cleaned_content, base_url)
            
            return {
                "title": title or "Untitled",
                "description": metadata.get('description', ''),
                "content": self._strip_html(readable_content),
                "reader_html": cleaned_content,
                "markdown": markdown_content,
                "meta_info": metadata,
                "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "success": bool(readable_content and len(readable_content.strip()) > 50)
            }
            
        except Exception as e:
            logger.error(f"Content extraction failed for {url}: {str(e)}")
            return {
                "title": "",
                "description": "",
                "content": "",
                "reader_html": "",
                "markdown": "",
                "meta_info": {},
                "extracted_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "success": False
            }
    
    async def _fallback_extraction(self, html_content: str, base_url: str) -> str:
        """Fallback content extraction using BeautifulSoup when readability fails"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'form', 'iframe']):
                element.decompose()
            
            # Try to find main content areas
            content_selectors = [
                'article',
                'main',
                '[role="main"]',
                '.content',
                '.post-content',
                '.entry-content',
                '.article-content',
                '#content',
                '#main',
                '.main-content'
            ]
            
            for selector in content_selectors:
                content_element = soup.select_one(selector)
                if content_element and len(content_element.get_text().strip()) > 200:
                    return str(content_element)
            
            # If no main content found, try to get all paragraphs
            paragraphs = soup.find_all('p')
            if paragraphs and len(' '.join([p.get_text() for p in paragraphs])) > 200:
                content_div = soup.new_tag('div')
                for p in paragraphs:
                    content_div.append(p)
                return str(content_div)
            
            # Last resort: return body content
            body = soup.find('body')
            if body:
                return str(body)
            
            return html_content
            
        except Exception as e:
            logger.error(f"Fallback extraction failed: {str(e)}")
            return html_content
    
    def _clean_content_for_markdown(self, html_content: str, base_url: str) -> str:
        """Clean HTML content specifically for better markdown conversion"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Remove unwanted elements but preserve structure
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript', 'form', 'iframe', 'button', 'input', 'select', 'textarea']):
                element.decompose()
            
            # Fix relative URLs
            for tag in soup.find_all(['a', 'img', 'link']):
                for attr in ['href', 'src']:
                    if tag.get(attr):
                        tag[attr] = urljoin(base_url, tag[attr])
            
            # Images will be handled later in _html_to_markdown_with_images
            # Just ensure they have proper attributes for now
            for img in soup.find_all('img'):
                img['loading'] = 'lazy'
                img['decoding'] = 'async'
            
            # Ensure proper structure for markdown conversion
            self._ensure_markdown_friendly_structure(soup)
            
            return str(soup)
            
        except Exception as e:
            logger.error(f"Content cleaning for markdown failed: {str(e)}")
            return html_content
    
    def _ensure_markdown_friendly_structure(self, soup):
        """Ensure HTML structure is markdown-friendly"""
        try:
            # Convert divs with only text to paragraphs
            for div in soup.find_all('div'):
                if div.get_text(strip=True) and not div.find(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'figure', 'img', 'a']):
                    text = div.get_text(strip=True)
                    if len(text) > 20:  # Only convert substantial text
                        # Split on natural breaks
                        if '\n\n' in text:
                            parts = text.split('\n\n')
                        else:
                            parts = [text]
                        
                        container = soup.new_tag('div')
                        for part in parts:
                            if part.strip():
                                p = soup.new_tag('p')
                                p.string = part.strip()
                                container.append(p)
                        div.replace_with(container)
            
            # Ensure headings have proper hierarchy
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for heading in headings:
                text = heading.get_text(strip=True)
                if text and len(text) > 3:  # Valid heading
                    # Clean up heading text
                    heading.string = text
                else:
                    # Convert invalid heading to paragraph
                    p = soup.new_tag('p')
                    p.string = text
                    heading.replace_with(p)
            
            # Ensure lists are properly structured
            for ul in soup.find_all('ul'):
                if not ul.find('li'):
                    # Convert ul without li to paragraph
                    text = ul.get_text(strip=True)
                    if text:
                        p = soup.new_tag('p')
                        p.string = text
                        ul.replace_with(p)
            
            for ol in soup.find_all('ol'):
                if not ol.find('li'):
                    # Convert ol without li to paragraph
                    text = ol.get_text(strip=True)
                    if text:
                        p = soup.new_tag('p')
                        p.string = text
                        ol.replace_with(p)
            
            # Ensure blockquotes have content
            for blockquote in soup.find_all('blockquote'):
                if not blockquote.get_text(strip=True):
                    blockquote.decompose()
            
        except Exception as e:
            logger.error(f"Failed to ensure markdown-friendly structure: {str(e)}")
    
    def _clean_content(self, html_content: str, base_url: str) -> str:
        """Clean and process HTML content for reader view"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            
            # Fix relative URLs
            for tag in soup.find_all(['a', 'img', 'link']):
                for attr in ['href', 'src']:
                    if tag.get(attr):
                        tag[attr] = urljoin(base_url, tag[attr])
            
            # Handle images - make them lazy-loaded and proxy them
            for img in soup.find_all('img'):
                src = img.get('src')
                if src:
                    # Proxy image through our backend
                    img['src'] = f"/content/proxy/image?url={src}"
                    img['loading'] = 'lazy'
                    img['decoding'] = 'async'
                    
                    # Add fade-in effect
                    img['style'] = 'opacity:0;transition:opacity .25s ease-in-out;'
                    img['onload'] = 'this.style.opacity=1'
            
            # Remove any remaining problematic elements
            for element in soup(['script', 'style', 'iframe', 'object', 'embed']):
                element.decompose()
            
            # Add reader-friendly styling
            content_div = soup.new_tag('div', **{
                'class': 'reader-content',
                'style': 'max-width: 800px; margin: 0 auto; padding: 20px; font-family: Georgia, serif; line-height: 1.6; color: #333;'
            })
            
            # Move all content into the styled div
            for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'li', 'img', 'figure', 'figcaption']):
                content_div.append(element)
            
            return str(content_div)
            
        except Exception as e:
            logger.error(f"Content cleaning failed: {str(e)}")
            return html_content
    
    def _extract_metadata(self, html_content: str, title: str, base_url: str) -> Dict[str, Any]:
        """Extract metadata from HTML"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            metadata = {}
            
            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                metadata['description'] = meta_desc.get('content', '')
            
            # Extract author
            meta_author = soup.find('meta', attrs={'name': 'author'})
            if meta_author:
                metadata['author'] = meta_author.get('content', '')
            
            # Extract publication date
            meta_date = soup.find('meta', attrs={'property': 'article:published_time'})
            if meta_date:
                metadata['published_date'] = meta_date.get('content', '')
            
            # Extract site name
            meta_site = soup.find('meta', attrs={'property': 'og:site_name'})
            if meta_site:
                metadata['site_name'] = meta_site.get('content', '')
            
            # Extract favicon
            favicon = soup.find('link', attrs={'rel': 'icon'}) or soup.find('link', attrs={'rel': 'shortcut icon'})
            if favicon:
                favicon_url = favicon.get('href', '')
                metadata['favicon'] = urljoin(base_url, favicon_url)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Metadata extraction failed: {str(e)}")
            return {}
    
    def _html_to_markdown(self, html_content: str) -> str:
        """Convert HTML to well-formatted markdown"""
        try:
            from markdownify import markdownify as md
            
            # Configure markdown conversion with better options
            markdown_options = {
                'heading_style': 'ATX',  # Use # ## ### style
                'bullets': '-',          # Use - for unordered lists
                'convert': ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'hr'],
                'escape_misc': False,
                'escape_links': False,
                'escape_images': False
            }
            
            markdown = md(html_content, **markdown_options)
            
            # Post-process the markdown for better formatting
            markdown = self._enhance_markdown_formatting(markdown)
            
            return markdown
            
        except Exception as e:
            logger.error(f"Markdown conversion failed: {str(e)}")
            return ""
    
    def _html_to_markdown_with_images(self, html_content: str, base_url: str) -> str:
        """Convert HTML to markdown with proper image URL handling"""
        try:
            from markdownify import markdownify as md
            from urllib.parse import urljoin, quote_plus
            
            # Configure markdown conversion with better options
            markdown_options = {
                'heading_style': 'ATX',  # Use # ## ### style
                'bullets': '-',          # Use - for unordered lists
                'convert': ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'hr'],
                'escape_misc': False,
                'escape_links': False,
                'escape_images': False
            }
            
            # First, preprocess images to use our proxy
            soup = BeautifulSoup(html_content, 'lxml')
            for img in soup.find_all('img'):
                src = img.get('src')
                if src:
                    # Skip data URLs - they're already fine
                    if src.startswith('data:'):
                        img['loading'] = 'lazy'
                        img['decoding'] = 'async'
                        continue
                    
                    # Make sure it's an absolute URL for direct CDN access
                    if src.startswith('//'):
                        src = f"https:{src}"
                    elif src.startswith('/'):
                        src = urljoin(base_url, src)
                    elif not src.startswith(('http://', 'https://')):
                        src = urljoin(base_url, src)
                    
                    # Use the original URL directly first, with proxy as fallback
                    # The frontend react-image component can handle multiple sources
                    img['src'] = src
                    img['data-fallback-src'] = f"/content/proxy/image?url={quote_plus(src)}"
                    img['loading'] = 'lazy'
                    img['decoding'] = 'async'
            
            # Also fix relative URLs in links
            for a in soup.find_all('a'):
                href = a.get('href')
                if href:
                    if href.startswith('//'):
                        a['href'] = f"https:{href}"
                    elif href.startswith('/'):
                        a['href'] = urljoin(base_url, href)
                    elif not href.startswith(('http://', 'https://', 'mailto:', 'tel:', '#')):
                        a['href'] = urljoin(base_url, href)
            
            # Convert to markdown
            markdown = md(str(soup), **markdown_options)
            
            # Post-process the markdown for better formatting
            markdown = self._enhance_markdown_formatting(markdown)
            
            return markdown
            
        except Exception as e:
            logger.error(f"Markdown conversion with images failed: {str(e)}")
            return self._html_to_markdown(html_content)
    
    def _enhance_markdown_formatting(self, markdown: str) -> str:
        """Enhance markdown formatting for better readability"""
        try:
            import re
            
            lines = markdown.split('\n')
            enhanced_lines = []
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Skip empty lines but preserve them for spacing
                if not line:
                    enhanced_lines.append('')
                    continue
                
                # Ensure proper spacing around headings
                if line.startswith('#'):
                    # Add space before heading if previous line is not empty
                    if enhanced_lines and enhanced_lines[-1].strip():
                        enhanced_lines.append('')
                    enhanced_lines.append(line)
                    # Add space after heading
                    if i + 1 < len(lines) and lines[i + 1].strip():
                        enhanced_lines.append('')
                    continue
                
                # Ensure proper spacing around lists
                if line.startswith(('- ', '* ', '+ ', '1. ', '2. ', '3. ', '4. ', '5. ')):
                    # Add space before list if previous line is not empty and not a list
                    if enhanced_lines and enhanced_lines[-1].strip() and not enhanced_lines[-1].startswith(('- ', '* ', '+ ', '1. ', '2. ', '3. ', '4. ', '5. ')):
                        enhanced_lines.append('')
                    enhanced_lines.append(line)
                    continue
                
                # Ensure proper spacing around blockquotes
                if line.startswith('>'):
                    # Add space before blockquote if previous line is not empty and not a blockquote
                    if enhanced_lines and enhanced_lines[-1].strip() and not enhanced_lines[-1].startswith('>'):
                        enhanced_lines.append('')
                    enhanced_lines.append(line)
                    continue
                
                # Ensure proper spacing around code blocks
                if line.startswith('```') or line.startswith('~~~'):
                    # Add space before code block if previous line is not empty
                    if enhanced_lines and enhanced_lines[-1].strip():
                        enhanced_lines.append('')
                    enhanced_lines.append(line)
                    continue
                
                # Regular paragraph - ensure it's not too long
                if len(line) > 100 and not line.startswith('![') and not line.startswith('['):
                    # Try to break long paragraphs at natural points
                    words = line.split()
                    if len(words) > 15:
                        # Break into chunks of ~15 words
                        chunks = []
                        current_chunk = []
                        for word in words:
                            current_chunk.append(word)
                            if len(current_chunk) >= 15:
                                chunks.append(' '.join(current_chunk))
                                current_chunk = []
                        if current_chunk:
                            chunks.append(' '.join(current_chunk))
                        
                        # Add the chunks with proper spacing
                        for j, chunk in enumerate(chunks):
                            if j > 0:
                                enhanced_lines.append('')
                            enhanced_lines.append(chunk)
                        continue
                
                # Regular line
                enhanced_lines.append(line)
            
            # Join lines and clean up multiple empty lines
            result = '\n'.join(enhanced_lines)
            result = re.sub(r'\n\s*\n\s*\n', '\n\n', result)  # Max 2 consecutive empty lines
            
            # Fix malformed links and improve link formatting
            result = self._fix_link_formatting(result)
            
            return result.strip()
            
        except Exception as e:
            logger.error(f"Markdown enhancement failed: {str(e)}")
            return markdown
    
    def _fix_link_formatting(self, markdown: str) -> str:
        """Fix malformed links and improve link formatting"""
        try:
            import re
            
            # Fix links that have formatting inside the link text like [*text*](url)
            # Convert [*text*](url) to [text](url) and make the text italic outside the link
            def fix_formatted_links(match):
                link_text = match.group(1)
                url = match.group(2)
                
                # Remove formatting from inside the link text
                clean_text = re.sub(r'\*([^*]+)\*', r'\1', link_text)  # Remove bold/italic
                clean_text = re.sub(r'_([^_]+)_', r'\1', clean_text)   # Remove underscore italic
                clean_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_text)  # Remove bold
                
                # If the original had formatting, add it outside the link
                if '*' in link_text or '_' in link_text:
                    if re.search(r'\*\*([^*]+)\*\*', link_text):
                        return f"**[{clean_text}]({url})**"
                    elif re.search(r'\*([^*]+)\*', link_text):
                        return f"*[{clean_text}]({url})*"
                    elif re.search(r'_([^_]+)_', link_text):
                        return f"_[{clean_text}]({url})_"
                
                return f"[{clean_text}]({url})"
            
            # Apply the fix to all markdown links
            markdown = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', fix_formatted_links, markdown)
            
            # Fix links that might have extra spaces or malformed URLs
            markdown = re.sub(r'\[([^\]]+)\]\(\s*([^)]+)\s*\)', r'[\1](\2)', markdown)
            
            # Fix links where the URL might be split across lines
            markdown = re.sub(r'\[([^\]]+)\]\(\s*\n\s*([^)]+)\s*\)', r'[\1](\2)', markdown)
            
            # Clean up any remaining malformed links
            markdown = re.sub(r'\[([^\]]*)\]\(\)', r'\1', markdown)  # Remove empty links
            markdown = re.sub(r'\[\]\([^)]+\)', '', markdown)  # Remove links with empty text
            
            return markdown
            
        except Exception as e:
            logger.error(f"Link formatting fix failed: {str(e)}")
            return markdown
    
    def _strip_html(self, html_content: str) -> str:
        """Strip HTML tags to get plain text"""
        try:
            soup = BeautifulSoup(html_content, 'lxml')
            return soup.get_text()
        except Exception as e:
            logger.error(f"HTML stripping failed: {str(e)}")
            return html_content
