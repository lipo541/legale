-- ============================================
-- FIX: Add missing DELETE policy for profiles
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- First, check existing policies on profiles table
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Drop old policy if exists (to avoid duplicates)
DROP POLICY IF EXISTS "super_admin_delete_profiles" ON profiles;

-- Create the DELETE policy for SUPER_ADMIN
CREATE POLICY "super_admin_delete_profiles"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- Verify the policy was created
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'DELETE';

-- ============================================
-- Also check if RLS is enabled on profiles
-- ============================================
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- ============================================
-- Check the specific user we want to delete
-- ============================================
SELECT id, email, role, is_blocked, verification_status 
FROM profiles 
WHERE id = '6083c82a-0f06-49d4-8d3d-03bab7af96da';

-- ============================================
-- Check what foreign keys reference this user
-- ============================================
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;
