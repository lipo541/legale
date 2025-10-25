-- Policies for company-logos bucket
-- Run this AFTER creating the bucket via UI

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
