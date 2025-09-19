-- Update get_bookmark_highlights function to return XPath data for robust positioning
-- This enables better highlight rendering using XPath information

DROP FUNCTION IF EXISTS public.get_bookmark_highlights(uuid);

CREATE OR REPLACE FUNCTION public.get_bookmark_highlights(bookmark_uuid uuid)
RETURNS TABLE (
  highlight_id uuid,
  selected_text text,
  color text,
  start_offset integer,
  end_offset integer,
  xpath_start text,
  xpath_end text,
  text_before text,
  text_after text,
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
    h.xpath_start,
    h.xpath_end,
    h.text_before,
    h.text_after,
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
