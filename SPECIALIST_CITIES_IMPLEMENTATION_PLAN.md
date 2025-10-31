# სპეციალისტებისთვის ქალაქების არჩევის სისტემის იმპლემენტაცია

## 📊 **პრობლემის ანალიზი**

### **მიმდინარე მდგომარეობა:**
- ✅ კომპანიებს აქვთ `company_cities` junction table
- ✅ კომპანიებს შეუძლიათ მრავალი ქალაქის არჩევა
- ✅ არსებობს `cities` ცხრილი 60+ ქართული ქალაქით
- ❌ სპეციალისტებს არ აქვთ `specialist_cities` junction table
- ❌ `profiles.city` არის VARCHAR - მხოლოდ 1 ქალაქის ტექსტური შენახვა
- ❌ სპეციალისტებს არ აქვთ UI ქალაქების არჩევისთვის
- ❌ ადმინებს და სპეციალისტებს არ შეუძლიათ რედაქტირება

### **მიზანი:**
სპეციალისტებისთვის იგივე ქალაქების არჩევის სისტემის შექმნა, როგორც კომპანიებს აქვთ, სრული CRUD ფუნქციონალით.

---

## 🗺️ **იმპლემენტაციის გეგმა (10 ნაბიჯი)**

---

### **PHASE 1: Database Structure** 📁

#### **ნაბიჯი 1: specialist_cities Junction Table შექმნა**
**ფაილი:** `supabase/migrations/039_create_specialist_cities.sql`

**რას აკეთებს:**
- ქმნის `specialist_cities` junction table-ს (many-to-many)
- მსგავსია `company_cities`-ის სტრუქტურის
- უზრუნველყოფს specialist ↔ city კავშირს

**სტრუქტურა:**
```sql
CREATE TABLE public.specialist_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(specialist_id, city_id)
);
```

**Indexes:**
- `idx_specialist_cities_specialist_id` - სწრაფი ძებნა specialist-ის მიხედვით
- `idx_specialist_cities_city_id` - სწრაფი ძებნა city-ის მიხედვით

**RLS Policies:**
1. **SELECT:** Public read access (ყველას სწვდება წაკითხვა)
2. **INSERT:** მხოლოდ თავად specialist-ს და super_admin-ს
3. **DELETE:** მხოლოდ თავად specialist-ს და super_admin-ს
4. **UPDATE:** არ არის საჭირო (მხოლოდ insert/delete)

**Migration Script:**
```sql
-- Create specialist_cities junction table
CREATE TABLE IF NOT EXISTS public.specialist_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(specialist_id, city_id)
);

-- Enable RLS
ALTER TABLE public.specialist_cities ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Specialist cities are viewable by everyone"
  ON public.specialist_cities FOR SELECT
  USING (true);

-- Specialists can manage their own cities
CREATE POLICY "Specialists can add their own cities"
  ON public.specialist_cities FOR INSERT
  WITH CHECK (
    auth.uid() = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE POLICY "Specialists can remove their own cities"
  ON public.specialist_cities FOR DELETE
  USING (
    auth.uid() = specialist_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Super admins have full access
CREATE POLICY "Super admins have full access to specialist_cities"
  ON public.specialist_cities
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

-- Create indexes
CREATE INDEX idx_specialist_cities_specialist_id ON public.specialist_cities(specialist_id);
CREATE INDEX idx_specialist_cities_city_id ON public.specialist_cities(city_id);
```

---

#### **ნაბიჯი 2: მონაცემების მიგრაცია (არსებული city ველიდან)**
**ფაილი:** `supabase/migrations/040_migrate_existing_specialist_cities.sql`

**რას აკეთებს:**
- იღებს `profiles.city` VARCHAR მნიშვნელობებს
- ეძებს შესაბამის ქალაქებს `cities` ცხრილში (name_ka/en/ru match)
- ავსებს `specialist_cities` ცხრილს არსებული მონაცემებით
- არ შლის `profiles.city` სვეტს (backward compatibility)

