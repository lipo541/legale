-- Create specializations table
CREATE TABLE IF NOT EXISTS public.specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create company_specializations junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.company_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES public.specializations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, specialization_id)
);

-- Insert specializations
INSERT INTO public.specializations (name_ka, name_en, name_ru) VALUES
  ('სამოქალაქო სამართალი', 'Civil Law', 'Гражданское право'),
  ('ადმინისტრაციული სამართალი', 'Administrative Law', 'Административное право'),
  ('სისხლის სამართალი', 'Criminal Law', 'Уголовное право');

-- RLS Policies for specializations table
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

-- Everyone can read specializations
CREATE POLICY "Specializations are viewable by everyone"
  ON public.specializations FOR SELECT
  USING (true);

-- RLS Policies for company_specializations table
ALTER TABLE public.company_specializations ENABLE ROW LEVEL SECURITY;

-- Companies can view their own specializations
CREATE POLICY "Companies can view their own specializations"
  ON public.company_specializations FOR SELECT
  USING (auth.uid() = company_id);

-- Companies can insert their own specializations
CREATE POLICY "Companies can add their own specializations"
  ON public.company_specializations FOR INSERT
  WITH CHECK (auth.uid() = company_id);

-- Companies can delete their own specializations
CREATE POLICY "Companies can remove their own specializations"
  ON public.company_specializations FOR DELETE
  USING (auth.uid() = company_id);

-- Create indexes for better performance
CREATE INDEX idx_company_specializations_company_id ON public.company_specializations(company_id);
CREATE INDEX idx_company_specializations_specialization_id ON public.company_specializations(specialization_id);
