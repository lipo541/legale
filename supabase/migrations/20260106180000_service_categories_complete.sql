-- ========================================
-- SERVICE CATEGORIES - COMPLETE MIGRATION
-- ========================================
-- სერვისების კატეგორიების სრული მიგრაცია
-- გაშვების თარიღი: 2026-01-06

-- ========================================
-- 1. TABLES
-- ========================================

-- Main categories table
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE service_categories IS 'Hierarchical service categories';
COMMENT ON COLUMN service_categories.parent_id IS 'Parent category for hierarchy';
COMMENT ON COLUMN service_categories.sort_order IS 'Display order within same level';

-- Translations table
CREATE TABLE IF NOT EXISTS service_category_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category_id, language),
    UNIQUE(slug, language)
);

COMMENT ON TABLE service_category_translations IS 'Translations for service categories (ka, en, ru)';

-- ========================================
-- 2. INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_sort ON service_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_service_category_translations_category ON service_category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_service_category_translations_slug ON service_category_translations(slug);
CREATE INDEX IF NOT EXISTS idx_service_category_translations_lang ON service_category_translations(language);

-- ========================================
-- 3. ADD CATEGORY_ID TO SERVICES
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'services' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE services ADD COLUMN category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;
        CREATE INDEX idx_services_category ON services(category_id);
    END IF;
END $$;

-- ========================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_category_translations ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. RLS POLICIES
-- ========================================

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Public read service_categories" ON service_categories;
DROP POLICY IF EXISTS "Public read service_category_translations" ON service_category_translations;
DROP POLICY IF EXISTS "Admin service_categories" ON service_categories;
DROP POLICY IF EXISTS "Admin service_category_translations" ON service_category_translations;
DROP POLICY IF EXISTS "Public read access for service categories" ON service_categories;
DROP POLICY IF EXISTS "Public read access for service category translations" ON service_category_translations;
DROP POLICY IF EXISTS "Super Admin full access to service_categories" ON service_categories;
DROP POLICY IF EXISTS "Super Admin full access to service_category_translations" ON service_category_translations;

-- Public read access (anyone can read categories)
CREATE POLICY "Public read service_categories" 
ON service_categories FOR SELECT 
USING (true);

CREATE POLICY "Public read service_category_translations" 
ON service_category_translations FOR SELECT 
USING (true);

-- Super Admin full access (insert, update, delete)
CREATE POLICY "Admin service_categories" 
ON service_categories FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

CREATE POLICY "Admin service_category_translations" 
ON service_category_translations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- ========================================
-- 6. PERMISSIONS
-- ========================================

GRANT SELECT ON service_categories TO anon;
GRANT SELECT ON service_category_translations TO anon;
GRANT ALL ON service_categories TO authenticated;
GRANT ALL ON service_category_translations TO authenticated;

-- ========================================
-- DONE!
-- ========================================
