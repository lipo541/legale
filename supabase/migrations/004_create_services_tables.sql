-- ============================================
-- Migration: Create Services Tables & Storage
-- Description: Creates services and service_translations tables with Storage bucket
-- Date: 2025-10-23
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Insert bucket for services images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services',
  'services',
  true,
  8388608, -- 8MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================

-- Policy: Anyone can read/view images (public access)
CREATE POLICY "Public read access for services images"
ON storage.objects FOR SELECT
USING (bucket_id = 'services');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload services images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

-- Policy: Authenticated users can update their own images
CREATE POLICY "Authenticated users can update services images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'services')
WITH CHECK (bucket_id = 'services');

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete services images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'services');

-- ============================================
-- 3. CREATE MAIN SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  image_url TEXT,
  og_image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE services IS 'Main services table - each service belongs to a practice';

-- Add comments to columns
COMMENT ON COLUMN services.id IS 'Unique service identifier';
COMMENT ON COLUMN services.practice_id IS 'Foreign key to practices table';
COMMENT ON COLUMN services.image_url IS 'Service image URL (same for all languages)';
COMMENT ON COLUMN services.og_image_url IS 'Open Graph image URL for social media sharing';
COMMENT ON COLUMN services.status IS 'Publication status: draft, published, or archived';

-- ============================================
-- 4. CREATE SERVICE_TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT, -- HTML content from RichTextEditor
  image_alt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one translation per language per service
  UNIQUE(service_id, language),
  
  -- Ensure slug is unique per language (different slugs for each language)
  UNIQUE(slug, language)
);

-- Add comment to table
COMMENT ON TABLE service_translations IS 'Translations for services - 3 rows per service (ka, en, ru)';

-- Add comments to columns
COMMENT ON COLUMN service_translations.service_id IS 'Foreign key to services table';
COMMENT ON COLUMN service_translations.language IS 'Language code: ka (Georgian), en (English), ru (Russian)';
COMMENT ON COLUMN service_translations.slug IS 'URL-friendly slug - unique per language';
COMMENT ON COLUMN service_translations.description IS 'HTML content from Tiptap editor';
COMMENT ON COLUMN service_translations.image_alt IS 'Alt text for service image - language specific';
COMMENT ON COLUMN service_translations.meta_title IS 'SEO meta title for search engines';
COMMENT ON COLUMN service_translations.meta_description IS 'SEO meta description for search engines';
COMMENT ON COLUMN service_translations.og_title IS 'Open Graph title for social media';
COMMENT ON COLUMN service_translations.og_description IS 'Open Graph description for social media';
COMMENT ON COLUMN service_translations.word_count IS 'Number of words in description (for reading stats)';
COMMENT ON COLUMN service_translations.reading_time IS 'Estimated reading time in minutes';

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for service_id lookups (frequently used in JOINs)
CREATE INDEX IF NOT EXISTS idx_service_translations_service_id 
ON service_translations(service_id);

-- Index for language filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_service_translations_language 
ON service_translations(language);

-- Index for slug lookups (used in frontend routing)
CREATE INDEX IF NOT EXISTS idx_service_translations_slug 
ON service_translations(slug);

-- Composite index for slug + language (most efficient for detail page queries)
CREATE INDEX IF NOT EXISTS idx_service_translations_slug_language 
ON service_translations(slug, language);

-- Index for status filtering (published services only)
CREATE INDEX IF NOT EXISTS idx_services_status 
ON services(status);

-- Index for practice_id lookups (services by practice)
CREATE INDEX IF NOT EXISTS idx_services_practice_id 
ON services(practice_id);

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ============================================

-- Trigger for services table
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for service_translations table
CREATE TRIGGER update_service_translations_updated_at
BEFORE UPDATE ON service_translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_translations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read published services
CREATE POLICY "Public read access for published services"
ON services FOR SELECT
USING (status = 'published');

-- Policy: Everyone can read translations of published services
CREATE POLICY "Public read access for published service translations"
ON service_translations FOR SELECT
USING (
  service_id IN (
    SELECT id FROM services WHERE status = 'published'
  )
);

-- Policy: Authenticated users can create services
CREATE POLICY "Authenticated users can create services"
ON services FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can create translations
CREATE POLICY "Authenticated users can create service translations"
ON service_translations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update services
CREATE POLICY "Authenticated users can update services"
ON services FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update translations
CREATE POLICY "Authenticated users can update service translations"
ON service_translations FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete services
CREATE POLICY "Authenticated users can delete services"
ON services FOR DELETE
USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete translations
CREATE POLICY "Authenticated users can delete service translations"
ON service_translations FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on services table
GRANT ALL ON services TO postgres, service_role;
GRANT SELECT ON services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON services TO authenticated;

-- Grant permissions on service_translations table
GRANT ALL ON service_translations TO postgres, service_role;
GRANT SELECT ON service_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON service_translations TO authenticated;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
