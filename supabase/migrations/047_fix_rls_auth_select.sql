-- Migration 047
-- Fix RLS policies to call auth functions via SELECT so they are initialized once per statement
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- DROP and RECREATE policies that used auth.uid() directly so the function is called once per statement

-- POSTS
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own draft posts" ON posts;
DROP POLICY IF EXISTS "Authors can delete own draft posts" ON posts;
DROP POLICY IF EXISTS "Super Admin full access to posts" ON posts;

CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = author_id AND
  status = 'draft'
);

CREATE POLICY "Authors can update own draft posts"
ON posts FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = author_id AND
  status = 'draft'
)
WITH CHECK (
  (select auth.uid()) = author_id AND
  status IN ('draft', 'pending')
);

CREATE POLICY "Authors can delete own draft posts"
ON posts FOR DELETE
TO authenticated
USING (
  (select auth.uid()) = author_id AND
  status = 'draft'
);

CREATE POLICY "Super Admin full access to posts"
ON posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- POST_TRANSLATIONS
DROP POLICY IF EXISTS "Authenticated users can create post translations" ON post_translations;
DROP POLICY IF EXISTS "Authors can update own post translations" ON post_translations;
DROP POLICY IF EXISTS "Authors can delete own post translations" ON post_translations;
DROP POLICY IF EXISTS "Super Admin full access to post translations" ON post_translations;

CREATE POLICY "Authenticated users can create post translations"
ON post_translations FOR INSERT
TO authenticated
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid()) 
    AND status = 'draft'
  )
);

CREATE POLICY "Authors can update own post translations"
ON post_translations FOR UPDATE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid()) 
    AND status IN ('draft', 'pending')
  )
)
WITH CHECK (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid()) 
    AND status IN ('draft', 'pending')
  )
);

CREATE POLICY "Authors can delete own post translations"
ON post_translations FOR DELETE
TO authenticated
USING (
  post_id IN (
    SELECT id FROM posts 
    WHERE author_id = (select auth.uid()) 
    AND status = 'draft'
  )
);

CREATE POLICY "Super Admin full access to post translations"
ON post_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- POST CATEGORIES / TRANSLATIONS (super-admin policies referencing auth.uid())
DROP POLICY IF EXISTS "Super Admin full access to categories" ON post_categories;
DROP POLICY IF EXISTS "Super Admin full access to category translations" ON post_category_translations;

CREATE POLICY "Super Admin full access to categories"
ON post_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'SUPER_ADMIN'
  )
);

CREATE POLICY "Super Admin full access to category translations"
ON post_category_translations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'SUPER_ADMIN'
  )
);

-- ACCESS_REQUESTS (company-scoped policies)
DROP POLICY IF EXISTS "Companies can view join requests" ON access_requests;
DROP POLICY IF EXISTS "Companies can update join requests" ON access_requests;

CREATE POLICY "Companies can view join requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

CREATE POLICY "Companies can update join requests"
  ON access_requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'COMPANY'
      AND profiles.id = access_requests.company_id
    )
  );

-- PROFILES (company -> specialists policies)
DROP POLICY IF EXISTS "Companies can view their specialists" ON profiles;
DROP POLICY IF EXISTS "Companies can update their specialists" ON profiles;
DROP POLICY IF EXISTS "Companies can delete their specialists" ON profiles;

CREATE POLICY "Companies can view their specialists"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = (select auth.uid())
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

CREATE POLICY "Companies can update their specialists"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = (select auth.uid())
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  )
  WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = (select auth.uid())
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

CREATE POLICY "Companies can delete their specialists"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    company_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM profiles AS company
      WHERE company.id = (select auth.uid())
      AND company.role = 'COMPANY'
      AND company.id = profiles.company_id
    )
  );

-- SPECIALIST_CITIES
DROP POLICY IF EXISTS "Specialists can add their own cities" ON public.specialist_cities;
DROP POLICY IF EXISTS "Specialists can remove their own cities" ON public.specialist_cities;
DROP POLICY IF EXISTS "Super admins have full access to specialist_cities" ON public.specialist_cities;

CREATE POLICY "Specialists can add their own cities"
  ON public.specialist_cities FOR INSERT
  WITH CHECK (
    (select auth.uid()) = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "Specialists can remove their own cities"
  ON public.specialist_cities FOR DELETE
  USING (
    (select auth.uid()) = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "Super admins have full access to specialist_cities"
  ON public.specialist_cities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'SUPER_ADMIN')
  );

-- Migration complete
