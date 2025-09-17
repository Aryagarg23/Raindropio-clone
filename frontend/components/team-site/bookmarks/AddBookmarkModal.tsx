import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Collection } from '../../../types/api';

interface AddBookmarkModalProps {
  collections: Collection[];
  onClose: () => void;
  onCreate: (url: string, title?: string, collectionId?: string, tags?: string[]) => void;
}

export default function AddBookmarkModal({
  collections,
  onClose,
  onCreate
}: AddBookmarkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isSubmitting]);

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setCollectionId('');
    setTagInput('');
    setTags([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onCreate(url.trim(), title.trim() || undefined, collectionId || undefined, tags);

        // Reset form and close modal
        resetForm();
        onClose();
      } catch (error) {
        console.error('Failed to create bookmark:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Bookmark</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL *</label>
              <Input
                type="url"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Optional title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Collection</label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    📁 {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const tag = tagInput.trim();
                      if (tag && !tags.includes(tag)) {
                        setTags([...tags, tag]);
                        setTagInput('');
                      }
                    }
                  }}
                  placeholder="Add tags (press Enter or comma to add)"
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-grey-accent-100 text-grey-accent-700 text-xs rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== index))}
                          className="text-grey-accent-500 hover:text-grey-accent-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || !url.trim()}>
                {isSubmitting ? 'Adding...' : 'Add Bookmark'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}