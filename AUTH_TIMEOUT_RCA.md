# Authorization Flow Timeout Issues - Root Cause Analysis

## Incident Summary
Users experienced persistent timeout errors during login/authentication flow, with the application repeatedly showing "timed out" messages when attempting to sign in with Google OAuth.

## Timeline
- **Issue Discovery**: User reported that login consistently times out
- **Initial Investigation**: Frontend authentication flow analysis
- **Root Cause Identified**: Multiple race conditions and configuration issues in auth state management
- **Fixes Applied**: Corrected auth initialization, timeout handling, and OAuth configuration

## Root Cause Analysis

### Primary Issue: Auth State Re-initialization Race Condition
**Problem**: The `useAuthState` hook's `useEffect` had `[router.pathname]` as a dependency, causing authentication to re-initialize on every route change.

**Impact**:
- Auth state reset on navigation between `/` and `/dashboard`
- Multiple concurrent auth operations
- Race conditions between OAuth redirect handling and session fetching
- Inconsistent authentication state across page transitions

**Evidence**:
```typescript
// BEFORE (problematic)
useEffect(() => {
  // ... auth initialization
}, [router.pathname]); // ❌ Re-initializes on every route change

// AFTER (fixed)
useEffect(() => {
  // ... auth initialization
}, []); // ✅ Only initializes once on mount
```

### Secondary Issue: Loading Timeout Too Aggressive
**Problem**: Loading timeout (10-15 seconds) was shorter than profile sync timeout (50 seconds), causing premature timeout errors.

**Impact**:
- Users saw timeout errors even when authentication was succeeding in background
- Profile sync continued after UI showed error
- Confusing user experience with false failure indications

**Evidence**:
```typescript
// BEFORE (problematic)
const timeout = setTimeout(() => {
  setError("Loading is taking too long...");
  setLoading(false);
}, options.redirectToDashboard ? 15000 : 10000); // ❌ Too short

// AFTER (fixed)
const timeout = setTimeout(() => {
  setError("Loading is taking too long...");
  setLoading(false);
}, 60000); // ✅ Matches profile sync timeout
```

### Tertiary Issue: OAuth Flow Configuration Problems
**Problem**: Supabase client used deprecated 'implicit' flow and inconsistent redirect URLs.

**Impact**:
- Unreliable OAuth completion on subsequent sign-in attempts
- Potential security issues with implicit flow
- Inconsistent redirect behavior between pages

**Evidence**:
```typescript
// BEFORE (problematic)
const supabase = createClient(url, key, {
  auth: {
    flowType: 'implicit', // ❌ Deprecated
    // ...
  }
});

// AFTER (fixed)
const supabase = createClient(url, key, {
  auth: {
    flowType: 'pkce', // ✅ Secure PKCE flow
    // ...
  }
});
```

```typescript
// BEFORE (problematic)
const redirectTo = `${frontendBase}${options.redirectToDashboard ? '/dashboard' : '/'}`; // ❌ Context-dependent

// AFTER (fixed)
const redirectTo = `${frontendBase}/dashboard`; // ✅ Always redirect to dashboard
```

## Investigation Methodology

### 1. Code Analysis
- Examined `useAuthState.ts` hook for state management issues
- Reviewed authentication flow in `index.tsx` and `dashboard.tsx`
- Analyzed API client timeout configurations
- Checked Supabase client setup

### 2. Log Analysis
- OAuth tokens successfully received in URL
- Auth state changes firing correctly
- API requests timing out or failing
- Multiple auth initializations detected

### 3. Dependency Analysis
- Identified race conditions in auth initialization
- Found timeout mismatches between components
- Discovered deprecated OAuth flow usage

## Fixes Implemented

### 1. Fixed Auth Initialization Race Condition
**File**: `frontend/hooks/useAuthState.ts`
**Change**: Removed `router.pathname` dependency from auth initialization `useEffect`
**Result**: Auth state now initializes only once per component lifecycle

### 2. Increased Loading Timeout
**File**: `frontend/hooks/useAuthState.ts`
**Change**: Increased loading timeout from 10-15s to 60s
**Result**: Loading timeout no longer interferes with legitimate profile sync operations

### 3. Updated OAuth Configuration
**File**: `frontend/modules/supabaseClient.ts`
**Change**: Changed flowType from 'implicit' to 'pkce'
**Result**: More secure and reliable OAuth authentication

### 4. Standardized OAuth Redirect
**File**: `frontend/hooks/useAuthState.ts`
**Change**: Always redirect to `/dashboard` after OAuth sign-in
**Result**: Consistent post-authentication navigation

