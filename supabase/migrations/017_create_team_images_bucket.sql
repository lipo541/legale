-- ============================================
-- Migration: Create Team Images Storage Bucket
-- Description: Storage bucket for team banner images and related assets
-- Date: 2025-11-11
-- Note: This migration sets up storage policies for the 'createteam' bucket
-- ============================================

-- The bucket 'createteam' should be created manually in Supabase Dashboard with:
--   - Name: createteam
--   - Public: true
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp

-- ============================================
-- STORAGE POLICIES (RLS) for 'createteam' bucket
-- ============================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "createteam_public_read" ON storage.objects;
DROP POLICY IF EXISTS "createteam_super_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "createteam_super_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "createteam_super_admin_delete" ON storage.objects;

-- Policy 1: Anyone can read/view images (public access)
CREATE POLICY "createteam_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'createteam');

-- Policy 2: Super admins can upload team images
CREATE POLICY "createteam_super_admin_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'createteam' 
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Policy 3: Super admins can update team images
CREATE POLICY "createteam_super_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'createteam'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
)
WITH CHECK (
  bucket_id = 'createteam'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Policy 4: Super admins can delete team images
CREATE POLICY "createteam_super_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'createteam'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);

