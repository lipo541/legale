# 🎯 დინამიური Hero სლაიდერის სისტემა - იმპლემენტაციის გეგმა

## 📋 მიმოხილვა

### პრობლემა
არსებული Hero კომპონენტი სტატიკურია - ტექსტები და სურათები მყარად არის ჩაშენებული კოდში. SuperAdmin-ს არ აქვს შესაძლებლობა მართოს მთავარი გვერდის ბანერები.

### გადაწყვეტა
შევქმნით სრულად კონტროლირებად Hero სლაიდერის სისტემას:
- ✅ მრავალი სლაიდის მხარდაჭერა (სლაიდერი)
- ✅ Light/Dark mode-ისთვის ცალ-ცალკე სურათები
- ✅ მრავალენოვანი ტექსტები (ka, en, ru)
- ✅ მოქნილი CTA ღილაკების სისტემა
- ✅ SEO-ფრიენდლი (h1 დუბლირების გარეშე)

---

## 🗄️ მონაცემთა ბაზის სქემა

### ტაბლა: `hero_slides`

```sql
CREATE TABLE hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- სურათები (Light/Dark mode)
  image_url_light TEXT NOT NULL,        -- Light mode სურათი
  image_url_dark TEXT NOT NULL,         -- Dark mode სურათი
  
  -- ტექსტები - ქართული
  title_ka TEXT NOT NULL,               -- სათაური (ka)
  description_ka TEXT,                  -- აღწერა (ka)
  
  -- ტექსტები - ინგლისური
  title_en TEXT NOT NULL,               -- სათაური (en)
  description_en TEXT,                  -- აღწერა (en)
  
  -- ტექსტები - რუსული
  title_ru TEXT NOT NULL,               -- სათაური (ru)
  description_ru TEXT,                  -- აღწერა (ru)
  
  -- კონტროლი
  display_order INTEGER DEFAULT 0,      -- თანმიმდევრობა
  is_active BOOLEAN DEFAULT true,       -- აქტიურია თუ არა
  
  -- მეტადატა
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);
```

### ტაბლა: `hero_slide_buttons`

```sql
CREATE TABLE hero_slide_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES hero_slides(id) ON DELETE CASCADE,
  
  -- ღილაკის ტექსტები
  text_ka TEXT NOT NULL,                -- ღილაკის ტექსტი (ka)
  text_en TEXT NOT NULL,                -- ღილაკის ტექსტი (en)
  text_ru TEXT NOT NULL,                -- ღილაკის ტექსტი (ru)
  
  -- Action სისტემა
  action_type TEXT NOT NULL CHECK (action_type IN (
    'link',           -- Custom URL (internal/external)
    'contact',        -- Contact modal გახსნა
    'specialist',     -- სპეციალისტის პროფილზე გადასვლა
    'practice',       -- პრაქტიკის გვერდზე გადასვლა
    'company'         -- კომპანიის გვერდზე გადასვლა
  )),
  
  -- Action მონაცემები (action_type-ის მიხედვით)
  action_url TEXT,                      -- link-ისთვის
  specialist_id UUID REFERENCES specialists(id),  -- specialist-ისთვის
  practice_id UUID REFERENCES practices(id),      -- practice-ისთვის
  company_id UUID REFERENCES companies(id),       -- company-ისთვის
  
  -- სტილი
  variant TEXT DEFAULT 'primary' CHECK (variant IN ('primary', 'secondary', 'outline')),
  display_order INTEGER DEFAULT 0,
  
  -- მეტადატა
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Bucket

```sql
-- Supabase Storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-slides', 'hero-slides', true);

-- RLS policies
CREATE POLICY "Public read access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'hero-slides');

CREATE POLICY "Admin upload access" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'hero-slides' 
    AND auth.role() = 'authenticated'
  );