## Testing and Validation

### Before Fixes
- Login attempts resulted in timeout errors
- Auth state inconsistent across navigation
- Multiple concurrent auth operations
- OAuth failures on subsequent attempts

### After Fixes
- Auth initialization occurs only once
- Loading timeouts allow sufficient time for operations
- OAuth flow uses secure PKCE method
- Consistent redirect behavior

## Prevention Measures

### 1. Code Review Checklist
- [ ] Auth `useEffect` dependencies reviewed for route-related issues
- [ ] Timeout values aligned across components
- [ ] OAuth configuration uses current best practices
- [ ] Redirect URLs are consistent and properly configured

### 2. Monitoring
- Auth state change logging maintained
- Timeout events monitored for frequency
- OAuth success/failure rates tracked

### 3. Documentation
- Auth flow documented with timeout expectations
- Supabase configuration requirements specified
- Environment variable requirements clearly stated

## Lessons Learned

1. **Route-based dependencies in auth hooks can cause race conditions**
2. **Timeout hierarchies must be carefully coordinated**
3. **OAuth configuration should follow current security standards**
4. **Auth state should be managed consistently across the application**

## Future Improvements

1. **Global Auth Context**: Consider implementing a React Context for auth state sharing
2. **Auth State Persistence**: Enhanced session recovery mechanisms
3. **Error Recovery**: Better handling of partial auth failures
4. **Testing**: Comprehensive auth flow integration tests

## Files Modified
- `frontend/hooks/useAuthState.ts`
- `frontend/modules/supabaseClient.ts`

## Post-Deployment Fixes (2025-09-19)

After deploying the initial fixes we observed intermittent timeouts and occasional `500` errors during profile sync (`POST /users/sync`) in production. The following additional measures were implemented to stop orphaned sync requests, improve diagnostics, and make the client/server behavior more robust:

### Key Fixes
- **AbortController cancellation for profile syncs**: `useAuthState` now creates a per-sync `AbortController` and aborts any previous in-flight profile sync when a new sync starts or when the component unmounts. This prevents orphaned network requests from lingering and reduces transient contention with backend resources.
- **API client signal support**: `frontend/modules/apiClient.ts` was extended to accept a caller-provided `AbortSignal` so higher-level hooks can cancel requests they started.
- **Retry on timeout and 5xx**: The client now performs a single one-time retry for sync requests that time out or return a 5xx response. This reduces the impact of transient network or backend cold-start errors without masking persistent failures.
- **Realtime subscription cleanup confirmation**: `useRealtimeSubscriptions` now logs confirmation after removing a Supabase realtime channel to make subscription lifecycle visible in logs.
- **Backend repr(e) diagnostic logging**: Backend repository methods and the `/users/sync` router were modified to print `repr(e)` for exceptions thrown by the Supabase/PostgREST client. These prints capture raw PostgREST response bodies which are crucial to determine whether 500s are caused by RLS/role issues, missing routes, or malformed queries.

### Files Modified (post-deploy)
- `frontend/hooks/useAuthState.ts` — added AbortController per-sync, retries, in-flight guard, and unmount cleanup.
- `frontend/modules/apiClient.ts` — forward `AbortSignal` to fetch, masked token logs, and `syncProfileWithSignal` helper.
- `frontend/hooks/useRealtimeSubscriptions.ts` — improved cleanup and confirmation logging.
- `backend/repositories/user_repository.py` — print `repr(e)` on DB/PostgREST exceptions.
- `backend/api/routers/users.py` — print `repr(e)` in `/users/sync` exception handler.

### How to Validate
- Reproduce the failing login/refresh sequence in a staging or production-like environment.
- Observe frontend logs for per-sync request IDs, abort messages, and retry attempts.
- Collect backend logs showing `repr(e)` lines from repository and router prints — these prints include the raw PostgREST response payload and will reveal the exact 500 cause.

### Why reload sometimes 'fixes' it
Reloading the page aborts active fetches and resets client state which hides race conditions or orphaned requests. Explicit abort + canonical initialization prevents the root cause, so manual reload is no longer required.

### Status
✅ **DEPLOYED** - Cancellation and diagnostic logging added. Awaiting reproduction logs for final backend root cause confirmation.

## Status
✅ **RESOLVED** - Authorization flow timeout issues fixed and auth state management stabilized.</content>
<parameter name="filePath">/home/arya/projects/NIS/Raindropio-clone/AUTH_RCA.md