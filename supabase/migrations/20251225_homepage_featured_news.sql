-- ============================================
-- HOMEPAGE FEATURED NEWS MIGRATION
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- 1. Add homepage featured columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homepage_featured_order INTEGER DEFAULT NULL;

-- 2. Add constraint for max 8 featured posts
-- This is enforced via trigger since PostgreSQL doesn't support dynamic CHECK constraints

-- 3. Create function to enforce max 8 featured limit
CREATE OR REPLACE FUNCTION check_homepage_featured_limit()
RETURNS TRIGGER AS $$
DECLARE
  featured_count INTEGER;
BEGIN
  -- Only check on INSERT or when setting is_homepage_featured to true
  IF NEW.is_homepage_featured = true THEN
    SELECT COUNT(*) INTO featured_count
    FROM posts
    WHERE is_homepage_featured = true
      AND id != NEW.id;
    
    IF featured_count >= 8 THEN
      RAISE EXCEPTION 'Maximum 8 homepage featured posts allowed. Current count: %', featured_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS enforce_homepage_featured_limit ON posts;
CREATE TRIGGER enforce_homepage_featured_limit
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_homepage_featured_limit();

-- 5. Create function to auto-assign order when setting featured
CREATE OR REPLACE FUNCTION auto_assign_homepage_featured_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- When setting is_homepage_featured to true and order is not set
  IF NEW.is_homepage_featured = true AND (NEW.homepage_featured_order IS NULL OR OLD.is_homepage_featured = false) THEN
    SELECT COALESCE(MAX(homepage_featured_order), 0) + 1 INTO max_order
    FROM posts
    WHERE is_homepage_featured = true
      AND id != NEW.id;
    
    NEW.homepage_featured_order := max_order;
  END IF;
  
  -- When removing featured status, clear the order
  IF NEW.is_homepage_featured = false THEN
    NEW.homepage_featured_order := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for auto-order
DROP TRIGGER IF EXISTS auto_homepage_featured_order ON posts;
CREATE TRIGGER auto_homepage_featured_order
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_homepage_featured_order();

-- 7. Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_posts_homepage_featured 
ON posts(is_homepage_featured, homepage_featured_order)
WHERE is_homepage_featured = true;

-- 8. Create index for published posts ordering
CREATE INDEX IF NOT EXISTS idx_posts_published_at_desc 
ON posts(published_at DESC)
WHERE status = 'published';

-- 9. Add comments
COMMENT ON COLUMN posts.is_homepage_featured IS 'If true, this post appears in homepage featured section';
COMMENT ON COLUMN posts.homepage_featured_order IS 'Display order in homepage featured section (1, 2, 3... lower = first)';

-- ============================================
-- VERIFICATION QUERY
-- Run after migration to verify columns exist
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'posts' 
-- AND column_name IN ('is_homepage_featured', 'homepage_featured_order');
