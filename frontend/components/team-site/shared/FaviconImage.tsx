import React, { useState } from 'react';
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
  const [imgSrc, setImgSrc] = useState(() => {
    try {
      const hostname = new URL(url).hostname;
      return faviconUrl || `https://favicon.yandex.net/favicon/${hostname}`;
    } catch {
      return null;
    }
  });
  const [fallbackCount, setFallbackCount] = useState(0);

  const handleError = () => {
    try {
      const hostname = new URL(url).hostname;

      if (fallbackCount === 0) {
        // Try Google's favicon service
        setImgSrc(`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`);
        setFallbackCount(1);
      } else if (fallbackCount === 1) {
        // Try DuckDuckGo's favicon service
        setImgSrc(`https://icons.duckduckgo.com/ip3/${hostname}.ico`);
        setFallbackCount(2);
      } else if (fallbackCount === 2) {
        // Try direct favicon from domain
        setImgSrc(`https://${hostname}/favicon.ico`);
        setFallbackCount(3);
      } else {
        // All failed, show default icon
        setImgSrc(null);
        setFallbackCount(4);
      }
    } catch {
      setImgSrc(null);
      setFallbackCount(4);
    }
  };

  if (!imgSrc || fallbackCount >= 4) {
    return <ExternalLink className={`${size} text-grey-accent-600 ${className}`} />;
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className={`${size} object-contain ${className}`}
      onError={handleError}
    />
  );
};