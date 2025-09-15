import { TeamEvent } from '../../types/api';

interface ActivityViewProps {
  events: TeamEvent[];
}

export default function ActivityView({ events }: ActivityViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'bookmark.created':
        return '🔖';
      case 'bookmark.updated':
        return '✏️';
      case 'bookmark.deleted':
        return '🗑️';
      case 'collection.created':
        return '📁';
      case 'collection.updated':
        return '📝';
      case 'collection.deleted':
        return '🗂️';
      case 'highlight.created':
        return '✨';
      case 'annotation.created':
        return '💬';
      case 'user.joined':
        return '👋';
      case 'user.left':
        return '👋';
      default:
        return '⚡';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'bookmark.created':
      case 'collection.created':
      case 'highlight.created':
      case 'annotation.created':
      case 'user.joined':
        return 'var(--success)';
      case 'bookmark.updated':
      case 'collection.updated':
        return 'var(--primary)';
      case 'bookmark.deleted':
      case 'collection.deleted':
      case 'user.left':
        return 'var(--danger)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getEventDescription = (event: TeamEvent) => {
    const data = event.data || {};
    const actorName = data.actor_name || 'Someone';

    switch (event.event_type) {
      case 'bookmark.created':
        return `${actorName} added a new bookmark: "${data.title || 'Untitled'}"`;
      case 'bookmark.updated':
        return `${actorName} updated bookmark: "${data.title || 'Untitled'}"`;
      case 'bookmark.deleted':
        return `${actorName} deleted bookmark: "${data.title || 'Untitled'}"`;
      case 'collection.created':
        return `${actorName} created collection: "${data.name || 'Untitled'}"`;
      case 'collection.updated':
        return `${actorName} updated collection: "${data.name || 'Untitled'}"`;
      case 'collection.deleted':
        return `${actorName} deleted collection: "${data.name || 'Untitled'}"`;
      case 'highlight.created':
        return `${actorName} added a highlight`;
      case 'annotation.created':
        return `${actorName} added an annotation`;
      case 'user.joined':
        return `${actorName} joined the team`;
      case 'user.left':
        return `${actorName} left the team`;
      default:
        return `${actorName} performed an action`;
    }
  };

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-4">⚡</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          No activity yet
        </h3>
        <p className="text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Team activity will appear here as members create bookmarks, collections, and collaborate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:transform hover:-translate-y-1"
          style={{ 
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
        >
          {/* Event Icon */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ 
              backgroundColor: getEventColor(event.event_type) + '20',
              color: getEventColor(event.event_type)
            }}
          >
            {getEventIcon(event.event_type)}
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              {getEventDescription(event)}
            </p>
            
            {/* Additional event data */}
            {event.data?.description && (
              <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                {event.data.description}
              </p>
            )}

            {event.data?.url && (
              <a
                href={event.data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline transition-colors duration-200"
                style={{ color: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                View Link
              </a>
            )}

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(event.created_at)}
              </span>
              
              {/* Event type badge */}
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: getEventColor(event.event_type) + '15',
                  color: getEventColor(event.event_type)
                }}
              >
                {event.event_type.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}