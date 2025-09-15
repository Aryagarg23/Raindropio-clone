-- Fix collection RLS policies to allow all team members to modify collections
-- Run this in Supabase SQL Editor after 010_insert_sample_tags_data.sql

-- Drop the existing restrictive update and delete policies
DROP POLICY IF EXISTS "collections_update_creator" ON public.collections;
DROP POLICY IF EXISTS "collections_delete_creator" ON public.collections;

-- Create new policies that allow any team member to update/delete collections in their team
CREATE POLICY "collections_update_team_member" ON public.collections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = collections.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "collections_delete_team_member" ON public.collections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = collections.team_id AND tm.user_id = auth.uid()
    )
  );

-- Also check if we need to update bookmark policies for consistency
DROP POLICY IF EXISTS "bookmarks_update_creator" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete_creator" ON public.bookmarks;

-- Create new bookmark policies that allow any team member to update/delete bookmarks in their team
CREATE POLICY "bookmarks_update_team_member" ON public.bookmarks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = bookmarks.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "bookmarks_delete_team_member" ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = bookmarks.team_id AND tm.user_id = auth.uid()
    )
  );