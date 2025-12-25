-- ============================================
-- HOMEPAGE FEATURED SPECIALISTS MIGRATION
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- 1. Add homepage featured columns to profiles table (for specialists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS homepage_featured_order INTEGER DEFAULT NULL;

-- 2. Create function to enforce max 8 featured specialists limit
CREATE OR REPLACE FUNCTION check_specialist_homepage_featured_limit()
RETURNS TRIGGER AS $$
DECLARE
  featured_count INTEGER;
BEGIN
  -- Only check on INSERT or when setting is_homepage_featured to true
  -- And only for specialist roles
  IF NEW.is_homepage_featured = true AND NEW.role IN ('SPECIALIST', 'SOLO_SPECIALIST') THEN
    SELECT COUNT(*) INTO featured_count
    FROM profiles
    WHERE is_homepage_featured = true
      AND role IN ('SPECIALIST', 'SOLO_SPECIALIST')
      AND id != NEW.id;
    
    IF featured_count >= 8 THEN
      RAISE EXCEPTION 'Maximum 8 homepage featured specialists allowed. Current count: %', featured_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
DROP TRIGGER IF EXISTS enforce_specialist_homepage_featured_limit ON profiles;
CREATE TRIGGER enforce_specialist_homepage_featured_limit
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_specialist_homepage_featured_limit();

-- 4. Create function to auto-assign order when setting featured
CREATE OR REPLACE FUNCTION auto_assign_specialist_homepage_featured_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- Only apply to specialists
  IF NEW.role NOT IN ('SPECIALIST', 'SOLO_SPECIALIST') THEN
    RETURN NEW;
  END IF;

  -- When setting is_homepage_featured to true and order is not set
  IF NEW.is_homepage_featured = true AND (NEW.homepage_featured_order IS NULL OR OLD.is_homepage_featured = false) THEN
    SELECT COALESCE(MAX(homepage_featured_order), 0) + 1 INTO max_order
    FROM profiles
    WHERE is_homepage_featured = true
      AND role IN ('SPECIALIST', 'SOLO_SPECIALIST')
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

-- 5. Create trigger for auto-order
DROP TRIGGER IF EXISTS auto_specialist_homepage_featured_order ON profiles;
CREATE TRIGGER auto_specialist_homepage_featured_order
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_specialist_homepage_featured_order();

-- 6. Create index for efficient querying of featured specialists
CREATE INDEX IF NOT EXISTS idx_profiles_homepage_featured_specialists 
ON profiles(is_homepage_featured, homepage_featured_order)
WHERE is_homepage_featured = true AND role IN ('SPECIALIST', 'SOLO_SPECIALIST');

-- 7. Create index for daily random query optimization
CREATE INDEX IF NOT EXISTS idx_profiles_verified_specialists
ON profiles(verification_status, role)
WHERE verification_status = 'verified' AND role IN ('SPECIALIST', 'SOLO_SPECIALIST');

-- 8. Add comments
COMMENT ON COLUMN profiles.is_homepage_featured IS 'If true, this specialist appears in homepage featured section (specialists only)';
COMMENT ON COLUMN profiles.homepage_featured_order IS 'Display order in homepage featured section (1, 2, 3... lower = first)';

-- ============================================
-- VERIFICATION QUERY
-- Run after migration to verify columns exist
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('is_homepage_featured', 'homepage_featured_order');
