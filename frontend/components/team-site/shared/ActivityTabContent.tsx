import React from 'react';
import ProfileIcon from '../../ProfileIcon';
import EventIcon from './EventIcon';
import EventDescription from './EventDescription';

interface TeamEvent {
  id: string;
  event_type: string;
  created_at: string;
  data: any; // JSONB data from the database
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface ActivityTabContentProps {
  teamEvents: TeamEvent[];
  onLoadMoreEvents?: () => void;
}

export const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  teamEvents
  ,onLoadMoreEvents
}) => {

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diff = now.getTime() - eventTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Team Activity</h3>

      <div className="space-y-2">
        {teamEvents.map((event: TeamEvent) => (
          <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0">
              <EventIcon event_type={event.event_type} />
            </div>
            <div className="flex-shrink-0">
              <ProfileIcon user={event.profiles} size="md" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {event.profiles?.full_name || 'Unknown User'}
                </span>
              </div>
              <EventDescription event={event} />
            </div>
            <div className="text-xs text-gray-500 self-start flex-shrink-0">
              {getRelativeTime(event.created_at)}
            </div>
          </div>
        ))}
      </div>

      {onLoadMoreEvents && teamEvents.length > 0 && (
        <div className="mt-4 text-center">
          <button
            className="px-4 py-2 bg-grey-accent-100 rounded-md text-sm"
            onClick={() => onLoadMoreEvents()}
          >
            Load more
          </button>
        </div>
      )}

      {teamEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
          <p className="text-gray-500">
            Team activity will appear here as members create collections and bookmarks.
          </p>
        </div>
      )}
    </div>
  );
};
