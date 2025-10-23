-- ============================================
-- Migration: Add SEO and Open Graph Fields
-- Description: Adds SEO meta tags and Open Graph fields to practice_translations table
-- Date: 2025-10-23
-- ============================================

-- ============================================
-- 1. ADD SEO COLUMNS
-- ============================================

-- Add Meta Title (SEO title for search engines)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- Add Meta Description (SEO description for search results)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add constraint for meta_description length (Google recommends max 160 chars)
ALTER TABLE practice_translations
ADD CONSTRAINT meta_description_length CHECK (
  meta_description IS NULL OR char_length(meta_description) <= 160
);

-- Add Focus Keyword (primary SEO keyword)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS focus_keyword TEXT;

-- ============================================
-- 2. ADD OPEN GRAPH COLUMNS
-- ============================================

-- Add OG Title (social media share title)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS og_title TEXT;

-- Add constraint for og_title length
ALTER TABLE practice_translations
ADD CONSTRAINT og_title_length CHECK (
  og_title IS NULL OR char_length(og_title) <= 60
);

-- Add OG Description (social media share description)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS og_description TEXT;

-- Add constraint for og_description length
ALTER TABLE practice_translations
ADD CONSTRAINT og_description_length CHECK (
  og_description IS NULL OR char_length(og_description) <= 200
);

-- Add OG Image URL (social media share image, 1200x630 recommended)
ALTER TABLE practice_translations 
ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- ============================================
-- 3. ADD COLUMN COMMENTS (Documentation)
-- ============================================

COMMENT ON COLUMN practice_translations.meta_title IS 
  'SEO meta title for search engines. Max 60 characters recommended. Shows in browser tab and Google search results. If NULL, fallback to title + site name.';

COMMENT ON COLUMN practice_translations.meta_description IS 
  'SEO meta description for search results snippet. Max 160 characters enforced. Shows below title in Google search results. If NULL, auto-generated from description.';

COMMENT ON COLUMN practice_translations.focus_keyword IS 
  'Primary SEO keyword for page ranking. Optional field used for SEO optimization tracking and content analysis.';

COMMENT ON COLUMN practice_translations.og_title IS 
  'Open Graph title for social media shares (Facebook, LinkedIn, WhatsApp). Max 60 characters enforced. If NULL, fallback to meta_title or title.';

COMMENT ON COLUMN practice_translations.og_description IS 
  'Open Graph description for social media shares. Max 200 characters enforced. Shows in social media cards. If NULL, fallback to meta_description.';

COMMENT ON COLUMN practice_translations.og_image_url IS 
  'Open Graph image URL for social media shares. Recommended size: 1200x630px. If NULL, fallback to page_hero_image_url. Used by Facebook, LinkedIn, Twitter, WhatsApp.';

-- ============================================
-- 4. CREATE INDEX FOR SEO KEYWORD SEARCH
-- ============================================

-- Index for searching by focus keyword (useful for SEO analytics)
CREATE INDEX IF NOT EXISTS idx_practice_translations_focus_keyword 
ON practice_translations(focus_keyword) 
WHERE focus_keyword IS NOT NULL;

-- ============================================
-- 5. SAMPLE DATA UPDATE (Optional - Uncomment to test)
-- ============================================

/*
-- Update existing practice with SEO data
UPDATE practice_translations
SET 
  meta_title = title || ' | Your Law Firm',
  meta_description = 'Professional legal services in ' || 
    CASE language 
      WHEN 'ka' THEN 'Georgia'
      WHEN 'en' THEN 'English'
      WHEN 'ru' THEN 'Russia'
    END,
  og_title = title,
  og_description = SUBSTRING(REGEXP_REPLACE(description, '<[^>]+>', '', 'g'), 1, 200)
WHERE meta_title IS NULL;
*/

-- ============================================
-- 6. VERIFICATION QUERY
-- ============================================

-- Run this to verify the new columns exist:
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'practice_translations'
-- AND column_name IN ('meta_title', 'meta_description', 'focus_keyword', 'og_title', 'og_description', 'og_image_url')
-- ORDER BY ordinal_position;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

-- New structure:
-- practice_translations table now includes:
--   ├── Existing: title, slug, description, hero_image_alt, page_hero_image_alt
--   ├── SEO: meta_title, meta_description (≤160), focus_keyword
--   └── Open Graph: og_title (≤60), og_description (≤200), og_image_url
