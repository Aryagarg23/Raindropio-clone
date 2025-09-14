-- Fix RLS policies to allow service role access
-- This allows the backend service to update profiles using the service role key

-- Add service role policies for profiles table
CREATE POLICY "profile_select_service_role" ON public.profiles
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "profile_insert_service_role" ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "profile_update_service_role" ON public.profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "profile_delete_service_role" ON public.profiles
  FOR DELETE
  TO service_role
  USING (true);

-- Note: service_role bypasses RLS by default, but these policies ensure
-- explicit permission in case RLS behavior changes in future Supabase versions