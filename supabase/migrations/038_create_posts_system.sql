-- ============================================
-- Migration: Create Posts System (News/Blog)
-- Description: Complete posts system with multi-language support, positions, and storage
-- Date: 2025-10-29
-- ============================================

-- ============================================
-- 1. CREATE STORAGE BUCKET FOR POST IMAGES
-- ============================================

-- Insert bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. STORAGE POLICIES (RLS)
-- ============================================

-- Policy: Anyone can read/view images (public access)
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Policy: Authenticated users can update images
CREATE POLICY "Authenticated users can update post images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-images')
WITH CHECK (bucket_id = 'post-images');

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated users can delete post images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images');

-- ============================================
-- 3. CREATE POST CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES post_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE post_categories IS 'Hierarchical categories for posts (supports subcategories)';

-- Add comments to columns
COMMENT ON COLUMN post_categories.parent_id IS 'Parent category ID for hierarchical structure (NULL = root category)';

-- ============================================
-- 4. CREATE POST CATEGORY TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES post_categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one translation per language per category
  UNIQUE(category_id, language),
  
  -- Ensure slug is unique per language
  UNIQUE(slug, language)
);

-- Add comment to table
COMMENT ON TABLE post_category_translations IS 'Translations for post categories - 3 rows per category (ka, en, ru)';

-- Add comments to columns
COMMENT ON COLUMN post_category_translations.category_id IS 'Foreign key to post_categories table';
COMMENT ON COLUMN post_category_translations.language IS 'Language code: ka (Georgian), en (English), ru (Russian)';
COMMENT ON COLUMN post_category_translations.slug IS 'URL-friendly slug - unique per language';

-- ============================================
-- 5. CREATE MAIN POSTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Author/Practice Reference
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  
  -- Display Position (1-10 for NewsPage featured positions, NULL for AllPostsSection)
  display_position INTEGER NULL CHECK (display_position BETWEEN 1 AND 10),
  position_order INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  
  -- Featured Image (same for all languages)
  featured_image_url TEXT,
  
  -- Publication Dates
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE posts IS 'Main posts table - news articles and blog posts with multi-language support';

-- Add comments to columns
COMMENT ON COLUMN posts.id IS 'Unique post identifier';
COMMENT ON COLUMN posts.author_id IS 'Foreign key to profiles table (post author)';
COMMENT ON COLUMN posts.practice_id IS 'Foreign key to practices table (optional)';
COMMENT ON COLUMN posts.display_position IS 'NewsPage position 1-10 (featured), NULL = AllPostsSection';
COMMENT ON COLUMN posts.position_order IS 'Order within slider positions (3, 5, 9, 10)';
COMMENT ON COLUMN posts.status IS 'Publication status: draft, pending, published, archived';
COMMENT ON COLUMN posts.featured_image_url IS 'Featured image URL (language-independent)';
COMMENT ON COLUMN posts.published_at IS 'Publication timestamp (NULL = not published yet)';

-- ============================================
-- 6. CREATE POST_TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_translations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Language
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  
  -- Content Fields
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT, -- HTML content from RichTextEditor
  
  -- Category (stored as text for now, can be FK to category_id later)
  category TEXT,
  
  -- SEO Fields
  slug TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  
  -- Social Media (Open Graph - works for all platforms)
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  
  -- Reading Statistics
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- in minutes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, language), -- One translation per language per post
  UNIQUE(slug, language) -- Unique slug per language
);

-- Add comment to table
COMMENT ON TABLE post_translations IS 'Translations for posts - 3 rows per post (ka, en, ru)';

