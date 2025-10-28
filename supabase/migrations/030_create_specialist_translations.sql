-- Create specialist_translations table for multilingual content
-- This table contains ALL textual fields from profiles table that need translation
CREATE TABLE IF NOT EXISTS specialist_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  
  -- Basic Info (translated versions)
  full_name TEXT,
  role_title TEXT,
  
  -- Profile Content (main textual content)
  bio TEXT,
  philosophy TEXT,
  teaching_writing_speaking TEXT,
  
  -- Arrays (stored as TEXT[] for easy translation)
  focus_areas TEXT[],
  representative_matters TEXT[],
  credentials_memberships TEXT[],
  
  -- Values object (JSONB to maintain key-value structure)
  -- Format: {"key1": "translated_value1", "key2": "translated_value2"}
  values_how_we_work JSONB DEFAULT '{}'::jsonb,
  
  -- SEO fields (for search engine optimization per language)
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  
  -- Social Media fields (for social sharing per language)
  social_title TEXT,
  social_description TEXT,
  social_hashtags TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one translation per language per specialist
  UNIQUE(specialist_id, language)
);

-- Create index for faster lookups
CREATE INDEX idx_specialist_translations_specialist_id ON specialist_translations(specialist_id);
CREATE INDEX idx_specialist_translations_language ON specialist_translations(language);

-- Enable RLS
ALTER TABLE specialist_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. SUPER_ADMIN: Full access to all translations
CREATE POLICY "super_admin_all_access_specialist_translations"
  ON specialist_translations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- 2. COMPANY: Can manage translations for their own specialists
CREATE POLICY "company_manage_own_specialists_translations"
  ON specialist_translations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND EXISTS (
        SELECT 1 FROM profiles AS specialist
        WHERE specialist.id = specialist_translations.specialist_id
        AND specialist.company_id = company.id
        AND specialist.role = 'SPECIALIST'
      )
    )
  );

-- 3. SPECIALIST: Can read their own translations (not edit)
CREATE POLICY "specialist_read_own_translations"
  ON specialist_translations
  FOR SELECT
  USING (
    specialist_id = auth.uid()
  );

-- 4. Public: Can read all translations (for public profiles)
CREATE POLICY "public_read_all_translations"
  ON specialist_translations
  FOR SELECT
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_specialist_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER specialist_translations_updated_at
  BEFORE UPDATE ON specialist_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_specialist_translations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE specialist_translations IS 'Stores multilingual translations for specialist profiles (Georgian, English, Russian)';
COMMENT ON COLUMN specialist_translations.full_name IS 'Translated full name';
COMMENT ON COLUMN specialist_translations.role_title IS 'Translated professional role/title';
COMMENT ON COLUMN specialist_translations.bio IS 'Translated biography';
COMMENT ON COLUMN specialist_translations.philosophy IS 'Translated professional philosophy';
COMMENT ON COLUMN specialist_translations.teaching_writing_speaking IS 'Translated teaching/writing/speaking activities';
COMMENT ON COLUMN specialist_translations.focus_areas IS 'Array of translated focus areas';
COMMENT ON COLUMN specialist_translations.representative_matters IS 'Array of translated representative matters';
COMMENT ON COLUMN specialist_translations.credentials_memberships IS 'Array of translated credentials and memberships';
COMMENT ON COLUMN specialist_translations.values_how_we_work IS 'JSON object with translated values and work approach';
COMMENT ON COLUMN specialist_translations.seo_title IS 'SEO meta title for this language';
COMMENT ON COLUMN specialist_translations.seo_description IS 'SEO meta description for this language';
COMMENT ON COLUMN specialist_translations.seo_keywords IS 'SEO keywords for this language';
COMMENT ON COLUMN specialist_translations.social_title IS 'Social media share title for this language';
COMMENT ON COLUMN specialist_translations.social_description IS 'Social media share description for this language';
COMMENT ON COLUMN specialist_translations.social_hashtags IS 'Social media hashtags for this language';
