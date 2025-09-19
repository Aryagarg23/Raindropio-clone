from bs4 import BeautifulSoup
from markdownify import markdownify as md
from urllib.parse import urljoin, quote_plus


def html_to_markdown(html: str) -> str:
    """Sanitize simple HTML and convert to Markdown.

    - Removes scripts, styles, nav, header, footer, aside, noscript
    - Uses markdownify with ATX heading style
    """
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript"]):
        tag.decompose()

    clean_html = str(soup)

    # Convert to markdown; tune options as needed
    markdown = md(clean_html, heading_style="ATX")
    return markdown


def sanitize_html_for_reader(html: str, base_url: str = None, keep_images: bool = False) -> str:
    """Return a cleaned, reader-friendly HTML string.

    - Removes distracting elements (scripts/styles/nav/header/footer/aside/noscript)
    - Resolves relative image URLs against `base_url` when provided
    - Rewrites image `src` to point to the backend image proxy `/content/proxy/image?url=...`
    - Keeps images in the output so reader view remains visual but controlled
    """
    soup = BeautifulSoup(html or "", "lxml")
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "form", "iframe"]):
        tag.decompose()

    # Handle images: by default remove images to keep reader minimal and avoid storing images server-side.
    # If `keep_images` is True, rewrite image `src` to use the `/content/proxy/image` endpoint (deterministic proxy URL).
    for img in soup.find_all('img'):
        if not keep_images:
            img.decompose()
            continue

        src = img.get('src') or img.get('data-src') or ''
        if not src:
            img.decompose()
            continue

        # Resolve relative URLs
        if base_url:
            try:
                resolved = urljoin(base_url, src)
            except Exception:
                resolved = src
        else:
            resolved = src

    # Encode URL for query param (deterministic for a given resolved URL)
    proxied = f"/content/proxy/image?url={quote_plus(resolved)}"
    img['src'] = proxied
    img['data-original-src'] = resolved

    # Add lazy-loading and async decoding to keep reader performant
    img['loading'] = 'lazy'
    img['decoding'] = 'async'

    # Add a subtle fade-in for images when they load
    existing_style = img.get('style', '')
    fade_style = 'opacity:0;transition:opacity .25s ease-in-out;'
    img['style'] = (existing_style + ';' + fade_style).strip(';')
    # Inline onload to set opacity — safe for our controlled reader HTML
    img['onload'] = 'this.style.opacity=1'

    # Return cleaned HTML fragment
    return str(soup)
