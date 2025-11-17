-- Migration 059
-- Fix CASCADE deletion for profiles to allow proper cleanup

-- Problem: Some foreign keys have ON DELETE RESTRICT which prevents
-- solo specialists from being deleted if they have related records.

-- Solution: Change RESTRICT to CASCADE where appropriate, or SET NULL.

-- ============================================
-- 1. Fix specialist_cities (should cascade)
-- ============================================
ALTER TABLE specialist_cities
  DROP CONSTRAINT IF EXISTS specialist_cities_specialist_id_fkey;

ALTER TABLE specialist_cities
  ADD CONSTRAINT specialist_cities_specialist_id_fkey
  FOREIGN KEY (specialist_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT specialist_cities_specialist_id_fkey ON specialist_cities IS
'Cascade delete cities when specialist is deleted';

-- ============================================
-- 2. Fix specialist_services (should cascade)
-- ============================================
ALTER TABLE specialist_services
  DROP CONSTRAINT IF EXISTS specialist_services_profile_id_fkey;

ALTER TABLE specialist_services
  ADD CONSTRAINT specialist_services_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT specialist_services_profile_id_fkey ON specialist_services IS
'Cascade delete services when specialist is deleted';

-- ============================================
-- 3. Fix specialist_translations (should cascade)
-- ============================================
ALTER TABLE specialist_translations
  DROP CONSTRAINT IF EXISTS specialist_translations_specialist_id_fkey;

ALTER TABLE specialist_translations
  ADD CONSTRAINT specialist_translations_specialist_id_fkey
  FOREIGN KEY (specialist_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT specialist_translations_specialist_id_fkey ON specialist_translations IS
'Cascade delete translations when specialist is deleted';

-- ============================================
-- 4. Fix company_translations (should cascade)
-- ============================================
ALTER TABLE company_translations
  DROP CONSTRAINT IF EXISTS company_translations_company_id_fkey;

ALTER TABLE company_translations
  ADD CONSTRAINT company_translations_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT company_translations_company_id_fkey ON company_translations IS
'Cascade delete translations when company is deleted';

-- ============================================
-- 5. Fix access_requests (should cascade)
-- ============================================
ALTER TABLE access_requests
  DROP CONSTRAINT IF EXISTS access_requests_user_id_fkey;

ALTER TABLE access_requests
  ADD CONSTRAINT access_requests_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT access_requests_user_id_fkey ON access_requests IS
'Cascade delete access request when user is deleted';

-- ============================================
-- 6. Fix profiles.company_id (SET NULL when company deleted)
-- ============================================
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT profiles_company_id_fkey ON profiles IS
'Set company_id to NULL when company is deleted (specialist becomes solo)';

-- ============================================
-- 7. Fix profiles.blocked_by (SET NULL when blocker deleted)
-- ============================================
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_blocked_by_fkey;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_blocked_by_fkey
  FOREIGN KEY (blocked_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT profiles_blocked_by_fkey ON profiles IS
'Set blocked_by to NULL when the admin who blocked is deleted';

-- ============================================
-- 8. Fix access_requests.reviewed_by (SET NULL when reviewer deleted)
-- ============================================
ALTER TABLE access_requests
  DROP CONSTRAINT IF EXISTS access_requests_reviewed_by_fkey;

ALTER TABLE access_requests
  ADD CONSTRAINT access_requests_reviewed_by_fkey
  FOREIGN KEY (reviewed_by)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT access_requests_reviewed_by_fkey ON access_requests IS
'Set reviewed_by to NULL when reviewer is deleted';

-- ============================================
-- NOTE: teams.leader_id should remain RESTRICT
-- because a team cannot exist without a leader.
-- Users must delete the team first or change leader.
-- ============================================

-- ============================================
-- NOTE: posts.author_id is already SET NULL
-- (from migration 038) so it's fine.
-- ============================================

COMMENT ON TABLE specialist_cities IS
'Now properly cascades when specialist is deleted';
COMMENT ON TABLE specialist_services IS
'Now properly cascades when specialist is deleted';
COMMENT ON TABLE specialist_translations IS
'Now properly cascades when specialist is deleted';
COMMENT ON TABLE company_translations IS
'Now properly cascades when company is deleted';