**Migration Script:**
```sql
-- Migrate existing specialist cities from profiles.city to specialist_cities table
DO $$
DECLARE
  profile_record RECORD;
  city_record RECORD;
BEGIN
  -- Loop through all specialists who have a city value
  FOR profile_record IN 
    SELECT id, city 
    FROM public.profiles 
    WHERE city IS NOT NULL 
      AND city != '' 
      AND role IN ('SPECIALIST', 'SOLO_SPECIALIST')
  LOOP
    -- Try to find matching city in cities table
    SELECT id INTO city_record
    FROM public.cities
    WHERE name_ka = profile_record.city 
       OR name_en = profile_record.city 
       OR name_ru = profile_record.city
    LIMIT 1;
    
    -- If city found, insert into specialist_cities
    IF FOUND THEN
      INSERT INTO public.specialist_cities (specialist_id, city_id)
      VALUES (profile_record.id, city_record.id)
      ON CONFLICT (specialist_id, city_id) DO NOTHING;
      
      RAISE NOTICE 'Migrated city for specialist %: %', profile_record.id, profile_record.city;
    ELSE
      RAISE WARNING 'City not found for specialist %: %', profile_record.id, profile_record.city;
    END IF;
  END LOOP;
END $$;
```

---

### **PHASE 2: Backend Data Fetching** 🔌

#### **ნაბიჯი 3: SpecialistDetailPage-ში ქალაქების ჩატვირთვა**
**ფაილი:** `src/components/specialists/specialist-detail/SpecialistDetailPage.tsx`

**რას ამატებს:**
- ამატებს `cities` state-ს
- ატვირთავს specialist-ის არჩეულ ქალაქებს `specialist_cities` junction table-დან
- გამოსახავს ქალაქების სიას profile-ში

**კოდი:**
```typescript
// Add to state
const [cities, setCities] = useState<Array<{ id: string; name_ka: string; name_en: string; name_ru: string }>>([])

// Add to useEffect (after specialist data is loaded)
useEffect(() => {
  const loadSpecialistCities = async () => {
    if (!specialist?.id) return

    const { data: cityData } = await supabase
      .from('specialist_cities')
      .select(`
        city_id,
        cities (
          id,
          name_ka,
          name_en,
          name_ru
        )
      `)
      .eq('specialist_id', specialist.id)

    if (cityData) {
      const cityList = cityData.map((item: any) => item.cities).filter(Boolean)
      setCities(cityList)
    }
  }

  loadSpecialistCities()
}, [specialist?.id])

// Update UI to show cities
<div className="flex items-center gap-3">
  <MapPin className="h-5 w-5" />
  <div className="flex flex-wrap gap-2">
    {cities.map(city => (
      <span key={city.id} className="px-2 py-1 rounded-md bg-emerald-500/10 text-sm">
        {locale === 'ka' ? city.name_ka : locale === 'en' ? city.name_en : city.name_ru}
      </span>
    ))}
  </div>
</div>
```

---

### **PHASE 3: Solo Specialist Dashboard - City Selection UI** 🎨

#### **ნაბიჯი 4: CityPicker კომპონენტის გამოყენება**
**ფაილი:** `src/components/solospecialistdashboard/solospecialistprofile/SoloSpecialistProfilePage.tsx`

**რას აკეთებს:**
- იყენებს არსებულ `CityPicker` კომპონენტს (კომპანიებისგან)
- ხსნის modal-ს ქალაქების არჩევისთვის
- ინახავს არჩევებს `specialist_cities` ცხრილში

**Steps:**
1. დააკოპირე `CityPicker.tsx` ან გამოიყენე იგივე კომპონენტი
2. დაამატე state მენეჯმენტი
3. დაამატე save/delete ფუნქციები

**კოდი:**
```typescript
import CityPicker from '@/components/companydashboard/companyprofile/CityPicker'

const [selectedCities, setSelectedCities] = useState<Array<{ id: string; name_ka: string; name_en: string }>>([])
const [selectedCityIds, setSelectedCityIds] = useState<string[]>([])
const [showCityPicker, setShowCityPicker] = useState(false)

// Load existing cities
useEffect(() => {
  const loadCities = async () => {
    const { data } = await supabase
      .from('specialist_cities')
      .select('city_id, cities(id, name_ka, name_en, name_ru)')
      .eq('specialist_id', user.id)

    if (data) {
      const cities = data.map((item: any) => item.cities).filter(Boolean)
      setSelectedCities(cities)
      setSelectedCityIds(cities.map((c: any) => c.id))
    }
  }
  loadCities()
}, [user.id])

// Save cities
const handleSaveCities = async (cityIds: string[]) => {
  // 1. Delete all existing cities
  await supabase
    .from('specialist_cities')
    .delete()
    .eq('specialist_id', user.id)

  // 2. Insert new selected cities
  if (cityIds.length > 0) {
    const insertData = cityIds.map(cityId => ({
      specialist_id: user.id,
      city_id: cityId
    }))

    await supabase
      .from('specialist_cities')
      .insert(insertData)
  }

  // 3. Reload cities
  // ... reload logic
  setShowCityPicker(false)
}

// UI
<button onClick={() => setShowCityPicker(true)}>
  Edit Cities ({selectedCities.length})
</button>

{showCityPicker && (
  <CityPicker
    onClose={() => setShowCityPicker(false)}
    onSave={handleSaveCities}
    selectedCityIds={selectedCityIds}
  />
)}
```