-- Add comments to columns
COMMENT ON COLUMN post_translations.post_id IS 'Foreign key to posts table';
COMMENT ON COLUMN post_translations.language IS 'Language code: ka (Georgian), en (English), ru (Russian)';
COMMENT ON COLUMN post_translations.title IS 'Post title in this language';
COMMENT ON COLUMN post_translations.excerpt IS 'Short description/summary (for cards and previews)';
COMMENT ON COLUMN post_translations.content IS 'Full HTML content from RichTextEditor (Tiptap)';
COMMENT ON COLUMN post_translations.category IS 'Category name (or FK to post_category_translations later)';
COMMENT ON COLUMN post_translations.slug IS 'URL-friendly slug - unique per language (e.g., /blog/my-post-slug)';
COMMENT ON COLUMN post_translations.meta_title IS 'SEO meta title for search engines';
COMMENT ON COLUMN post_translations.meta_description IS 'SEO meta description for search engines';
COMMENT ON COLUMN post_translations.keywords IS 'Comma-separated keywords for SEO';
COMMENT ON COLUMN post_translations.og_title IS 'Open Graph title (Facebook, Twitter, LinkedIn, etc.)';
COMMENT ON COLUMN post_translations.og_description IS 'Open Graph description for social media sharing';
COMMENT ON COLUMN post_translations.og_image IS 'Open Graph image URL for social media previews';
COMMENT ON COLUMN post_translations.word_count IS 'Number of words in content (for reading stats)';
COMMENT ON COLUMN post_translations.reading_time IS 'Estimated reading time in minutes (Georgian: 180 WPM, English: 200 WPM, Russian: 190 WPM)';

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for display_position lookups (NewsPage positions 1-10)
CREATE INDEX IF NOT EXISTS idx_posts_display_position 
ON posts(display_position) 
WHERE display_position IS NOT NULL;

-- Index for status filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_posts_status 
ON posts(status);

-- Composite index for published posts with position (for NewsPage queries)
CREATE INDEX IF NOT EXISTS idx_posts_published_positioned 
ON posts(display_position, position_order) 
WHERE status = 'published' AND display_position IS NOT NULL;

-- Index for author lookups (user's own posts)
CREATE INDEX IF NOT EXISTS idx_posts_author_id 
ON posts(author_id);

-- Index for practice posts
CREATE INDEX IF NOT EXISTS idx_posts_practice_id 
ON posts(practice_id);

-- Index for published_at ordering (AllPostsSection chronological)
CREATE INDEX IF NOT EXISTS idx_posts_published_at 
ON posts(published_at DESC) 
WHERE status = 'published';

-- Index for post_id lookups in translations (frequently used in JOINs)
CREATE INDEX IF NOT EXISTS idx_post_translations_post_id 
ON post_translations(post_id);

-- Index for language filtering (most queries filter by language)
CREATE INDEX IF NOT EXISTS idx_post_translations_language 
ON post_translations(language);

-- Index for slug lookups (used in frontend routing)
CREATE INDEX IF NOT EXISTS idx_post_translations_slug 
ON post_translations(slug);

-- Composite index for slug + language (most efficient for detail page queries)
CREATE INDEX IF NOT EXISTS idx_post_translations_slug_language 
ON post_translations(slug, language);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_post_translations_category 
ON post_translations(category);

-- Index for category_id lookups in category translations
CREATE INDEX IF NOT EXISTS idx_post_category_translations_category_id 
ON post_category_translations(category_id);

-- Index for category language filtering
CREATE INDEX IF NOT EXISTS idx_post_category_translations_language 
ON post_category_translations(language);

-- Index for category slug lookups
CREATE INDEX IF NOT EXISTS idx_post_category_translations_slug 
ON post_category_translations(slug);

-- ============================================
-- 8. CREATE UNIQUE CONSTRAINTS FOR SINGLE POSITIONS
-- ============================================

-- Unique constraint: Only one published post per single position (1, 2, 4, 6, 7)
-- Positions 3, 5, 9, 10 are sliders and can have multiple posts
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_single_position
ON posts(display_position)
WHERE display_position IN (1, 2, 4, 6, 7) AND status = 'published';

-- ============================================
-- 9. CREATE UPDATED_AT TRIGGERS
-- ============================================

-- Trigger for posts table
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for post_translations table
CREATE TRIGGER update_post_translations_updated_at
BEFORE UPDATE ON post_translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for post_categories table
CREATE TRIGGER update_post_categories_updated_at
BEFORE UPDATE ON post_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for post_category_translations table
CREATE TRIGGER update_post_category_translations_updated_at
BEFORE UPDATE ON post_category_translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_category_translations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. RLS POLICIES - POSTS TABLE
-- ============================================

-- Policy: Everyone can read published posts
CREATE POLICY "Public read access for published posts"
ON posts FOR SELECT
USING (status = 'published');

-- Policy: Authenticated users can create posts (as drafts)
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id AND
  status = 'draft'
);

