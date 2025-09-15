-- Insert sample highlighting and annotation data
-- Run this in Supabase SQL Editor after 007_add_highlights_annotations.sql
-- This adds realistic test data for highlights and annotations

DO $$
DECLARE
  sample_team_id uuid;
  sample_user_id uuid;
  second_user_id uuid;
  sample_bookmark_id uuid;
  highlight1_id uuid := gen_random_uuid();
  highlight2_id uuid := gen_random_uuid();
  highlight3_id uuid := gen_random_uuid();
  annotation1_id uuid := gen_random_uuid();
  annotation2_id uuid := gen_random_uuid();
  annotation3_id uuid := gen_random_uuid();
BEGIN
  -- Get existing data
  SELECT id INTO sample_team_id FROM public.teams LIMIT 1;
  SELECT user_id INTO sample_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  SELECT user_id INTO second_user_id FROM public.profiles WHERE role = 'user' LIMIT 1;
  SELECT id INTO sample_bookmark_id FROM public.bookmarks LIMIT 1;
  
  -- If no regular user exists, use admin for both
  IF second_user_id IS NULL THEN
    second_user_id := sample_user_id;
  END IF;
  
  IF sample_team_id IS NULL OR sample_user_id IS NULL OR sample_bookmark_id IS NULL THEN
    RAISE EXCEPTION 'Missing required data. Ensure teams, users, and bookmarks exist first.';
  END IF;
  
  -- Insert sample highlights with realistic text selections
  INSERT INTO public.highlights (id, bookmark_id, team_id, created_by, selected_text, text_before, text_after, start_offset, end_offset, color) VALUES
  (highlight1_id, sample_bookmark_id, sample_team_id, sample_user_id, 
   'collaborative design tool for teams', 
   'Figma is a ', ' to create, prototype, and iterate on designs together.',
   12, 45, '#ffeb3b'),
  
  (highlight2_id, sample_bookmark_id, sample_team_id, second_user_id,
   'real-time collaboration',
   'The key feature is ', ' which allows multiple designers to work simultaneously.',
   67, 89, '#4caf50'),
   
  (highlight3_id, sample_bookmark_id, sample_team_id, sample_user_id,
   'version control for design files',
   'Unlike traditional tools, it offers ', ' making it easier to track changes.',
   134, 165, '#f44336');
  
  -- Insert sample annotations
  -- Annotation on bookmark (no highlight_id)
  INSERT INTO public.annotations (id, bookmark_id, highlight_id, team_id, created_by, content, annotation_type) VALUES
  (annotation1_id, sample_bookmark_id, NULL, sample_team_id, sample_user_id,
   'This is a great resource for our design system work. We should standardize on this tool for the team.',
   'important'),
  
  -- Annotation on first highlight
  (annotation2_id, sample_bookmark_id, highlight1_id, sample_team_id, second_user_id,
   'Agreed! The collaboration features are exactly what we need for our multi-designer projects.',
   'comment'),
   
  -- Question annotation on second highlight
  (annotation3_id, sample_bookmark_id, highlight2_id, sample_team_id, sample_user_id,
   'How does this compare to other tools like Sketch + InVision? Has anyone done a comparison?',
   'question');
  
  -- Insert sample reactions
  INSERT INTO public.annotation_reactions (annotation_id, team_id, created_by, reaction_type) VALUES
  (annotation1_id, sample_team_id, second_user_id, 'like'),
  (annotation2_id, sample_team_id, sample_user_id, 'agree'),
  (annotation3_id, sample_team_id, second_user_id, 'question');
  
  RAISE NOTICE 'Sample highlights and annotations inserted successfully';
  RAISE NOTICE 'Highlights created: 3 text selections with different colors';
  RAISE NOTICE 'Annotations created: 1 bookmark comment, 1 highlight response, 1 question';
  RAISE NOTICE 'Reactions added: likes and agreements on annotations';
  RAISE NOTICE 'Team events automatically logged for highlights and annotations';
END $$;