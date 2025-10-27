-- ============================================
-- Migration: Cleanup Orphaned Practice Translations
-- Description: Remove practice_translations that reference deleted practices
-- Date: 2025-10-28
-- ============================================

-- 1. Check for orphaned translations (for debugging)
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM practice_translations pt
  LEFT JOIN practices p ON pt.practice_id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE 'Found % orphaned practice_translations', orphaned_count;
END $$;

-- 2. Delete orphaned practice_translations
DELETE FROM practice_translations pt
WHERE NOT EXISTS (
  SELECT 1 FROM practices p WHERE p.id = pt.practice_id
);

-- 3. Verify the foreign key constraint has CASCADE delete
-- This should already exist, but let's make sure
DO $$
BEGIN
  -- Drop the old constraint if it exists without CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'practice_translations_practice_id_fkey'
    AND table_name = 'practice_translations'
  ) THEN
    ALTER TABLE practice_translations 
    DROP CONSTRAINT IF EXISTS practice_translations_practice_id_fkey;
  END IF;

  -- Re-add the constraint with CASCADE delete
  ALTER TABLE practice_translations
  ADD CONSTRAINT practice_translations_practice_id_fkey
  FOREIGN KEY (practice_id)
  REFERENCES practices(id)
  ON DELETE CASCADE;
  
  RAISE NOTICE 'Foreign key constraint updated with CASCADE delete';
END $$;

-- 4. Verify the fix
DO $$
DECLARE
  remaining_orphans INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_orphans
  FROM practice_translations pt
  LEFT JOIN practices p ON pt.practice_id = p.id
  WHERE p.id IS NULL;
  
  IF remaining_orphans > 0 THEN
    RAISE WARNING 'Still have % orphaned records!', remaining_orphans;
  ELSE
    RAISE NOTICE '✅ No orphaned practice_translations found. Database is clean!';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to check the foreign key constraint:
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- JOIN information_schema.referential_constraints AS rc
--   ON rc.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'practice_translations'
--   AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
