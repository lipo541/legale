# 📰 NewsPage - სრული სტრუქტურის ანალიზი და Database გეგმა

## 🎯 NEWSPAGE LAYOUT სტრუქტურა

### **Grid Layout (12 columns, responsive)**

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NEWSPAGE - 10 POSITIONS                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────┐  ┌──────────────────────┐  ┌──────────┐                │
│  │         │  │                      │  │          │                │
│  │ POS 1   │  │      POSITION 3      │  │ POSITION │                │
│  │ Hero    │  │   Main Feature       │  │    5     │                │
│  │ Slider  │  │   Fade Slider        │  │  News    │                │
│  │         │  │                      │  │  Ticker  │                │
│  │ 3 rows  │  ├──────────────────────┤  │          │                │
│  │         │  │ POS 4 │ POS 6│ POS 7│  │  2 rows  │                │
│  │ lg:3    │  │ Stats │ Categ│ Link │  │          │                │
│  │ cols    │  │       │      │      │  │  lg:3    │                │
│  │         │  └──────────────────────┘  │  cols    │                │
│  └─────────┘                            └──────────┘                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  POS 2      │     POSITION 9      │    POSITION 10         │    │
│  │ Vertical    │  Horizontal News    │  Featured Topics       │    │
│  │ News Feed   │  Carousel           │  (3D Coverflow)        │    │
│  │ (3 items)   │  (Swiper slider)    │  (Popular themes)      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              ALL POSTS SECTION                             │     │
│  │  (ავტორების ატვირთული პოსტები რომლებიც ჯერ არ არის       │     │
│  │   SuperAdmin-ის მიერ მინიჭებული პოზიციაზე)                │     │
│  │  ├─ Grid: 3 columns (md:2, mobile:1)                       │     │
│  │  ├─ Card format: Image + Title + Excerpt + Author          │     │
│  │  ├─ Status badges: Draft, Pending, Published               │     │
│  │  └─ Load More button (6 items increment)                   │     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 POSITION-ების დეტალური ანალიზი

### **Position 1 - Hero Slider** (Left, 3 row span)
- **ტიპი:** Swiper Slider (Autoplay + Pagination)
- **კონტენტი:** 3 slides (background gradient + title + subtitle)
- **ზომა:** lg:col-span-3, lg:row-span-3, h-[580px]
- **მახასიათებლები:**
  - Autoplay: 5000ms
  - Loop: true
  - Pagination bullets
  - Gradient overlay
  - CTA button: "ვრცლად"
- **Database:** `display_position = 1` → მხოლოდ 1 პოსტი ან slider_group = 1

---

### **Position 2 - Vertical News Feed** (Bottom left)
- **ტიპი:** Static list (3 items)
- **კონტენტი:** Small news cards (date + category + title)
- **ზომა:** lg:col-span-4, h-[240px]
- **მახასიათებლები:**
  - Hover animation (border ring)
  - Arrow indicator on hover
  - Date + category badge
- **Database:** `display_position = 2` → 1 პოსტი (ან 3 უახლესი იმავე position-ის)

---

### **Position 3 - Main Feature Slider** (Center, 2 row span)
- **ტიპი:** Swiper Fade Effect Slider
- **კონტენტი:** 3 featured items (icon + title + description + stats)
- **ზომა:** lg:col-span-6, lg:row-span-2, h-[380px]
- **მახასიათებლები:**
  - Effect: fade crossFade
  - Autoplay: 6000ms
  - Progress indicators (3 lines)
  - CTA button: "გაეცანი"
  - Large icons (emoji)
- **Database:** `display_position = 3` → slider_group = 3

---

### **Position 4 - Stats Card** (Below Position 3)
- **ტიპი:** Static info card
- **კონტენტი:** Icon + Big number + description
- **ზომა:** lg:col-span-3, h-[190px]
- **მახასიათებლები:**
  - Centered content
  - Document icon
  - "2,450+ სამართლებრივი დოკუმენტი"
  - "განახლებულია დღეს"
- **Database:** `display_position = 4` → 1 პოსტი (stats type)

---

### **Position 5 - News Ticker** (Right, 2 row span)
- **ტიპი:** Vertical Swiper Slider (Auto-scroll)
- **კონტენტი:** 4 updates (time + text)
- **ზომა:** lg:col-span-3, lg:row-span-2, h-[380px]
- **მახასიათებლები:**
  - Direction: vertical
  - slidesPerView: 3
  - Autoplay: 3000ms
  - Animated pulse dot
  - "ახალი ამბები" header
- **Database:** `display_position = 5` → slider_group = 5 (multiple items)

---

