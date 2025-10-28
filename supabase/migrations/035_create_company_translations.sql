-- Create company_translations table for English and Russian translations
-- Georgian content is stored in the profiles table

CREATE TABLE IF NOT EXISTS company_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'ru')),
  
  -- Content fields
  company_overview TEXT,
  summary TEXT,
  mission_statement TEXT,
  vision_values TEXT,
  history TEXT,
  how_we_work TEXT,
  avatar_alt_text TEXT,
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Social media fields
  social_title TEXT,
  social_description TEXT,
  social_hashtags TEXT,
  social_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(company_id, language)
);

-- Enable RLS
ALTER TABLE company_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company can view their own translations"
  ON company_translations FOR SELECT
  USING (
    company_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Company can insert their own translations"
  ON company_translations FOR INSERT
  WITH CHECK (
    company_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Company can update their own translations"
  ON company_translations FOR UPDATE
  USING (
    company_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Public can view all company translations"
  ON company_translations FOR SELECT
  USING (true);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER on_company_translations_updated
  BEFORE UPDATE ON company_translations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE company_translations IS 'Stores English and Russian translations for company profiles';
COMMENT ON COLUMN company_translations.company_id IS 'Reference to company profile in profiles table';
COMMENT ON COLUMN company_translations.language IS 'Language code: en (English) or ru (Russian)';
COMMENT ON COLUMN company_translations.company_overview IS 'Detailed company overview/description (translated)';
COMMENT ON COLUMN company_translations.summary IS 'Brief introduction (translated)';
COMMENT ON COLUMN company_translations.mission_statement IS 'Company mission statement (translated)';
COMMENT ON COLUMN company_translations.vision_values IS 'Company vision and values (translated)';
COMMENT ON COLUMN company_translations.history IS 'Company history (translated)';
COMMENT ON COLUMN company_translations.how_we_work IS 'How the company works (translated)';
COMMENT ON COLUMN company_translations.avatar_alt_text IS 'Company logo alt text for accessibility (translated)';
COMMENT ON COLUMN company_translations.meta_title IS 'SEO meta title (translated)';
COMMENT ON COLUMN company_translations.meta_description IS 'SEO meta description (translated)';
COMMENT ON COLUMN company_translations.meta_keywords IS 'SEO keywords (translated)';
COMMENT ON COLUMN company_translations.social_title IS 'Social media title (translated)';
COMMENT ON COLUMN company_translations.social_description IS 'Social media description (translated)';
COMMENT ON COLUMN company_translations.social_hashtags IS 'Social media hashtags (translated)';
COMMENT ON COLUMN company_translations.social_image_url IS 'Social media image URL (translated)';
