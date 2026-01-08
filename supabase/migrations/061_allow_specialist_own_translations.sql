-- Migration 061: Allow specialists to modify their own translations
-- Problem: Specialists can only SELECT their translations, not INSERT/UPDATE
-- This prevents sync from specialist dashboard to specialist_translations table

-- Drop existing modify policy
DROP POLICY IF EXISTS "specialist_translations_modify_policy" ON specialist_translations;

-- Create new policy that allows:
-- 1. Specialists to modify their OWN translations (specialist_id = auth.uid())
-- 2. Companies to modify their specialists' translations
-- 3. Super admins to modify any translations
CREATE POLICY "specialist_translations_modify_policy"
ON specialist_translations FOR ALL
TO authenticated
USING (
  -- Specialists can modify their own translations
  specialist_id = (select auth.uid()) OR
  -- Companies can modify their specialists' translations
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_translations.specialist_id
    AND specialist.company_id = (select auth.uid())
  ) OR
  -- Super admins can modify any translations
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE
  specialist_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM profiles AS specialist
    WHERE specialist.id = specialist_translations.specialist_id
    AND specialist.company_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
);

-- Comment explaining the policy
COMMENT ON POLICY "specialist_translations_modify_policy" ON specialist_translations IS 
'Allows specialists to modify their own translations, companies to modify their specialists translations, and super admins to modify any translations';
