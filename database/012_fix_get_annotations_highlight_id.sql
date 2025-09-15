-- Fix get_annotations function to return highlight_id field
-- This is needed for proper filtering of highlight-specific vs general annotations

DROP FUNCTION IF EXISTS public.get_annotations(uuid, uuid);

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