-- Policy: Authors can update their own draft posts
CREATE POLICY "Authors can update own draft posts"
ON posts FOR UPDATE
TO authenticated
USING (
  auth.uid() = author_id AND
  status = 'draft'
)
WITH CHECK (
  auth.uid() = author_id AND
  status IN ('draft', 'pending')
);

-- Policy: Authors can delete their own draft posts
CREATE POLICY "Authors can delete own draft posts"
ON posts FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id AND
  status = 'draft'
);

-- Policy: Super Admin full access to all posts
CREATE POLICY "Super Admin full access to posts"
ON posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- 12. RLS POLICIES - POST_TRANSLATIONS TABLE
-- ============================================

-- Policy: Everyone can read translations of published posts
CREATE POLICY "Public read access for published post translations"
ON post_translations FOR SELECT
USING (
  post_id IN (
    SELECT id FROM posts WHERE status = 'published'
  )
);

-- Policy: Authenticated users can create translations
CREATE POLICY "Authenticated users can create post translations"
ON post_translations FOR INSERT
TO authenticated
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = auth.uid() 
    AND status = 'draft'
  )
);

-- Policy: Authors can update translations of their own draft posts
CREATE POLICY "Authors can update own post translations"
ON post_translations FOR UPDATE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = auth.uid() 
    AND status IN ('draft', 'pending')
  )
)
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = auth.uid() 
    AND status IN ('draft', 'pending')
  )
);

-- Policy: Authors can delete translations of their own draft posts
CREATE POLICY "Authors can delete own post translations"
ON post_translations FOR DELETE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = auth.uid() 
    AND status = 'draft'
  )
);

-- Policy: Super Admin full access to all translations
CREATE POLICY "Super Admin full access to post translations"
ON post_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- 13. RLS POLICIES - POST_CATEGORIES TABLE
-- ============================================

-- Policy: Everyone can read categories
CREATE POLICY "Public read access for post categories"
ON post_categories FOR SELECT
USING (true);

-- Policy: Super Admin can manage categories
CREATE POLICY "Super Admin full access to categories"
ON post_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- 14. RLS POLICIES - POST_CATEGORY_TRANSLATIONS TABLE
-- ============================================

-- Policy: Everyone can read category translations
CREATE POLICY "Public read access for category translations"
ON post_category_translations FOR SELECT
USING (true);

-- Policy: Super Admin can manage category translations
CREATE POLICY "Super Admin full access to category translations"
ON post_category_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- 15. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on posts table
GRANT ALL ON posts TO postgres, service_role;
GRANT SELECT ON posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;

-- Grant permissions on post_translations table
GRANT ALL ON post_translations TO postgres, service_role;
GRANT SELECT ON post_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON post_translations TO authenticated;

-- Grant permissions on post_categories table
GRANT ALL ON post_categories TO postgres, service_role;
GRANT SELECT ON post_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON post_categories TO authenticated;

-- Grant permissions on post_category_translations table
GRANT ALL ON post_category_translations TO postgres, service_role;
GRANT SELECT ON post_category_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON post_category_translations TO authenticated;

-- ============================================
-- 16. INSERT SAMPLE CATEGORIES (OPTIONAL)
-- ============================================