### **Position 6 - Category Card** (Middle bottom)
- **ტიპი:** Hover card with gradient
- **კონტენტი:** Icon + Title + Description
- **ზომა:** lg:col-span-3, h-[190px]
- **მახასიათებლები:**
  - Scale animation on hover
  - Gradient overlay
  - Icon scale on hover
  - Arrow indicator
  - "ანალიტიკა" theme
- **Database:** `display_position = 6` → 1 category card

---

### **Position 7 - Quick Link** (Right bottom)
- **ტიპი:** Simple centered card
- **კონტენტი:** Icon + Title + Description
- **ზომა:** lg:col-span-3, h-[190px]
- **მახასიათებლები:**
  - Centered layout
  - Icon scale on hover
  - "ბიბლიოთეკა" link
- **Database:** `display_position = 7` → 1 quick link

---

### **Position 9 - Horizontal Carousel** (Bottom center)
- **ტიპი:** Swiper Horizontal Slider with Navigation
- **კონტენტი:** 4 articles (date + category + title + excerpt)
- **ზომა:** lg:col-span-4, h-[335px]
- **მახასიათებლები:**
  - Navigation arrows (custom buttons)
  - Autoplay: 3500ms
  - "რეკომენდებული" header
  - Live indicator (pulsing dot)
  - CTA: "წაიკითხე"
- **Database:** `display_position = 9` → slider_group = 9 (multiple posts)

---

### **Position 10 - Featured Topics** (Bottom right)
- **ტიპი:** 3D Coverflow Effect Slider
- **კონტენტი:** 4 topics (icon emoji + title + count)
- **ზომა:** lg:col-span-4, h-[335px]
- **მახასიათებლები:**
  - Effect: coverflow (3D depth)
  - centeredSlides: true
  - slidesPerView: 1.5
  - Autoplay: 3000ms
  - "პოპულარული თემები" header
  - Document count badge
- **Database:** `display_position = 10` → topics/categories

---

### **AllPostsSection** (ქვემოთ grid view)
- **ტიპი:** Grid of all unpublished/unassigned posts
- **კონტენტი:** Author-uploaded posts without position
- **მახასიათებლები:**
  - Grid: 3 cols (lg), 2 cols (md), 1 col (mobile)
  - Image placeholder
  - Status badges: Draft, Pending, Published
  - Date + Category
  - Author avatar/name
  - Load More: +6 items
- **Database:** `WHERE display_position IS NULL OR status != 'published'`

---

## 🗄️ DATABASE SCHEMA

### **1. Main Posts Table**

```sql
CREATE TABLE posts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Author/Practice Reference
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  
  -- Display Position (1-10 for NewsPage featured positions)
  display_position INTEGER NULL CHECK (display_position BETWEEN 1 AND 10),
  position_order INTEGER DEFAULT 0, -- Order within same position (for sliders)
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  
  -- Images (language-independent)
  featured_image_url TEXT,
  
  -- Publication Dates
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: Only one post per position (if not slider)
  CONSTRAINT unique_single_position 
    UNIQUE (display_position) 
    WHERE display_position IN (1, 2, 4, 6, 7) AND status = 'published'
  
  -- Multiple posts allowed for slider positions: 3, 5, 9, 10
);

-- Comments
COMMENT ON TABLE posts IS 'Main posts table - news articles and updates';
COMMENT ON COLUMN posts.display_position IS '1-10 for NewsPage positions, NULL for AllPostsSection';
COMMENT ON COLUMN posts.position_order IS 'Order within slider (Position 3, 5, 9, 10)';
COMMENT ON COLUMN posts.status IS 'draft (author), pending (review), published (live), archived';
```

---

### **2. Post Translations Table**

```sql
CREATE TABLE post_translations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Language
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  
  -- Content Fields
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT, -- HTML from RichTextEditor
  
  -- Category
  category TEXT,
  
  -- SEO Fields
  slug TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  
  -- Social Media (Open Graph)
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  
  -- Reading Stats
  word_count INTEGER DEFAULT 0,
  reading_time INTEGER DEFAULT 0, -- minutes
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, language), -- One translation per language per post
  UNIQUE(slug, language) -- Unique slug per language
);

-- Comments
COMMENT ON TABLE post_translations IS 'Translations for posts - 3 rows per post (ka, en, ru)';
COMMENT ON COLUMN post_translations.language IS 'Language code: ka (Georgian), en (English), ru (Russian)';
COMMENT ON COLUMN post_translations.slug IS 'URL-friendly slug - unique per language';
COMMENT ON COLUMN post_translations.content IS 'HTML content from RichTextEditor (Tiptap)';
COMMENT ON COLUMN post_translations.word_count IS 'Number of words (for reading stats)';
COMMENT ON COLUMN post_translations.reading_time IS 'Estimated reading time in minutes';
```

