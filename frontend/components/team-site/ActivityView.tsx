import { TeamEvent } from '../../types/api';

interface ActivityViewProps {
  events: TeamEvent[];
}

export default function ActivityView({ events }: ActivityViewProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'collection.created': return { icon: '📁', color: 'text-blue-600', bg: 'bg-blue-50' }
      case 'bookmark.created': return { icon: '🔖', color: 'text-green-600', bg: 'bg-green-50' }
      case 'highlight.created': return { icon: '✨', color: 'text-yellow-600', bg: 'bg-yellow-50' }
      case 'annotation.created': return { icon: '💬', color: 'text-purple-600', bg: 'bg-purple-50' }
      default: return { icon: '�', color: 'text-grey-accent-600', bg: 'bg-grey-accent-50' }
    }
  }
  
  const getVerboseDescription = (eventType: string, data: any, event: any) => {
    const timestamp = new Date(event.created_at)
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = timestamp.toLocaleDateString()
    const userName = (event as any).profiles?.full_name || 'Unknown User'
    
    switch (eventType) {
      case 'collection.created':
        return {
          action: `Created collection "${data?.collection_name || 'Untitled'}"`,
          details: data?.collection_description ? `Description: "${data.collection_description}"` : 'No description provided',
          metadata: `Collection ID: ${data?.collection_id || 'Unknown'}`
        }
      case 'bookmark.created':
        return {
          action: `Added bookmark "${data?.bookmark_title || data?.bookmark_url || 'Untitled'}"`,
          details: data?.bookmark_url ? `URL: ${data.bookmark_url}` : 'No URL provided',
          metadata: `${data?.collection_name ? `To collection: "${data.collection_name}"` : 'Uncategorized'} • Bookmark ID: ${data?.bookmark_id || 'Unknown'}`
        }
      case 'highlight.created':
        return {
          action: 'Created text highlight',
          details: data?.highlight_text ? `"${data.highlight_text.substring(0, 100)}${data.highlight_text.length > 100 ? '...' : ''}"` : 'No highlight text',
          metadata: `Source: ${data?.source_url || 'Unknown'}`
        }
      case 'annotation.created':
        return {
          action: 'Added annotation',
          details: data?.annotation_text ? `"${data.annotation_text}"` : 'No annotation text',
          metadata: `Target: ${data?.target_type || 'Unknown'}`
        }
      default:
        return {
          action: eventType.replace('.', ' ').replace('_', ' '),
          details: 'System event',
          metadata: `Event type: ${eventType}`
        }
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚡</div>
        <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
        <p className="text-muted-foreground">
          Team activity will appear here as members create collections and bookmarks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Header */}
      <div className="bg-white rounded-lg border border-grey-accent-200 p-4">
        <h3 className="text-lg font-semibold text-grey-accent-900 mb-2">Team Activity Log</h3>
        <p className="text-sm text-grey-accent-600">
          Real-time activity feed showing all team member actions • {events.length} events
        </p>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg border border-grey-accent-200 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {events.map((event, index) => {
            const eventStyle = getEventIcon(event.event_type)
            const description = getVerboseDescription(event.event_type, event.data, event)
            const timestamp = new Date(event.created_at)
            const now = new Date()
            const diffMs = now.getTime() - timestamp.getTime()
            const diffMins = Math.floor(diffMs / (1000 * 60))
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            
            const getRelativeTime = () => {
              if (diffMins < 1) return 'Just now'
              if (diffMins < 60) return `${diffMins}m ago`
              if (diffHours < 24) return `${diffHours}h ago`
              if (diffDays < 7) return `${diffDays}d ago`
              return timestamp.toLocaleDateString()
            }

            return (
              <div 
                key={event.id} 
                className={`border-l-4 p-4 hover:bg-grey-accent-25 transition-colors ${
                  index !== events.length - 1 ? 'border-b border-grey-accent-100' : ''
                } ${eventStyle.bg} border-l-current`}
              >
                <div className="flex items-start gap-3">
                  {/* Timestamp column */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <div className="text-xs font-mono text-grey-accent-500">
                      {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-grey-accent-400">
                      {getRelativeTime()}
                    </div>
                  </div>
                  
                  {/* Icon and user */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-grey-accent-600 to-grey-accent-700 text-white flex items-center justify-center text-xs font-semibold">
                      {((event as any).profiles?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm">{eventStyle.icon}</span>
                  </div>
                  
                  {/* Event details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-grey-accent-900 text-sm">
                        {(event as any).profiles?.full_name || 'Unknown User'}
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}