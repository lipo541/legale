-- ============================================
-- HOMEPAGE FEATURED BANNER MIGRATION
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- 1. Add is_homepage_featured column to news_banners table
ALTER TABLE news_banners
ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN DEFAULT false;

-- 2. Create function to ensure only one homepage featured banner
CREATE OR REPLACE FUNCTION ensure_single_homepage_featured_banner()
RETURNS TRIGGER AS $$
BEGIN
  -- When setting a banner as homepage featured, unfeatured all others
  IF NEW.is_homepage_featured = true THEN
    UPDATE news_banners
    SET is_homepage_featured = false
    WHERE id != NEW.id AND is_homepage_featured = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
DROP TRIGGER IF EXISTS ensure_single_homepage_featured_banner_trigger ON news_banners;
CREATE TRIGGER ensure_single_homepage_featured_banner_trigger
  BEFORE INSERT OR UPDATE ON news_banners
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_homepage_featured_banner();

-- 4. Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_news_banners_homepage_featured 
ON news_banners(is_homepage_featured)
WHERE is_homepage_featured = true;

-- 5. Add comment
COMMENT ON COLUMN news_banners.is_homepage_featured IS 'If true, this banner appears on homepage after hero section (only one can be featured)';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- SELECT id, is_homepage_featured, is_active 
-- FROM news_banners;
