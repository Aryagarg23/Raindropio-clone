import React from 'react';
import { Folder, Bookmark } from 'lucide-react';

const EventDescription = ({ event }: { event: any }) => {
  const { event_type, data } = event;

  switch (event_type) {
    case 'collection.created':
      return (
        <p className="text-sm text-gray-700">
          Created a new collection: <strong className="font-semibold text-gray-900">{data.collection_name || 'Untitled'}</strong>
        </p>
      );
    case 'collection.deleted':
      return (
        <p className="text-sm text-gray-700">
          Deleted the collection: <strong className="font-semibold text-gray-900">{data.collection_name || 'Untitled'}</strong>
        </p>
      );
    case 'bookmark.created':
      return (
        <p className="text-sm text-gray-700">
          Added a new bookmark <strong className="font-semibold text-gray-900">{data.bookmark_title || 'Untitled'}</strong>
          {data.collection_name && 
            <>
              {" to "}
              <strong className="font-semibold text-gray-900">{data.collection_name}</strong>
            </>
          }
        </p>
      );
    case 'bookmark.deleted':
      return (
        <p className="text-sm text-gray-700">
          Removed the bookmark <strong className="font-semibold text-gray-900">{data.bookmark_title || 'Untitled'}</strong>
        </p>
      );
    default:
      return <p className="text-sm text-gray-600 font-mono">{event_type}</p>;
  }
};

export default EventDescription;