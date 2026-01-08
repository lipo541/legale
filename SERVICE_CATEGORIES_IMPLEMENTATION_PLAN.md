# 🗂️ სერვისების კატეგორიზაციის იმპლემენტაციის გეგმა

## 📋 შინაარსი
1. [მიმოხილვა](#მიმოხილვა)
2. [არსებული სისტემის ანალიზი](#არსებული-სისტემის-ანალიზი)
3. [ახალი სისტემის არქიტექტურა](#ახალი-სისტემის-არქიტექტურა)
4. [Database სტრუქტურა](#database-სტრუქტურა)
5. [ფაილების სტრუქტურა](#ფაილების-სტრუქტურა)
6. [URL და Slug სისტემა](#url-და-slug-სისტემა)
7. [Admin Dashboard](#admin-dashboard)
8. [Public გვერდები](#public-გვერდები)
9. [SEO იმპლემენტაცია](#seo-იმპლემენტაცია)
10. [იმპლემენტაციის ეტაპები](#იმპლემენტაციის-ეტაპები)

---

## მიმოხილვა

### მიზანი
სერვისების კატეგორიზაცია იერარქიული სტრუქტურით (უსასრულო subcategories), news-ის კატეგორიების მსგავსად.

### ძირითადი პრინციპები
- ✅ **არსებული სერვისების URL არ იცვლება** (`/practices/[practiceSlug]/[serviceSlug]`)
- ✅ **კატეგორიები მხოლოდ დაჯგუფებისთვის** - ახალი გვერდები სერვისების card-ებით
- ✅ **იერარქიული breadcrumbs** - მშობელი კატეგორიების სრული ჯაჭვი
- ✅ **SEO ოპტიმიზირებული** - თითოეულ კატეგორიას თავისი SEO ველები
- ✅ **დინამიური გვერდის შექმნა** - მხოლოდ როცა კატეგორიას სერვისი აქვს მინიჭებული

---

## არსებული სისტემის ანალიზი

### News Categories (მაგალითი რასაც ვიმეორებთ)

#### Database ცხრილები:
```
post_categories
├── id (UUID, PK)
├── parent_id (UUID, FK → post_categories.id) -- იერარქიისთვის
├── created_at
└── updated_at

post_category_translations
├── id (UUID, PK)
├── category_id (UUID, FK → post_categories.id)
├── language (TEXT: 'ka' | 'en' | 'ru')
├── name (TEXT)
├── slug (TEXT, UNIQUE per language)
├── description (TEXT)
├── seo_title (TEXT)
├── seo_description (TEXT)
├── created_at
└── updated_at
```

#### URL სტრუქტურა (News-ის, არა სერვისების!):
```
/ka/news/category/[slug]   ← News კატეგორიები
/en/news/category/[slug]
/ru/news/category/[slug]
```

> ⚠️ **შენიშვნა:** ეს არის News-ის URL სტრუქტურა. სერვისების კატეგორიებისთვის გამოვიყენებთ `/category/[slug]` (news პრეფიქსის გარეშე) - იხ. [URL და Slug სისტემა](#url-და-slug-სისტემა)

#### ფაილები:
```
src/app/[locale]/news/category/[slug]/
├── page.tsx              # Server Component - ISR (revalidate=3600)
└── CategoryPageClient.tsx # Client Component - UI ლოგიკა
```

---

### არსებული Services სისტემა

#### Database ცხრილები:
```
services
├── id (UUID, PK)
├── practice_id (UUID, FK → practices.id)
├── image_url (TEXT)
├── og_image_url (TEXT)
├── status ('draft' | 'published' | 'archived')
├── created_at
└── updated_at

service_translations
├── id (UUID, PK)
├── service_id (UUID, FK → services.id)
├── language (TEXT: 'ka' | 'en' | 'ru')
├── title (TEXT)
├── slug (TEXT, UNIQUE per language)
├── description (TEXT)
├── meta_title (TEXT)
├── meta_description (TEXT)
├── og_title (TEXT)
├── og_description (TEXT)
├── created_at
└── updated_at
```

#### URL სტრუქტურა (რჩება იგივე):
```
/ka/practices/[practiceSlug]/[serviceSlug]
```

---

## ახალი სისტემის არქიტექტურა

### მთავარი კონცეფცია

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE CATEGORIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   სამოქალაქო სამართალი (ROOT)                                  │
│   ├── საოჯახო სამართალი (Level 2)                              │
│   │   ├── განქორწინება (Level 3)                               │
│   │   │   └── [სერვისი: განქორწინების იურიდიული მომსახურება]   │
│   │   ├── ალიმენტი (Level 3)                                   │
│   │   │   └── [სერვისი: ალიმენტის გამოთვლა]                    │
│   │   └── მეურვეობა (Level 3)                                  │
│   │       └── [სერვისი: მეურვეობის საქმეები]                   │
│   └── მემკვიდრეობა (Level 2)                                   │
│       └── [სერვისი: ანდერძის შედგენა]                          │
│                                                                 │
│   სისხლის სამართალი (ROOT)                                     │
│   ├── დაცვა (Level 2)                                          │
│   │   └── [სერვისი: სისხლის სამართლის დაცვა]                   │
│   └── ...                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### URL ლოგიკა

```
კატეგორიის გვერდი: /ka/category/[slug]
                  /ka/category/საოჯახო-სამართალი

სერვისის გვერდი:  /ka/practices/[practiceSlug]/[serviceSlug]  (იგივე რჩება!)
```

### Breadcrumb ლოგიკა

კატეგორიის გვერდზე (`/ka/category/განქორწინება`):
```
მთავარი → სამოქალაქო სამართალი → საოჯახო სამართალი → განქორწინება
   ↓              ↓                     ↓                  ↓
 /ka      /ka/category/...      /ka/category/...      (current)
```

---

## Database სტრუქტურა

### ახალი მიგრაცია: `061_create_service_categories.sql`

```sql
-- ============================================
-- Migration: Create Service Categories System
-- Description: Hierarchical categories for services
-- Date: 2026-01-06
-- ============================================

-- ============================================
-- 1. CREATE SERVICE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-referencing foreign key index
CREATE INDEX idx_service_categories_parent ON service_categories(parent_id);
CREATE INDEX idx_service_categories_active ON service_categories(is_active);

COMMENT ON TABLE service_categories IS 'Hierarchical categories for services (supports unlimited subcategories)';
COMMENT ON COLUMN service_categories.parent_id IS 'Parent category ID (NULL = root category)';
COMMENT ON COLUMN service_categories.sort_order IS 'Display order within same parent';
COMMENT ON COLUMN service_categories.is_active IS 'Whether category is visible on public site';

-- ============================================
-- 2. CREATE SERVICE CATEGORY TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One translation per language per category
  UNIQUE(category_id, language),
  -- Slug unique per language
  UNIQUE(slug, language)
);

CREATE INDEX idx_service_category_translations_category ON service_category_translations(category_id);
CREATE INDEX idx_service_category_translations_slug_lang ON service_category_translations(slug, language);

COMMENT ON TABLE service_category_translations IS 'Translations for service categories (ka, en, ru)';

-- ============================================
-- 3. ADD CATEGORY_ID TO SERVICES TABLE
-- ============================================

ALTER TABLE services ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;
CREATE INDEX idx_services_category ON services(category_id);

COMMENT ON COLUMN services.category_id IS 'Service category for grouping (optional)';

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_category_translations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for service categories"
ON service_categories FOR SELECT USING (true);

CREATE POLICY "Public read access for service category translations"
ON service_category_translations FOR SELECT USING (true);

-- Super Admin full access
CREATE POLICY "Super Admin full access to service_categories"
ON service_categories TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'SUPER_ADMIN'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'SUPER_ADMIN'
));

CREATE POLICY "Super Admin full access to service_category_translations"
ON service_category_translations TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'SUPER_ADMIN'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'SUPER_ADMIN'
));

-- ============================================
-- 5. TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_service_categories_updated_at
BEFORE UPDATE ON service_categories
FOR EACH ROW EXECUTE FUNCTION update_service_categories_updated_at();

CREATE TRIGGER trigger_service_category_translations_updated_at
BEFORE UPDATE ON service_category_translations
FOR EACH ROW EXECUTE FUNCTION update_service_categories_updated_at();
```

---

## ფაილების სტრუქტურა

### 📁 საბოლოო ფაილების სტრუქტურა

```
src/
├── app/
│   ├── [locale]/
│   │   └── category/
│   │       └── [slug]/
│   │           ├── page.tsx                    # ✨ NEW - Server Component
│   │           └── ServiceCategoryClient.tsx   # ✨ NEW - Client Component
│   └── sitemap.ts                              # 📝 MODIFY - დაამატე service categories
│
├── components/
│   └── superadmindashboard/
│       ├── servicecategories/
│       │   └── ServiceCategoryAdd.tsx          # ✨ NEW - Admin CRUD
│       ├── services/
│       │   ├── ServicesPage.tsx                # 📝 MODIFY - category column/filter
│       │   └── ServiceAdd.tsx                  # 📝 MODIFY - category selector
│       └── Dashboard.tsx                       # 📝 MODIFY - nav item დამატება
│
supabase/
└── migrations/
    └── 061_create_service_categories.sql       # ✨ NEW - Database migration
```

### შესაქმნელი ფაილები (✨ NEW)

| ფაილი | აღწერა | მაგალითი (დაეყრდნო) |
|-------|--------|---------------------|
| `supabase/migrations/061_create_service_categories.sql` | Database migration | `038_create_posts_system.sql` |
| `src/app/[locale]/category/[slug]/page.tsx` | კატეგორიის გვერდი (Server) | `src/app/[locale]/news/category/[slug]/page.tsx` |
| `src/app/[locale]/category/[slug]/ServiceCategoryClient.tsx` | კატეგორიის UI (Client) | `src/app/[locale]/news/category/[slug]/CategoryPageClient.tsx` |
| `src/components/superadmindashboard/servicecategories/ServiceCategoryAdd.tsx` | Admin CRUD | `src/components/superadmindashboard/categories/CategoryAdd.tsx` |

### მოდიფიცირებადი ფაილები (📝 MODIFY)

| ფაილი | ცვლილება |
|-------|----------|
| `src/app/sitemap.ts` | დაამატე `service_category_translations` URLs |
| `src/components/superadmindashboard/services/ServicesPage.tsx` | კატეგორიის column და filter |
| `src/components/superadmindashboard/services/ServiceAdd.tsx` | კატეგორიის hierarchical dropdown |
| `src/components/superadmindashboard/Dashboard.tsx` | ServiceCategories nav item |

---

## URL და Slug სისტემა

### URL სტრუქტურა

| გვერდი | URL Pattern | მაგალითი |
|--------|-------------|----------|
| კატეგორიის გვერდი | `/[locale]/category/[slug]` | `/ka/category/saojakho-samartali` |
| სერვისის გვერდი | `/[locale]/practices/[practiceSlug]/[serviceSlug]` | `/ka/practices/samoqalaqo/ganqorwineba` |

### Slug გენერაცია (transliteration)

```typescript
const generateSlug = (text: string): string => {
  const translitMap: { [key: string]: string } = {
    // Georgian
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 
    'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 
    'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 
    'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 
    'ძ': 'dz', 'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
    // Russian
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  }

  let slug = text.toLowerCase().trim()
  slug = slug.split('').map(char => translitMap[char] || char).join('')
  return slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}
```

### Language Redirect ლოგიკა (308 Permanent)

თუ მომხმარებელი შევა `/ka/category/family-law` (ინგლისური slug ქართულ locale-ზე):
1. სისტემა ამოწმებს slug-ის ენას
2. თუ ენა არ ემთხვევა → **308 Permanent Redirect** → `/en/category/family-law`

```typescript
// page.tsx
async function getCategoryBySlug(slug: string, locale: string) {
  const { data: slugCheck } = await supabase
    .from('service_category_translations')
    .select('category_id, language, slug')
    .eq('slug', slug)
    .single()
  
  if (slugCheck?.language !== locale) {
    return { 
      shouldRedirect: true, 
      redirectLocale: slugCheck.language,
      redirectSlug: slugCheck.slug
    }
  }
  return { shouldRedirect: false, categoryId: slugCheck.category_id }
}
```

---

## Admin Dashboard

### 🎯 UI მოთხოვნები

> **მნიშვნელოვანი:** `ServiceCategoryAdd.tsx` უნდა იყოს **100% იდენტური** `CategoryAdd.tsx`-თან (News კატეგორიები), მხოლოდ ცხრილების სახელები შეიცვლება.

#### Responsive Design მოთხოვნები:
- **Mobile (< 640px):** `grid-cols-1` - ენები ვერტიკალურად
- **Tablet (640px - 1024px):** `grid-cols-2` - 2 ენა ერთ რიგში
- **Desktop (> 1024px):** `grid-cols-3` - ყველა ენა ერთ რიგში

```typescript
// მაგალითი responsive grid-ისთვის:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
  {/* Georgian */}
  {/* English */}
  {/* Russian */}
</div>
```

#### კოპირების წესი:
1. დააკოპირე `src/components/superadmindashboard/categories/CategoryAdd.tsx`
2. შეცვალე ცხრილების სახელები:
   - `post_categories` → `service_categories`
   - `post_category_translations` → `service_category_translations`
3. შეცვალე კომპონენტის სახელი: `CategoryAdd` → `ServiceCategoryAdd`
4. დაამატე responsive breakpoints თუ არ არის

### ServiceCategoryAdd.tsx - ძირითადი ფუნქციონალი

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🗂️ სერვისის კატეგორიები                              [+ ახალი კატეგორია]│
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📁 სამოქალაქო სამართალი                            [✏️] [🗑️] [+ Sub]   │
│  │                                                                       │
│  ├── 📁 საოჯახო სამართალი                          [✏️] [🗑️] [+ Sub]   │
│  │   ├── 📁 განქორწინება (5 სერვისი)               [✏️] [🗑️] [+ Sub]   │
│  │   ├── 📁 ალიმენტი (3 სერვისი)                   [✏️] [🗑️] [+ Sub]   │
│  │   └── 📁 მეურვეობა (2 სერვისი)                  [✏️] [🗑️] [+ Sub]   │
│  │                                                                       │
│  └── 📁 მემკვიდრეობა                                [✏️] [🗑️] [+ Sub]   │
│      └── 📁 ანდერძი (1 სერვისი)                    [✏️] [🗑️] [+ Sub]   │
│                                                                          │
│  📁 სისხლის სამართალი                               [✏️] [🗑️] [+ Sub]   │
│  └── ...                                                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### კატეგორიის ფორმა (Modal)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  კატეგორიის შექმნა                                              [✕]     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [ქართული] [English] [Русский]                                          │
│                                                                          │
│  სახელი *                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ საოჯახო სამართალი                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Slug (ავტომატური)                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ saojakho-samartali                                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  აღწერა                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ საოჯახო სამართლის სერვისები...                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ─────────────────── SEO ───────────────────                            │
│                                                                          │
│  SEO Title                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ საოჯახო სამართალი - Legal.ge                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  SEO Description                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ საოჯახო სამართლის იურიდიული მომსახურება საქართველოში...        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│                                           [გაუქმება]  [💾 შენახვა]       │
└──────────────────────────────────────────────────────────────────────────┘
```

### ServicesPage.tsx - კატეგორიის column დამატება

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📋 სერვისები                                         [+ ახალი სერვისი] │
├──────────────────────────────────────────────────────────────────────────┤
│  🔍 ძებნა...                     [კატეგორია ▼] [პრაქტიკა ▼] [სტატუსი ▼] │
├──────────────────────────────────────────────────────────────────────────┤
│  სათაური         │ პრაქტიკა     │ კატეგორია           │ სტატუსი │ ...   │
│  ─────────────────┼──────────────┼─────────────────────┼─────────┼────── │
│  განქორწინება    │ სამოქალაქო   │ საოჯახო სამართალი  │ ✅      │ [✏️]  │
│  ალიმენტი        │ სამოქალაქო   │ საოჯახო სამართალი  │ ✅      │ [✏️]  │
│  დაცვა           │ სისხლის      │ -                   │ 📝      │ [✏️]  │
└──────────────────────────────────────────────────────────────────────────┘
```

### ServiceAdd.tsx - კატეგორიის არჩევა

```
┌──────────────────────────────────────────────────────────────────────────┐
│  კატეგორია (არასავალდებულო)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ ▼ აირჩიეთ კატეგორია...                                          │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │   სამოქალაქო სამართალი                                          │    │
│  │   ├── საოჯახო სამართალი                                         │    │
│  │   │   ├── განქორწინება                                          │    │
│  │   │   ├── ალიმენტი                                              │    │
│  │   │   └── მეურვეობა                                             │    │
│  │   └── მემკვიდრეობა                                              │    │
│  │       └── ანდერძი                                               │    │
│  │   სისხლის სამართალი                                             │    │
│  │   └── ...                                                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Public გვერდები

### კატეგორიის გვერდის სტრუქტურა

```
┌──────────────────────────────────────────────────────────────────────────┐
│  🏠 მთავარი > სამოქალაქო სამართალი > საოჯახო სამართალი                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  საოჯახო სამართალი                                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  საოჯახო სამართლის იურიდიული მომსახურება საქართველოში...               │
│                                                                          │
│  ─────────────────── ქვეკატეგორიები ───────────────────                 │
│                                                                          │
│  [განქორწინება (5)] [ალიმენტი (3)] [მეურვეობა (2)]                      │
│                                                                          │
│  ─────────────────── სერვისები ───────────────────                      │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   🖼️        │  │   🖼️        │  │   🖼️        │  │   🖼️        │     │
│  │             │  │             │  │             │  │             │     │
│  │ განქორწინება│  │ ალიმენტის   │  │ მეურვეობის  │  │ მემკვიდრე- │     │
│  │ სერვისი     │  │ გამოთვლა    │  │ საქმეები    │  │ ობა        │     │
│  │             │  │             │  │             │  │             │     │
│  │ [→ ვრცლად] │  │ [→ ვრცლად] │  │ [→ ვრცლად] │  │ [→ ვრცლად] │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### გვერდის შექმნის ლოგიკა (Empty State)

**მნიშვნელოვანი:** კატეგორიის გვერდი იქმნება **მხოლოდ** თუ:
1. კატეგორია აქტიურია (`is_active = true`)
2. კატეგორიას აქვს მინიმუმ **1 სერვისი** (პირდაპირ ან შვილ კატეგორიებში)

```typescript
// page.tsx - კატეგორიის გვერდის შემოწმება
async function hasServicesInCategory(categoryId: string): Promise<boolean> {
  const supabase = createStaticClient()
  
  // 1. პირდაპირი სერვისები
  const { count: directCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('status', 'published')
  
  if (directCount && directCount > 0) return true
  
  // 2. შვილი კატეგორიებში სერვისები (recursive)
  const descendants = await getAllDescendantCategoryIds(categoryId)
  
  if (descendants.length === 0) return false
  
  const { count: descendantCount } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .in('category_id', descendants)
    .eq('status', 'published')
  
  return (descendantCount ?? 0) > 0
}

// თუ სერვისი არ არის → notFound()
export default async function CategoryPage({ params }) {
  // ...
  const hasServices = await hasServicesInCategory(categoryData.category.id)
  
  if (!hasServices) {
    notFound() // 404 - SEO-სთვის უკეთესია ვიდრე ცარიელი გვერდი
  }
  // ...
}
```

---

## SEO იმპლემენტაცია

### Metadata Generation

```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = createStaticClient()
  
  // Fetch category data
  const { data: category } = await supabase
    .from('service_category_translations')
    .select(`
      name, slug, description, seo_title, seo_description,
      category:service_categories!inner(id)
    `)
    .eq('slug', decodeURIComponent(slug))
    .eq('language', locale)
    .single()
  
  if (!category) return { title: 'Not Found' }
  
  // Fetch all translations for hreflang
  const { data: allTranslations } = await supabase
    .from('service_category_translations')
    .select('language, slug')
    .eq('category_id', category.category.id)
  
  // Build language alternates
  const languageAlternates: Record<string, string> = {}
  allTranslations?.forEach(trans => {
    languageAlternates[trans.language] = 
      `${siteConfig.baseUrl}/${trans.language}/category/${encodeURIComponent(trans.slug)}`
  })
  
  const canonicalUrl = `${siteConfig.baseUrl}/${locale}/category/${encodeURIComponent(slug)}`
  
  return {
    title: category.seo_title || `${category.name} - Legal.ge`,
    description: category.seo_description || category.description,
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates
    },
    openGraph: {
      title: category.seo_title || category.name,
      description: category.seo_description || category.description,
      url: canonicalUrl,
      type: 'website',
      locale: locale === 'ka' ? 'ka_GE' : locale === 'ru' ? 'ru_RU' : 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title: category.seo_title || category.name,
      description: category.seo_description || category.description
    }
  }
}
```

### Schema.org (CollectionPage)

```typescript
const collectionPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: category.name,
  description: category.description,
  url: canonicalUrl,
  inLanguage: locale === 'ka' ? 'ka' : locale === 'ru' ? 'ru' : 'en',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Legal.ge',
    url: siteConfig.baseUrl
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteConfig.baseUrl}/${locale}/category/${encodeURIComponent(crumb.slug)}`
    }))
  }
}
```

### Sitemap Update

```typescript
// src/app/sitemap.ts - დასამატებელი სექცია

// 9. Service Categories
const { data: serviceCategoryTranslations } = await supabase
  .from('service_category_translations')
  .select(`
    slug, 
    language, 
    category:service_categories!inner(id, is_active)
  `)
  .eq('category.is_active', true)
  .not('slug', 'is', null)

// Filter categories that have services
if (serviceCategoryTranslations) {
  for (const translation of serviceCategoryTranslations) {
    // Check if category has any services (implement helper function)
    const hasServices = await checkCategoryHasServices(translation.category.id)
    
    if (hasServices) {
      const url = encodeURI(`${baseUrl}/${translation.language}/category/${translation.slug}`)
      sitemap.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    }
  }
}
```

### Revalidation Strategy

```typescript
// ISR - ყოველ 1 საათში რევალიდაცია
export const revalidate = 3600
```

---

## იმპლემენტაციის ეტაპები

### ეტაპი 1: Database (დღე 1)
- [ ] შექმენი მიგრაცია `061_create_service_categories.sql`
- [ ] გაუშვი მიგრაცია: `npx supabase db push`
- [ ] შეამოწმე ცხრილები Supabase Dashboard-ში
- [ ] შეამოწმე RLS policies

### ეტაპი 2: Admin - კატეგორიების მართვა (დღე 2-3)
- [ ] დააკოპირე `CategoryAdd.tsx` → `ServiceCategoryAdd.tsx`
- [ ] შეცვალე ცხრილების სახელები (post_ → service_)
- [ ] დაამატე responsive breakpoints: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] დაამატე Dashboard.tsx-ში ნავიგაცია
- [ ] ტესტი: CRUD ოპერაციები (create, read, update, delete)
- [ ] ტესტი: იერარქიული subcategories
- [ ] ტესტი: SEO ველები 3 ენაზე
- [ ] ტესტი: **Mobile responsive** (< 640px)
- [ ] ტესტი: **Tablet responsive** (640px - 1024px)
- [ ] ტესტი: **Desktop** (> 1024px)

### ეტაპი 3: Admin - სერვისებთან დაკავშირება (დღე 4)
- [ ] მოდიფიცირება: `ServicesPage.tsx` - კატეგორიის column და filter
- [ ] მოდიფიცირება: `ServiceAdd.tsx` - კატეგორიის hierarchical dropdown
- [ ] ტესტი: სერვისზე კატეგორიის მინიჭება
- [ ] ტესტი: ფილტრაცია კატეგორიით

### ეტაპი 4: Public გვერდები (დღე 5-6)
- [ ] შექმენი `src/app/[locale]/category/[slug]/page.tsx`
- [ ] შექმენი `src/app/[locale]/category/[slug]/ServiceCategoryClient.tsx`
- [ ] Breadcrumbs იმპლემენტაცია
- [ ] Service cards გამოჩენა
- [ ] Empty state (404 თუ სერვისი არ არის)
- [ ] 308 Language redirect

### ეტაპი 5: SEO (დღე 7)
- [ ] Metadata generation (title, description)
- [ ] hreflang tags
- [ ] Schema.org CollectionPage + BreadcrumbList
- [ ] OpenGraph & Twitter cards
- [ ] მოდიფიცირება: `sitemap.ts` - service categories URLs

### ეტაპი 6: ტესტირება და Deploy (დღე 8)
- [ ] ტესტი: ყველა 3 ენაზე
- [ ] ტესტი: Breadcrumb navigation
- [ ] ტესტი: SEO tags (og:*, twitter:*)
- [ ] ტესტი: Sitemap validation
- [ ] Performance check (Lighthouse)
- [ ] Production deploy

---

## ⚠️ მნიშვნელოვანი შენიშვნები

1. **არსებული URL-ები არ იცვლება** - სერვისის გვერდი რჩება `/practices/[practice]/[service]`

2. **Empty Categories** - თუ კატეგორიაში სერვისი არ არის, გვერდი 404 აბრუნებს (SEO best practice)

3. **Revalidation** - გამოიყენე `revalidate = 3600` (1 საათი) ISR-ისთვის

4. **Language Redirect** - slug სხვა ენის რომ იყოს, 308 redirect შესაბამის locale-ზე

5. **Breadcrumb** - მხოლოდ კატეგორიის გვერდზე, არა სერვისის გვერდზე

6. **category_id არასავალდებულო** - სერვისს შეიძლება არ ჰქონდეს კატეგორია

---

## 📚 Reference ფაილები (კოპირებისთვის)

| ახალი ფაილი | მაგალითი |
|-------------|----------|
| `061_create_service_categories.sql` | `supabase/migrations/038_create_posts_system.sql` |
| `category/[slug]/page.tsx` | `src/app/[locale]/news/category/[slug]/page.tsx` |
| `ServiceCategoryClient.tsx` | `src/app/[locale]/news/category/[slug]/CategoryPageClient.tsx` |
| `ServiceCategoryAdd.tsx` | `src/components/superadmindashboard/categories/CategoryAdd.tsx` |

---

**შექმნის თარიღი:** 2026-01-06  
**ავტორი:** Development Team  
**სტატუსი:** გეგმა მზადაა იმპლემენტაციისთვის
