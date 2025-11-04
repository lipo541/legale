-- ============================================
-- Migration: Add MODERATOR Full Access to Posts System
-- Description: Grant MODERATOR role same permissions as SUPER_ADMIN for posts and translations
-- Date: 2025-11-04
-- ============================================

-- ============================================
-- 1. DROP EXISTING SUPER_ADMIN-ONLY POLICIES
-- ============================================

-- Drop existing SUPER_ADMIN policy for posts
DROP POLICY IF EXISTS "Super Admin full access to posts" ON posts;

-- Drop existing SUPER_ADMIN policy for post_translations
DROP POLICY IF EXISTS "Super Admin full access to post translations" ON post_translations;

-- ============================================
-- 2. CREATE NEW POLICIES WITH SUPER_ADMIN + MODERATOR ACCESS
-- ============================================

-- Policy: SUPER_ADMIN and MODERATOR full access to all posts
CREATE POLICY "Super Admin and Moderator full access to posts"
ON posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SUPER_ADMIN', 'MODERATOR')
  )
);

-- Policy: SUPER_ADMIN and MODERATOR full access to all post translations
CREATE POLICY "Super Admin and Moderator full access to post translations"
ON post_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('SUPER_ADMIN', 'MODERATOR')
  )
);

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

-- Migration Summary:
-- ✅ Dropped old SUPER_ADMIN-only policies for posts and post_translations
-- ✅ Created new policies granting full access to both SUPER_ADMIN and MODERATOR roles
-- ✅ MODERATOR can now: CREATE, READ, UPDATE, DELETE all posts
-- ✅ MODERATOR can now: CREATE, READ, UPDATE, DELETE all post translations
-- ✅ MODERATOR has identical post management capabilities as SUPER_ADMIN

-- Next Steps:
-- 1. Run migration: supabase migration up
-- 2. Test MODERATOR role by creating/editing posts in moderator-dashboard
-- 3. Verify RLS policies work correctly for MODERATOR role
