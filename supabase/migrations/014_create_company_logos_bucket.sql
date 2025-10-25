-- Create storage bucket for company logos
-- Note: Run this with postgres role or create bucket via UI first
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'company-logos',
    'company-logos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Bucket creation skipped - create via UI: Storage > New Bucket > company-logos (public)';
END $$;

-- Policy: Allow companies to upload their own logos
CREATE POLICY "Companies can upload their own logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
    )
  );

-- Policy: Allow companies to update their own logos
CREATE POLICY "Companies can update their own logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
    )
  );

-- Policy: Allow companies to delete their own logos
CREATE POLICY "Companies can delete their own logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
    )
  );

-- Policy: Anyone can view logos (public bucket)
CREATE POLICY "Anyone can view company logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-logos');

-- Comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
