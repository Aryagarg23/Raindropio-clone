import { useEffect, useRef } from 'react';
import supabase from '../modules/supabaseClient';

interface UsePresenceProps {
  teamId: string;
  user: any;
  authLoading: boolean;
  dataLoading: boolean;
}

export function usePresence({ teamId, user, authLoading, dataLoading }: UsePresenceProps) {
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityHandlerRef = useRef<(() => void) | null>(null);
  const lastActivityUpdateRef = useRef<number>(0);
  const activityThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update presence
  const updatePresence = async () => {
    if (!user?.id || !teamId) return;

    try {
      // Use server-side RPC to stamp last_seen with server time and avoid client clock skew
      const { data, error } = await supabase.rpc('touch_presence', {
        team: teamId,
        userid: user.id
      });

      if (error) {
        console.error('[PRESENCE] touch_presence RPC failed:', error);
      } else {
        console.log('[PRESENCE] touch_presence invoked for team:', teamId);
      }
    } catch (err) {
      console.error('[PRESENCE] Error updating presence:', err);
    }
  };

  // Activity tracking
  useEffect(() => {
    if (!user || !teamId) return;

    const updateActivityInDatabase = async () => {
      try {
        // Use RPC to update presence with server timestamp
        await supabase.rpc('touch_presence', {
          team: teamId,
          userid: user.id
        });
        
        lastActivityUpdateRef.current = Date.now();
      } catch (error) {
        console.error('[PRESENCE] Failed to update activity:', error);
      }
    };

    const handleActivity = () => {
      // Clear existing offline timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Throttle database updates to at most once every 30 seconds
      const now = Date.now();
      const timeSinceLastUpdate = now - lastActivityUpdateRef.current;
      const shouldUpdate = timeSinceLastUpdate > 30000; // 30 seconds

      if (shouldUpdate) {
        // Update immediately if it's been more than 30 seconds
        updateActivityInDatabase();
      } else {
        // Clear any pending throttled update
        if (activityThrottleTimeoutRef.current) {
          clearTimeout(activityThrottleTimeoutRef.current);
        }
        
        // Schedule an update for when the throttle period is over
        const timeUntilNextUpdate = 30000 - timeSinceLastUpdate;
        activityThrottleTimeoutRef.current = setTimeout(() => {
          updateActivityInDatabase();
        }, timeUntilNextUpdate);
      }

      // Set new timeout for marking offline (5 minutes)
      // Note: With last_seen only approach, we don't need to explicitly mark offline
      // The UI will compute offline status from last_seen age
      activityTimeoutRef.current = setTimeout(() => {
        console.log(`[PRESENCE] User inactive for 5 minutes in team:`, teamId);
        // No action needed - UI will show offline based on last_seen age
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Activity handlers
    const handleMouseMove = () => handleActivity();
    const handleKeyPress = () => handleActivity();
    const handleClick = () => handleActivity();
    const handleScroll = () => handleActivity();

    // Store activity handler
    activityHandlerRef.current = handleActivity;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);

    // Initial activity
    handleActivity();

    // Cleanup
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (activityThrottleTimeoutRef.current) {
        clearTimeout(activityThrottleTimeoutRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [user, teamId]);

  // Initialize presence after auth and data loading
  useEffect(() => {
    if (user && teamId && !authLoading && !dataLoading) {
      updatePresence();
    }
  }, [user, teamId, authLoading, dataLoading]);

  return {
    updatePresence
  };
}