```

---

## 📁 ფაილების სტრუქტურა

### გრაფიკული სქემა - SuperAdmin Hero Manager

```
components/superadmindashboard/hero/
├── 📄 index.ts                      ← Root Barrel Export
├── 📄 HeroManager.tsx               ← მთავარი Manager კომპონენტი
└── 📁 components/
    ├── 📄 index.ts                  ← Component Barrel
    ├── 📄 HeroSlideList.tsx         ← სლაიდების სია (drag & drop)
    ├── 📄 HeroSlideForm.tsx         ← სლაიდის შექმნა/რედაქტირება
    ├── 📄 HeroSlideCard.tsx         ← სლაიდის preview card
    ├── 📄 HeroButtonEditor.tsx      ← ღილაკების მართვა
    ├── 📄 HeroImageUploader.tsx     ← Light/Dark სურათების ატვირთვა
    └── 📄 HeroActionSelector.tsx    ← Action type-ის არჩევა
```

### გრაფიკული სქემა - Frontend Hero

```
components/hero/
├── 📄 index.ts                      ← Root Barrel Export
├── 📄 Hero.tsx                      ← მთავარი კომპონენტი (გადაკეთებული)
└── 📁 components/
    ├── 📄 index.ts                  ← Component Barrel
    ├── 📄 HeroSlide.tsx             ← ერთი სლაიდის კომპონენტი
    ├── 📄 HeroButton.tsx            ← CTA ღილაკი (action handler)
    ├── 📄 HeroSlider.tsx            ← სლაიდერის ლოგიკა
    ├── 📄 HeroNavigation.tsx        ← სლაიდერის ნავიგაცია (dots/arrows)
    └── 📄 HeroSkeleton.tsx          ← Loading state
```

### გრაფიკული სქემა - Types

```
lib/types/
└── 📄 hero.ts                       ← Hero-სთან დაკავშირებული ტიპები
```

---

## 🔧 კომპონენტების დეტალური აღწერა

### 1. HeroManager.tsx (SuperAdmin)

```
┌─────────────────────────────────────────────────────────────────┐
│                        HeroManager                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Header: "Hero სლაიდერის მართვა"    [+ ახალი სლაიდი]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    HeroSlideList                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  HeroSlideCard #1 (drag handle)                    │  │   │
│  │  │  [Preview] [Edit] [Delete] [Toggle Active]         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  HeroSlideCard #2 (drag handle)                    │  │   │
│  │  │  [Preview] [Edit] [Delete] [Toggle Active]         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  HeroSlideForm (Modal)                    │   │
│  │                                                          │   │
│  │  [Images Tab] [Text Tab] [Buttons Tab]                   │   │
│  │                                                          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │  Light Mode     │  │  Dark Mode      │               │   │
│  │  │  [Upload Image] │  │  [Upload Image] │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                          │   │
│  │  [KA] [EN] [RU] ← Language Tabs                         │   │
│  │  ┌────────────────────────────────────────┐             │   │
│  │  │ Title: [___________________________]   │             │   │
│  │  │ Description: [____________________]    │             │   │
│  │  └────────────────────────────────────────┘             │   │
│  │                                                          │   │
│  │  Buttons:                                                │   │
│  │  ┌────────────────────────────────────────┐             │   │
│  │  │ [HeroButtonEditor]  [+ Add Button]     │             │   │
│  │  └────────────────────────────────────────┘             │   │
│  │                                                          │   │
│  │                    [Cancel] [Save]                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. HeroButtonEditor.tsx

