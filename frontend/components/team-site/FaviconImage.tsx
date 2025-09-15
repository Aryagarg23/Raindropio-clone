import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'

interface FaviconImageProps {
  url: string
  faviconUrl?: string
  size?: string
}

export const FaviconImage: React.FC<FaviconImageProps> = ({ 
  url, 
  faviconUrl, 
  size = "w-4 h-4" 
}) => {
  const [imgSrc, setImgSrc] = useState(
    faviconUrl || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`
  )
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      // Try Google's favicon service as fallback
      if (imgSrc !== `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`) {
        setImgSrc(`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`)
      } else {
        setHasError(true)
      }
    }
  }

  if (hasError) {
    return <ExternalLink className={`${size} text-grey-accent-600`} />
  }

  return (
    <img
      src={imgSrc}
      alt=""
      className={`${size} object-contain`}
      onError={handleError}
    />
  )
}