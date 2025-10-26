-- ============================================
-- Migration: Simplified Specialist Photos Policies
-- Description: Simpler policies for specialist photos
-- Date: 2025-10-26
-- ============================================

-- Drop ALL existing policies for specialist-photos
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

-- SIMPLIFIED: Allow anyone authenticated to manage specialist-photos
-- RLS on profiles table will handle who can update avatar_url
CREATE POLICY "Authenticated users can upload specialist photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'specialist-photos');

CREATE POLICY "Authenticated users can update specialist photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'specialist-photos');

CREATE POLICY "Authenticated users can delete specialist photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'specialist-photos');

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
