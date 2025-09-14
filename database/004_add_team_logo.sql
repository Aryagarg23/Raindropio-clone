-- Add logo_url column to teams table
-- Run this in Supabase SQL Editor after 003_create_teams_memberships.sql

ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.teams.logo_url IS 'URL to team logo/avatar image';