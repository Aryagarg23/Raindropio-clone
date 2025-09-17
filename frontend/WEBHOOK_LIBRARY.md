# Webhook & Event System Library

## Overview
This document serves as the central reference for the Raindropio-clone webhook and event system. While traditional HTTP webhooks aren't implemented yet, the system uses a comprehensive event-driven architecture with Supabase real-time subscriptions that functions similarly to webhooks internally.

## 🎯 Event System Architecture

### Core Components

#### Team Events Table (`public.team_events`)
```sql
CREATE TABLE public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
**Purpose**: Central event log for all team activities
**RLS Policy**: Team members can read events from their teams, authenticated users can insert events
**Indexes**: `team_id`, `created_at DESC` for efficient querying

#### Real-time Subscriptions (`useRealtimeSubscriptions`)
```typescript
interface UseRealtimeSubscriptionsProps {
  teamId: string;
  user: any;
  setCollections: React.Dispatch<React.SetStateAction<any[]>>;
  setBookmarks: React.Dispatch<React.SetStateAction<any[]>>;
  setTeamEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setPresence: React.Dispatch<React.SetStateAction<any[]>>;
}
```
**Purpose**: Manages Supabase real-time subscriptions for live UI updates
**Channels**: `team-{teamId}-collections`, `team-{teamId}-bookmarks`, `team-{teamId}-events`
**Event Types**: `INSERT`, `UPDATE`, `DELETE` for each table

---

## 📊 Event Types & Data Structures

### Collection Events

#### `collection.created`
```typescript
interface CollectionCreatedEvent {
  event_type: 'collection.created';
  actor_id: string; // User who created the collection
  data: {
    collection_id: string;
    collection_name: string;
    collection_description?: string;
    collection_color?: string;
  };
}
```
**Trigger**: Database trigger on `collections` INSERT
**Consumers**: Real-time UI updates, activity feeds
**Data Source**: `collections` table

#### `collection.updated`
```typescript
interface CollectionUpdatedEvent {
  event_type: 'collection.updated';
  actor_id: string;
  data: {
    collection_id: string;
    old_name?: string;
    new_name?: string;
    old_description?: string;
    new_description?: string;
    changes: Record<string, { old: any; new: any }>;
  };
}
```
**Trigger**: Manual logging in application code
**Consumers**: Activity feeds, notification systems

#### `collection.deleted`
```typescript
interface CollectionDeletedEvent {
  event_type: 'collection.deleted';
  actor_id: string;
  data: {
    collection_id: string;
    collection_name: string;
    bookmark_count: number; // Bookmarks that were in this collection
  };
}
```
**Trigger**: Application code before DELETE
**Consumers**: Activity feeds, cleanup operations

### Bookmark Events

#### `bookmark.created`
```typescript
interface BookmarkCreatedEvent {
  event_type: 'bookmark.created';
  actor_id: string;
  data: {
    bookmark_id: string;
    bookmark_title: string;
    bookmark_url: string;
    collection_id?: string;
    collection_name?: string;
    tags?: string[];
  };
}
```
**Trigger**: Database trigger on `bookmarks` INSERT
**Consumers**: Real-time UI updates, collection stats, activity feeds
**Data Source**: `bookmarks` table with collection join

#### `bookmark.updated`
```typescript
interface BookmarkUpdatedEvent {
  event_type: 'bookmark.updated';
  actor_id: string;
  data: {
    bookmark_id: string;
    old_title?: string;
    new_title?: string;
    old_url?: string;
    new_url?: string;
    changes: Record<string, { old: any; new: any }>;
  };
}
```
**Trigger**: Manual logging in application code
**Consumers**: Activity feeds, search index updates

#### `bookmark.deleted`
```typescript
interface BookmarkDeletedEvent {
  event_type: 'bookmark.deleted';
  actor_id: string;
  data: {
    bookmark_id: string;
    bookmark_title: string;
    bookmark_url: string;
    collection_id?: string;
  };
}
```
**Trigger**: Application code before DELETE
**Consumers**: Activity feeds, cleanup operations

#### `bookmark.tags_updated`
```typescript
interface BookmarkTagsUpdatedEvent {
  event_type: 'bookmark.tags_updated';
  actor_id: string;
  data: {
    bookmark_id: string;
    tags: string[]; // New tag array
  };
}
```
**Trigger**: `update_bookmark_tags()` PostgreSQL function
**Consumers**: Tag search updates, activity feeds

### Highlight & Annotation Events

#### `highlight.created`
```typescript
interface HighlightCreatedEvent {
  event_type: 'highlight.created';
  actor_id: string;
  data: {
    highlight_id: string;
    bookmark_id: string;
    selected_text: string; // First 100 chars + "..."
  };
}
```
**Trigger**: Database trigger on `highlights` INSERT
**Consumers**: Activity feeds, annotation counts

#### `annotation.created`
```typescript
interface AnnotationCreatedEvent {
  event_type: 'annotation.created';
  actor_id: string;
  data: {
    annotation_id: string;
    bookmark_id: string;
    highlight_id?: string; // null = annotation on bookmark itself
    content: string; // First 100 chars + "..."
  };
}
```
**Trigger**: Database trigger on `annotations` INSERT
**Consumers**: Activity feeds, discussion threads

---

## 🔧 Event Processing Pipeline

### Event Creation Flow

#### 1. Database Triggers (Automatic)
```sql
-- Example: Collection creation trigger
CREATE OR REPLACE FUNCTION public.log_collection_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_events (team_id, event_type, actor_id, data)
  VALUES (
    NEW.team_id,
    'collection.created',
    NEW.created_by,
    jsonb_build_object(
      'collection_id', NEW.id,
      'collection_name', NEW.name,
      'collection_description', NEW.description
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_collection_created
  AFTER INSERT ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.log_collection_created();
```
**Location**: Database migration files
**Security**: Runs with SECURITY DEFINER (admin privileges)

#### 2. Application Code (Manual)
```typescript
// From useTeamActions.ts
const createCollection = async (name: string, description: string) => {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      team_id: teamId,
      name,
      description,
      created_by: user.id
    })
    .select()
    .single();

  if (data) {
    // Event is automatically created by database trigger
    // Additional processing can happen here
  }
};
```
**Location**: `hooks/useTeamActions.ts`
**Pattern**: CRUD operations with automatic event logging

#### 3. PostgreSQL Functions (Complex Operations)
```sql
-- From update_bookmark_tags function
INSERT INTO public.team_events (team_id, event_type, actor_id, data)
VALUES (
  bookmark_team_id,
  'bookmark.tags_updated',
  auth.uid(),
  jsonb_build_object(
    'bookmark_id', bookmark_uuid,
    'tags', new_tags
  )
);
```
**Location**: Database function definitions
**Use Case**: Complex operations requiring validation

### Event Consumption Flow

#### 1. Real-time UI Updates
```typescript
// From useRealtimeSubscriptions.ts
const eventsSubscription = supabase
  .channel(`team-${teamId}-events`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'team_events', filter: `team_id=eq.${teamId}` },
    async (payload: any) => {
      console.log('Team event:', payload);
      // Update local state
      setTeamEvents(prev => [payload.new, ...prev]);
    }
  )
  .subscribe();
