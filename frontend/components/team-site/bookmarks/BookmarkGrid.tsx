import React from 'react';
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { ExternalLink, Heart, Plus } from "lucide-react";
import ProfileIcon from "../../ProfileIcon";
import { FaviconImage } from "../shared/FaviconImage";

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

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer"
      onClick={() => onBookmarkClick(bookmark)}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img
          src={imageSrc}
          alt={bookmark.title || bookmark.url}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          data-debug-src={imageSrc}
          onLoad={(e) => { console.debug('BookmarkGrid image loaded', bookmark.id, (e.target as HTMLImageElement).src); }}
          onError={(e) => {
            console.warn('BookmarkGrid image error', bookmark.id, (e.target as HTMLImageElement).src);
            const target = e.target as HTMLImageElement;
            target.src = getPlaceholderUrl(bookmark.url);
          }}
        />
        {/* Favicon overlay - moved to bottom right */}
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-8 rounded bg-white shadow-lg flex items-center justify-center border border-grey-accent-200">
            <FaviconImage
              url={bookmark.url}
              faviconUrl={bookmark.favicon_url}
              size="w-5 h-5"
            />
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          {bookmark.title || bookmark.url}
        </h3>
        {bookmark.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {bookmark.description}
          </p>
        )}
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3 items-center">
          {bookmark.tags && bookmark.tags.length > 0 && (
            <>
              {bookmark.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 rounded-full text-xs"
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newTags = bookmark.tags!.filter((_, i) => i !== index);
                      updateBookmarkTags(bookmark.id, newTags);
                    }}
                    className="text-grey-accent-500 hover:text-grey-accent-700 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {bookmark.tags.length > 3 && (
                <span className="px-2 py-1 bg-grey-accent-100 text-grey-accent-600 text-xs rounded-full">
                  +{bookmark.tags.length - 3}
                </span>
              )}
            </>
          )}

          {/* Add tag button */}
          {editingTags === bookmark.id ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={tagInput}
                onChange={(e) => onSetTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tagInput.trim() && !bookmark.tags?.includes(tagInput.trim())) {
                      updateBookmarkTags(bookmark.id, [...(bookmark.tags || []), tagInput.trim()]);
                    }
                    onSetTagInput('');
                    onSetEditingTags(null);
                  } else if (e.key === 'Escape') {
                    onSetTagInput('');
                    onSetEditingTags(null);
                  }
                }}
                onBlur={() => {
                  if (tagInput.trim() && !bookmark.tags?.includes(tagInput.trim())) {
                    updateBookmarkTags(bookmark.id, [...(bookmark.tags || []), tagInput.trim()]);
                  }
                  onSetTagInput('');
                  onSetEditingTags(null);
                }}
                placeholder="Add tag..."
                className="w-20 h-6 text-xs px-2 py-1 border border-grey-accent-300 rounded"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetEditingTags(bookmark.id);
              }}
              className="w-5 h-5 rounded-full bg-grey-accent-200 hover:bg-grey-accent-300 flex items-center justify-center text-grey-accent-600 hover:text-grey-accent-800 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-grey-accent-600">
          <div className="flex items-center gap-2">
            <ProfileIcon
              user={{
                avatar_url: (bookmark as any).profiles?.avatar_url,
                full_name: (bookmark as any).profiles?.full_name,
                email: (bookmark as any).profiles?.user_id
              }}
              size="sm"
            />
            <span>{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Heart className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
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
}

export function BookmarkGrid({
  bookmarks,
  viewMode,
  editingTags,
  tagInput,
  onBookmarkClick,
  onUpdateTags,
  onSetEditingTags,
  onSetTagInput
}: BookmarkGridProps) {
  const updateBookmarkTags = (bookmarkId: string, newTags: string[]) => {
    onUpdateTags(bookmarkId, newTags);
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => {
        // Generate fallback placeholder
        const getPlaceholderUrl = (url: string) => {
          const domain = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
          // Create a simple SVG placeholder
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="#f3f4f6"/><text x="32" y="28" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#9ca3af" text-anchor="middle">${domain}</text></svg>`;
          return `data:image/svg+xml;base64,${btoa(svg)}`;
        };

        const imageSrc = bookmark.preview_image || getPlaceholderUrl(bookmark.url);

        return (
          <Card key={bookmark.id} className="hover:shadow-md transition-all duration-200 bg-white border-grey-accent-200 hover:border-grey-accent-300 cursor-pointer" onClick={() => onBookmarkClick(bookmark)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={imageSrc}
                    alt={bookmark.title || bookmark.url}
                    className="w-16 h-12 object-cover rounded border border-grey-accent-200"
                    onError={(e) => {
                      // Fallback to placeholder on error
                      const target = e.target as HTMLImageElement;
                      target.src = getPlaceholderUrl(bookmark.url);
                    }}
                  />
                  {/* Favicon */}
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-6 h-6 rounded bg-white shadow-md flex items-center justify-center border border-grey-accent-200">
                      <FaviconImage
                        url={bookmark.url}
                        faviconUrl={bookmark.favicon_url}
                        size="w-4 h-4"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate text-grey-accent-900">
                    {bookmark.title || bookmark.url}
                  </h3>
                  {bookmark.description && (
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {bookmark.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-grey-accent-600">
                    <ProfileIcon
                      user={{
                        avatar_url: (bookmark as any).profiles?.avatar_url,
                        full_name: (bookmark as any).profiles?.full_name,
                        email: (bookmark as any).profiles?.user_id
                      }}
                      size="sm"
                    />
                    <span>{(bookmark as any).profiles?.full_name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}