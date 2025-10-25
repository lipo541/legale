-- Add Russian language column to existing cities table
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- Update existing cities with Russian translations
UPDATE public.cities SET name_ru = 'Тбилиси' WHERE name_ka = 'თბილისი';
UPDATE public.cities SET name_ru = 'Батуми' WHERE name_ka = 'ბათუმი';
UPDATE public.cities SET name_ru = 'Кутаиси' WHERE name_ka = 'ქუთაისი';
UPDATE public.cities SET name_ru = 'Рустави' WHERE name_ka = 'რუსთავი';
UPDATE public.cities SET name_ru = 'Гори' WHERE name_ka = 'გორი';
UPDATE public.cities SET name_ru = 'Зугдиди' WHERE name_ka = 'ზუგდიდი';
UPDATE public.cities SET name_ru = 'Поти' WHERE name_ka = 'ფოთი';
UPDATE public.cities SET name_ru = 'Кобулети' WHERE name_ka = 'ქობულეთი';
UPDATE public.cities SET name_ru = 'Хашури' WHERE name_ka = 'ხაშური';
UPDATE public.cities SET name_ru = 'Самтредиа' WHERE name_ka = 'სამტრედია';
UPDATE public.cities SET name_ru = 'Сенаки' WHERE name_ka = 'სენაკი';
UPDATE public.cities SET name_ru = 'Зестафони' WHERE name_ka = 'ზესტაფონი';
UPDATE public.cities SET name_ru = 'Марнеули' WHERE name_ka = 'მარნეული';
UPDATE public.cities SET name_ru = 'Телави' WHERE name_ka = 'თელავი';
UPDATE public.cities SET name_ru = 'Ахалцихе' WHERE name_ka = 'ახალციხე';
UPDATE public.cities SET name_ru = 'Озургети' WHERE name_ka = 'ოზურგეთი';
UPDATE public.cities SET name_ru = 'Гардабани' WHERE name_ka = 'გარდაბანი';
UPDATE public.cities SET name_ru = 'Боржоми' WHERE name_ka = 'ბორჯომი';
UPDATE public.cities SET name_ru = 'Тианети' WHERE name_ka = 'თიანეთი';
UPDATE public.cities SET name_ru = 'Амбролаури' WHERE name_ka = 'ამბროლაური';
UPDATE public.cities SET name_ru = 'Ахалкалаки' WHERE name_ka = 'ახალქალაქი';
UPDATE public.cities SET name_ru = 'Цнори' WHERE name_ka = 'წნორი';
UPDATE public.cities SET name_ru = 'Кварели' WHERE name_ka = 'ყვარელი';
UPDATE public.cities SET name_ru = 'Сагареджо' WHERE name_ka = 'საგარეჯო';
UPDATE public.cities SET name_ru = 'Гурджаани' WHERE name_ka = 'გურჯაანი';
UPDATE public.cities SET name_ru = 'Сигнахи' WHERE name_ka = 'სიღნაღი';
UPDATE public.cities SET name_ru = 'Дедоплисцкаро' WHERE name_ka = 'დედოფლისწყარო';
UPDATE public.cities SET name_ru = 'Лагодехи' WHERE name_ka = 'ლაგოდეხი';
UPDATE public.cities SET name_ru = 'Цаленджиха' WHERE name_ka = 'წალენჯიხა';
UPDATE public.cities SET name_ru = 'Мартвили' WHERE name_ka = 'მარტვილი';
UPDATE public.cities SET name_ru = 'Абаша' WHERE name_ka = 'აბაშა';
UPDATE public.cities SET name_ru = 'Местиа' WHERE name_ka = 'მესტია';
UPDATE public.cities SET name_ru = 'Чхороцку' WHERE name_ka = 'ჩხოროწყუ';
UPDATE public.cities SET name_ru = 'Цალка' WHERE name_ka = 'წალკა';
UPDATE public.cities SET name_ru = 'Дманиси' WHERE name_ka = 'დმანისი';
UPDATE public.cities SET name_ru = 'Болниси' WHERE name_ka = 'ბოლნისი';
UPDATE public.cities SET name_ru = 'Тетрицкаро' WHERE name_ka = 'თეთრიწყარო';
UPDATE public.cities SET name_ru = 'Мцхета' WHERE name_ka = 'მცხეთა';
UPDATE public.cities SET name_ru = 'Душети' WHERE name_ka = 'დუშეთი';
UPDATE public.cities SET name_ru = 'Ахалгори' WHERE name_ka = 'ახალგორი';
UPDATE public.cities SET name_ru = 'Карели' WHERE name_ka = 'ქარელი';
UPDATE public.cities SET name_ru = 'Каспи' WHERE name_ka = 'კასპი';
UPDATE public.cities SET name_ru = 'Чиатура' WHERE name_ka = 'ჭიათურა';
UPDATE public.cities SET name_ru = 'Сачхере' WHERE name_ka = 'საჩხერე';
UPDATE public.cities SET name_ru = 'Ткибули' WHERE name_ka = 'ტყიბული';
UPDATE public.cities SET name_ru = 'Багдати' WHERE name_ka = 'ბაღდათი';
UPDATE public.cities SET name_ru = 'Вани' WHERE name_ka = 'ვანი';
UPDATE public.cities SET name_ru = 'Хони' WHERE name_ka = 'ხონი';
UPDATE public.cities SET name_ru = 'Ланчхути' WHERE name_ka = 'ლანჩხუთი';
UPDATE public.cities SET name_ru = 'Чохатаури' WHERE name_ka = 'ჩოხატაური';
UPDATE public.cities SET name_ru = 'Адигени' WHERE name_ka = 'ადიგენი';
UPDATE public.cities SET name_ru = 'Аспиндза' WHERE name_ka = 'ასპინძა';
UPDATE public.cities SET name_ru = 'Ниноцминда' WHERE name_ka = 'ნინოწმინდა';
UPDATE public.cities SET name_ru = 'Они' WHERE name_ka = 'ონი';
UPDATE public.cities SET name_ru = 'Цагери' WHERE name_ka = 'ცაგერი';
UPDATE public.cities SET name_ru = 'Лентехи' WHERE name_ka = 'ლენტეხი';
UPDATE public.cities SET name_ru = 'Хелвачаури' WHERE name_ka = 'ხელვაჩაური';
UPDATE public.cities SET name_ru = 'Шуахеви' WHERE name_ka = 'შუახევი';
UPDATE public.cities SET name_ru = 'Кеда' WHERE name_ka = 'ქედა';
UPDATE public.cities SET name_ru = 'Хуло' WHERE name_ka = 'ხულო';

-- Make name_ru NOT NULL after filling data
ALTER TABLE public.cities 
ALTER COLUMN name_ru SET NOT NULL;

-- Create index for Russian names
CREATE INDEX IF NOT EXISTS idx_cities_name_ru ON public.cities(name_ru);
