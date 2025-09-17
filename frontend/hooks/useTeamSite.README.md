# useTeamSite Hook - REFACTOR NEEDED

## Overview
This custom hook manages all state and logic for team sites, spanning 1106 lines of code. It handles authentication, data fetching, real-time subscriptions, and complex state management.

## Current Issues
- **Excessive Size**: 1106 lines in a single hook
- **Multiple Responsibilities**: Auth, data fetching, subscriptions, state management
- **Complex Dependencies**: Many interconnected state variables
- **Performance Concerns**: Large re-renders and subscription management
- **Testing Difficulty**: Monolithic structure hard to unit test

## Functionality

### Authentication & Authorization
- User authentication verification
- Profile loading and validation
- Team membership verification
- Redirect logic for unauthorized access

### Data Management
- Collections CRUD operations
- Bookmarks CRUD operations
- Team events and activity tracking
- Real-time presence updates

### Real-time Features
- Supabase subscriptions for live updates
- Presence tracking (who's online)
- Activity monitoring
- Conflict resolution for concurrent edits

### State Management
- 20+ useState hooks
- Complex state synchronization
- Error handling and loading states
- Data caching and invalidation

## Refactoring Plan

### Phase 1: Extract Sub-hooks
Break down into smaller, focused hooks:

```typescript
// Authentication
const useTeamAuth = (teamId: string) => {
  // Handle auth checking and redirects
}

// Data fetching
const useTeamData = (teamId: string) => {
  // Handle collections and bookmarks loading
}

// Real-time subscriptions
const useTeamSubscriptions = (teamId: string) => {
  // Handle Supabase subscriptions
}

// Presence tracking
const useTeamPresence = (teamId: string) => {
  // Handle online presence
}
```

### Phase 2: Service Layer
Extract business logic into service functions:

```typescript
// services/teamService.ts
export const teamService = {
  async loadCollections(teamId: string): Promise<Collection[]>,
  async createBookmark(bookmark: CreateBookmarkRequest): Promise<Bookmark>,
  async updatePresence(userId: string, status: 'online' | 'offline'): Promise<void>,
  // ... other operations
}
```

### Phase 3: State Management
Consider using a state management library:

```typescript
// stores/teamStore.ts
interface TeamState {
  collections: Collection[];
  bookmarks: Bookmark[];
  presence: Presence[];
  loading: boolean;
  error: string | null;
}

const useTeamStore = create<TeamState & TeamActions>((set, get) => ({
  // State and actions
}));
```

### Phase 4: Custom Hooks Composition
Compose smaller hooks in the main hook:

```typescript
export function useTeamSite(teamId: string) {
  const auth = useTeamAuth(teamId);
  const data = useTeamData(teamId);
  const subscriptions = useTeamSubscriptions(teamId);
  const presence = useTeamPresence(teamId);

  // Combine and return unified interface
  return {
    ...auth,
    ...data,
    ...subscriptions,
    ...presence,
  };
}
```

## Dependencies
- Supabase client for auth and subscriptions
- API client for data operations
- Next.js router for navigation
- TypeScript types from `../types/api`

## Performance Issues
- Multiple subscriptions running simultaneously
- Large state objects causing unnecessary re-renders
- Complex dependency arrays in useEffect
- Memory leaks from uncleaned subscriptions

## Testing Strategy
- Mock Supabase subscriptions
- Test auth flows separately
- Unit test individual operations
- Integration tests for full workflows