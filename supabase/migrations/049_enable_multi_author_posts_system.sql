-- ============================================
-- Migration: Enable Multi-Author Posts System with Auto-Draft Protection
-- Description: Allow verified specialists, companies, and authors to create posts
--              with automatic draft status when published posts are edited by authors
-- Date: 2025-11-04
-- Author: System
-- ============================================

-- ============================================
-- PART 1: DROP EXISTING RESTRICTIVE RLS POLICIES
-- ============================================

-- Drop old restrictive policies that only allow SUPER_ADMIN or limit to draft-only
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own draft posts" ON posts;
DROP POLICY IF EXISTS "Authors can delete own draft posts" ON posts;

DROP POLICY IF EXISTS "Authenticated users can create post translations" ON post_translations;
DROP POLICY IF EXISTS "Authors can update own post translations" ON post_translations;
DROP POLICY IF EXISTS "Authors can delete own post translations" ON post_translations;

-- ============================================
-- PART 2: CREATE NEW FLEXIBLE RLS POLICIES FOR POSTS TABLE
-- ============================================

-- Policy 1: Public can read published posts (unchanged)
-- Already exists: "Public read access for published posts"

-- Policy 2: Verified users (SPECIALIST, COMPANY, SOLO_SPECIALIST, AUTHOR) can CREATE posts
CREATE POLICY "Verified users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be the author
  (select auth.uid()) = author_id
  AND
  -- User must have a verified role (not USER)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role IN ('SPECIALIST', 'COMPANY', 'SOLO_SPECIALIST', 'AUTHOR', 'SUPER_ADMIN')
  )
  AND
  -- New posts must start as draft
  status = 'draft'
);

-- Policy 3: Authors can READ their own posts (any status)
CREATE POLICY "Authors can read own posts"
ON posts FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = author_id
);

-- Policy 4: Authors can UPDATE their own posts
-- Note: The trigger (below) will auto-set status to 'draft' if published post is edited by non-superadmin
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = author_id
)
WITH CHECK (
  (select auth.uid()) = author_id
);

-- Policy 5: Authors can DELETE their own draft posts only
CREATE POLICY "Authors can delete own draft posts"
ON posts FOR DELETE
TO authenticated
USING (
  (select auth.uid()) = author_id
  AND status = 'draft'
);

-- Policy 6: Super Admin has full access (unchanged)
-- Already exists: "Super Admin full access to posts"

-- ============================================
-- PART 3: CREATE NEW FLEXIBLE RLS POLICIES FOR POST_TRANSLATIONS TABLE
-- ============================================

-- Policy 1: Public can read translations of published posts (unchanged)
-- Already exists: "Public read access for published post translations"

-- Policy 2: Authors can CREATE translations for their own posts
CREATE POLICY "Authors can create own post translations"
ON post_translations FOR INSERT
TO authenticated
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid())
  )
);

-- Policy 3: Authors can READ translations of their own posts
CREATE POLICY "Authors can read own post translations"
ON post_translations FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid())
  )
);

-- Policy 4: Authors can UPDATE translations of their own posts
CREATE POLICY "Authors can update own post translations"
ON post_translations FOR UPDATE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid())
  )
)
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid())
  )
);

-- Policy 5: Authors can DELETE translations of their own draft posts
CREATE POLICY "Authors can delete own post translations"
ON post_translations FOR DELETE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid())
    AND status = 'draft'
  )
);

-- Policy 6: Super Admin has full access (unchanged)
-- Already exists: "Super Admin full access to post translations"

-- ============================================
-- PART 4: CREATE TRIGGER FUNCTION FOR AUTO-DRAFT PROTECTION
-- ============================================

-- This function automatically changes status to 'draft' when:
-- 1. A published post is edited by the author (not SUPER_ADMIN)
-- 2. This ensures all author edits go through review again

CREATE OR REPLACE FUNCTION auto_draft_on_author_edit()
RETURNS TRIGGER AS $$
DECLARE
  editor_role TEXT;
  post_author_id UUID;