```
┌─────────────────────────────────────────────────────────────────┐
│                      HeroButtonEditor                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Button Text: [KA] [EN] [RU]                                    │
│  ┌───────────────────────────────────────────┐                  │
│  │ [დაგვიკავშირდით____________________]      │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                  │
│  Action Type:                                                    │
│  ┌───────────────────────────────────────────┐                  │
│  │ ○ Custom Link                             │                  │
│  │ ○ Contact Modal                           │                  │
│  │ ○ Specialist Profile                      │                  │
│  │ ○ Practice Page                           │                  │
│  │ ○ Company Page                            │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                  │
│  [Action-specific fields based on selection]                    │
│                                                                  │
│  ┌───────────────────────────────────────────┐                  │
│  │ If "Custom Link":                         │                  │
│  │   URL: [https://example.com__________]    │                  │
│  │   ☐ Open in new tab                       │                  │
│  ├───────────────────────────────────────────┤                  │
│  │ If "Specialist Profile":                  │                  │
│  │   Select Specialist: [Dropdown_______]    │                  │
│  ├───────────────────────────────────────────┤                  │
│  │ If "Practice Page":                       │                  │
│  │   Select Practice: [Dropdown_________]    │                  │
│  ├───────────────────────────────────────────┤                  │
│  │ If "Company Page":                        │                  │
│  │   Select Company: [Dropdown__________]    │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                  │
│  Style:                                                          │
│  ┌───────────────────────────────────────────┐                  │
│  │ ● Primary  ○ Secondary  ○ Outline         │                  │
│  └───────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Frontend Hero.tsx (გადაკეთებული)

```
┌─────────────────────────────────────────────────────────────────┐
│                          Hero                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     HeroSlider                            │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              HeroSlide (current)                   │  │   │
│  │  │                                                    │  │   │
│  │  │  [Background: light/dark image based on theme]     │  │   │
│  │  │                                                    │  │   │
│  │  │       <h1> (only first slide)                      │  │   │
│  │  │       OR                                           │  │   │
│  │  │       <p role="heading"> (other slides)            │  │   │
│  │  │                                                    │  │   │
│  │  │       <p> Description text </p>                    │  │   │
│  │  │                                                    │  │   │
│  │  │       [HeroButton] [HeroButton]                    │  │   │
│  │  │                                                    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              HeroNavigation                        │  │   │
│  │  │          ● ○ ○     (pagination dots)               │  │   │
│  │  │        ◄     ►     (prev/next arrows)              │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Scroll Indicator - existing]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 SEO გადაწყვეტა - H1 დუბლირების პრობლემა

### პრობლემა
თუ 3 სლაიდია და თითოეულს აქვს `<h1>`, გვერდზე 3 h1 იქნება - ეს SEO-სთვის ცუდია.

### გადაწყვეტა

```tsx
// HeroSlide.tsx
interface HeroSlideProps {
  slide: HeroSlide;
  isFirst: boolean;  // პირველი სლაიდია თუ არა
  locale: string;
}

export default function HeroSlide({ slide, isFirst, locale }: HeroSlideProps) {
  const title = slide[`title_${locale}`];
  
  return (
    <div className="hero-slide">
      {isFirst ? (
        // პირველი სლაიდი - ნამდვილი h1
        <h1 className="hero-title">{title}</h1>
      ) : (
        // დანარჩენი სლაიდები - ვიზუალურად იგივე, სემანტიკურად განსხვავებული
        <p 
          role="heading" 
          aria-level={2}
          className="hero-title"
        >
          {title}
        </p>
      )}
    </div>
  );
}
```

### არქიტექტურა

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEO-Friendly Structure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Slide 1 (index === 0):                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  <h1>იურიდიული მომსახურება საქართველოში</h1>              │ │
│  │  <p>აღწერა...</p>                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Slide 2 (index > 0):                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  <p role="heading" aria-level="2">სხვა სათაური</p>         │ │
│  │  <p>აღწერა...</p>                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Slide 3 (index > 0):                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  <p role="heading" aria-level="2">კიდევ სხვა</p>           │ │
│  │  <p>აღწერა...</p>                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔘 ღილაკის Action System

### Action Types და მათი დანიშნულება

| Action Type | დანიშნულება | საჭირო მონაცემი |
|-------------|-------------|-----------------|
| `link` | Custom URL-ზე გადასვლა | `action_url` |
| `contact` | Contact modal-ის გახსნა | არაფერი |
| `specialist` | სპეციალისტის პროფილზე გადასვლა | `specialist_id` |
| `practice` | პრაქტიკის გვერდზე გადასვლა | `practice_id` |
| `company` | კომპანიის გვერდზე გადასვლა | `company_id` |

### HeroButton კომპონენტის ლოგიკა

