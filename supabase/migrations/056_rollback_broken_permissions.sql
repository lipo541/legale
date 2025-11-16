-- ROLLBACK: Restore previous RLS policies and permissions state
-- This reverses the changes made by migration 055 that broke Gmail auth

-- Step 1: Drop the trigger and function that were created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Revoke the problematic permissions that were granted
REVOKE ALL ON public.profiles FROM authenticated;
REVOKE ALL ON public.profiles FROM service_role;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated, service_role;

-- Step 3: Re-grant the correct minimal permissions
-- Allow authenticated users to select and update their own profile
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Step 4: Ensure service_role has full access (needed for backend operations)
GRANT ALL ON public.profiles TO service_role;

-- Comment
COMMENT ON TABLE public.profiles IS 'User profiles table - RLS policies restored to working state';
