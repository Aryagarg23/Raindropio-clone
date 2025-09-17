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

  // Update presence
  const updatePresence = async (isOnline: boolean = true) => {
    if (!user?.id || !teamId) return;

    try {
      console.log(`[PRESENCE] Updating presence for team:`, teamId);
      const { data, error } = await supabase
        .from('presence')
        .upsert({
          team_id: teamId,
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'team_id,user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('[PRESENCE] Failed to update presence:', error);
      } else {
        console.log('[PRESENCE] Presence updated successfully:', data);
      }
    } catch (err) {
      console.error('[PRESENCE] Error updating presence:', err);
    }
  };

  // Activity tracking
  useEffect(() => {
    if (!user || !teamId) return;

    const handleActivity = () => {
      // Clear existing timeout
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }

      // Update presence
      supabase
        .from('presence')
        .update({
          last_seen: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('[PRESENCE] Failed to update activity:', error);
          }
        });

      // Set new timeout for marking offline
      activityTimeoutRef.current = setTimeout(async () => {
        if (user?.id && teamId) {
          console.log(`[PRESENCE] Marking offline due to inactivity in team:`, teamId);
          await supabase
            .from('presence')
            .update({
              is_online: false,
              last_seen: new Date().toISOString()
            })
            .eq('team_id', teamId)
            .eq('user_id', user.id);
        }
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [user, teamId]);

  // Initialize presence after auth and data loading
  useEffect(() => {
    if (user && teamId && !authLoading && !dataLoading) {
      updatePresence(true);
    }
  }, [user, teamId, authLoading, dataLoading]);

  return {
    updatePresence
  };
}