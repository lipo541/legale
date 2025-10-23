-- ============================================
-- Migration 003: Add RLS Policies for Practices
-- ============================================
-- Description: Add Row Level Security policies for practices and practice_translations tables
-- Author: System
-- Date: 2025-10-23

-- ============================================
-- 1. ENABLE RLS ON TABLES (if not already enabled)
-- ============================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_translations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================

DROP POLICY IF EXISTS "Enable read access for all users" ON practices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON practices;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON practices;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON practices;

DROP POLICY IF EXISTS "Enable read access for all users" ON practice_translations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON practice_translations;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON practice_translations;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON practice_translations;

-- ============================================
-- 3. CREATE POLICIES FOR PRACTICES TABLE
-- ============================================

-- Allow public read access to published practices
CREATE POLICY "Enable read access for all users" ON practices
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert practices
CREATE POLICY "Enable insert for authenticated users only" ON practices
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update practices
CREATE POLICY "Enable update for authenticated users only" ON practices
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete practices
CREATE POLICY "Enable delete for authenticated users only" ON practices
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 4. CREATE POLICIES FOR PRACTICE_TRANSLATIONS TABLE
-- ============================================

-- Allow public read access to all translations
CREATE POLICY "Enable read access for all users" ON practice_translations
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert translations
CREATE POLICY "Enable insert for authenticated users only" ON practice_translations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update translations
CREATE POLICY "Enable update for authenticated users only" ON practice_translations
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete translations
CREATE POLICY "Enable delete for authenticated users only" ON practice_translations
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on practices table
GRANT ALL ON practices TO postgres, service_role;
GRANT SELECT ON practices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON practices TO authenticated;

-- Grant permissions on practice_translations table
GRANT ALL ON practice_translations TO postgres, service_role;
GRANT SELECT ON practice_translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON practice_translations TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON POLICY "Enable read access for all users" ON practices IS 
  'Allows anyone to read practices (published and draft)';

COMMENT ON POLICY "Enable insert for authenticated users only" ON practices IS 
  'Only authenticated users (admins) can create new practices';

COMMENT ON POLICY "Enable update for authenticated users only" ON practices IS 
  'Only authenticated users (admins) can update practices';

COMMENT ON POLICY "Enable delete for authenticated users only" ON practices IS 
  'Only authenticated users (admins) can delete practices';
