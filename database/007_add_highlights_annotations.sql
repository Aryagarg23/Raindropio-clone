-- Add highlighting and annotation features to team-site
-- Run this in Supabase SQL Editor after 006_insert_sample_team_site_data.sql

-- 1. HIGHLIGHTS Table (text selections on bookmarks)
CREATE TABLE IF NOT EXISTS public.highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id uuid NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  -- Text selection data
  selected_text text NOT NULL, -- The actual highlighted text
  text_before text, -- Context before selection (for re-finding text)
  text_after text, -- Context after selection (for re-finding text)
  -- Position data for re-highlighting
  start_offset integer, -- Character offset where selection starts
  end_offset integer, -- Character offset where selection ends
  xpath_start text, -- XPath to start element (for robust positioning)
  xpath_end text, -- XPath to end element
  -- Styling
  color text DEFAULT '#ffeb3b', -- Highlight color
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ANNOTATIONS Table (comments/notes on highlights or bookmarks)
CREATE TABLE IF NOT EXISTS public.annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bookmark_id uuid NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  highlight_id uuid REFERENCES public.highlights(id) ON DELETE CASCADE, -- null = annotation on bookmark itself
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  -- Content
  content text NOT NULL, -- The annotation text/comment
  annotation_type text DEFAULT 'comment' CHECK (annotation_type IN ('comment', 'question', 'important', 'idea')),
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. ANNOTATION_REACTIONS Table (likes, replies to annotations)
CREATE TABLE IF NOT EXISTS public.annotation_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id uuid NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'agree', 'disagree', 'question')),
  created_at timestamptz DEFAULT now(),
  -- Prevent duplicate reactions from same user
  UNIQUE(annotation_id, created_by, reaction_type)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_highlights_bookmark_id ON public.highlights(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_highlights_team_id ON public.highlights(team_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_by ON public.highlights(created_by);
CREATE INDEX IF NOT EXISTS idx_annotations_bookmark_id ON public.annotations(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_annotations_highlight_id ON public.annotations(highlight_id);
CREATE INDEX IF NOT EXISTS idx_annotations_team_id ON public.annotations(team_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created_by ON public.annotations(created_by);
CREATE INDEX IF NOT EXISTS idx_annotation_reactions_annotation_id ON public.annotation_reactions(annotation_id);

-- Enable RLS on new tables
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotation_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for HIGHLIGHTS table

-- Users can read highlights from teams they belong to
CREATE POLICY "highlights_select_team_member" ON public.highlights
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = highlights.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create highlights in teams they belong to
CREATE POLICY "highlights_insert_team_member" ON public.highlights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = highlights.team_id AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update/delete their own highlights
CREATE POLICY "highlights_update_creator" ON public.highlights
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "highlights_delete_creator" ON public.highlights
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for highlights
CREATE POLICY "highlights_admin_all" ON public.highlights
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- RLS Policies for ANNOTATIONS table

-- Users can read annotations from teams they belong to
CREATE POLICY "annotations_select_team_member" ON public.annotations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = annotations.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create annotations in teams they belong to
CREATE POLICY "annotations_insert_team_member" ON public.annotations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = annotations.team_id AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update/delete their own annotations
CREATE POLICY "annotations_update_creator" ON public.annotations
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "annotations_delete_creator" ON public.annotations
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for annotations
CREATE POLICY "annotations_admin_all" ON public.annotations
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- RLS Policies for ANNOTATION_REACTIONS table

-- Users can read reactions from teams they belong to
CREATE POLICY "annotation_reactions_select_team_member" ON public.annotation_reactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = annotation_reactions.team_id AND tm.user_id = auth.uid()
    )
  );

-- Users can create reactions in teams they belong to
CREATE POLICY "annotation_reactions_insert_team_member" ON public.annotation_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = annotation_reactions.team_id AND tm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can delete their own reactions
CREATE POLICY "annotation_reactions_delete_creator" ON public.annotation_reactions
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admin policies for annotation reactions
CREATE POLICY "annotation_reactions_admin_all" ON public.annotation_reactions
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Triggers to auto-update updated_at
CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.highlights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.annotation_reactions;

-- Helper functions for highlights and annotations

-- Get all highlights for a bookmark with creator info
CREATE OR REPLACE FUNCTION public.get_bookmark_highlights(bookmark_uuid uuid)
RETURNS TABLE (
  highlight_id uuid,
  selected_text text,
  color text,
  start_offset integer,
  end_offset integer,
  created_at timestamptz,
  creator_name text,
  creator_avatar text,
  creator_id uuid
) AS $$
DECLARE
  bookmark_team_id uuid;
BEGIN
  -- Get team_id from bookmark and verify access
  SELECT b.team_id INTO bookmark_team_id
  FROM public.bookmarks b
  WHERE b.id = bookmark_uuid;
  
  IF bookmark_team_id IS NULL THEN
    RAISE EXCEPTION 'Bookmark not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = bookmark_team_id AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;
  
  RETURN QUERY
  SELECT 
    h.id as highlight_id,
    h.selected_text,
    h.color,
    h.start_offset,
    h.end_offset,
    h.created_at,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    h.created_by as creator_id
  FROM public.highlights h
  JOIN public.profiles p ON h.created_by = p.user_id
  WHERE h.bookmark_id = bookmark_uuid
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get annotations for a bookmark or highlight with creator info and reaction counts
CREATE OR REPLACE FUNCTION public.get_annotations(
  bookmark_uuid uuid,
  highlight_uuid uuid DEFAULT NULL
)
RETURNS TABLE (
  annotation_id uuid,
  content text,
  annotation_type text,
  created_at timestamptz,
  creator_name text,
  creator_avatar text,
  creator_id uuid,
  highlight_id uuid,
  like_count integer,
  user_liked boolean
) AS $$
DECLARE
  bookmark_team_id uuid;
BEGIN
  -- Get team_id from bookmark and verify access
  SELECT b.team_id INTO bookmark_team_id
  FROM public.bookmarks b
  WHERE b.id = bookmark_uuid;
  
  IF bookmark_team_id IS NULL THEN
    RAISE EXCEPTION 'Bookmark not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = bookmark_team_id AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id as annotation_id,
    a.content,
    a.annotation_type,
    a.created_at,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    a.created_by as creator_id,
    a.highlight_id,
    COALESCE(reaction_counts.like_count, 0)::integer as like_count,
    COALESCE(user_reactions.user_liked, false) as user_liked
  FROM public.annotations a
  JOIN public.profiles p ON a.created_by = p.user_id
  LEFT JOIN (
    SELECT 
      ar.annotation_id,
      COUNT(*) FILTER (WHERE ar.reaction_type = 'like') as like_count
    FROM public.annotation_reactions ar
    GROUP BY ar.annotation_id
  ) reaction_counts ON a.id = reaction_counts.annotation_id
  LEFT JOIN (
    SELECT 
      ar.annotation_id,
      true as user_liked
    FROM public.annotation_reactions ar
    WHERE ar.created_by = auth.uid() AND ar.reaction_type = 'like'
  ) user_reactions ON a.id = user_reactions.annotation_id
  WHERE a.bookmark_id = bookmark_uuid
    AND (highlight_uuid IS NULL OR a.highlight_id = highlight_uuid)
  ORDER BY a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create team event when highlight is created
CREATE OR REPLACE FUNCTION public.log_highlight_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_events (team_id, event_type, actor_id, data)
  VALUES (
    NEW.team_id,
    'highlight.created',
    NEW.created_by,
    jsonb_build_object(
      'highlight_id', NEW.id,
      'bookmark_id', NEW.bookmark_id,
      'selected_text', LEFT(NEW.selected_text, 100) || CASE WHEN LENGTH(NEW.selected_text) > 100 THEN '...' ELSE '' END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create team event when annotation is created
CREATE OR REPLACE FUNCTION public.log_annotation_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_events (team_id, event_type, actor_id, data)
  VALUES (
    NEW.team_id,
    'annotation.created',
    NEW.created_by,
    jsonb_build_object(
      'annotation_id', NEW.id,
      'bookmark_id', NEW.bookmark_id,
      'highlight_id', NEW.highlight_id,
      'content', LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to log events
CREATE TRIGGER log_highlight_created
  AFTER INSERT ON public.highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.log_highlight_event();

CREATE TRIGGER log_annotation_created
  AFTER INSERT ON public.annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_annotation_event();