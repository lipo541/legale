-- ============================================
-- Hero Slides System Migration
-- Created: 2025-12-25
-- Description: დინამიური Hero სლაიდერის სისტემა
-- ============================================

-- =====================
-- 1. hero_slides ტაბლა
-- =====================
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- სურათები (Light/Dark mode)
  image_url_light TEXT NOT NULL,
  image_url_dark TEXT NOT NULL,
  
  -- ტექსტები - ქართული
  title_ka TEXT NOT NULL,
  description_ka TEXT,
  
  -- ტექსტები - ინგლისური
  title_en TEXT NOT NULL,
  description_en TEXT,
  
  -- ტექსტები - რუსული
  title_ru TEXT NOT NULL,
  description_ru TEXT,
  
  -- კონტროლი
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- მეტადატა
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ============================
-- 2. hero_slide_buttons ტაბლა
-- ============================
CREATE TABLE IF NOT EXISTS hero_slide_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES hero_slides(id) ON DELETE CASCADE,
  
  -- ღილაკის ტექსტები
  text_ka TEXT NOT NULL,
  text_en TEXT NOT NULL,
  text_ru TEXT NOT NULL,
  
  -- Action სისტემა
  action_type TEXT NOT NULL CHECK (action_type IN (
    'link',
    'contact',
    'specialist',
    'practice',
    'company'
  )),
  
  -- Action მონაცემები (action_type-ის მიხედვით)
  action_url TEXT,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- External link option
  open_in_new_tab BOOLEAN DEFAULT false,
  
  -- სტილი
  variant TEXT DEFAULT 'primary' CHECK (variant IN ('primary', 'secondary', 'outline')),
  display_order INTEGER DEFAULT 0,
  
  -- მეტადატა
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 3. Indexes
-- =====================
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(display_order);
CREATE INDEX IF NOT EXISTS idx_hero_slide_buttons_slide ON hero_slide_buttons(slide_id);
CREATE INDEX IF NOT EXISTS idx_hero_slide_buttons_order ON hero_slide_buttons(display_order);

-- =====================
-- 4. Updated_at Trigger
-- =====================
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hero_slides_updated_at
  BEFORE UPDATE ON hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_hero_slides_updated_at();

-- =====================
-- 5. RLS Policies
-- =====================

-- Enable RLS
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slide_buttons ENABLE ROW LEVEL SECURITY;

-- hero_slides policies
CREATE POLICY "Anyone can view active hero slides"
  ON hero_slides
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can view all hero slides"
  ON hero_slides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can insert hero slides"
  ON hero_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can update hero slides"
  ON hero_slides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can delete hero slides"
  ON hero_slides
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- hero_slide_buttons policies
CREATE POLICY "Anyone can view buttons of active slides"
  ON hero_slide_buttons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hero_slides
      WHERE hero_slides.id = hero_slide_buttons.slide_id
      AND hero_slides.is_active = true
    )
  );

CREATE POLICY "Super admins can view all buttons"
  ON hero_slide_buttons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can insert buttons"
  ON hero_slide_buttons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can update buttons"
  ON hero_slide_buttons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can delete buttons"
  ON hero_slide_buttons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- =====================
-- 6. Storage Bucket
-- =====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-slides',
  'hero-slides',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view hero slide images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'hero-slides');

CREATE POLICY "Super admins can upload hero slide images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hero-slides'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can update hero slide images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hero-slides'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admins can delete hero slide images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hero-slides'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- =====================
-- 7. Comments
-- =====================
COMMENT ON TABLE hero_slides IS 'მთავარი გვერდის Hero სლაიდერის სლაიდები';
COMMENT ON TABLE hero_slide_buttons IS 'Hero სლაიდების CTA ღილაკები';
COMMENT ON COLUMN hero_slides.image_url_light IS 'Light mode-ის სურათის URL';
COMMENT ON COLUMN hero_slides.image_url_dark IS 'Dark mode-ის სურათის URL';
COMMENT ON COLUMN hero_slide_buttons.action_type IS 'ღილაკის მოქმედების ტიპი: link, contact, specialist, practice, company';
