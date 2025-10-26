-- ============================================
-- Migration: Fix Specialist Photos Policies for Company Admins
-- Description: Allow company admins to upload photos for their specialists
-- Date: 2025-10-26
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Solo specialists can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Solo specialists can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Solo specialists can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Specialists can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Specialists can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Specialists can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can upload specialist photos" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can update specialist photos" ON storage.objects;
DROP POLICY IF EXISTS "Company admins can delete specialist photos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload specialist photos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update specialist photos" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete specialist photos" ON storage.objects;

-- Policy: Allow specialists (solo or company) to upload their own photos
CREATE POLICY "Specialists can upload their own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOLO_SPECIALIST', 'SPECIALIST')
    )
  );

-- Policy: Allow company admins to upload photos for their specialists
CREATE POLICY "Company admins can upload specialist photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'specialist-photos' AND
    (
      -- Extract specialist ID from path (format: "specialistId/photo-timestamp.ext")
      SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (string_to_array(name, '/'))[1]::uuid
        AND profiles.company_id = auth.uid()
        AND profiles.role = 'SPECIALIST'
      )
    )
  );

-- Policy: Allow super admins to upload photos for any specialist
CREATE POLICY "Super admins can upload specialist photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'specialist-photos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Policy: Allow specialists to update their own photos
CREATE POLICY "Specialists can update their own photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOLO_SPECIALIST', 'SPECIALIST')
    )
  );

-- Policy: Allow company admins to update their specialists' photos
CREATE POLICY "Company admins can update specialist photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (
      SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (string_to_array(name, '/'))[1]::uuid
        AND profiles.company_id = auth.uid()
        AND profiles.role = 'SPECIALIST'
      )
    )
  );

-- Policy: Allow super admins to update any specialist photos
CREATE POLICY "Super admins can update specialist photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Policy: Allow specialists to delete their own photos
CREATE POLICY "Specialists can delete their own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOLO_SPECIALIST', 'SPECIALIST')
    )
  );

-- Policy: Allow company admins to delete their specialists' photos
CREATE POLICY "Company admins can delete specialist photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    (
      SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (string_to_array(name, '/'))[1]::uuid
        AND profiles.company_id = auth.uid()
        AND profiles.role = 'SPECIALIST'
      )
    )
  );

-- Policy: Allow super admins to delete any specialist photos
CREATE POLICY "Super admins can delete specialist photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'specialist-photos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
