-- Allow users to upgrade their own role to SOLO_SPECIALIST ONLY
-- This is needed when a user completes the solo specialist registration form
-- SECURITY: Users can ONLY change from USER to SOLO_SPECIALIST, nothing else
-- IMPORTANT: Admin/Moderator/Company/Specialist roles can ONLY be assigned by SUPER_ADMIN

-- First, drop the old policy that might be too restrictive
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate with STRICT WITH CHECK clause to prevent privilege escalation
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- Case 1: No role change - user updates other fields only
      (role = (SELECT role FROM profiles WHERE id = auth.uid()))
      
      -- Case 2: STRICT one-time upgrade: USER → SOLO_SPECIALIST ONLY
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'USER' 
        AND role = 'SOLO_SPECIALIST'
      )
    )
  );

-- Add explicit comment for security audit
COMMENT ON POLICY "Users can update their own profile" ON profiles IS 
'SECURITY: Users can update profile fields. Role changes are RESTRICTED: Only USER → SOLO_SPECIALIST self-upgrade allowed. All other role assignments (SPECIALIST, COMPANY, MODERATOR, SUPER_ADMIN, AUTHOR) require SUPER_ADMIN approval via access_requests table.';
