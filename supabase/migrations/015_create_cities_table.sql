-- Create cities table for Georgian cities
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create company_cities junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.company_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, city_id)
);

-- Insert Georgian cities
INSERT INTO public.cities (name_ka, name_en, name_ru, region) VALUES
  ('თბილისი', 'Tbilisi', 'Тбилиси', 'Tbilisi'),
  ('ბათუმი', 'Batumi', 'Батуми', 'Adjara'),
  ('ქუთაისი', 'Kutaisi', 'Кутаиси', 'Imereti'),
  ('რუსთავი', 'Rustavi', 'Рустави', 'Kvemo Kartli'),
  ('გორი', 'Gori', 'Гори', 'Shida Kartli'),
  ('ზუგდიდი', 'Zugdidi', 'Зугдиди', 'Samegrelo-Zemo Svaneti'),
  ('ფოთი', 'Poti', 'Поти', 'Samegrelo-Zemo Svaneti'),
  ('ქობულეთი', 'Kobuleti', 'Кобулети', 'Adjara'),
  ('ხაშური', 'Khashuri', 'Хашури', 'Shida Kartli'),
  ('სამტრედია', 'Samtredia', 'Самтредиа', 'Imereti'),
  ('სენაკი', 'Senaki', 'Сенаки', 'Samegrelo-Zemo Svaneti'),
  ('ზესტაფონი', 'Zestaponi', 'Зестафони', 'Imereti'),
  ('მარნეული', 'Marneuli', 'Марнеули', 'Kvemo Kartli'),
  ('თელავი', 'Telavi', 'Телави', 'Kakheti'),
  ('ახალციხე', 'Akhaltsikhe', 'Ахалцихе', 'Samtskhe-Javakheti'),
  ('ოზურგეთი', 'Ozurgeti', 'Озургети', 'Guria'),
  ('გარდაბანი', 'Gardabani', 'Гардабани', 'Kvemo Kartli'),
  ('ბორჯომი', 'Borjomi', 'Боржоми', 'Samtskhe-Javakheti'),
  ('თიანეთი', 'Tianeti', 'Тианети', 'Mtskheta-Mtianeti'),
  ('ამბროლაური', 'Ambrolauri', 'Амбролаури', 'Racha-Lechkhumi and Kvemo Svaneti'),
  ('ახალქალაქი', 'Akhalkalaki', 'Ахалкалаки', 'Samtskhe-Javakheti'),
  ('წნორი', 'Tsnori', 'Цнори', 'Kakheti'),
  ('ყვარელი', 'Kvareli', 'Кварели', 'Kakheti'),
  ('საგარეჯო', 'Sagarejo', 'Сагареджо', 'Kakheti'),
  ('გურჯაანი', 'Gurjaani', 'Гурджаани', 'Kakheti'),
  ('სიღნაღი', 'Sighnaghi', 'Сигнахи', 'Kakheti'),
  ('დედოფლისწყარო', 'Dedoplistskaro', 'Дедоплисцкаро', 'Kakheti'),
  ('ლაგოდეხი', 'Lagodekhi', 'Лагодехи', 'Kakheti'),
  ('წალენჯიხა', 'Tsalenjikha', 'Цаленджиха', 'Samegrelo-Zemo Svaneti'),
  ('მარტვილი', 'Martvili', 'Мартвили', 'Samegrelo-Zemo Svaneti'),
  ('აბაშა', 'Abasha', 'Абаша', 'Samegrelo-Zemo Svaneti'),
  ('მესტია', 'Mestia', 'Местиа', 'Samegrelo-Zemo Svaneti'),
  ('ჩხოროწყუ', 'Chkhorotsku', 'Чхороцку', 'Samegrelo-Zemo Svaneti'),
  ('წალკა', 'Tsalka', 'Цалка', 'Kvemo Kartli'),
  ('დმანისი', 'Dmanisi', 'Дманиси', 'Kvemo Kartli'),
  ('ბოლნისი', 'Bolnisi', 'Болниси', 'Kvemo Kartli'),
  ('თეთრიწყარო', 'Tetritskaro', 'Тетрицкаро', 'Kvemo Kartli'),
  ('მცხეთა', 'Mtskheta', 'Мцхета', 'Mtskheta-Mtianeti'),
  ('დუშეთი', 'Dusheti', 'Душети', 'Mtskheta-Mtianeti'),
  ('ახალგორი', 'Akhalgori', 'Ахалгори', 'Mtskheta-Mtianeti'),
  ('ქარელი', 'Kareli', 'Карели', 'Shida Kartli'),
  ('კასპი', 'Kaspi', 'Каспи', 'Shida Kartli'),
  ('ხაშური', 'Khashuri', 'Хашури', 'Shida Kartli'),
  ('ჭიათურა', 'Chiatura', 'Чиатура', 'Imereti'),
  ('საჩხერე', 'Sachkhere', 'Сачхере', 'Imereti'),
  ('ტყიბული', 'Tkibuli', 'Ткибули', 'Imereti'),
  ('ბაღდათი', 'Baghdati', 'Багдати', 'Imereti'),
  ('ვანი', 'Vani', 'Вани', 'Imereti'),
  ('ხონი', 'Khoni', 'Хони', 'Imereti'),
  ('ლანჩხუთი', 'Lanchkhuti', 'Ланчхути', 'Guria'),
  ('ჩოხატაური', 'Chokhatauri', 'Чохатаури', 'Guria'),
  ('ადიგენი', 'Adigeni', 'Адигени', 'Samtskhe-Javakheti'),
  ('ასპინძა', 'Aspindza', 'Аспиндза', 'Samtskhe-Javakheti'),
  ('ნინოწმინდა', 'Ninotsminda', 'Ниноцминда', 'Samtskhe-Javakheti'),
  ('ონი', 'Oni', 'Они', 'Racha-Lechkhumi and Kvemo Svaneti'),
  ('ცაგერი', 'Tsageri', 'Цагери', 'Racha-Lechkhumi and Kvemo Svaneti'),
  ('ლენტეხი', 'Lentekhi', 'Лентехи', 'Racha-Lechkhumi and Kvemo Svaneti'),
  ('ხელვაჩაური', 'Khelvachauri', 'Хелвачаури', 'Adjara'),
  ('შუახევი', 'Shuakhevi', 'Шуахеви', 'Adjara'),
  ('ქედა', 'Keda', 'Кеда', 'Adjara'),
  ('ხულო', 'Khulo', 'Хуло', 'Adjara');

-- RLS Policies for cities table
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Everyone can read cities
CREATE POLICY "Cities are viewable by everyone"
  ON public.cities FOR SELECT
  USING (true);

-- RLS Policies for company_cities table
ALTER TABLE public.company_cities ENABLE ROW LEVEL SECURITY;

-- Companies can view their own cities
CREATE POLICY "Companies can view their own cities"
  ON public.company_cities FOR SELECT
  USING (auth.uid() = company_id);

-- Companies can insert their own cities
CREATE POLICY "Companies can add their own cities"
  ON public.company_cities FOR INSERT
  WITH CHECK (auth.uid() = company_id);

-- Companies can delete their own cities
CREATE POLICY "Companies can remove their own cities"
  ON public.company_cities FOR DELETE
  USING (auth.uid() = company_id);

-- Create indexes for better performance
CREATE INDEX idx_company_cities_company_id ON public.company_cities(company_id);
CREATE INDEX idx_company_cities_city_id ON public.company_cities(city_id);
CREATE INDEX idx_cities_name_ka ON public.cities(name_ka);
CREATE INDEX idx_cities_name_en ON public.cities(name_en);
CREATE INDEX idx_cities_name_ru ON public.cities(name_ru);
