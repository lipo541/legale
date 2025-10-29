-- =====================================================
-- Migration: Fix Position Constraints for Sliders
-- =====================================================
-- SLIDERS (multiple posts allowed):
--   - Position 1: Hero Slider (Swiper, 5 slides)
--   - Position 2: Vertical Feed (3 posts)
--   - Position 3: Main Feature Slider (fade effect, 5 slides)
--   - Position 5: Vertical News Ticker (auto-scroll, 10 posts)
--   - Position 9: Horizontal Carousel (10 posts)
--   - Position 10: Featured Topics (10 posts)
--
-- SINGLE POSTS (only 1 post allowed):
--   - Position 4: Single Card
--   - Position 6: Single Card
--   - Position 7: Single Card

-- Drop existing constraint
DROP INDEX IF EXISTS idx_posts_unique_single_position;

-- Create new constraint only for single positions (4,6,7)
-- Positions 1,2,3,5,9,10 are sliders/feeds with multiple posts
CREATE UNIQUE INDEX idx_posts_unique_single_position 
ON posts (display_position) 
WHERE display_position IN (4, 6, 7) 
  AND status = 'published';

COMMENT ON INDEX idx_posts_unique_single_position IS 'Only positions 4,6,7 are single posts. Others are sliders/feeds with multiple posts.';
