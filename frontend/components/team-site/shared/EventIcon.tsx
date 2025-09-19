import React from 'react';
import { FolderPlus, FolderMinus, BookmarkPlus, BookmarkMinus, Activity } from 'lucide-react';

const EventIcon = ({ event_type }: { event_type: string }) => {
  switch (event_type) {
    case 'collection.created':
      return <FolderPlus className="w-5 h-5 text-blue-500" />;
    case 'collection.deleted':
      return <FolderMinus className="w-5 h-5 text-red-500" />;
    case 'bookmark.created':
      return <BookmarkPlus className="w-5 h-5 text-green-500" />;
    case 'bookmark.deleted':
      return <BookmarkMinus className="w-5 h-5 text-orange-500" />;
    default:
      return <Activity className="w-5 h-5 text-gray-400" />;
  }
};

export default EventIcon;