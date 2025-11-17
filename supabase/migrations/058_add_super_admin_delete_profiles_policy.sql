-- Migration 058
-- Add SUPER_ADMIN DELETE policy for profiles table

-- The DELETE policy for SUPER_ADMIN was missing from the profiles table.
-- This migration adds it so SUPER_ADMINs can delete any profile.

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

COMMENT ON POLICY "super_admin_delete_profiles" ON profiles IS
'Super admins can delete any profile (solo specialists, companies, specialists, etc.)';
