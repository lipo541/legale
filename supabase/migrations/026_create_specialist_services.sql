-- ============================================
-- Migration: Create Specialist Services
-- Description: Allows both solo specialists and company specialists to select services
-- Date: 2025-10-26
-- ============================================

-- ============================================
-- 1. CREATE SPECIALIST_SERVICES JUNCTION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS specialist_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a specialist can't select the same service twice
  UNIQUE(profile_id, practice_id)
);

-- Add comments
COMMENT ON TABLE specialist_services IS 'Junction table for specialists (both solo and company) and their selected services/practices';
COMMENT ON COLUMN specialist_services.profile_id IS 'Foreign key to profiles table (specialist)';
COMMENT ON COLUMN specialist_services.practice_id IS 'Foreign key to practices table (service area)';

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for finding all services of a specialist
CREATE INDEX IF NOT EXISTS idx_specialist_services_profile_id 
ON specialist_services(profile_id);

-- Index for finding all specialists of a service
CREATE INDEX IF NOT EXISTS idx_specialist_services_practice_id 
ON specialist_services(practice_id);

-- Composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_specialist_services_profile_practice 
ON specialist_services(profile_id, practice_id);

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_specialist_services_updated_at
BEFORE UPDATE ON specialist_services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE specialist_services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read specialist services (for public profiles)
CREATE POLICY "Public read access for specialist services"
ON specialist_services FOR SELECT
USING (true);

-- Policy: Specialists can manage their own services
-- Solo specialists can manage their own
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

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON specialist_services TO postgres, service_role;
GRANT SELECT ON specialist_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON specialist_services TO authenticated;

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================