---

#### **ნაბიჯი 5: UI Display - Selected Cities**
**ფაილი:** `src/components/solospecialistdashboard/solospecialistprofile/SoloSpecialistProfilePage.tsx`

**რას გამოსახავს:**
- ყველა არჩეული ქალაქი badge-ებში
- "Add Cities" ღილაკი თუ ცარიელია
- "Edit" ღილაკი ქალაქების სიის გვერდით

**UI კოდი:**
```typescript
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      <MapPin className="h-5 w-5" />
      ქალაქები
    </h3>
    <button
      onClick={() => setShowCityPicker(true)}
      className="text-sm text-emerald-500 hover:text-emerald-600"
    >
      {selectedCities.length === 0 ? 'Add Cities' : 'Edit'}
    </button>
  </div>

  {selectedCities.length === 0 ? (
    <p className="text-sm text-gray-500">
      არჩეული ქალაქები არ არის
    </p>
  ) : (
    <div className="flex flex-wrap gap-2">
      {selectedCities.map(city => (
        <span
          key={city.id}
          className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm"
        >
          {locale === 'ka' ? city.name_ka : locale === 'en' ? city.name_en : city.name_ru}
        </span>
      ))}
    </div>
  )}
</div>
```

---

### **PHASE 4: Super Admin Dashboard - Edit Any Specialist** 👑

#### **ნაბიჯი 6: Super Admin - Specialist Cities Management**
**ფაილი:** `src/components/superadmindashboard/specialists/EditSpecialistModal.tsx` (ან შექმნა)

**რას აკეთებს:**
- Super Admin-ს ეძლევა ნებისმიერი specialist-ის რედაქტირების უფლება
- ამატებს City Picker-ს edit modal-ში
- ინახავს ცვლილებებს `specialist_cities` ცხრილში

**კოდი მსგავსია Solo Specialist Dashboard-ის, მაგრამ:**
```typescript
// Pass specialist_id as prop instead of using auth.uid()
interface EditSpecialistModalProps {
  specialistId: string
  // ... other props
}

const handleSaveCities = async (cityIds: string[]) => {
  // Use specialistId prop instead of user.id
  await supabase
    .from('specialist_cities')
    .delete()
    .eq('specialist_id', specialistId)

  if (cityIds.length > 0) {
    const insertData = cityIds.map(cityId => ({
      specialist_id: specialistId,
      city_id: cityId
    }))

    await supabase.from('specialist_cities').insert(insertData)
  }
}
```

---

### **PHASE 5: Filtering & Search** 🔍

#### **ნაბიჯი 7: SpecialistsPage - City Filter**
**ფაილი:** `src/app/[locale]/specialists/page.tsx`

**რას ამატებს:**
- ამატებს city filter-ს specialists search-ში
- იყენებს `specialist_cities` junction table-ს filtering-ისთვის

**კოდი:**
```typescript
// Add city filter state
const [selectedCity, setSelectedCity] = useState<string | null>(null)

// Update query to include city filter
let query = supabase
  .from('profiles')
  .select(`
    *,
    specialist_translations(*)
  `)
  .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
  .eq('verification_status', 'approved')

// City filter
if (selectedCity) {
  // Get city ID
  const { data: cityData } = await supabase
    .from('cities')
    .select('id')
    .or(`name_ka.eq.${selectedCity},name_en.eq.${selectedCity},name_ru.eq.${selectedCity}`)
    .single()

  if (cityData) {
    // Get specialist IDs who have this city
    const { data: specialistCityData } = await supabase
      .from('specialist_cities')
      .select('specialist_id')
      .eq('city_id', cityData.id)

    const specialistIds = specialistCityData?.map(sc => sc.specialist_id) || []
    
    if (specialistIds.length > 0) {
      query = query.in('id', specialistIds)
    } else {
      // No specialists in this city
      query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Returns empty
    }
  }
}
```

---

