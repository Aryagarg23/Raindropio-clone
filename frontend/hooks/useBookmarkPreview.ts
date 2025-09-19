import { useState, useEffect } from 'react';

interface PreviewData {
  url: string;
  imageUrl?: string;
  loading: boolean;
  error?: string;
}

const PREVIEW_CACHE_KEY = 'bookmark_previews_v5';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CachedPreview {
  url: string;
  imageUrl?: string;
  cachedAt: number;
}

function getPreviewCache(): Record<string, CachedPreview> {
  try {
    const stored = localStorage.getItem(PREVIEW_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePreviewCache(cache: Record<string, CachedPreview>): void {
  try {
    localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save preview cache:', error);
  }
}

function extractPreviewImage(html: string, baseUrl: string): string | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try OpenGraph image
  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const imageUrl = ogImage.getAttribute('content');
    if (imageUrl) return resolveUrl(imageUrl, baseUrl);
  }

  // Try Twitter card image
  const twitterImage = doc.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    const imageUrl = twitterImage.getAttribute('content');
    if (imageUrl) return resolveUrl(imageUrl, baseUrl);
  }

  return undefined;
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export function useBookmarkPreview(bookmarkUrl: string) {
  const [preview, setPreview] = useState<PreviewData>(() => {
    // Initialize with placeholder
    const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://127.0.0.1:8000';
    const hostname = (() => {
      try { return new URL(bookmarkUrl).hostname; } catch { return 'example.com'; }
    })();
    const placeholderUrl = `${apiBase.replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent(hostname)}`;
    
    return {
      url: bookmarkUrl,
      imageUrl: placeholderUrl,
      loading: false,
    };
  });

  useEffect(() => {
    if (!bookmarkUrl) return;

    // Check cache first
    const cache = getPreviewCache();
    const cached = cache[bookmarkUrl];

    if (cached && (Date.now() - cached.cachedAt) < CACHE_EXPIRY) {
      // Check if cached imageUrl is properly proxied or is a placeholder
      const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://127.0.0.1:8000';
      const isProxied = cached.imageUrl?.startsWith(`${apiBase.replace(/\/$/, '')}/content/proxy/image`);
      const isPlaceholder = cached.imageUrl?.startsWith(`${apiBase.replace(/\/$/, '')}/api/placeholder`);
      
      if (isProxied || isPlaceholder) {
        setPreview({
          url: bookmarkUrl,
          imageUrl: cached.imageUrl,
          loading: false,
        });
        return;
      }
      // If cached URL is not properly formatted, refetch
    }

    // Fetch preview
    fetchPreview(bookmarkUrl);
  }, [bookmarkUrl]);

  const fetchPreview = async (url: string) => {
    setPreview(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Try to fetch the page HTML directly from the browser.
      // Many sites block cross-origin requests; handle failures gracefully.
      let html: string | null = null;

      try {
        const resp = await fetch(url, { method: 'GET', mode: 'cors' });
        if (resp.ok) {
          html = await resp.text();
        }
      } catch (err) {
        // CORS or network error — we'll fallback below
        html = null;
      }

      let imageUrl: string | undefined;

      if (html) {
        imageUrl = extractPreviewImage(html, url);
        if (imageUrl) {
          // Use image proxy to avoid CORS issues and support more formats
          const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
            ? process.env.NEXT_PUBLIC_API_URL
            : 'http://127.0.0.1:8000';
          imageUrl = `${apiBase.replace(/\/$/, '')}/content/proxy/image?url=${encodeURIComponent(imageUrl)}`;
        }
      }

      // If we didn't get an image from the page (or couldn't fetch due to CORS),
      // construct a placeholder image URL — prefer any server-side placeholder if available,
      // otherwise use a simple SVG data URL.
      if (!imageUrl) {
        // Secondary fallback: request server-side extraction (bypasses CORS).
        try {
          const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
            ? process.env.NEXT_PUBLIC_API_URL
            : 'http://127.0.0.1:8000';
          const extractUrl = `${apiBase.replace(/\/$/, '')}/content/extract`;
          const resp = await fetch(extractUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          if (resp && resp.ok) {
            const json: any = await resp.json();
            const serverImage = json?.meta_info?.image;
            if (serverImage) {
              // Use image proxy to avoid CORS issues and support more formats
              const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
                ? process.env.NEXT_PUBLIC_API_URL
                : 'http://127.0.0.1:8000';
              imageUrl = `${apiBase.replace(/\/$/, '')}/content/proxy/image?url=${encodeURIComponent(serverImage)}`;
            }
          }
        } catch (e) {
          // ignore server fallback errors to keep the hook resilient
        }
      }

      if (!imageUrl) {
        // Final fallback: use server-side placeholder API
        const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== '')
          ? process.env.NEXT_PUBLIC_API_URL
          : 'http://127.0.0.1:8000';
        const hostname = (() => {
          try { return new URL(url).hostname; } catch { return 'example.com'; }
        })();
        imageUrl = `${apiBase.replace(/\/$/, '')}/api/placeholder/400/220?domain=${encodeURIComponent(hostname)}`;
      }

      // Cache and update
      const cache = getPreviewCache();
      cache[url] = { url, imageUrl, cachedAt: Date.now() };
      savePreviewCache(cache);

      setPreview(prev => ({
        ...prev,
        imageUrl,
        loading: false,
      }));

    } catch (error) {
      console.warn('Failed to fetch bookmark preview:', error);
      setPreview(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  return preview;
}
