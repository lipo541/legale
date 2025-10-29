-- ============================================
-- FIX PUBLISHED_AT FOR EXISTING POSTS
-- Set current timestamp for published posts that have NULL or epoch date
-- ============================================

-- Update published_at for all published posts that don't have a valid date
UPDATE posts
SET published_at = NOW()
WHERE status = 'published' 
  AND (
    published_at IS NULL 
    OR published_at < '2020-01-01'::timestamptz
  );

-- Log completion
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM posts
  WHERE status = 'published' AND published_at >= NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Successfully updated % published posts with current timestamp', updated_count;
END $$;
