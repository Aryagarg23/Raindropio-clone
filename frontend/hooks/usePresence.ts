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
  
  // WORKAROUND for a build toolchain bug.
  // Removing the line below causes a "Cannot read properties of null" TypeError
  // in the completely unrelated useDragDrop.ts hook. This suggests a Heisenbug
  // in the build process (e.g., Webpack/Babel/Next.js) where adding or removing
  // this hook changes the compiled output in a way that avoids the error.
  // Do not remove this line until the underlying toolchain bug is resolved.
  const activityHandlerRef = useRef<(() => void) | null>(null);
  
  const lastActivityUpdateRef = useRef<number>(0);
  const activityThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update presence
  const updatePresence = async () => {
    if (!user?.id || !teamId) return;

    try {
      const { error } = await supabase.rpc('touch_presence', {
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
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastActivityUpdateRef.current;
      const shouldUpdate = timeSinceLastUpdate > 30000; // 30 seconds

      if (shouldUpdate) {
        updateActivityInDatabase();
      } else {
        if (activityThrottleTimeoutRef.current) {
          clearTimeout(activityThrottleTimeoutRef.current);
        }
        
        const timeUntilNextUpdate = 30000 - timeSinceLastUpdate;
        activityThrottleTimeoutRef.current = setTimeout(() => {
          updateActivityInDatabase();
        }, timeUntilNextUpdate);
      }

      activityTimeoutRef.current = setTimeout(() => {
        console.log(`[PRESENCE] User inactive for 5 minutes in team:`, teamId);
      }, 5 * 60 * 1000);
    };

    const activityEvents = ['mousemove', 'keypress', 'click', 'scroll'];
    activityEvents.forEach(event => document.addEventListener(event, handleActivity));

    handleActivity();

    return () => {
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (activityThrottleTimeoutRef.current) clearTimeout(activityThrottleTimeoutRef.current);
      activityEvents.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [user, teamId]);

  useEffect(() => {
    if (user && teamId && !authLoading && !dataLoading) {
      updatePresence();
    }
  }, [user, teamId, authLoading, dataLoading]);

  return {
    updatePresence
  };
}