#### **ნაბიჯი 8: Statistics - Cities Count**
**ფაილი:** `src/components/specialists/statistics/SpecialistsStatistics.tsx`

**რას ამატებს:**
- აჩვენებს რამდენი specialist არის თითოეულ ქალაქში
- გამოთვლილია `specialist_cities` ცხრილიდან

**კოდი:**
```typescript
const [citiesCount, setCitiesCount] = useState<Record<string, number>>({})

useEffect(() => {
  const loadCitiesCount = async () => {
    // Get all specialist-city relationships
    const { data: specialistCities } = await supabase
      .from('specialist_cities')
      .select('city_id, cities(name_ka, name_en, name_ru)')

    // Count specialists per city
    const counts: Record<string, number> = {}
    
    specialistCities?.forEach((sc: any) => {
      const cityName = locale === 'ka' ? sc.cities.name_ka 
                     : locale === 'en' ? sc.cities.name_en 
                     : sc.cities.name_ru
      counts[cityName] = (counts[cityName] || 0) + 1
    })

    setCitiesCount(counts)
  }

  loadCitiesCount()
}, [locale])

// Display in UI
{Object.entries(citiesCount)
  .sort((a, b) => b[1] - a[1])
  .map(([city, count]) => (
    <button key={city} onClick={() => setSelectedCity(city)}>
      {city} ({count})
    </button>
  ))}
```

---

### **PHASE 6: Testing & Validation** ✅

#### **ნაბიჯი 9: Testing Checklist**

**Database Tests:**
- [ ] `specialist_cities` ცხრილი შექმნილია
- [ ] RLS policies მუშაობს (specialist, super_admin)
- [ ] არსებული მონაცემები მიგრირებულია
- [ ] Indexes შექმნილია და მუშაობს

**Frontend Tests:**
- [ ] Solo Specialist Dashboard - City Picker ხსნის
- [ ] Solo Specialist Dashboard - Cities ინახება
- [ ] Solo Specialist Dashboard - Cities წაიშლება
- [ ] Solo Specialist Dashboard - UI განახლდება
- [ ] Specialist Detail Page - Cities ჩანს
- [ ] Specialist Cards - Cities ჩანს
- [ ] Super Admin - Edit Cities მუშაობს
- [ ] Filtering by City მუშაობს
- [ ] Statistics - Cities Count სწორია

**Permission Tests:**
- [ ] Solo Specialist ხედავს მხოლოდ საკუთარ cities-ს
- [ ] Solo Specialist არედაქტირებს მხოლოდ საკუთარს
- [ ] Company Specialist ხედავს მხოლოდ საკუთარს (თუ კომპანიამ არ შეზღუდა)
- [ ] Super Admin ხედავს და არედაქტირებს ყველას
- [ ] Anonymous users ხედავენ cities-ს (public read)

**UI/UX Tests:**
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states ("No cities selected")
- [ ] Multi-language support (ka, en, ru)

---

## 📋 **Implementation Checklist**

### Database (2 files)
- [ ] `039_create_specialist_cities.sql` - Junction table + RLS
- [ ] `040_migrate_existing_specialist_cities.sql` - Data migration

### Frontend Components (3 files)
- [ ] `SpecialistDetailPage.tsx` - Display cities
- [ ] `SoloSpecialistProfilePage.tsx` - Edit cities (dashboard)
- [ ] `EditSpecialistModal.tsx` - Super admin edit

### Filtering & Search (2 files)
- [ ] `src/app/[locale]/specialists/page.tsx` - City filter
- [ ] `SpecialistsStatistics.tsx` - City statistics

### Testing
- [ ] Manual testing all flows
- [ ] RLS policy testing
- [ ] Mobile responsive testing

---

## 🎯 **Priority Order**

**High Priority (Core Functionality):**
1. ✅ Database structure (Steps 1-2)
2. ✅ Solo Specialist Dashboard (Steps 4-5)
3. ✅ Display on Detail Page (Step 3)

**Medium Priority (Enhanced Features):**
4. ✅ Super Admin Edit (Step 6)

**Low Priority (Nice to Have):**
5. ✅ Filtering by City (Step 7)
6. ✅ Statistics (Step 8)

---

## 🚀 **Ready to Start?**

გვჭირდება თქვენი დადასტურება, რომ დავიწყოთ იმპლემენტაცია!

**შემდეგი ნაბიჯი:** 
შევქმნათ პირველი migration file: `039_create_specialist_cities.sql`

დავიწყოთ? 🎯
