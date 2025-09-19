-- Migration: Drop preview_image column from bookmarks table
-- Since we're removing all preview generation functionality

ALTER TABLE public.bookmarks DROP COLUMN IF EXISTS preview_image;