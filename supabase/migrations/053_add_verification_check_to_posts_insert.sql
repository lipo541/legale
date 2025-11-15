-- Add verification_status check to posts INSERT policy
-- Only VERIFIED specialists/solo specialists can create posts

DROP POLICY IF EXISTS "Verified users can create posts" ON posts;

CREATE POLICY "Verified users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be the author
  (select auth.uid()) = author_id
  AND
  -- User must have a verified role AND be verified (for SPECIALIST/SOLO_SPECIALIST)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role IN ('SPECIALIST', 'COMPANY', 'SOLO_SPECIALIST', 'AUTHOR', 'SUPER_ADMIN')
    AND (
      -- SUPER_ADMIN and AUTHOR don't need verification
      profiles.role IN ('SUPER_ADMIN', 'AUTHOR')
      OR
      -- SPECIALIST, SOLO_SPECIALIST, COMPANY must be verified
      (profiles.role IN ('SPECIALIST', 'SOLO_SPECIALIST', 'COMPANY') AND profiles.verification_status = 'verified')
    )
  )
  AND
  -- New posts must start as draft
  status = 'draft'
);

COMMENT ON POLICY "Verified users can create posts" ON posts IS 'Only verified specialists/solo specialists/companies or authors/super admins can create draft posts';