---

### **3. Categories Table (Optional - for structured categories)**

```sql
CREATE TABLE post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES post_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES post_categories(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('ka', 'en', 'ru')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  UNIQUE(category_id, language),
  UNIQUE(slug, language)
);
```

---

### **4. Storage Bucket - Post Images**

```sql
-- Insert bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

---

## 🔄 POSITION LOGIC

### **Single Position (1, 2, 4, 6, 7)**
- მხოლოდ 1 პოსტი შეიძლება იყოს მინიჭებული
- UNIQUE constraint ზრუნავს
- თუ SuperAdmin-მა ახალი პოსტი დაასვა → ძველი ავტომატურად NULL-ში გადადის

### **Slider Positions (3, 5, 9, 10)**
- რამდენიმე პოსტი შეიძლება იყოს
- `position_order` განსაზღვრავს რიგითობას slider-ში
- Query: `WHERE display_position = 3 ORDER BY position_order ASC`

### **AllPostsSection**
- `WHERE display_position IS NULL`
- ყველა draft, pending, და unassigned published posts
- Grid view with Load More

---

## 📋 INDEXES FOR PERFORMANCE

```sql
-- Position filtering
CREATE INDEX idx_posts_display_position ON posts(display_position) 
WHERE display_position IS NOT NULL;

-- Status filtering
CREATE INDEX idx_posts_status ON posts(status);

-- Published posts with position
CREATE INDEX idx_posts_published_positioned ON posts(display_position, position_order) 
WHERE status = 'published' AND display_position IS NOT NULL;

-- Translations by post
CREATE INDEX idx_post_translations_post_id ON post_translations(post_id);

-- Translations by language
CREATE INDEX idx_post_translations_language ON post_translations(language);

-- Slug lookups
CREATE INDEX idx_post_translations_slug_language ON post_translations(slug, language);

-- Author posts
CREATE INDEX idx_posts_author_id ON posts(author_id);
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_translations ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Public read published posts"
ON posts FOR SELECT
USING (status = 'published');

-- Public read translations of published posts
CREATE POLICY "Public read published post translations"
ON post_translations FOR SELECT
USING (
  post_id IN (SELECT id FROM posts WHERE status = 'published')
);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own draft posts
CREATE POLICY "Authors update own draft posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id AND status = 'draft')
WITH CHECK (auth.uid() = author_id);

-- Super Admin full access
CREATE POLICY "Super Admin full access posts"
ON posts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SUPER_ADMIN'
  )
);
```

---

## 🎨 FRONTEND QUERIES

### **Position 1 - Hero Slider**
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    featured_image_url,
    post_translations!inner(title, excerpt, slug)
  `)
  .eq('display_position', 1)
  .eq('status', 'published')
  .eq('post_translations.language', 'ka')
  .order('position_order', { ascending: true })
  .limit(3)
```

### **Position 3 - Main Feature Slider**
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    post_translations!inner(title, content, slug)
  `)
  .eq('display_position', 3)
  .eq('status', 'published')
  .eq('post_translations.language', 'ka')
  .order('position_order', { ascending: true })
```

### **AllPostsSection - Unpublished/Unpositioned**
```typescript
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    status,
    created_at,
    featured_image_url,
    author:profiles(full_name, avatar_url),
    post_translations!inner(title, excerpt, category, slug)
  `)
  .is('display_position', null)
  .eq('post_translations.language', 'ka')
  .order('created_at', { ascending: false })
  .range(0, 5) // First 6 items
```

---

## ✅ SUMMARY

### **Position Distribution:**
1. **Single Posts:** 1, 2, 4, 6, 7 (5 positions)
2. **Sliders:** 3, 5, 9, 10 (4 positions)
3. **Total:** 10 featured positions
4. **Overflow:** AllPostsSection (unlimited grid)

### **Database Tables:**
- ✅ `posts` - Main table (id, author, position, status, images)
- ✅ `post_translations` - 3 languages (ka, en, ru)
- ✅ `post_categories` + translations (optional)
- ✅ `post-images` Storage bucket

### **Next Steps:**
1. შევქმნათ migration ფაილი
2. დავამატოთ Storage policies
3. განვაახლოთ Context (PostTranslationsContext) display_position-ით
4. შევქმნათ SuperAdmin UI position selector-ისთვის
5. Frontend queries integration

---

🎯 **მზად ვართ მიგრაციის შესაქმნელად!**
