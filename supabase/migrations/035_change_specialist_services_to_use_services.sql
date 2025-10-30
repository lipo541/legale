-- ============================================
-- Migration: Change specialist_services to use services instead of practices
-- Description: Changes practice_id to service_id in specialist_services table
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- 1. DROP EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public read access for specialist services" ON specialist_services;
DROP POLICY IF EXISTS "Solo specialists can manage their own services" ON specialist_services;
DROP POLICY IF EXISTS "Company admins can manage their specialists services" ON specialist_services;
DROP POLICY IF EXISTS "Super admins have full access to specialist_services" ON specialist_services;

-- ============================================
-- 2. DROP EXISTING INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_specialist_services_practice_id;
DROP INDEX IF EXISTS idx_specialist_services_profile_practice;

-- ============================================
-- 3. DELETE ALL EXISTING DATA (since we're changing from practices to services)
-- ============================================

-- Clear all existing specialist_services data
-- Users will need to re-select their services instead of practices
TRUNCATE TABLE specialist_services CASCADE;

-- ============================================
-- 4. DROP OLD CONSTRAINT AND COLUMN
-- ============================================

-- Drop the unique constraint
ALTER TABLE specialist_services DROP CONSTRAINT IF EXISTS specialist_services_profile_id_practice_id_key;

-- Drop the old practice_id column
ALTER TABLE specialist_services DROP COLUMN IF EXISTS practice_id;

-- ============================================
-- 5. ADD NEW SERVICE_ID COLUMN
-- ============================================

ALTER TABLE specialist_services 
ADD COLUMN service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE;

-- Add unique constraint for profile_id and service_id
ALTER TABLE specialist_services 
ADD CONSTRAINT specialist_services_profile_id_service_id_key UNIQUE(profile_id, service_id);

-- ============================================
-- 6. CREATE NEW INDEXES
-- ============================================

-- Index for finding all specialists of a service
CREATE INDEX idx_specialist_services_service_id 
ON specialist_services(service_id);

-- Composite index for efficient lookups
CREATE INDEX idx_specialist_services_profile_service 
ON specialist_services(profile_id, service_id);

-- ============================================
-- 7. UPDATE COMMENTS
-- ============================================

COMMENT ON TABLE specialist_services IS 'Junction table for specialists (both solo and company) and their selected services';
COMMENT ON COLUMN specialist_services.profile_id IS 'Foreign key to profiles table (specialist)';
COMMENT ON COLUMN specialist_services.service_id IS 'Foreign key to services table';

-- ============================================
-- 8. RECREATE ROW LEVEL SECURITY POLICIES
-- ============================================

-- Policy: Anyone can read specialist services (for public profiles)
CREATE POLICY "Public read access for specialist services"
ON specialist_services FOR SELECT
USING (true);

-- Policy: Solo specialists can manage their own services
CREATE POLICY "Solo specialists can manage their own services"
ON specialist_services FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SOLO_SPECIALIST', 'SPECIALIST')
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SOLO_SPECIALIST', 'SPECIALIST')
  )
);

-- Policy: Company admins can manage their specialists' services
CREATE POLICY "Company admins can manage their specialists services"
ON specialist_services FOR ALL
USING (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE company_id = auth.uid()
    AND role = 'SPECIALIST'
  )
)
WITH CHECK (
  profile_id IN (
    SELECT id FROM profiles 
    WHERE company_id = auth.uid()
    AND role = 'SPECIALIST'
  )
);

-- Policy: Super admins have full access
CREATE POLICY "Super admins have full access to specialist_services" 
ON specialist_services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  )
);

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
