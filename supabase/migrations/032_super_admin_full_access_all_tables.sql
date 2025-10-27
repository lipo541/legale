-- Grant SUPER_ADMIN full access to all tables
-- This ensures super admins can manage everything without restrictions

-- ====================================
-- ACCESS REQUESTS TABLE
-- ====================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can view all requests" ON access_requests;
DROP POLICY IF EXISTS "Super admins can update all requests" ON access_requests;
DROP POLICY IF EXISTS "Super admins can delete requests" ON access_requests;
DROP POLICY IF EXISTS "Super admins have full access to access_requests" ON access_requests;

-- Create comprehensive SUPER_ADMIN policy for access_requests
CREATE POLICY "Super admins have full access to access_requests" 
ON access_requests 
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

-- ====================================
-- SPECIALIST SERVICES TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage all specialist services" ON specialist_services;
DROP POLICY IF EXISTS "Super admins have full access to specialist_services" ON specialist_services;

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

-- ====================================
-- PRACTICES TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can view all practices" ON practices;
DROP POLICY IF EXISTS "Super admins can manage practices" ON practices;
DROP POLICY IF EXISTS "Super admins have full access to practices" ON practices;

CREATE POLICY "Super admins have full access to practices" 
ON practices 
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

-- ====================================
-- PRACTICE TRANSLATIONS TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage practice translations" ON practice_translations;
DROP POLICY IF EXISTS "Super admins have full access to practice_translations" ON practice_translations;

CREATE POLICY "Super admins have full access to practice_translations" 
ON practice_translations 
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

-- ====================================
-- SERVICES TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage services" ON services;
DROP POLICY IF EXISTS "Super admins have full access to services" ON services;

CREATE POLICY "Super admins have full access to services" 
ON services 
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

-- ====================================
-- SERVICE TRANSLATIONS TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage service translations" ON service_translations;
DROP POLICY IF EXISTS "Super admins have full access to service_translations" ON service_translations;

CREATE POLICY "Super admins have full access to service_translations" 
ON service_translations 
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

-- ====================================
-- CITIES TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Super admins have full access to cities" ON cities;

CREATE POLICY "Super admins have full access to cities" 
ON cities 
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

-- ====================================
-- COMPANY SPECIALIZATIONS TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage company specializations" ON company_specializations;
DROP POLICY IF EXISTS "Super admins have full access to company_specializations" ON company_specializations;

CREATE POLICY "Super admins have full access to company_specializations" 
ON company_specializations 
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

-- Add comment for documentation
COMMENT ON POLICY "Super admins have full access to all profiles" ON profiles 
IS 'SUPER_ADMIN role has unrestricted access to all profile operations including verification status changes';

-- ====================================
-- SPECIALIZATIONS TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage specializations" ON specializations;
DROP POLICY IF EXISTS "Super admins have full access to specializations" ON specializations;

CREATE POLICY "Super admins have full access to specializations" 
ON specializations 
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

-- ====================================
-- COMPANY CITIES TABLE
-- ====================================

DROP POLICY IF EXISTS "Super admins can manage company cities" ON company_cities;
DROP POLICY IF EXISTS "Super admins have full access to company_cities" ON company_cities;

CREATE POLICY "Super admins have full access to company_cities" 
ON company_cities 
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

-- ====================================
-- ADDITIONAL COMMENTS
-- ====================================

COMMENT ON POLICY "Super admins have full access to access_requests" ON access_requests 
IS 'SUPER_ADMIN has unrestricted access to all access request operations';

COMMENT ON POLICY "Super admins have full access to specialist_services" ON specialist_services 
IS 'SUPER_ADMIN has unrestricted access to all specialist services operations';

COMMENT ON POLICY "Super admins have full access to practices" ON practices 
IS 'SUPER_ADMIN has unrestricted access to all practices operations';


