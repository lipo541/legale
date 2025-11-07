-- Add display_order column to news_banners table
ALTER TABLE news_banners 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX idx_news_banners_display_order ON news_banners(display_order);

-- Update existing banners with sequential order based on created_at
WITH ordered_banners AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM news_banners
)
UPDATE news_banners
SET display_order = ordered_banners.row_num
FROM ordered_banners
WHERE news_banners.id = ordered_banners.id;
