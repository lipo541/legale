-- Fix RLS policies to allow public read access to company_cities and company_specializations
-- This allows visitors and all users to see which companies operate in which cities
-- and what specializations they have

-- Drop existing restrictive SELECT policies for company_cities
DROP POLICY IF EXISTS "Companies can view their own cities" ON public.company_cities;

-- Create new public read policy for company_cities
CREATE POLICY "Anyone can view company cities"
  ON public.company_cities FOR SELECT
  USING (true);

-- Drop existing restrictive SELECT policies for company_specializations
DROP POLICY IF EXISTS "Companies can view their own specializations" ON public.company_specializations;

-- Create new public read policy for company_specializations
CREATE POLICY "Anyone can view company specializations"
  ON public.company_specializations FOR SELECT
  USING (true);

-- Note: INSERT and DELETE policies remain the same (only companies can modify their own data)
