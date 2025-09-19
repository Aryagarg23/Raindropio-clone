import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Collection } from '../../../types/api';
import { stickyPalette } from '../../../utils/colors';

interface CreateCollectionModalProps {
  onClose: () => void;
  onCreate: (name: string, description?: string, color?: string, parentId?: string) => void;
  collections?: Collection[];
  initialParentId?: string;
}

export default function CreateCollectionModal({
  onClose,
  onCreate,
  collections = []
  , initialParentId
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#FFEB3B');
  const [parentId, setParentId] = useState('');
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
    setName('');
    setDescription('');
    setColor('#FFEB3B');
    setParentId(initialParentId || '');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Initialize parentId from prop when modal opens or prop changes
  React.useEffect(() => {
    if (initialParentId) setParentId(initialParentId);
  }, [initialParentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onCreate(name.trim(), description.trim() || undefined, color, parentId || undefined);

        // Reset form and close modal
        resetForm();
        onClose();
      } catch (error) {
        console.error('Failed to create collection:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const colorOptions = stickyPalette;

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
          <CardTitle>Create New Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Collection Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Enter collection name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Collection</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="">Root Level (No Parent)</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    📁 {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Collection Color</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded border-2 ${color === colorOption ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: colorOption }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Collection'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}