-- Policies for specialist-photos bucket
-- Run this AFTER creating the bucket via UI

-- Policy: Allow solo specialists to upload their own photos
CREATE POLICY "Solo specialists can upload their own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SOLO_SPECIALIST'
    )
  );

-- Policy: Allow solo specialists to update their own photos
CREATE POLICY "Solo specialists can update their own photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SOLO_SPECIALIST'
    )
  );

-- Policy: Allow solo specialists to delete their own photos
CREATE POLICY "Solo specialists can delete their own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SOLO_SPECIALIST'
    )
  );

-- Policy: Anyone can view specialist photos (public bucket)
CREATE POLICY "Anyone can view specialist photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'specialist-photos');
