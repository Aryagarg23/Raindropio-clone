-- Add infinite nesting support to collections (fixed: avoid reserved word `position`)
-- Run this in Supabase SQL Editor after 008_insert_sample_highlights_data.sql

-- Add parent_id column to collections for infinite nesting
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add index for performance on parent_id
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);

-- Add sort_order column for sorting nested collections (avoid reserved word `position`)
ALTER TABLE public.collections
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add index for sort_order to help ordering
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON public.collections(sort_order);

-- Add helper function to get collection hierarchy
CREATE OR REPLACE FUNCTION public.get_collection_hierarchy(team_uuid uuid)
RETURNS TABLE (
  id uuid,
  team_id uuid,
  name text,
  description text,
  color text,
  parent_id uuid,
  sort_order integer,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  level integer,
  path text[]
) AS $$
BEGIN
  -- Check if user is member of the team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = team_uuid AND tm.user_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied: not a member of this team';
  END IF;
  
  RETURN QUERY
  WITH RECURSIVE collection_tree AS (
    -- Base case: root collections (no parent)
    SELECT 
      c.id, c.team_id, c.name, c.description, c.color, c.parent_id, c.sort_order,
      c.created_by, c.created_at, c.updated_at,
      0 as level,
      ARRAY[c.name] as path
    FROM public.collections c
    WHERE c.team_id = team_uuid AND c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child collections
    SELECT 
      c.id, c.team_id, c.name, c.description, c.color, c.parent_id, c.sort_order,
      c.created_by, c.created_at, c.updated_at,
      ct.level + 1,
      ct.path || c.name
    FROM public.collections c
    INNER JOIN collection_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM collection_tree
  ORDER BY level, sort_order, name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a collection move would create a cycle
CREATE OR REPLACE FUNCTION public.would_create_cycle(
  collection_uuid uuid, 
  new_parent_uuid uuid
) RETURNS boolean AS $$
BEGIN
  -- If new parent is null (moving to root), no cycle possible
  IF new_parent_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if new_parent_uuid is a descendant of collection_uuid
  RETURN EXISTS (
    WITH RECURSIVE descendants AS (
      -- Base case: direct children
      SELECT id, parent_id FROM public.collections 
      WHERE parent_id = collection_uuid
      
      UNION ALL
      
      -- Recursive case: children of children
      SELECT c.id, c.parent_id
      FROM public.collections c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT 1 FROM descendants WHERE id = new_parent_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent cycles when updating parent_id
CREATE OR REPLACE FUNCTION public.prevent_collection_cycles()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if parent_id is being changed
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    IF public.would_create_cycle(NEW.id, NEW.parent_id) THEN
      RAISE EXCEPTION 'Cannot move collection: would create a cycle';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS prevent_collection_cycles_trigger ON public.collections;
CREATE TRIGGER prevent_collection_cycles_trigger
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_collection_cycles();