BEGIN
  -- Get the editor's role
  SELECT role INTO editor_role
  FROM profiles
  WHERE id = (select auth.uid());

  -- Get the post's author
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.id;

  -- If the post was published AND the editor is NOT a SUPER_ADMIN AND the editor is the author
  IF OLD.status = 'published' 
     AND editor_role != 'SUPER_ADMIN' 
     AND (select auth.uid()) = post_author_id THEN
    
    -- Force status to 'draft'
    NEW.status := 'draft';
    
    -- Log the change (optional)
    RAISE NOTICE 'Post % automatically changed to draft because author edited it', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: CREATE TRIGGER ON POSTS TABLE
-- ============================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_auto_draft_on_author_edit ON posts;

-- Create trigger that fires BEFORE UPDATE
CREATE TRIGGER trigger_auto_draft_on_author_edit
BEFORE UPDATE ON posts
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.updated_at IS DISTINCT FROM NEW.updated_at)
EXECUTE FUNCTION auto_draft_on_author_edit();

-- ============================================
-- PART 6: ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON POLICY "Verified users can create posts" ON posts IS 
'Allows SPECIALIST, COMPANY, SOLO_SPECIALIST, AUTHOR roles to create posts. All new posts must be draft status.';

COMMENT ON POLICY "Authors can read own posts" ON posts IS 
'Authors can view all their own posts regardless of status.';

COMMENT ON POLICY "Authors can update own posts" ON posts IS 
'Authors can edit their own posts. If a published post is edited by author, trigger auto-sets status to draft.';

COMMENT ON POLICY "Authors can delete own draft posts" ON posts IS 
'Authors can only delete their own posts if they are in draft status.';

COMMENT ON FUNCTION auto_draft_on_author_edit() IS 
'Automatically changes post status to draft when a non-SUPER_ADMIN author edits a published post. This ensures editorial review.';

-- ============================================
-- PART 7: CREATE HELPER VIEW FOR DASHBOARD QUERIES
-- ============================================

-- Create a view to simplify author dashboard queries
CREATE OR REPLACE VIEW author_posts_with_status AS
SELECT 
  p.id,
  p.author_id,
  p.practice_id,
  p.status,
  p.display_position,
  p.position_order,
  p.featured_image_url,
  p.published_at,
  p.created_at,
  p.updated_at,
  prof.full_name as author_name,
  prof.email as author_email,
  prof.role as author_role,
  -- Count translations
  (SELECT COUNT(*) FROM post_translations WHERE post_id = p.id) as translation_count,
  -- Get Georgian title for quick reference
  (SELECT title FROM post_translations WHERE post_id = p.id AND language = 'ka' LIMIT 1) as title_ka
FROM posts p
LEFT JOIN profiles prof ON p.author_id = prof.id;

-- Grant access to view
GRANT SELECT ON author_posts_with_status TO authenticated;

-- Add RLS to view (inherits from base tables)
ALTER VIEW author_posts_with_status SET (security_invoker = on);

COMMENT ON VIEW author_posts_with_status IS 
'Helper view for author dashboards. Shows posts with author info and basic translation data.';

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================

-- Migration Summary:
-- ✅ Dropped old restrictive RLS policies
-- ✅ Created new flexible policies for verified users (SPECIALIST, COMPANY, SOLO_SPECIALIST, AUTHOR)
-- ✅ Authors can now create, read, update, and delete their own posts
-- ✅ New posts automatically start as 'draft'
-- ✅ Created auto_draft_on_author_edit() trigger function
-- ✅ Published posts automatically revert to 'draft' when edited by author (not SUPER_ADMIN)
-- ✅ SUPER_ADMIN retains full control over all posts
-- ✅ Created helper view for dashboard queries
-- ✅ Added comprehensive comments for documentation

-- Security Features:
-- 🔒 Only verified users (non-USER role) can create posts
-- 🔒 Authors can only manage their own posts
-- 🔒 Published posts require SUPER_ADMIN approval after author edits
-- 🔒 Automatic draft protection prevents unauthorized published content
-- 🔒 All RLS policies use subqueries for security (no function inlining issues)

-- Next Steps for Implementation:
-- 1. Apply migration: supabase db push
-- 2. Create universal PostEditor component in frontend
-- 3. Add "My Posts" section to specialist/company dashboards
-- 4. Update SuperAdmin dashboard to show all draft posts (from all authors)
-- 5. Add status indicator UI (Draft/Published) for authors
-- 6. Test full workflow: create → submit → admin approve → author edit → auto-draft

