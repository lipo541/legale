-- Create news_banners table
CREATE TABLE IF NOT EXISTS news_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url_ka TEXT NOT NULL,
  image_url_en TEXT NOT NULL,
  image_url_ru TEXT NOT NULL,
  category_id UUID REFERENCES post_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner', 'banner', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE news_banners ENABLE ROW LEVEL SECURITY;

-- Policies for news_banners
CREATE POLICY "News banners are viewable by everyone"
  ON news_banners FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert news banners"
  ON news_banners FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update news banners"
  ON news_banners FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete news banners"
  ON news_banners FOR DELETE
  USING (auth.role() = 'authenticated');

-- Storage policies for banner bucket
CREATE POLICY "Banner images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner');

CREATE POLICY "Authenticated users can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banner' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update banner images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'banner' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete banner images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banner' AND auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_banners_category_id ON news_banners(category_id);
CREATE INDEX IF NOT EXISTS idx_news_banners_is_active ON news_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_news_banners_created_at ON news_banners(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_news_banners_updated_at
  BEFORE UPDATE ON news_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_news_banners_updated_at();
