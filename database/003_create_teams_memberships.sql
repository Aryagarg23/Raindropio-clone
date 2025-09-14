-- Create teams and team_memberships tables
-- Run this in Supabase SQL Editor after 002_fix_service_role_policies.sql

-- First, create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';

-- 1. TEAMS Table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL
);

-- 2. TEAM_MEMBERSHIPS Table (join table)
CREATE TABLE IF NOT EXISTS public.team_memberships (
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (team_id, user_id) -- Prevents duplicate memberships
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON public.team_memberships(team_id);

-- Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role from profiles table
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies for TEAMS table

-- Users can read teams they are members of
CREATE POLICY "teams_select_member" ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

-- Admins can read all teams
CREATE POLICY "teams_select_admin" ON public.teams
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only admins can insert teams
CREATE POLICY "teams_insert_admin" ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

-- Only admins can update teams
CREATE POLICY "teams_update_admin" ON public.teams
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Only admins can delete teams
CREATE POLICY "teams_delete_admin" ON public.teams
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Service role policies for teams (backend operations)
CREATE POLICY "teams_select_service_role" ON public.teams
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "teams_insert_service_role" ON public.teams
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "teams_update_service_role" ON public.teams
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "teams_delete_service_role" ON public.teams
  FOR DELETE
  TO service_role
  USING (true);

-- RLS Policies for TEAM_MEMBERSHIPS table

-- Users can read their own memberships
CREATE POLICY "team_memberships_select_own" ON public.team_memberships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all memberships
CREATE POLICY "team_memberships_select_admin" ON public.team_memberships
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only admins can insert memberships
CREATE POLICY "team_memberships_insert_admin" ON public.team_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

-- Only admins can delete memberships
CREATE POLICY "team_memberships_delete_admin" ON public.team_memberships
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- Service role policies for team_memberships (backend operations)
CREATE POLICY "team_memberships_select_service_role" ON public.team_memberships
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "team_memberships_insert_service_role" ON public.team_memberships
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "team_memberships_update_service_role" ON public.team_memberships
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "team_memberships_delete_service_role" ON public.team_memberships
  FOR DELETE
  TO service_role
  USING (true);

-- Optional: Create a view for easier team queries with member counts
CREATE OR REPLACE VIEW public.teams_with_member_count AS
SELECT 
  t.*,
  COUNT(tm.user_id) as member_count
FROM public.teams t
LEFT JOIN public.team_memberships tm ON t.id = tm.team_id
GROUP BY t.id, t.name, t.description, t.created_at, t.created_by;

-- Grant access to the view
GRANT SELECT ON public.teams_with_member_count TO authenticated, service_role;

-- Create RLS policy for the view (inherits from underlying tables)
ALTER VIEW public.teams_with_member_count SET (security_invoker = true);