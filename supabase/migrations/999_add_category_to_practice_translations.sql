-- ============================================
-- Migration: Add Category to Practice Translations
-- Description: Adds category field to practice_translations for filtering
-- Date: 2025-10-31
-- ============================================

-- Add category column
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comment
COMMENT ON COLUMN practice_translations.category IS 
  'Practice category for filtering (e.g., "კორპორატიული სამართალი", "Corporate Law", etc.)';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_practice_translations_category 
ON practice_translations(category) 
WHERE category IS NOT NULL;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
