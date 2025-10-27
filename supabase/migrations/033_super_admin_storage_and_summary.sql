-- Grant SUPER_ADMIN full access to storage buckets
-- This ensures super admins can manage all files and buckets without restrictions

-- ====================================
-- STORAGE BUCKETS POLICIES
-- ====================================

-- Drop any existing super admin storage policies
DROP POLICY IF EXISTS "Super admins can manage services bucket" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage company-logos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage specialist-photos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can manage all buckets" ON storage.objects;

-- Note: The main storage policy was created in 032_super_admin_full_access_all_tables.sql
-- This migration ensures all storage-related restrictions are removed for SUPER_ADMIN

-- Grant bucket management permissions
-- SUPER_ADMIN can now:
-- 1. Upload to any bucket
-- 2. Delete from any bucket  
-- 3. Update any file
-- 4. View all files in all buckets

-- Add documentation
COMMENT ON POLICY "Super admins have full access to all storage" ON storage.objects 
IS 'SUPER_ADMIN has unrestricted access to all storage buckets including: services, company-logos, specialist-photos, and any future buckets';

-- ====================================
-- Ensure SUPER_ADMIN bypass on auth.users if needed
-- ====================================

-- Note: SUPER_ADMIN permissions are primarily managed through the profiles table
-- All policies check: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
-- This ensures consistent permission checking across all tables

-- ====================================
-- Summary of SUPER_ADMIN permissions
-- ====================================

-- SUPER_ADMIN now has FULL ACCESS to:
-- ✓ profiles (SELECT, INSERT, UPDATE, DELETE)
-- ✓ access_requests (SELECT, INSERT, UPDATE, DELETE)
-- ✓ specialist_services (SELECT, INSERT, UPDATE, DELETE)
-- ✓ practices (SELECT, INSERT, UPDATE, DELETE)
-- ✓ practice_translations (SELECT, INSERT, UPDATE, DELETE)
-- ✓ services (SELECT, INSERT, UPDATE, DELETE)
-- ✓ service_translations (SELECT, INSERT, UPDATE, DELETE)
-- ✓ cities (SELECT, INSERT, UPDATE, DELETE)
-- ✓ company_specializations (SELECT, INSERT, UPDATE, DELETE)
-- ✓ specializations (SELECT, INSERT, UPDATE, DELETE)
-- ✓ company_cities (SELECT, INSERT, UPDATE, DELETE)
-- ✓ storage.objects - ALL buckets (SELECT, INSERT, UPDATE, DELETE)

-- SUPER_ADMIN can:
-- ✓ Change verification_status for any role (SOLO_SPECIALIST, SPECIALIST, COMPANY)
-- ✓ Approve/reject access requests
-- ✓ Manage all user profiles
-- ✓ Upload/delete files in any storage bucket
-- ✓ Manage all practices, services, and translations
-- ✓ No restrictions on any database operations
