-- Insert sample data for team-site development and testing
-- Run this in Supabase SQL Editor after 005_create_team_site_tables.sql
-- Only run this for development/testing - DO NOT run in production

-- This assumes you have at least one team and one user already created
-- You can find your team_id and user_id by running:
-- SELECT id, name FROM public.teams;
-- SELECT user_id, email FROM public.profiles;

-- Replace these UUIDs with actual values from your database
-- Example team_id: get from `SELECT id, name FROM public.teams LIMIT 1;`
-- Example user_id: get from `SELECT user_id, email FROM public.profiles WHERE role = 'admin' LIMIT 1;`

DO $$
DECLARE
  sample_team_id uuid;
  sample_user_id uuid;
  collection1_id uuid := gen_random_uuid();
  collection2_id uuid := gen_random_uuid();
  bookmark1_id uuid := gen_random_uuid();
  bookmark2_id uuid := gen_random_uuid();
  bookmark3_id uuid := gen_random_uuid();
BEGIN
  -- Get first available team and admin user
  SELECT id INTO sample_team_id FROM public.teams LIMIT 1;
  SELECT user_id INTO sample_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF sample_team_id IS NULL THEN
    RAISE EXCEPTION 'No teams found. Create a team first via admin panel.';
  END IF;
  
  IF sample_user_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Promote a user to admin first.';
  END IF;
  
  -- Insert sample collections
  INSERT INTO public.collections (id, team_id, name, description, color, created_by) VALUES
  (collection1_id, sample_team_id, 'Design Resources', 'UI/UX design tools and inspiration', '#ff6b6b', sample_user_id),
  (collection2_id, sample_team_id, 'Development Tools', 'Programming resources and documentation', '#4ecdc4', sample_user_id);
  
  -- Insert sample bookmarks
  INSERT INTO public.bookmarks (id, team_id, collection_id, url, title, description, tags, created_by) VALUES
  (bookmark1_id, sample_team_id, collection1_id, 'https://dribbble.com', 'Dribbble', 'Design inspiration and resources', ARRAY['design', 'inspiration', 'ui'], sample_user_id),
  (bookmark2_id, sample_team_id, collection1_id, 'https://figma.com', 'Figma', 'Collaborative design tool', ARRAY['design', 'tool', 'collaboration'], sample_user_id),
  (bookmark3_id, sample_team_id, collection2_id, 'https://github.com', 'GitHub', 'Code hosting and version control', ARRAY['development', 'git', 'collaboration'], sample_user_id);
  
  -- Insert sample team events (activity log)
  INSERT INTO public.team_events (team_id, event_type, actor_id, data) VALUES
  (sample_team_id, 'collection.created', sample_user_id, 
   jsonb_build_object('collection_id', collection1_id, 'collection_name', 'Design Resources')),
  (sample_team_id, 'collection.created', sample_user_id, 
   jsonb_build_object('collection_id', collection2_id, 'collection_name', 'Development Tools')),
  (sample_team_id, 'bookmark.created', sample_user_id, 
   jsonb_build_object('bookmark_id', bookmark1_id, 'bookmark_title', 'Dribbble', 'collection_id', collection1_id)),
  (sample_team_id, 'bookmark.created', sample_user_id, 
   jsonb_build_object('bookmark_id', bookmark2_id, 'bookmark_title', 'Figma', 'collection_id', collection1_id)),
  (sample_team_id, 'bookmark.created', sample_user_id, 
   jsonb_build_object('bookmark_id', bookmark3_id, 'bookmark_title', 'GitHub', 'collection_id', collection2_id));
  
  -- Insert presence (show user as online)
  INSERT INTO public.presence (team_id, user_id, current_page, is_online) VALUES
  (sample_team_id, sample_user_id, 'team-overview', true)
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET last_seen = now(), current_page = 'team-overview', is_online = true;
  
  RAISE NOTICE 'Sample data inserted successfully for team_id: % and user_id: %', sample_team_id, sample_user_id;
  RAISE NOTICE 'Collections created: Design Resources, Development Tools';
  RAISE NOTICE 'Bookmarks created: Dribbble, Figma, GitHub';
  RAISE NOTICE 'Team events and presence data added';
END $$;