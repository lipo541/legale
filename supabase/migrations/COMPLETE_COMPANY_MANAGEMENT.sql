-- Complete migrations for company-specialist management system

-- ============================================
-- PART 1: PROFILES TABLE UPDATES
-- ============================================

-- 1. Add is_blocked field to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);

COMMENT ON COLUMN profiles.is_blocked IS 'Whether the user is blocked (cannot access platform)';

-- 2. Add company_id field to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

COMMENT ON COLUMN profiles.company_id IS 'Reference to company profile that this specialist belongs to';

-- ============================================
-- PART 2: ACCESS_REQUESTS TABLE UPDATES
-- ============================================

-- Add company_id to track which company a specialist wants to join
ALTER TABLE access_requests
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES profiles(id);

-- Add index for company_id
CREATE INDEX IF NOT EXISTS idx_access_requests_company_id ON access_requests(company_id);

COMMENT ON COLUMN access_requests.company_id IS 'Company that specialist wants to join (null for solo specialists or company registrations)';

-- ============================================
-- PART 3: RLS POLICIES FOR ACCESS_REQUESTS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can view join requests" ON access_requests;
DROP POLICY IF EXISTS "Companies can update join requests" ON access_requests;

-- Add RLS policy: Companies can view requests for joining their company
CREATE POLICY "Companies can view join requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

-- Add RLS policy: Companies can update requests for joining their company (approve/reject)
CREATE POLICY "Companies can update join requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

-- ============================================
-- PART 4: RLS POLICIES FOR PROFILES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies can view their specialists" ON profiles;
DROP POLICY IF EXISTS "Companies can update their specialists" ON profiles;
DROP POLICY IF EXISTS "Companies can delete their specialists" ON profiles;

-- Policy: Companies can view their own specialists
CREATE POLICY "Companies can view their specialists"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

-- Policy: Companies can update their own specialists
CREATE POLICY "Companies can update their specialists"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

-- Policy: Companies can delete their own specialists
CREATE POLICY "Companies can delete their specialists"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = auth.uid()
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );
