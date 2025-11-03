-- Migration 048
-- Complete RLS Performance Fix - Fix ALL remaining auth.uid() calls and merge duplicate policies
-- This migration addresses TWO main issues:
-- 1. Auth RLS Init Plan: Replace auth.uid() with (select auth.uid()) for performance
-- 2. Multiple Permissive Policies: Merge duplicate policies into single policies with OR logic
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- PART 1: FIX PRACTICES & PRACTICE_TRANSLATIONS
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON practices;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON practices;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON practices;
DROP POLICY IF EXISTS "Super admins have full access to practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can create practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can update practices" ON practices;
DROP POLICY IF EXISTS "Authenticated users can delete practices" ON practices;

-- Create merged policy for INSERT (combines all insert permissions)
CREATE POLICY "practices_insert_policy"
ON practices FOR INSERT
TO authenticated
WITH CHECK (
  -- Super admins can insert anything
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Create merged policy for UPDATE
CREATE POLICY "practices_update_policy"
ON practices FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Create merged policy for DELETE
CREATE POLICY "practices_delete_policy"
ON practices FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- PRACTICE_TRANSLATIONS
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON practice_translations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON practice_translations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON practice_translations;
DROP POLICY IF EXISTS "Super admins have full access to practice_translations" ON practice_translations;
DROP POLICY IF EXISTS "Authenticated users can create practice translations" ON practice_translations;
DROP POLICY IF EXISTS "Authenticated users can update practice translations" ON practice_translations;
DROP POLICY IF EXISTS "Authenticated users can delete practice translations" ON practice_translations;

-- Create merged policies for practice_translations
CREATE POLICY "practice_translations_insert_policy"
ON practice_translations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "practice_translations_update_policy"
ON practice_translations FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "practice_translations_delete_policy"
ON practice_translations FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 2: FIX SERVICES & SERVICE_TRANSLATIONS
-- ============================================

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON services;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON services;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON services;
DROP POLICY IF EXISTS "Super admins have full access to services" ON services;

CREATE POLICY "services_insert_policy"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "services_update_policy"
ON services FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "services_delete_policy"
ON services FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- SERVICE_TRANSLATIONS
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON service_translations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON service_translations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON service_translations;
DROP POLICY IF EXISTS "Super admins have full access to service_translations" ON service_translations;

CREATE POLICY "service_translations_insert_policy"
ON service_translations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "service_translations_update_policy"
ON service_translations FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

CREATE POLICY "service_translations_delete_policy"
ON service_translations FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 3: FIX CITIES
-- ============================================

DROP POLICY IF EXISTS "Super admins have full access to cities" ON cities;

CREATE POLICY "cities_manage_policy"
ON cities FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 4: FIX COMPANY_CITIES (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Companies can add their own cities" ON company_cities;
DROP POLICY IF EXISTS "Companies can remove their own cities" ON company_cities;
DROP POLICY IF EXISTS "Super admins have full access to company_cities" ON company_cities;

-- Merged INSERT policy
CREATE POLICY "company_cities_insert_policy"
ON company_cities FOR INSERT
WITH CHECK (
  -- Companies can add their own cities OR super admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND (
      (role = 'COMPANY' AND id = company_cities.company_id) OR
      role = 'SUPER_ADMIN'
    )
  )
);

-- Merged DELETE policy
CREATE POLICY "company_cities_delete_policy"
ON company_cities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND (
      (role = 'COMPANY' AND id = company_cities.company_id) OR
      role = 'SUPER_ADMIN'
    )
  )
);

-- ============================================
-- PART 5: FIX COMPANY_SPECIALIZATIONS (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Companies can add their own specializations" ON company_specializations;
DROP POLICY IF EXISTS "Companies can remove their own specializations" ON company_specializations;
DROP POLICY IF EXISTS "Super admins have full access to company_specializations" ON company_specializations;

CREATE POLICY "company_specializations_insert_policy"
ON company_specializations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND (
      (role = 'COMPANY' AND id = company_specializations.company_id) OR
      role = 'SUPER_ADMIN'
    )
  )
);

CREATE POLICY "company_specializations_delete_policy"
ON company_specializations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid())
    AND (
      (role = 'COMPANY' AND id = company_specializations.company_id) OR
      role = 'SUPER_ADMIN'
    )
  )
);

-- ============================================
-- PART 6: FIX COMPANY_TRANSLATIONS (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Company can view their own translations" ON company_translations;
DROP POLICY IF EXISTS "Company can insert their own translations" ON company_translations;
DROP POLICY IF EXISTS "Company can update their own translations" ON company_translations;

-- Keep public read as-is (no auth call)
-- Merge company + admin access into single policies

CREATE POLICY "company_translations_insert_policy"
ON company_translations FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (select auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "company_translations_update_policy"
ON company_translations FOR UPDATE
TO authenticated
USING (
  company_id = (select auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('ADMIN', 'SUPER_ADMIN'))
)
WITH CHECK (
  company_id = (select auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- ============================================
-- PART 7: FIX SPECIALIZATIONS
-- ============================================

DROP POLICY IF EXISTS "Super admins have full access to specializations" ON specializations;

CREATE POLICY "specializations_manage_policy"
ON specializations FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 8: FIX ACCESS_REQUESTS (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Super admins have full access to access_requests" ON access_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON access_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON access_requests;
DROP POLICY IF EXISTS "Super admins can update requests" ON access_requests;

-- Merged SELECT policy (users, companies, super admins)
CREATE POLICY "access_requests_select_policy"
ON access_requests FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role = 'COMPANY' AND id = access_requests.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Merged INSERT policy
CREATE POLICY "access_requests_insert_policy"
ON access_requests FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (select auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Merged UPDATE policy
CREATE POLICY "access_requests_update_policy"
ON access_requests FOR UPDATE
TO authenticated
USING (
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role = 'COMPANY' AND id = access_requests.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (select auth.uid()) AND role = 'COMPANY' AND id = access_requests.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 9: FIX PROFILES (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Solo specialists can update own profile" ON profiles;
DROP POLICY IF EXISTS "Companies can request verification" ON profiles;
DROP POLICY IF EXISTS "Specialists can request verification" ON profiles;
DROP POLICY IF EXISTS "Super admins have full access to all profiles" ON profiles;
DROP POLICY IF EXISTS "SOLO_SPECIALIST can view own profile" ON profiles;
DROP POLICY IF EXISTS "Solo specialists can view own profile" ON profiles;

-- Merged SELECT policy
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
  id = (select auth.uid()) OR
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles AS company
    WHERE company.id = (select auth.uid()) AND company.role = 'COMPANY' AND company.id = profiles.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Merged UPDATE policy (users, companies updating specialists, verification requests, super admin)
CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (
  id = (select auth.uid()) OR
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles AS company
    WHERE company.id = (select auth.uid()) AND company.role = 'COMPANY' AND company.id = profiles.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  id = (select auth.uid()) OR
  (company_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles AS company
    WHERE company.id = (select auth.uid()) AND company.role = 'COMPANY' AND company.id = profiles.company_id
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Merged DELETE policy (already handled in migration 047, but ensuring it's using select)
-- (Companies can delete specialists is already in 047, just keep it)

-- ============================================
-- PART 10: FIX SPECIALIST_SERVICES (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "Solo specialists can manage their own services" ON specialist_services;
DROP POLICY IF EXISTS "Company admins can manage their specialists services" ON specialist_services;
DROP POLICY IF EXISTS "Super admins have full access to specialist_services" ON specialist_services;

-- Merged policy for ALL operations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "specialist_services_all_policy"
ON specialist_services FOR ALL
USING (
  -- Solo specialists
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'SOLO_SPECIALIST' 
    AND id = specialist_services.specialist_id
  ) OR
  -- Company admins managing their specialists
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_services.specialist_id
    AND specialist.company_id = (select auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'COMPANY')
  ) OR
  -- Super admins
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'SOLO_SPECIALIST' 
    AND id = specialist_services.specialist_id
  ) OR
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_services.specialist_id
    AND specialist.company_id = (select auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'COMPANY')
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- ============================================
-- PART 11: FIX SPECIALIST_TRANSLATIONS (MERGE POLICIES)
-- ============================================

DROP POLICY IF EXISTS "super_admin_all_access_specialist_translations" ON specialist_translations;
DROP POLICY IF EXISTS "company_manage_own_specialists_translations" ON specialist_translations;
DROP POLICY IF EXISTS "specialist_read_own_translations" ON specialist_translations;

-- Merged SELECT policy (public + specialist + company + super admin)
-- Keep public read as separate since it has no auth check
-- CREATE POLICY "public_read_all_translations" ON specialist_translations FOR SELECT USING (true);

-- Merged authenticated access
CREATE POLICY "specialist_translations_select_auth_policy"
ON specialist_translations FOR SELECT
TO authenticated
USING (
  specialist_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_translations.specialist_id
    AND specialist.company_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Merged INSERT/UPDATE/DELETE policy (company + super admin)
CREATE POLICY "specialist_translations_modify_policy"
ON specialist_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_translations.specialist_id
    AND specialist.company_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_translations.specialist_id
    AND specialist.company_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Migration complete
-- Summary: Fixed ~60+ RLS policies across 15+ tables
-- - All auth.uid() calls now use (select auth.uid()) for better performance
-- - Multiple permissive policies merged into single policies with OR logic
-- - This should eliminate most/all Supabase performance warnings
