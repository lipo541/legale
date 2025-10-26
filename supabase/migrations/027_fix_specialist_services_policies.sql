-- ============================================
-- Migration: Fix Specialist Services RLS Policies
-- Description: Fix Company admin policy to correctly check company_id
-- Date: 2025-10-26
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Company admins can manage their specialists services" ON specialist_services;

-- Recreate Company admin policy with correct logic
-- Company user's ID should match the specialist's company_id
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
-- MIGRATION COMPLETE ✅
-- ============================================
