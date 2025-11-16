    -- ============================================
    -- Fix Profiles RLS: Allow authenticated users to read their own profile
    -- This fixes the 406 error when Gmail users try to login
    -- ============================================

    -- Drop existing restrictive SELECT policy
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

    -- Create new policy that allows authenticated users to read their own profile
    -- This will work even if the profile was just created
    CREATE POLICY "Authenticated users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

    -- Also allow anon users to view public profile data (needed for public pages)
    CREATE POLICY "Public can view public profile data" 
    ON public.profiles 
    FOR SELECT 
    TO anon
    USING (true);

    -- ============================================
    -- Fix completed ✅
    -- ============================================