```tsx
// components/hero/components/HeroButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface HeroButtonProps {
  button: HeroSlideButton;
  onContactClick?: () => void;
}

export default function HeroButton({ button, onContactClick }: HeroButtonProps) {
  const router = useRouter();
  const { locale } = useParams();
  
  const handleClick = () => {
    switch (button.action_type) {
      case 'link':
        if (button.action_url?.startsWith('http')) {
          window.open(button.action_url, '_blank');
        } else {
          router.push(button.action_url || '/');
        }
        break;
        
      case 'contact':
        onContactClick?.();
        break;
        
      case 'specialist':
        router.push(`/${locale}/specialists/${button.specialist_id}`);
        break;
        
      case 'practice':
        router.push(`/${locale}/practices/${button.practice_id}`);
        break;
        
      case 'company':
        router.push(`/${locale}/companies/${button.company_id}`);
        break;
    }
  };
  
  const buttonText = button[`text_${locale}`];
  
  return (
    <button 
      onClick={handleClick}
      className={`hero-button hero-button--${button.variant}`}
    >
      {buttonText}
    </button>
  );
}
```

---

## 📋 სამოქმედო გეგმა - ნაბიჯ-ნაბიჯ

### ფაზა 1: მონაცემთა ბაზა და Storage

#### ნაბიჯი 1.1: მიგრაციის ფაილის შექმნა
```
📄 supabase/migrations/[timestamp]_create_hero_slides.sql
```
- `hero_slides` ტაბლის შექმნა
- `hero_slide_buttons` ტაბლის შექმნა
- RLS policies
- Indexes

#### ნაბიჯი 1.2: Storage Bucket
```
📦 hero-slides bucket
├── light/
│   └── [slide_id]/image.webp
└── dark/
    └── [slide_id]/image.webp
```

#### ნაბიჯი 1.3: მიგრაციის გაშვება
```bash
npx supabase db push
```

---

### ფაზა 2: Types და Utilities

#### ნაბიჯი 2.1: Hero Types
```
📄 src/lib/types/hero.ts
```

```typescript
export interface HeroSlide {
  id: string;
  image_url_light: string;
  image_url_dark: string;
  title_ka: string;
  title_en: string;
  title_ru: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  display_order: number;
  is_active: boolean;
  buttons?: HeroSlideButton[];
}

export interface HeroSlideButton {
  id: string;
  slide_id: string;
  text_ka: string;
  text_en: string;
  text_ru: string;
  action_type: 'link' | 'contact' | 'specialist' | 'practice' | 'company';
  action_url?: string;
  specialist_id?: string;
  practice_id?: string;
  company_id?: string;
  variant: 'primary' | 'secondary' | 'outline';
  display_order: number;
}

export type HeroSlideFormData = Omit<HeroSlide, 'id' | 'buttons'>;
export type HeroButtonFormData = Omit<HeroSlideButton, 'id' | 'slide_id'>;
```

---

### ფაზა 3: SuperAdmin UI

#### ნაბიჯი 3.1: ფოლდერის სტრუქტურის შექმნა

```bash
# შესაქმნელი ფაილები:
src/components/superadmindashboard/hero/
├── index.ts
├── HeroManager.tsx
└── components/
    ├── index.ts
    ├── HeroSlideList.tsx
    ├── HeroSlideForm.tsx
    ├── HeroSlideCard.tsx
    ├── HeroButtonEditor.tsx
    ├── HeroImageUploader.tsx
    └── HeroActionSelector.tsx
```

#### ნაბიჯი 3.2: Barrel Exports

**hero/index.ts:**
```typescript
export { default as HeroManager } from './HeroManager';
```

**hero/components/index.ts:**
```typescript
export { default as HeroSlideList } from './HeroSlideList';
export { default as HeroSlideForm } from './HeroSlideForm';
export { default as HeroSlideCard } from './HeroSlideCard';
export { default as HeroButtonEditor } from './HeroButtonEditor';
export { default as HeroImageUploader } from './HeroImageUploader';
export { default as HeroActionSelector } from './HeroActionSelector';
```

