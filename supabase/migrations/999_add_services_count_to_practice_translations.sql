-- ============================================
-- Migration: Add Services Count to Practice Translations
-- Description: Adds services_count field to track number of services per practice
-- Date: 2025-10-31
-- ============================================

-- Add services_count column
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS services_count INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN practice_translations.services_count IS 
  'Number of services available for this practice area';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_practice_translations_services_count 
ON practice_translations(services_count);

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
