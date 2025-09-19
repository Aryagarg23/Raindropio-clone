-- Add optional color column to bookmarks
ALTER TABLE bookmarks
ADD COLUMN IF NOT EXISTS color varchar(32);

-- Optionally populate with default color for existing bookmarks
-- UPDATE bookmarks SET color = '#FFEB3B' WHERE color IS NULL;
