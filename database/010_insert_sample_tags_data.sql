-- Insert sample highlights and bookmarks with tags for testing
-- Run this in Supabase SQL Editor after 009_add_collection_nesting.sql

-- First, let's create some bookmarks with proper tags
INSERT INTO public.bookmarks (
  id,
  team_id,
  collection_id,
  url,
  title,
  description,
  tags,
  created_by
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    (SELECT id FROM public.collections LIMIT 1),
    'https://react.dev/learn',
    'React Documentation - Learn React',
    'Official React documentation and tutorial for learning React.js',
    ARRAY['react', 'javascript', 'frontend', 'web-development'],
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    (SELECT id FROM public.collections LIMIT 1),
    'https://tailwindcss.com/docs',
    'Tailwind CSS Documentation',
    'Utility-first CSS framework for rapidly building custom user interfaces.',
    ARRAY['css', 'tailwind', 'design', 'frontend', 'ui'],
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    (SELECT id FROM public.collections LIMIT 1),
    'https://nextjs.org/docs',
    'Next.js Documentation',
    'The React Framework for Production - complete guide to Next.js features.',
    ARRAY['nextjs', 'react', 'fullstack', 'vercel'],
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    (SELECT id FROM public.collections LIMIT 1),
    'https://supabase.com/docs',
    'Supabase Documentation',
    'Open source Firebase alternative with PostgreSQL database.',
    ARRAY['database', 'backend', 'postgresql', 'supabase', 'auth'],
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    (SELECT id FROM public.collections LIMIT 1),
    'https://www.typescriptlang.org/docs/',
    'TypeScript Handbook',
    'Learn TypeScript - a typed superset of JavaScript that compiles to plain JavaScript.',
    ARRAY['typescript', 'javascript', 'programming', 'types'],
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  );

-- Create a nested collection structure for testing
WITH parent_collection AS (
  INSERT INTO public.collections (
    id,
    team_id,
    name,
    description,
    color,
    parent_id,
    sort_order,
    created_by
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM public.teams LIMIT 1),
    'Web Development Resources',
    'Frontend and backend development resources',
    '#3b82f6',
    NULL,
    0,
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ) RETURNING id
),
frontend_collection AS (
  INSERT INTO public.collections (
    team_id,
    name,
    description,
    color,
    parent_id,
    sort_order,
    created_by
  ) VALUES (
    (SELECT id FROM public.teams LIMIT 1),
    'Frontend Frameworks',
    'React, Vue, Angular and other frontend frameworks',
    '#10b981',
    (SELECT id FROM parent_collection),
    1,
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ) RETURNING id
),
backend_collection AS (
  INSERT INTO public.collections (
    team_id,
    name,
    description,
    color,
    parent_id,
    sort_order,
    created_by
  ) VALUES (
    (SELECT id FROM public.teams LIMIT 1),
    'Backend & Databases',
    'Server-side frameworks and database technologies',
    '#f59e0b',
    (SELECT id FROM parent_collection),
    2,
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ) RETURNING id
)

-- Insert nested collections under frontend
INSERT INTO public.collections (
  team_id,
  name,
  description,
  color,
  parent_id,
  sort_order,
  created_by
) VALUES 
  (
    (SELECT id FROM public.teams LIMIT 1),
    'React Ecosystem',
    'React, Next.js, and related tools',
    '#61dafb',
    (SELECT id FROM frontend_collection),
    1,
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  ),
  (
    (SELECT id FROM public.teams LIMIT 1),
    'CSS Frameworks',
    'Tailwind, Bootstrap, and other CSS frameworks',
    '#06b6d4',
    (SELECT id FROM frontend_collection),
    2,
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
  );

-- Add some sample team events for the activity feed
INSERT INTO public.team_events (
  team_id,
  event_type,
  actor_id,
  data
) VALUES 
  (
    (SELECT id FROM public.teams LIMIT 1),
    'bookmark.created',
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    jsonb_build_object(
      'bookmark_id', (SELECT id FROM public.bookmarks WHERE title LIKE '%React%' LIMIT 1),
      'bookmark_title', 'React Documentation - Learn React',
      'bookmark_url', 'https://react.dev/learn',
      'collection_name', (SELECT name FROM public.collections LIMIT 1)
    )
  ),
  (
    (SELECT id FROM public.teams LIMIT 1),
    'collection.created',
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    jsonb_build_object(
      'collection_id', (SELECT id FROM parent_collection),
      'collection_name', 'Web Development Resources'
    )
  ),
  (
    (SELECT id FROM public.teams LIMIT 1),
    'bookmark.created',
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    jsonb_build_object(
      'bookmark_id', (SELECT id FROM public.bookmarks WHERE title LIKE '%Tailwind%' LIMIT 1),
      'bookmark_title', 'Tailwind CSS Documentation',
      'bookmark_url', 'https://tailwindcss.com/docs',
      'collection_name', (SELECT name FROM public.collections LIMIT 1)
    )
  );