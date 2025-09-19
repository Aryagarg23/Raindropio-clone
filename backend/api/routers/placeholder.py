from fastapi import APIRouter, Response
from typing import Optional
import html
import hashlib
from pathlib import Path
import os

router = APIRouter(prefix="/api", tags=["placeholder"])


def _domain_to_initials(domain: Optional[str]) -> str:
    if not domain:
        return "?"
    # strip protocol/paths if passed
    try:
        # take only hostname portion if a full url was passed
        if '://' in domain:
            from urllib.parse import urlparse
            domain = urlparse(domain).hostname or domain
    except Exception:
        pass
    # normalize: remove port and any path segments
    domain = domain.lower().split(':')[0]
    domain = domain.split('/')[0]
    domain = domain.replace('www.', '')
    parts = [p for p in domain.split('.') if p]
    # compute main domain (last two labels) to make bruh.com and www.bruh.com same
    if len(parts) >= 2:
        main = '.'.join(parts[-2:])
    else:
        main = domain
    # use up to first 2 chars of the main label
    name = main.split('.')[0]
    initials = ''.join([c for c in name if c.isalnum()])[:2].upper()
    return initials or main[:2].upper()


def _color_from_domain(domain: Optional[str]) -> str:
    if not domain:
        return '#6b7280'
    # normalize domain to main domain (strip subdomains/ports)
    try:
        d = domain.lower().split(':')[0]
        d = d.split('/')[0]
        d = d.replace('www.', '')
        parts = [p for p in d.split('.') if p]
        if len(parts) >= 2:
            main = '.'.join(parts[-2:])
        else:
            main = d
    except Exception:
        main = domain
    h = int(hashlib.sha1(main.encode('utf-8')).hexdigest(), 16) % 360
    # choose a pleasant HSL color with good contrast
    return f'hsl({h} 70% 45%)'


@router.get('/placeholder/{w}/{h}')
async def placeholder_svg(w: int, h: int, domain: Optional[str] = None):
    """Return a simple text-based SVG placeholder image for a domain.

    Example: /api/placeholder/600/300?domain=example.com
    """
    initials = html.escape(_domain_to_initials(domain))
    bg = _color_from_domain(domain or '')
    # font sizing tuned to image height
    font_size = max(24, int(min(w, h) * 0.17))

    # Use a filesystem cache shared across processes/teams so everyone reuses the same placeholder
    try:
        # normalize main domain (strip path/port/subdomain)
        md = domain or ''
        if '://' in md:
            from urllib.parse import urlparse
            md = urlparse(md).hostname or md
        md = md.lower().split(':')[0].split('/')[0].replace('www.', '')
        parts = [p for p in md.split('.') if p]
        if len(parts) >= 2:
            main_domain = '.'.join(parts[-2:])
        else:
            main_domain = md
    except Exception:
        main_domain = domain or 'unknown'

    cache_dir = Path(__file__).resolve().parents[3] / 'cache' / 'placeholders'
    cache_dir.mkdir(parents=True, exist_ok=True)
    # sanitize filename
    safe = ''.join([c if c.isalnum() or c in ('-', '_', '.') else '-' for c in main_domain])
    filename = f"{w}x{h}_{safe}.svg"
    filepath = cache_dir / filename

    now = __import__('time').time()
    ttl = 7 * 24 * 60 * 60

    if filepath.exists() and (now - filepath.stat().st_mtime) < ttl:
        svg = filepath.read_text()
    else:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
  <rect width="100%" height="100%" fill="{bg}" />
  <g fill="#ffffff" fill-opacity="0.92">
    <text x="50%" y="50%" dy="0.35em" font-family="Inter, Roboto, system-ui, -apple-system, 'Segoe UI', Arial" font-size="{font_size}" text-anchor="middle">{initials}</text>
  </g>
</svg>'''
        try:
            filepath.write_text(svg)
        except Exception:
            # if writing fails, ignore and still return the SVG
            pass

    headers = {
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400'
    }
    return Response(content=svg, media_type='image/svg+xml', headers=headers)
