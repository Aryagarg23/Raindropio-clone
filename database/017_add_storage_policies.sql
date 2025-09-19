-- Migration: Add image_url column to bookmarks table
-- Run this after 016_drop_preview_image_column.sql

ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS image_url text;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_image_url ON public.bookmarks(image_url);

-- Storage policies for file uploads
-- ... add storage policies here if needed ...