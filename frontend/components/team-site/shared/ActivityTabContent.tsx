import React from 'react';
import ProfileIcon from '../../ProfileIcon';

interface TeamEvent {
  id: string;
  event_type: string;
  created_at: string;
  details?: string;
  metadata?: string;
  profiles?: {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface ActivityTabContentProps {
  teamEvents: TeamEvent[];
}

export const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  teamEvents
}) => {
  return (
    <div className="bg-white rounded-lg border border-grey-accent-200 p-6">
      <h3 className="text-xl font-semibold text-grey-accent-900 mb-6">Team Activity</h3>

      <div className="space-y-4">
        {teamEvents.map((event: TeamEvent) => {
          // Event styling logic would go here
          const eventStyle = {
            icon: '📝',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800'
          };

          const timestamp = new Date(event.created_at);
          const getRelativeTime = () => {
            const now = new Date();
            const diff = now.getTime() - timestamp.getTime();
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 1) return 'Just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            return `${days}d ago`;
          };

          const description = {
            action: `Created ${event.event_type}`,
            details: event.details || '',
            metadata: event.metadata || ''
          };

          return (
            <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg border border-grey-accent-200 hover:bg-grey-accent-50 transition-colors group">
              {/* Timestamp */}
              <div className="flex flex-col items-end text-xs text-grey-accent-500 min-w-[60px]">
                <div className="font-mono">
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-grey-accent-400">
                  {getRelativeTime()}
                </div>
              </div>

              {/* Icon and user */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ProfileIcon
                  user={{
                    avatar_url: event.profiles?.avatar_url,
                    full_name: event.profiles?.full_name,
                    email: event.profiles?.user_id
                  }}
                  size="md"
                />
                <span className="text-xs">{eventStyle.icon}</span>
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-grey-accent-900 text-sm">
                    {event.profiles?.full_name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-grey-accent-500 bg-grey-accent-100 px-2 py-0.5 rounded-full">
                    {event.event_type}
                  </span>
                </div>

                <div className="text-sm text-grey-accent-800 mb-1">
                  {description.action}
                </div>

                <div className="text-xs text-grey-accent-600 mb-1">
                  {description.details}
                </div>

                <div className="text-xs text-grey-accent-500 font-mono">
                  {description.metadata}
                </div>
              </div>

              {/* Full timestamp on hover */}
              <div className="text-xs text-grey-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {timestamp.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {teamEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
          <p className="text-muted-foreground">
            Team activity will appear here as members create collections and bookmarks
          </p>
        </div>
      )}
    </div>
  );
};