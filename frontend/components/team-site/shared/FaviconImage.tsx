import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface FaviconImageProps {
  url: string;
  faviconUrl?: string;
  size?: string;
  className?: string;
}

export const FaviconImage: React.FC<FaviconImageProps> = ({
  url,
  faviconUrl,
  size = "w-4 h-4",
  className = ""
}) => {
  const [faviconSrc, setFaviconSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (faviconUrl) {
      setFaviconSrc(faviconUrl);
      return;
    }

    // Try to construct favicon URL from the bookmark URL
    try {
      const urlObj = new URL(url);
      const siteFavicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
      const googleS2 = `https://s2.googleusercontent.com/s2/favicons?sz=64&domain=${urlObj.hostname}`;
      setFaviconSrc(siteFavicon);

      // Pre-check site favicon by creating an Image to avoid immediate broken img
      const img = new Image();
      img.src = siteFavicon;
      img.onload = () => setFaviconSrc(siteFavicon);
      img.onerror = () => setFaviconSrc(googleS2);
    } catch {
      setHasError(true);
    }
  }, [url, faviconUrl]);

  if (hasError || !faviconSrc) {
    return <ExternalLink className={`${size} text-grey-accent-600 ${className}`} />;
  }

  return (
    <img
      src={faviconSrc}
      alt="favicon"
      className={`${size} ${className}`}
      onError={() => {
        // If the current src was site favicon, try google s2 service before giving up
        try {
          const u = new URL(faviconSrc || '');
          const googleS2 = `https://s2.googleusercontent.com/s2/favicons?sz=64&domain=${u.hostname}`;
          if (faviconSrc && !faviconSrc.includes('s2.googleusercontent.com')) {
            setFaviconSrc(googleS2);
            return;
          }
        } catch (e) {
          // ignore
        }
        setHasError(true);
      }}
      style={{ objectFit: 'contain' }}
    />
  );
};