#### ნაბიჯი 3.3: Sidebar-ში დამატება

**SuperAdminDashboard.tsx-ში:**
```typescript
case 'hero':
  return <HeroManager />;
```

---

### ფაზა 4: Frontend Hero კომპონენტი

#### ნაბიჯი 4.1: ფოლდერის რესტრუქტურიზაცია

```bash
# არსებული:
src/components/hero/Hero.tsx

# გადაკეთების შემდეგ:
src/components/hero/
├── index.ts
├── Hero.tsx                 # გადაკეთებული
└── components/
    ├── index.ts
    ├── HeroSlide.tsx
    ├── HeroButton.tsx
    ├── HeroSlider.tsx
    ├── HeroNavigation.tsx
    └── HeroSkeleton.tsx
```

#### ნაბიჯი 4.2: Data Fetching

**lib/actions/hero.ts:**
```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function getActiveHeroSlides() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('hero_slides')
    .select(`
      *,
      buttons:hero_slide_buttons(*)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
    
  if (error) throw error;
  return data;
}
```

---

### ფაზა 5: ინტეგრაცია

#### ნაბიჯი 5.1: მთავარი გვერდის განახლება

**app/[locale]/page.tsx:**
```typescript
import Hero from '@/components/hero/Hero';
import { getActiveHeroSlides } from '@/lib/actions/hero';

export default async function LocaleHome({ params }) {
  const slides = await getActiveHeroSlides();
  return <Hero slides={slides} />;
}
```

---

## ✅ შემოწმების ჩამონათვალი

### მონაცემთა ბაზა
- [ ] `hero_slides` ტაბლა შექმნილია
- [ ] `hero_slide_buttons` ტაბლა შექმნილია
- [ ] RLS policies კონფიგურირებულია
- [ ] `hero-slides` storage bucket შექმნილია

### SuperAdmin UI
- [ ] HeroManager კომპონენტი მუშაობს
- [ ] სლაიდების CRUD ოპერაციები
- [ ] სურათების ატვირთვა (light/dark)
- [ ] ღილაკების მართვა
- [ ] Drag & drop რეორდერინგი
- [ ] Preview ფუნქცია

### Frontend
- [ ] Hero სლაიდერი ჩანს
- [ ] Light/Dark სურათები იცვლება
- [ ] სლაიდერის ნავიგაცია მუშაობს
- [ ] ღილაკების actions მუშაობს
- [ ] SEO-friendly (ერთი h1)
- [ ] Responsive დიზაინი
- [ ] მრავალენოვანი ტექსტები

### Performance
- [ ] სურათების ოპტიმიზაცია (WebP)
- [ ] Lazy loading
- [ ] Skeleton loading state

---

## 📅 სავარაუდო ვადები

| ფაზა | დრო | პრიორიტეტი |
|------|-----|-----------|
| ფაზა 1: Database | 30 წუთი | 🔴 მაღალი |
| ფაზა 2: Types | 15 წუთი | 🔴 მაღალი |
| ფაზა 3: SuperAdmin UI | 2-3 საათი | 🔴 მაღალი |
| ფაზა 4: Frontend Hero | 1-2 საათი | 🔴 მაღალი |
| ფაზა 5: ინტეგრაცია | 30 წუთი | 🟡 საშუალო |
| ტესტირება | 1 საათი | 🟡 საშუალო |

**სულ: ~5-7 საათი**

---

## 🔗 დამოკიდებულებები

### არსებული კომპონენტები რომლებსაც გამოვიყენებთ:
- `ThemeContext` - dark/light mode detection
- `useParams` - locale detection
- `createClient` - Supabase client
- UI კომპონენტები (`Button`, `Input`, `Dialog`, etc.)

### შესაძლო ახალი დამოკიდებულებები:
- `@dnd-kit/core` - drag & drop რეორდერინგისთვის (თუ არ არის)
- `swiper` - სლაიდერისთვის (ან Embla Carousel)

---

**დოკუმენტი შექმნილია:** 2025 წლის 25 დეკემბერი

**პროექტი:** Legal.ge