```
**Purpose**: Live UI updates without page refresh
**Scope**: Current team members only

#### 2. Activity Feed Display
```typescript
// From [teamId].tsx
const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'collection.created': return { icon: '📁', color: 'text-blue-600', bg: 'bg-blue-50' }
    case 'bookmark.created': return { icon: '🔖', color: 'text-green-600', bg: 'bg-green-50' }
    case 'highlight.created': return { icon: '✨', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    case 'annotation.created': return { icon: '💬', color: 'text-purple-600', bg: 'bg-purple-50' }
    default: return { icon: '📝', color: 'text-grey-accent-600', bg: 'bg-grey-accent-50' }
  }
};
```
**Purpose**: Visual representation in activity feeds
**Location**: Component render logic

#### 3. Data Aggregation (Future)
```typescript
// Planned: Analytics and reporting
interface EventAggregator {
  teamId: string;
  eventTypes: string[];
  dateRange: { start: Date; end: Date };
  groupBy: 'day' | 'week' | 'month';
}

// Example usage for analytics
const getTeamActivity = async (aggregator: EventAggregator) => {
  const { data } = await supabase
    .from('team_events')
    .select('*')
    .eq('team_id', aggregator.teamId)
    .in('event_type', aggregator.eventTypes)
    .gte('created_at', aggregator.dateRange.start.toISOString())
    .lte('created_at', aggregator.dateRange.end.toISOString());

  return aggregateEvents(data, aggregator.groupBy);
};
```
**Status**: Planned for future analytics features

---

## 🌐 External Webhook System (Planned)

### Webhook Configuration Table
```sql
-- Future: External webhook endpoints
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL, -- For HMAC verification
  events text[] NOT NULL, -- Array of event types to send
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_sent_at timestamptz,
  failure_count int DEFAULT 0
);
```

### Webhook Payload Structure
```typescript
interface WebhookPayload {
  id: string; // Unique webhook delivery ID
  event_type: string;
  team_id: string;
  actor_id: string;
  actor_email?: string;
  data: Record<string, any>; // Event-specific data
  timestamp: string;
  webhook_id: string; // Reference to webhook_endpoints.id
}

