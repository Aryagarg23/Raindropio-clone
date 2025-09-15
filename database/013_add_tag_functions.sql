-- Function to get all unique tags used in a team for autocomplete
CREATE OR REPLACE FUNCTION public.get_team_tags(team_uuid uuid)
RETURNS TABLE (tag text, usage_count bigint) AS $$
BEGIN
  -- Verify user has access to this team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_uuid AND tm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;

  RETURN QUERY
  SELECT 
    unnest(b.tags) as tag,
    COUNT(*) as usage_count
  FROM public.bookmarks b
  WHERE b.team_id = team_uuid
    AND b.tags IS NOT NULL 
    AND array_length(b.tags, 1) > 0
  GROUP BY unnest(b.tags)
  ORDER BY usage_count DESC, tag ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bookmark tags
CREATE OR REPLACE FUNCTION public.update_bookmark_tags(
  bookmark_uuid uuid,
  new_tags text[]
)
RETURNS void AS $$
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

  -- Update the bookmark tags
  UPDATE public.bookmarks 
  SET 
    tags = new_tags,
    updated_at = now()
  WHERE id = bookmark_uuid;
  
  -- Log team event
  INSERT INTO public.team_events (team_id, event_type, actor_id, data)
  VALUES (
    bookmark_team_id,
    'bookmark.tags_updated',
    auth.uid(),
    jsonb_build_object(
      'bookmark_id', bookmark_uuid,
      'tags', new_tags
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;