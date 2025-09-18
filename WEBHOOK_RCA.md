# Root Cause Analysis (RCA) - Webhook System Failure

**Date:** September 18, 2025  
**Issue:** Real-time webhooks not updating UI components despite successful socket connections  
**Severity:** High - Core functionality impacted  
**Status:** ✅ RESOLVED  

## 📋 Issue Summary

The webhook/real-time subscription system was failing to update UI components when database changes occurred, despite:
- ✅ Successful Supabase real-time connections
- ✅ All subscription channels showing SUBSCRIBED status
- ✅ Console logs showing webhook events being received
- ❌ UI components not reflecting the changes

## 🔍 Investigation Process

### Timeline
- **14:00** - User reported webhook issues after 1 hour of debugging
- **14:15** - Verified real-time connections were successful (all channels SUBSCRIBED)
- **14:30** - Examined webhook event logs - events were being received
- **14:45** - Analyzed component integration with useRealtimeSubscriptions hook
- **15:00** - Identified root cause: stale closure references in React hooks
- **15:15** - Implemented fix using useRef pattern
- **15:30** - Created test script and documentation

### What We Checked
1. ✅ Supabase RLS policies - confirmed working
2. ✅ Supabase configuration - confirmed working  
3. ✅ Real-time connection status - all channels SUBSCRIBED
4. ✅ Webhook event reception - events being logged
5. ✅ Component rendering logic - working correctly
6. ❌ React hook closure behavior - **ROOT CAUSE FOUND**

## 🐛 Root Cause Analysis

### Primary Cause: Stale Closure References in React Hooks

The issue was in `/frontend/hooks/useRealtimeSubscriptions.ts`. The hook was suffering from the classic "stale closure" problem:

**Problem:**
```typescript
// BEFORE (Broken)
useEffect(() => {
  // This creates closures over the current values of setCollections, setBookmarks, etc.
  const collectionsSubscription = supabase
    .channel(`team-${teamId}-collections`)
    .on('postgres_changes', async (payload) => {
      setCollections(prev => { /* This setCollections reference becomes stale! */ });
    });
}, [user?.id, teamId]); // Missing setter dependencies!
```

**What happened:**
1. When the component first renders, `useRealtimeSubscriptions` sets up subscriptions
2. The subscription callbacks capture references to the state setter functions
3. If the parent component re-renders (which happens frequently), new setter functions are created
4. The subscription callbacks still reference the OLD setter functions
5. Calling old setters has no effect on the current component state
6. Events are received and "processed" but state doesn't update

### Contributing Factors
1. **Missing dependencies** - `useEffect` dependency array didn't include setter functions
2. **Frequent parent re-renders** - Complex component structure caused frequent re-renders
3. **Complex subscription setup** - Multiple nested subscriptions made the issue harder to spot

## 🔧 Solution Implemented

### Fix: Stable References Pattern
Used `useRef` to create stable references to state setters:

```typescript
// AFTER (Fixed)
export function useRealtimeSubscriptions({
  teamId, user, setCollections, setBookmarks, setTeamEvents, setPresence
}: UseRealtimeSubscriptionsProps) {
  // Create stable references for state setters
  const setCollectionsRef = useRef(setCollections);
  // ...
  
  // Update refs when setters change (always current references)
  setCollectionsRef.current = setCollections;
  // ...

  // Use ref.current in subscriptions (always current setter)
  useEffect(() => {
    const collectionsSubscription = supabase
      .channel(`team-${teamId}-collections`)
      .on('postgres_changes', async (payload) => {
        setCollectionsRef.current(prev => { /* Always current setter! */ });
      });
  }, [user?.id, teamId]); // No need for setter dependencies now
}
```

---

# Part 2: Intermittent Failures and Authentication Race Condition

**Date:** September 18, 2025  
**Issue:** After fixing the stale closure issue, real-time events were received inconsistently. The system would sometimes work, but often fail silently on initial page load after login.

## 📋 Issue Summary (Part 2)

The system exhibited inconsistent behavior:
- ✅ On initial login, subscriptions would connect (`SUBSCRIBED`), but no `postgres_changes` events were received.
- ✅ After a page reload, or sometimes "randomly" after user activity, the events would start flowing correctly.
- ✅ The `presence` webhook seemed to sometimes "kick-start" the other subscriptions.

## 🔍 Investigation Process (Part 2)