-- Insert root categories
DO $$
DECLARE
  cat_news_id UUID := gen_random_uuid();
  cat_analysis_id UUID := gen_random_uuid();
  cat_legislation_id UUID := gen_random_uuid();
  cat_practice_id UUID := gen_random_uuid();
BEGIN
  -- News category
  INSERT INTO post_categories (id, parent_id, created_at) 
  VALUES (cat_news_id, NULL, NOW());
  
  INSERT INTO post_category_translations (category_id, language, name, slug, description) VALUES
    (cat_news_id, 'ka', 'ახალი ამბები', 'axali-ambebi', 'სამართლებრივი სიახლეები და განახლებები'),
    (cat_news_id, 'en', 'News', 'news', 'Legal news and updates'),
    (cat_news_id, 'ru', 'Новости', 'novosti', 'Юридические новости и обновления');
  
  -- Analysis category
  INSERT INTO post_categories (id, parent_id, created_at) 
  VALUES (cat_analysis_id, NULL, NOW());
  
  INSERT INTO post_category_translations (category_id, language, name, slug, description) VALUES
    (cat_analysis_id, 'ka', 'ანალიტიკა', 'analitika', 'სამართლებრივი ანალიზი და კვლევები'),
    (cat_analysis_id, 'en', 'Analysis', 'analysis', 'Legal analysis and research'),
    (cat_analysis_id, 'ru', 'Аналитика', 'analitika', 'Юридический анализ и исследования');
  
  -- Legislation category
  INSERT INTO post_categories (id, parent_id, created_at) 
  VALUES (cat_legislation_id, NULL, NOW());
  
  INSERT INTO post_category_translations (category_id, language, name, slug, description) VALUES
    (cat_legislation_id, 'ka', 'საკანონმდებლო ცვლილებები', 'sakanonmdeblo-cvlilebebi', 'ახალი კანონები და რეგულაციები'),
    (cat_legislation_id, 'en', 'Legislation Changes', 'legislation-changes', 'New laws and regulations'),
    (cat_legislation_id, 'ru', 'Законодательные изменения', 'zakonodatelnye-izmeneniya', 'Новые законы и нормативы');
  
  -- Court Practice category
  INSERT INTO post_categories (id, parent_id, created_at) 
  VALUES (cat_practice_id, NULL, NOW());
  
  INSERT INTO post_category_translations (category_id, language, name, slug, description) VALUES
    (cat_practice_id, 'ka', 'სასამართლო პრაქტიკა', 'sasamartlo-praktika', 'სასამართლო გადაწყვეტილებები და პრეცედენტები'),
    (cat_practice_id, 'en', 'Court Practice', 'court-practice', 'Court decisions and precedents'),
    (cat_practice_id, 'ru', 'Судебная практика', 'sudebnaya-praktika', 'Судебные решения и прецеденты');

END $$;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

-- Migration Summary:
-- ✅ Created storage bucket: post-images (5MB limit, public access)
-- ✅ Created storage policies (read, insert, update, delete)
-- ✅ Created post_categories table (hierarchical structure)
-- ✅ Created post_category_translations table (ka, en, ru)
-- ✅ Created posts table (with display_position 1-10, status, author)
-- ✅ Created post_translations table (14 fields, 3 languages per post)
-- ✅ Created 13 indexes for performance optimization
-- ✅ Created unique constraint for single positions (1,2,4,6,7)
-- ✅ Created updated_at triggers for all tables
-- ✅ Enabled RLS on all tables
-- ✅ Created 12 RLS policies (public read, author CRUD, super admin full)
-- ✅ Granted permissions to roles
-- ✅ Inserted 4 sample root categories with translations

-- Next Steps:
-- 1. Run migration: supabase db push
-- 2. Update PostTranslationsContext to include display_position
-- 3. Create Position Selector UI component
-- 4. Implement frontend queries for NewsPage positions
-- 5. Test AllPostsSection with real data

