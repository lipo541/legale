-- Create specialist_cities junction table for many-to-many relationship
-- This allows specialists to select multiple cities they work in, similar to company_cities

CREATE TABLE IF NOT EXISTS public.specialist_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(specialist_id, city_id)
);

-- Enable RLS
ALTER TABLE public.specialist_cities ENABLE ROW LEVEL SECURITY;

-- Public read access - everyone can see which cities specialists work in
CREATE POLICY "Specialist cities are viewable by everyone"
  ON public.specialist_cities FOR SELECT
  USING (true);

-- Specialists can add their own cities
CREATE POLICY "Specialists can add their own cities"
  ON public.specialist_cities FOR INSERT
  WITH CHECK (
    auth.uid() = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Specialists can remove their own cities
CREATE POLICY "Specialists can remove their own cities"
  ON public.specialist_cities FOR DELETE
  USING (
    auth.uid() = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Super admins have full access to all specialist cities
CREATE POLICY "Super admins have full access to specialist_cities"
  ON public.specialist_cities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Create indexes for better query performance
CREATE INDEX idx_specialist_cities_specialist_id ON public.specialist_cities(specialist_id);
CREATE INDEX idx_specialist_cities_city_id ON public.specialist_cities(city_id);

-- Add comment for documentation
COMMENT ON TABLE public.specialist_cities IS 'Junction table linking specialists to multiple cities they work in';
COMMENT ON COLUMN public.specialist_cities.specialist_id IS 'References the specialist user ID from auth.users';
COMMENT ON COLUMN public.specialist_cities.city_id IS 'References the city ID from cities table';
