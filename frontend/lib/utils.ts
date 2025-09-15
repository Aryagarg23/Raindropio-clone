import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a fallback thumbnail URL for bookmarks without images
 * Creates a text-based thumbnail using the domain name
 */
export function generateFallbackThumbnail(url: string, title?: string): string {
  try {
    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Use first part of domain or title initial
    const text = title ? title.charAt(0).toUpperCase() : domain.split('.')[0].toUpperCase();
    
    // Generate a simple SVG with the text
    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#f3f4f6"/>
        <text x="200" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
        <text x="200" y="140" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
          ${domain}
        </text>
      </svg>
    `.trim();
    
    // Encode SVG as data URL
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml;charset=UTF-8,${encodedSvg}`;
  } catch (error) {
    // Fallback for invalid URLs
    return `data:image/svg+xml;charset=UTF-8,<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="200" fill="#f3f4f6"/><text x="200" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">🔗</text></svg>`;
  }
}