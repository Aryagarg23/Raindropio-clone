import { useMemo } from 'react'

interface BookmarkLike {
  preview_image?: string | null
  favicon_url?: string | null
  url: string
}

// Returns a preview source and a small flag whether it's a full-width image
export function useBookmarkPreview(bookmark?: BookmarkLike) {
  return useMemo(() => {
    if (!bookmark) return { src: null, isImage: false };

    // 1) If there is a preview image (scraped thumbnail), use that as full image
    if (bookmark.preview_image) {
      return { src: bookmark.preview_image, isImage: true };
    }

    // 2) No preview image: provide a full-width placeholder image derived from the domain
    //    (this gives a nicer visual than just showing the favicon in the large area).
    try {
      const hostname = new URL(bookmark.url).hostname;
      const apiBase = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:8000';
      const placeholder = `${apiBase.replace(/\/$/, '')}/api/placeholder/600/300?domain=${encodeURIComponent(hostname)}`;

      // Simple localStorage cache: key per domain, store url + timestamp
      try {
        const cacheKey = `placeholder:${hostname}`;
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          // 7 day TTL
          if (Date.now() - (parsed.t || 0) < 7 * 24 * 60 * 60 * 1000) {
            return { src: parsed.u || placeholder, isImage: true };
          }
        }
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(cacheKey, JSON.stringify({ u: placeholder, t: Date.now() }));
        }
      } catch (e) {
        // ignore localStorage errors
      }

      return { src: placeholder, isImage: true };
    } catch {
      return { src: null, isImage: false };
    }
  }, [bookmark]);
}

export default useBookmarkPreview;
