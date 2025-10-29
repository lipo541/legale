-- ============================================
-- ADD CATEGORY RELATION TO POST_TRANSLATIONS
-- Migration to link posts with category system via slug
-- ============================================

-- Step 1: Add category_id column to post_translations
ALTER TABLE post_translations 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES post_categories(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_post_translations_category_id 
ON post_translations(category_id);

-- Step 3: Add category_slug for easier lookups (denormalized for performance)
ALTER TABLE post_translations 
ADD COLUMN IF NOT EXISTS category_slug TEXT;

-- Step 4: Create index on category_slug
CREATE INDEX IF NOT EXISTS idx_post_translations_category_slug 
ON post_translations(category_slug);

-- Step 5: Keep the old 'category' text field for backward compatibility
-- (We'll migrate data gradually)

COMMENT ON COLUMN post_translations.category_id IS 'Foreign key to post_categories table (recommended way)';
COMMENT ON COLUMN post_translations.category_slug IS 'Denormalized category slug for quick lookups without JOIN';
COMMENT ON COLUMN post_translations.category IS 'Legacy text category (will be deprecated after migration)';

-- ============================================
-- HELPER FUNCTION: AUTO-GENERATE SLUG FROM NAME
-- ============================================

CREATE OR REPLACE FUNCTION generate_category_slug(category_name TEXT, lang TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  base_slug := lower(trim(category_name));
  
  -- Georgian to English transliteration (basic)
  base_slug := replace(base_slug, 'ა', 'a');
  base_slug := replace(base_slug, 'ბ', 'b');
  base_slug := replace(base_slug, 'გ', 'g');
  base_slug := replace(base_slug, 'დ', 'd');
  base_slug := replace(base_slug, 'ე', 'e');
  base_slug := replace(base_slug, 'ვ', 'v');
  base_slug := replace(base_slug, 'ზ', 'z');
  base_slug := replace(base_slug, 'თ', 't');
  base_slug := replace(base_slug, 'ი', 'i');
  base_slug := replace(base_slug, 'კ', 'k');
  base_slug := replace(base_slug, 'ლ', 'l');
  base_slug := replace(base_slug, 'მ', 'm');
  base_slug := replace(base_slug, 'ნ', 'n');
  base_slug := replace(base_slug, 'ო', 'o');
  base_slug := replace(base_slug, 'პ', 'p');
  base_slug := replace(base_slug, 'ჟ', 'zh');
  base_slug := replace(base_slug, 'რ', 'r');
  base_slug := replace(base_slug, 'ს', 's');
  base_slug := replace(base_slug, 'ტ', 't');
  base_slug := replace(base_slug, 'უ', 'u');
  base_slug := replace(base_slug, 'ფ', 'p');
  base_slug := replace(base_slug, 'ქ', 'k');
  base_slug := replace(base_slug, 'ღ', 'gh');
  base_slug := replace(base_slug, 'ყ', 'q');
  base_slug := replace(base_slug, 'შ', 'sh');
  base_slug := replace(base_slug, 'ჩ', 'ch');
  base_slug := replace(base_slug, 'ც', 'ts');
  base_slug := replace(base_slug, 'ძ', 'dz');
  base_slug := replace(base_slug, 'წ', 'ts');
  base_slug := replace(base_slug, 'ჭ', 'ch');
  base_slug := replace(base_slug, 'ხ', 'kh');
  base_slug := replace(base_slug, 'ჯ', 'j');
  base_slug := replace(base_slug, 'ჰ', 'h');
  
  -- Replace spaces and special characters with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Ensure uniqueness
  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM post_category_translations 
    WHERE slug = final_slug AND language = lang
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: AUTO-GENERATE SLUG ON INSERT
-- ============================================

CREATE OR REPLACE FUNCTION auto_generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- If slug is empty or null, generate it
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_category_slug(NEW.name, NEW.language);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_generate_category_slug ON post_category_translations;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_category_slug
BEFORE INSERT ON post_category_translations
FOR EACH ROW
EXECUTE FUNCTION auto_generate_category_slug();

-- ============================================
-- SAMPLE DATA: Create default categories
-- ============================================

-- Insert root categories (if not exist)
DO $$
DECLARE
  cat_law_id UUID;
  cat_business_id UUID;
  cat_politics_id UUID;
  cat_tech_id UUID;
BEGIN
  -- 1. Law Category
  INSERT INTO post_categories (id) 
  VALUES (gen_random_uuid()) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO cat_law_id;
  
  IF cat_law_id IS NOT NULL THEN
    INSERT INTO post_category_translations (category_id, language, name, description)
    VALUES 
      (cat_law_id, 'ka', 'სამართალი', 'სამართლებრივი სიახლეები და ანალიზი'),
      (cat_law_id, 'en', 'Law', 'Legal news and analysis'),
      (cat_law_id, 'ru', 'Право', 'Юридические новости и анализ')
    ON CONFLICT (category_id, language) DO NOTHING;
  END IF;

  -- 2. Business Category
  INSERT INTO post_categories (id) 
  VALUES (gen_random_uuid()) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO cat_business_id;
  
  IF cat_business_id IS NOT NULL THEN
    INSERT INTO post_category_translations (category_id, language, name, description)
    VALUES 
      (cat_business_id, 'ka', 'ბიზნესი', 'ბიზნეს სიახლეები და ანალიზი'),
      (cat_business_id, 'en', 'Business', 'Business news and analysis'),
      (cat_business_id, 'ru', 'Бизнес', 'Бизнес новости и анализ')
    ON CONFLICT (category_id, language) DO NOTHING;
  END IF;

  -- 3. Politics Category
  INSERT INTO post_categories (id) 
  VALUES (gen_random_uuid()) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO cat_politics_id;
  
  IF cat_politics_id IS NOT NULL THEN
    INSERT INTO post_category_translations (category_id, language, name, description)
    VALUES 
      (cat_politics_id, 'ka', 'პოლიტიკა', 'პოლიტიკური სიახლეები'),
      (cat_politics_id, 'en', 'Politics', 'Political news'),
      (cat_politics_id, 'ru', 'Политика', 'Политические новости')
    ON CONFLICT (category_id, language) DO NOTHING;
  END IF;

  -- 4. Technology Category
  INSERT INTO post_categories (id) 
  VALUES (gen_random_uuid()) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO cat_tech_id;
  
  IF cat_tech_id IS NOT NULL THEN
    INSERT INTO post_category_translations (category_id, language, name, description)
    VALUES 
      (cat_tech_id, 'ka', 'ტექნოლოგია', 'ტექნოლოგიური სიახლეები'),
      (cat_tech_id, 'en', 'Technology', 'Technology news'),
      (cat_tech_id, 'ru', 'Технология', 'Технологические новости')
    ON CONFLICT (category_id, language) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- RLS POLICIES FOR NEW COLUMNS
-- ============================================

-- Policies are inherited from existing post_translations policies
-- No additional RLS needed for new columns