// HTTP Headers sent with webhook
interface WebhookHeaders {
  'Content-Type': 'application/json';
  'User-Agent': 'Raindropio-Clone-Webhook/1.0';
  'X-Webhook-ID': string;
  'X-Webhook-Event': string;
  'X-Webhook-Signature': string; // HMAC-SHA256 signature
  'X-Webhook-Attempt': string; // Retry attempt number
}
```

### Webhook Delivery Service
```typescript
class WebhookService {
  async deliverWebhook(endpoint: WebhookEndpoint, event: TeamEvent): Promise<DeliveryResult> {
    const payload: WebhookPayload = {
      id: generateId(),
      event_type: event.event_type,
      team_id: event.team_id,
      actor_id: event.actor_id,
      data: event.data,
      timestamp: event.created_at,
      webhook_id: endpoint.id
    };

    const signature = this.generateSignature(payload, endpoint.secret);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Raindropio-Clone-Webhook/1.0',
          'X-Webhook-ID': payload.id,
          'X-Webhook-Event': event.event_type,
          'X-Webhook-Signature': signature,
          'X-Webhook-Attempt': '1'
        },
        body: JSON.stringify(payload)
      });

      return {
        success: response.ok,
        statusCode: response.status,
        responseBody: await response.text()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }
}
```

### Webhook Event Processing
```typescript
// Database trigger to queue webhooks
CREATE OR REPLACE FUNCTION public.queue_webhooks()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into webhook delivery queue
  INSERT INTO public.webhook_deliveries (webhook_id, event_id, status, created_at)
  SELECT
    we.id,
    NEW.id,
    'pending',
    now()
  FROM public.webhook_endpoints we
  WHERE we.team_id = NEW.team_id
    AND we.is_active = true
    AND NEW.event_type = ANY(we.events);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to team_events
CREATE TRIGGER queue_webhooks_trigger
  AFTER INSERT ON public.team_events
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_webhooks();
```

---

## 📈 Analytics & Monitoring

### Event Metrics (Planned)
```typescript
interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByTeam: Record<string, number>;
  hourlyActivity: Array<{ hour: number; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

// Example query for event analytics
const getEventMetrics = async (teamId: string, dateRange: DateRange): Promise<EventMetrics> => {
  const { data } = await supabase
    .from('team_events')
    .select('event_type, actor_id, created_at')
    .eq('team_id', teamId)
    .gte('created_at', dateRange.start.toISOString())
    .lte('created_at', dateRange.end.toISOString());

  return {
    totalEvents: data.length,
    eventsByType: data.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {}),
    // ... additional aggregations
  };
};
```

### Webhook Monitoring (Future)
```typescript
interface WebhookMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  endpointsByStatus: Record<string, number>;
}

