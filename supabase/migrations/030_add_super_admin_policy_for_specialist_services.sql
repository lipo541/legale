-- ============================================
-- Migration: Add Super Admin Policy for Specialist Services
-- Description: Allow super admins to manage specialist services
-- Date: 2025-10-27
-- ============================================

-- Policy: Super admins can manage all specialist services
CREATE POLICY "Super admins can manage all specialist services"
ON specialist_services FOR ALL
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