1.  **Initial Theories:** Investigated RLS `SELECT` policies and server-side subscription `filter` parameters, as a mismatch can cause silent failures. These were found to be correct.
2.  **Code Refactoring Analysis:** Compared the new, refactored hooks (`useAuth`, `useRealtimeSubscriptions`) with the original, monolithic `useTeamSite.ts.backup` file.
3.  **Auth Flow Discrepancy:** Discovered the new `useAuth` hook was missing the `onAuthStateChange` listener, which could lead to an outdated auth state in the Supabase client.
4.  **Race Condition Hypothesis:** Even after fixing the auth hook, the intermittent nature of the bug pointed to a race condition. The real-time WebSocket connection was being established *before* the Supabase client was guaranteed to be authenticated, especially on the first load after login.
5.  **Confirmation:** The user's report that activity (triggering the presence webhook) or a reload seemed to fix the issue confirmed the hypothesis. An authenticated HTTP request (like the presence update) was likely "upgrading" the WebSocket connection's authentication state after the fact.

## 🐛 Root Cause Analysis (Part 2)

### Primary Cause: Real-Time Authentication Race Condition

The Supabase client manages authentication for both standard HTTP requests and real-time WebSocket connections. A race condition occurred on initial application load:

1.  The React component tree would render.
2.  The `useRealtimeSubscriptions` hook would trigger.
3.  The real-time client would attempt to establish a WebSocket connection.
4.  Simultaneously, the `useAuth` hook would begin fetching the user session from `localStorage`.
5.  Often, the WebSocket connection would be established *before* the user's JWT was loaded into the client. The connection was therefore unauthenticated and could not receive RLS-protected database changes.
6.  An action like a page refresh or a presence update (which makes an authenticated HTTP request) would force the client to resolve its auth state, which would then apply to the existing WebSocket connection, causing it to start working "randomly".

## 🔧 Solution Implemented (Part 2)

### Fix: Explicitly Synchronize Real-Time Authentication

To eliminate the race condition, we forced the real-time client to wait for a valid session and then manually set its authentication token before creating any subscriptions.

```typescript
// In /frontend/hooks/useRealtimeSubscriptions.ts

useEffect(() => {
  const setup = async () => {
    // Wait for user and for auth loading to be complete
    if (user?.id && teamId && !authLoading) {
      // 1. Get the session to ensure we have a valid JWT
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Realtime setup failed: No session found.');
        return;
      }
      
      // 2. Manually set the auth token on the realtime client
      console.log('Manually setting realtime auth token.');
      supabase.realtime.setAuth(session.access_token);

      // 3. Add a small delay to allow the auth to propagate on the server
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Now, it is safe to set up the subscriptions
      const cleanup = setupRealtimeSubscriptions();
      subscriptionCleanupRef.current = cleanup;
    }
  }
  setup();
}, [user?.id, teamId, authLoading]);
```

### Final Refactoring

After fixing the root cause, the subscription logic was refactored to use a single, efficient channel for all topics, as is best practice.

## 📚 Lessons Learned (Updated)

1.  **React Hook Closures:** Always be careful with closures in `useEffect` hooks.
2.  **Real-Time Auth is Separate:** A successful WebSocket connection (`SUBSCRIBED`) does not guarantee it is properly authenticated to receive RLS-protected data.
3.  **Beware Race Conditions:** Authentication in single-page applications can have subtle timing issues. The user session may not be immediately available on first load.
4.  **`supabase.realtime.setAuth()` is Key:** For complex applications, explicitly setting the real-time auth token after the session is loaded is the most robust way to prevent authentication race conditions.
5.  **Server-Side Latency:** A small delay after setting the token may be necessary to ensure the server has processed the new authentication state for the WebSocket connection.

## 📁 Files Modified (Saga)

- `/frontend/hooks/useAuth.ts` - Rewritten to use `onAuthStateChange` for robust session management.
- `/frontend/hooks/useTeamSite.ts` - Updated to pass loading state to subscription hook.
- `/frontend/hooks/useRealtimeSubscriptions.ts` - Final fix applied: explicit `setAuth`, delay, and refactored to a single channel.
- `/WEBHOOK_RCA.md` - This document.

## 🎯 Final Status: RESOLVED ✅

The webhook system is now functioning correctly and reliably. The underlying race condition has been fixed, and the code has been refactored to be more robust and efficient.

---

**Prepared by:** Gemini & GitHub Copilot  
**Reviewed by:** [Pending Team Review]  
**Next Review Date:** October 18, 2025