// Webhook health dashboard
const getWebhookHealth = async (teamId: string) => {
  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select(`
      *,
      deliveries:webhook_deliveries(
        status,
        response_time,
        created_at
      )
    `)
    .eq('team_id', teamId);

  return endpoints.map(endpoint => ({
    endpoint: endpoint.url,
    isActive: endpoint.is_active,
    lastDelivery: endpoint.last_sent_at,
    failureRate: calculateFailureRate(endpoint.deliveries),
    averageResponseTime: calculateAverageResponseTime(endpoint.deliveries)
  }));
};
```

---

## 🔒 Security Considerations

### Event Data Privacy
- **RLS Policies**: Events are only visible to team members
- **Data Sanitization**: Sensitive data is filtered before logging
- **Actor Attribution**: Events include actor_id for accountability

### Webhook Security (Future)
- **HMAC Signatures**: SHA256 signatures for payload verification
- **Secret Management**: Encrypted webhook secrets in database
- **Rate Limiting**: Prevent webhook spam and abuse
- **Retry Logic**: Exponential backoff for failed deliveries
- **Timeout Handling**: Configurable timeouts for webhook endpoints

### Audit Trail
```sql
-- Future: Event audit log
CREATE TABLE public.event_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.team_events(id),
  action text NOT NULL, -- 'created', 'delivered', 'failed', 'retried'
  details jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 🚀 Implementation Roadmap

### Phase 1: Enhanced Internal Events (Current)
- ✅ Database triggers for automatic event logging
- ✅ Real-time subscriptions for UI updates
- ✅ Event display in activity feeds
- 🔄 Add more event types (collection.updated, bookmark.updated)

### Phase 2: External Webhooks (Next)
- 📋 Create webhook_endpoints table
- 📋 Implement webhook delivery service
- 📋 Add webhook management UI
- 📋 Configure retry logic and monitoring

### Phase 3: Advanced Features (Future)
- 📋 Event aggregation and analytics
- 📋 Custom event filtering and routing
- 📋 Integration with external services (Slack, Discord, etc.)
- 📋 Event-driven automation workflows

---

## 📚 Usage Examples

### Creating Custom Events
```typescript
// In application code
const logCustomEvent = async (
  teamId: string,
  eventType: string,
  actorId: string,
  eventData: Record<string, any>
) => {
  const { error } = await supabase
    .from('team_events')
    .insert({
      team_id: teamId,
      event_type: eventType,
      actor_id: actorId,
      data: eventData
    });

  if (error) {
    console.error('Failed to log event:', error);
  }
};

// Usage
await logCustomEvent(
  teamId,
  'integration.sync_completed',
  user.id,
  {
    integration_type: 'github',
    items_synced: 42,
    sync_duration_ms: 1500
  }
);
```

### Listening to Events
```typescript
// Custom event listener hook
const useEventListener = (eventTypes: string[], callback: (event: TeamEvent) => void) => {
  useEffect(() => {
    const subscription = supabase
      .channel('custom-events')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_events',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          if (eventTypes.includes(payload.new.event_type)) {
            callback(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventTypes, callback]);
};
```

### Event Processing Utilities
```typescript
// Event type guards
const isCollectionEvent = (event: TeamEvent): event is TeamEvent & { event_type: 'collection.created' | 'collection.updated' | 'collection.deleted' } => {
  return event.event_type.startsWith('collection.');
};

const isBookmarkEvent = (event: TeamEvent): event is TeamEvent & { event_type: 'bookmark.created' | 'bookmark.updated' | 'bookmark.deleted' } => {
  return event.event_type.startsWith('bookmark.');
};

// Event data validation
const validateEventData = (eventType: string, data: any): boolean => {
  const schemas = {
    'collection.created': (d: any) => d.collection_id && d.collection_name,
    'bookmark.created': (d: any) => d.bookmark_id && d.bookmark_url,
    // ... more schemas
  };

  const validator = schemas[eventType];
  return validator ? validator(data) : true;
};
```

---

## 🔧 Maintenance & Extension

**When adding new event types:**
1. Define the event interface in this document
2. Add database trigger or application logging
3. Update event display logic (icons, descriptions)
4. Add to real-time subscription handling
5. Update any analytics or monitoring code

**When implementing external webhooks:**
1. Create webhook_endpoints table migration
2. Implement delivery service with retry logic
3. Add webhook management UI
4. Configure monitoring and alerting
5. Document webhook payload formats

**Performance considerations:**
- Events table may grow large; consider partitioning by team_id and date
- Real-time subscriptions should filter events efficiently
- Webhook delivery should be asynchronous to avoid blocking
- Implement event archiving for old data cleanup</content>
<parameter name="filePath">/home/arya/projects/NIS/Raindropio-clone/frontend/WEBHOOK_LIBRARY.md