import React from 'react';
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { ExternalLink } from "lucide-react";
import { FaviconImage } from "../shared/FaviconImage";

const getDomain = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || url;
  }
};

interface Bookmark {
  id: string;
  title?: string;
  description?: string;
  url: string;
  collection_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  favicon_url?: string;
  preview_image?: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  editingTags: string | null;
  tagInput: string;
  onBookmarkClick: (bookmark: Bookmark) => void;
  onUpdateTags: (bookmarkId: string, tags: string[]) => void;
  onSetEditingTags: (bookmarkId: string | null) => void;
  onSetTagInput: (tagInput: string) => void;
}

function BookmarkCard({
  bookmark,
  editingTags,
  tagInput,
  onBookmarkClick,
  onUpdateTags,
  onSetEditingTags,
  onSetTagInput
}: BookmarkCardProps) {
  const updateBookmarkTags = (bookmarkId: string, newTags: string[]) => {
    onUpdateTags(bookmarkId, newTags);
  };

  // Generate fallback placeholder
  const getPlaceholderUrl = (url: string) => {
    const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
    // Create a simple SVG placeholder
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#f3f4f6"/><text x="200" y="110" font-family="Arial,sans-serif" font-size="24" font-weight="bold" fill="#9ca3af" text-anchor="middle">${domain}</text></svg>`;
    try {
      // Prefer browser btoa when available
      if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      }
      // Server-side: use Buffer
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    } catch (e) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };

  const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

  const getDomain = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0] || url;
    }
  };

  return (
    <Card compact
      className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer"
      onClick={() => onBookmarkClick(bookmark)}
    >
      <div className="aspect-video relative overflow-hidden bg-muted rounded-t-xl">
        <img
          src={imageSrc}
          alt={bookmark.title || bookmark.url}
          className="block w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 rounded-t-xl"
          style={{ borderTopLeftRadius: '0.75rem', borderTopRightRadius: '0.75rem' }}
          data-debug-src={imageSrc}
          onLoad={(e) => { console.debug('BookmarkGrid image loaded', bookmark.id, (e.target as HTMLImageElement).src); }}
          onError={(e) => {
            console.warn('BookmarkGrid image error', bookmark.id, (e.target as HTMLImageElement).src);
            const target = e.target as HTMLImageElement;
            target.src = getPlaceholderUrl(bookmark.url);
          }}
        />
        {/* Favicon overlay - bottom-left */}
        <div className="absolute bottom-2 left-2">
          <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
            <FaviconImage
              url={bookmark.url}
              faviconUrl={bookmark.favicon_url}
              size="w-5 h-5"
            />
          </div>
        </div>
        {/* Domain bubble - bottom-right */}
        <div className="absolute bottom-2 right-2">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 hover:bg-white text-grey-accent-700 text-xs rounded-full shadow transition">
            <span className="truncate max-w-[6rem]">{getDomain(bookmark.url)}</span>
            <ExternalLink className="w-3 h-3 text-grey-accent-500" />
          </a>
        </div>
        {/* tags now rendered in CardContent so they share title padding */}
      </div>
      <CardContent className="p-4">
        {/* Tags row placed into the gap between image and title; shares same left/right padding as title */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="-mt-6 mb-2">
            <div onClick={(e) => e.stopPropagation()} className="flex flex-wrap items-center gap-2">
              {bookmark.tags.map((tag, index) => (
                <span key={tag + index} className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          {bookmark.title || bookmark.url}
        </h3>
        {bookmark.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {bookmark.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-grey-accent-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-grey-accent-600">{new Date(bookmark.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  viewMode: "grid" | "list";
  editingTags: string | null;
  tagInput: string;
  onBookmarkClick: (bookmark: Bookmark) => void;
  onUpdateTags: (bookmarkId: string, tags: string[]) => void;
  onSetEditingTags: (bookmarkId: string | null) => void;
  onSetTagInput: (tagInput: string) => void;
  gridColsClass?: string; // e.g. 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  listColsClass?: string; // e.g. 'grid-cols-1 sm:grid-cols-2' to render list as grid
}

export function BookmarkGrid({
  bookmarks,
  viewMode,
  editingTags,
  tagInput,
  onBookmarkClick,
  onUpdateTags,
  onSetEditingTags,
  onSetTagInput,
  gridColsClass,
  listColsClass
}: BookmarkGridProps) {
  const updateBookmarkTags = (bookmarkId: string, newTags: string[]) => {
    onUpdateTags(bookmarkId, newTags);
  };

  if (viewMode === "grid") {
    const gridClass = gridColsClass || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return (
      <div className={`grid gap-4 ${gridClass}`}>
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            editingTags={editingTags}
            tagInput={tagInput}
            onBookmarkClick={onBookmarkClick}
            onUpdateTags={onUpdateTags}
            onSetEditingTags={onSetEditingTags}
            onSetTagInput={onSetTagInput}
          />
        ))}
      </div>
    );
  }
  // List view: optionally render as a grid with listColsClass, otherwise fall back to single-column list
  const listClass = listColsClass || '';
  if (listClass) {
    return (
      <div className={`grid gap-4 ${listClass}`}>
        {bookmarks.map((bookmark) => {
        const getPlaceholderUrl = (url: string) => {
          const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="#f3f4f6"/><text x="32" y="28" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#9ca3af" text-anchor="middle">${domain}</text></svg>`;
          try {
            if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
              return `data:image/svg+xml;base64,${btoa(svg)}`;
            }
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
          } catch {
            return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          }
        };

        const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

        return (
          <div
            key={bookmark.id}
            onClick={() => onBookmarkClick(bookmark)}
            className="relative flex items-center gap-4 bg-white border border-grey-accent-200 rounded-xl p-3 hover:shadow-sm cursor-pointer"
          >
            <div className="relative flex-shrink-0">
              <img
                src={imageSrc}
                alt={bookmark.title || bookmark.url}
                className="w-20 h-12 object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getPlaceholderUrl(bookmark.url);
                }}
              />
              <div className="absolute -bottom-1 -left-1">
                <div className="w-6 h-6 rounded bg-white shadow-md flex items-center justify-center border border-grey-accent-200">
                  <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-4 h-4" />
                </div>
              </div>
              {/* domain bubble removed for list view - grid-only bubble handled in grid cards */}
              {/* image-level overlay removed; card-level overlay added below */}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate text-grey-accent-900">{bookmark.title || bookmark.url}</h3>
              {bookmark.description && (
                <p className="text-xs text-muted-foreground truncate">{bookmark.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-grey-accent-600 mt-2">
                <span className="font-medium">{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    {bookmark.tags.map((tag: string, i) => (
                      <span
                        key={tag + i}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-full flex items-end">
              <div className="text-xs text-grey-accent-600">{new Date(bookmark.created_at).toLocaleDateString()}</div>
            </div>
            {/* card-level redirect button removed; domain bubble on image handles redirect */}
          </div>
        );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => {
        const getPlaceholderUrl = (url: string) => {
          const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="#f3f4f6"/><text x="32" y="28" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#9ca3af" text-anchor="middle">${domain}</text></svg>`;
          try {
            if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
              return `data:image/svg+xml;base64,${btoa(svg)}`;
            }
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
          } catch {
            return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          }
        };

        const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

        return (
          <div
            key={bookmark.id}
            onClick={() => onBookmarkClick(bookmark)}
            className="flex items-center gap-4 bg-white border border-grey-accent-200 rounded-xl p-3 hover:shadow-sm cursor-pointer"
          >
            <div className="relative flex-shrink-0">
              <img
                src={imageSrc}
                alt={bookmark.title || bookmark.url}
                className="w-20 h-12 object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getPlaceholderUrl(bookmark.url);
                }}
              />
              <div className="absolute -bottom-1 -left-1">
                <div className="w-6 h-6 rounded bg-white shadow-md flex items-center justify-center border border-grey-accent-200">
                  <FaviconImage url={bookmark.url} faviconUrl={bookmark.favicon_url} size="w-4 h-4" />
                </div>
              </div>
              {/* domain bubble removed for list view - grid-only bubble handled in grid cards */}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate text-grey-accent-900">{bookmark.title || bookmark.url}</h3>
              {bookmark.description && (
                <p className="text-xs text-muted-foreground truncate">{bookmark.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-grey-accent-600 mt-2">
                <span className="font-medium">{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                      {bookmark.tags.map((tag: string, i) => (
                        <span
                          key={tag + i}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full cursor-default"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-full flex items-end">
              <div className="text-xs text-grey-accent-600">{new Date(bookmark.created_at).toLocaleDateString()}</div>
            </div>
            {/* card-level redirect button removed; domain bubble on image handles redirect */}
          </div>
        );
      })}
    </div>
  );
}