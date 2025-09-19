-- Create team-site collections and bookmarks tables
-- Run this in Supabase SQL Editor after 004_add_team_logo.sql

-- 1. COLLECTIONS Table (like Raindrop folders)
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#007acc',
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. BOOKMARKS Table (like Raindrop links/items)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  url text NOT NULL,
  title text,
  description text,
  favicon_url text,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TEAM_EVENTS Table (activity log for realtime updates)
CREATE TABLE IF NOT EXISTS public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'bookmark.created', 'collection.updated', 'bookmark.deleted', etc
  actor_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  data jsonb NOT NULL, -- Event payload: affected object IDs, old/new values, etc
  created_at timestamptz DEFAULT now()
);

-- 4. PRESENCE Table (who's currently active in team workspace)
CREATE TABLE IF NOT EXISTS public.presence (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  last_seen timestamptz DEFAULT now(),
  current_page text, -- e.g., 'team-overview', 'collection:uuid', 'bookmark:uuid'
  is_online boolean DEFAULT true,
  PRIMARY KEY (team_id, user_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_collections_team_id ON public.collections(team_id);
CREATE INDEX IF NOT EXISTS idx_collections_created_by ON public.collections(created_by);
CREATE INDEX IF NOT EXISTS idx_bookmarks_team_id ON public.bookmarks(team_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_collection_id ON public.bookmarks(collection_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_by ON public.bookmarks(created_by);
CREATE INDEX IF NOT EXISTS idx_bookmarks_url ON public.bookmarks(url);
CREATE INDEX IF NOT EXISTS idx_team_events_team_id ON public.team_events(team_id);
CREATE INDEX IF NOT EXISTS idx_team_events_created_at ON public.team_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_team_id ON public.presence(team_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON public.presence(last_seen DESC);

-- Enable RLS on new tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for COLLECTIONS table

-- Users can read collections from teams they belong to
CREATE POLICY "collections_select_team_member" ON public.collections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = collections.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create collections in teams they belong to
CREATE POLICY "collections_insert_team_member" ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = collections.team_id AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update collections they created in their teams
CREATE POLICY "collections_update_creator" ON public.collections
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = collections.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can delete collections they created
CREATE POLICY "collections_delete_creator" ON public.collections
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for collections
CREATE POLICY "collections_admin_all" ON public.collections
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- RLS Policies for BOOKMARKS table

-- Users can read bookmarks from teams they belong to
CREATE POLICY "bookmarks_select_team_member" ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = bookmarks.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create bookmarks in teams they belong to
CREATE POLICY "bookmarks_insert_team_member" ON public.bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = bookmarks.team_id AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update bookmarks they created
CREATE POLICY "bookmarks_update_creator" ON public.bookmarks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = bookmarks.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can delete bookmarks they created
CREATE POLICY "bookmarks_delete_creator" ON public.bookmarks
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for bookmarks
CREATE POLICY "bookmarks_admin_all" ON public.bookmarks
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- RLS Policies for TEAM_EVENTS table

-- Users can read events from teams they belong to
CREATE POLICY "team_events_select_team_member" ON public.team_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_events.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create events in teams they belong to (for activity tracking)
CREATE POLICY "team_events_insert_team_member" ON public.team_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_events.team_id AND tm.user_id = auth.uid()
    )
    AND actor_id = auth.uid()
  );

-- Admin policies for team events
CREATE POLICY "team_events_admin_all" ON public.team_events
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- RLS Policies for PRESENCE table

-- Users can read presence from teams they belong to
CREATE POLICY "presence_select_team_member" ON public.presence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = presence.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can update their own presence in teams they belong to
CREATE POLICY "presence_upsert_own" ON public.presence
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = presence.team_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = presence.team_id AND tm.user_id = auth.uid()
    )
  );

-- Admin policies for presence
CREATE POLICY "presence_admin_all" ON public.presence
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;

-- Add useful helper functions
CREATE OR REPLACE FUNCTION public.get_team_collections(team_uuid uuid)
RETURNS SETOF public.collections AS $$
BEGIN
  -- Check if user is member of the team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_uuid AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.collections c
  WHERE c.team_id = team_uuid
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_collection_bookmarks(collection_uuid uuid)
RETURNS SETOF public.bookmarks AS $$
DECLARE
  team_uuid uuid;
BEGIN
  -- Get team_id from collection and verify access
  SELECT c.team_id INTO team_uuid
  FROM public.collections c
  WHERE c.id = collection_uuid;
  
  IF team_uuid IS NULL THEN
    RAISE EXCEPTION 'Collection not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_uuid AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.bookmarks b
  WHERE b.collection_id = collection_uuid
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;