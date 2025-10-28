-- Storage policies for specialist-social-images bucket
-- This bucket stores social media share images for specialists in multiple languages
-- Structure: {specialist_id}/{language}/image.jpg

-- Drop any existing policies
DROP POLICY IF EXISTS "Super admins can upload specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can upload specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can update specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can delete specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete specialist social images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view specialist social images" ON storage.objects;

-- SIMPLIFIED: Allow anyone authenticated to manage specialist-social-images
-- This matches the approach used for specialist-photos bucket
CREATE POLICY "Authenticated users can upload specialist social images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'specialist-social-images');

CREATE POLICY "Authenticated users can update specialist social images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'specialist-social-images');

CREATE POLICY "Authenticated users can delete specialist social images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'specialist-social-images');

-- Public read access (bucket is public)
CREATE POLICY "Public can view specialist social images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'specialist-social-images');
