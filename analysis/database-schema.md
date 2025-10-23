# 🗄️ მონაცემთა ბაზის სტრუქტურა (Supabase PostgreSQL)

## ზოგადი ინფორმაცია

**Database Type:** PostgreSQL (Supabase)  
**Version:** PostgreSQL 15.x  
**მთავარი ფუნქციები:**
- Row Level Security (RLS)
- Real-time subscriptions
- Auto-generated REST API
- UUID Primary Keys
- Timestamps (created_at, updated_at)

---

## 📋 ტაბელების სია

1. **profiles** - მომხმარებლის პროფილები
2. **companies** - კომპანიები
3. **specialists** - სპეციალისტები
4. **practice_areas** - პრაქტიკის სფეროები
5. **services** - სერვისები
6. **posts** - ბლოგის პოსტები
7. **categories** - კატეგორიები
8. **post_categories** - პოსტების და კატეგორიების კავშირი
9. **requests** - მომხმარებლის მოთხოვნები
10. **translations** - მრავალენოვანი კონტენტი

---

## 1️⃣ profiles (მომხმარებლის პროფილები)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'author', 'specialist', 'company', 'admin')),
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ყველას ხედავს პუბლიკურ პროფილებს
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- მომხმარებელს შეუძლია საკუთარი პროფილის განახლება
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი (UUID, Supabase Auth user id)
- `email` - ელ.ფოსტა (უნიკალური)
- `full_name` - სრული სახელი
- `avatar_url` - ავატარის URL (Supabase Storage)
- `role` - როლი (user, author, specialist, company, admin)
- `phone` - ტელეფონის ნომერი
- `bio` - ბიოგრაფია
- `created_at` - შექმნის თარიღი
- `updated_at` - განახლების თარიღი

---

## 2️⃣ companies (კომპანიები)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_verified ON companies(verified);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified companies"
ON companies FOR SELECT
USING (verified = true);

CREATE POLICY "Company owners can manage own company"
ON companies FOR ALL
USING (auth.uid() = user_id);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `user_id` - კომპანიის მფლობელი (profiles-თან კავშირი)
- `name` - კომპანიის სახელი
- `slug` - URL-ისთვის (unique)
- `description` - აღწერა
- `logo_url` - ლოგოს URL (Supabase Storage)
- `website` - ვებსაიტი
- `email` - კონტაქტის ელ.ფოსტა
- `phone` - კონტაქტის ტელეფონი
- `address` - მისამართი
- `city` - ქალაქი
- `verified` - გადამოწმებულია თუ არა
- `created_at` - შექმნის თარიღი
- `updated_at` - განახლების თარიღი

---

## 3️⃣ specialists (სპეციალისტები)

```sql
CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  education TEXT,
  certifications TEXT[],
  languages TEXT[] DEFAULT ARRAY['ka'],
  hourly_rate DECIMAL(10, 2),
  available BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_specialists_user_id ON specialists(user_id);
CREATE INDEX idx_specialists_company_id ON specialists(company_id);
CREATE INDEX idx_specialists_verified ON specialists(verified);

-- RLS Policies
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified specialists"
ON specialists FOR SELECT
USING (verified = true);

CREATE POLICY "Specialists can manage own profile"
ON specialists FOR ALL
USING (auth.uid() = user_id);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `user_id` - სპეციალისტის მომხმარებელი
- `company_id` - კომპანია (optional)
- `bio` - ბიოგრაფია
- `years_experience` - გამოცდილების წლები
- `education` - განათლება
- `certifications` - სერტიფიკატები (array)
- `languages` - ენები (array: ka, en, ru)
- `hourly_rate` - საათობრივი განაკვეთი
- `available` - ხელმისაწვდომია თუ არა
- `verified` - გადამოწმებულია თუ არა

---

## 4️⃣ practice_areas (პრაქტიკის სფეროები)

```sql
CREATE TABLE practice_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_practice_areas_slug ON practice_areas(slug);
CREATE INDEX idx_practice_areas_parent ON practice_areas(parent_id);
CREATE INDEX idx_practice_areas_active ON practice_areas(active);

-- RLS Policies
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active practice areas"
ON practice_areas FOR SELECT
USING (active = true);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `slug` - URL-ისთვის
- `icon` - ხატულა (Lucide icon name)
- `parent_id` - მშობელი სფერო (ქვე-კატეგორიებისთვის)
- `order_index` - დალაგების რიგი
- `active` - აქტიურია თუ არა

---

## 5️⃣ services (სერვისები)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'GEL',
  duration INTEGER, -- წუთებში
  active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_services_slug ON services(slug);
CREATE INDEX idx_services_practice_area ON services(practice_area_id);
CREATE INDEX idx_services_company ON services(company_id);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_featured ON services(featured);

-- RLS Policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
USING (active = true);

CREATE POLICY "Company owners can manage own services"
ON services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = services.company_id
    AND companies.user_id = auth.uid()
  )
);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `practice_area_id` - პრაქტიკის სფერო
- `company_id` - კომპანია
- `slug` - URL-ისთვის
- `price` - ფასი
- `currency` - ვალუტა (GEL, USD, EUR)
- `duration` - ხანგრძლივობა წუთებში
- `active` - აქტიურია თუ არა
- `featured` - გამორჩეულია თუ არა

---

## 6️⃣ posts (ბლოგის პოსტები)

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  reading_time INTEGER, -- წუთებში
  views INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_featured ON posts(featured);

-- RLS Policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
USING (published = true);

CREATE POLICY "Authors can manage own posts"
ON posts FOR ALL
USING (auth.uid() = author_id);

-- View Count Function
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET views = views + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `author_id` - ავტორი (profiles)
- `slug` - URL-ისთვის
- `content` - კონტენტი (HTML/Markdown)
- `excerpt` - მოკლე აღწერა
- `image_url` - გამოსახულება
- `reading_time` - კითხვის დრო
- `views` - ნახვების რაოდენობა
- `published` - გამოქვეყნებულია თუ არა
- `published_at` - გამოქვეყნების თარიღი
- `featured` - გამორჩეულია თუ არა

---

## 7️⃣ categories (კატეგორიები)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
ON categories FOR SELECT
USING (true);
```

---

## 8️⃣ post_categories (პოსტების და კატეგორიების კავშირი)

```sql
CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

-- Index
CREATE INDEX idx_post_categories_post ON post_categories(post_id);
CREATE INDEX idx_post_categories_category ON post_categories(category_id);

-- RLS Policies
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post categories"
ON post_categories FOR SELECT
USING (true);
```

---

## 9️⃣ requests (მომხმარებლის მოთხოვნები)

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_requests_user ON requests(user_id);
CREATE INDEX idx_requests_service ON requests(service_id);
CREATE INDEX idx_requests_specialist ON requests(specialist_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);

-- RLS Policies
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
ON requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests"
ON requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ადმინებს და სპეციალისტებს ხედავთ მოთხოვნებს
CREATE POLICY "Specialists can view assigned requests"
ON requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = requests.specialist_id
    AND specialists.user_id = auth.uid()
  )
);
```

**ველების აღწერა:**
- `id` - უნიკალური იდენტიფიკატორი
- `user_id` - მომხმარებელი
- `service_id` - სერვისი (optional)
- `specialist_id` - სპეციალისტი (optional)
- `subject` - თემა
- `message` - შეტყობინება
- `phone` - ტელეფონი
- `email` - ელ.ფოსტა
- `status` - სტატუსი (pending, in_progress, completed, cancelled)
- `priority` - პრიორიტეტი (low, normal, high, urgent)
- `notes` - შენიშვნები
- `responded_at` - პასუხის თარიღი

---

## 🔟 translations (მრავალენოვანი კონტენტი)

```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('ka', 'en', 'ru')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(table_name, record_id, field_name, locale)
);

-- Index
CREATE INDEX idx_translations_record ON translations(table_name, record_id, locale);
CREATE INDEX idx_translations_locale ON translations(locale);

-- RLS Policies
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view translations"
ON translations FOR SELECT
USING (true);
```

**მაგალითი:**
```sql
-- practice_area-ის სახელის თარგმანები
INSERT INTO translations (table_name, record_id, field_name, locale, value) VALUES
('practice_areas', 'uuid-here', 'name', 'ka', 'სამოქალაქო სამართალი'),
('practice_areas', 'uuid-here', 'name', 'en', 'Civil Law'),
('practice_areas', 'uuid-here', 'name', 'ru', 'Гражданское право');
```

---

## 🔄 Relations Diagram

```
profiles (მომხმარებლები)
  ├── companies (1:many) - კომპანიები
  ├── specialists (1:1) - სპეციალისტები
  ├── posts (1:many) - პოსტები
  └── requests (1:many) - მოთხოვნები

companies (კომპანიები)
  ├── services (1:many) - სერვისები
  └── specialists (1:many) - სპეციალისტები

practice_areas (სფეროები)
  ├── services (1:many) - სერვისები
  └── practice_areas (parent) - ქვე-კატეგორიები

posts (პოსტები)
  └── post_categories (many:many) - კატეგორიები

services (სერვისები)
  └── requests (1:many) - მოთხოვნები

specialists (სპეციალისტები)
  └── requests (1:many) - მოთხოვნები
```

---

## 🛠️ Helper Functions

### Auto Update Timestamp

```sql
-- Automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- და ა.შ. ყველა ტაბელისთვის...
```

### Translation Helper Function

```sql
-- Get translated value
CREATE OR REPLACE FUNCTION get_translation(
  p_table_name TEXT,
  p_record_id UUID,
  p_field_name TEXT,
  p_locale TEXT DEFAULT 'ka'
)
RETURNS TEXT AS $$
DECLARE
  translated_value TEXT;
BEGIN
  SELECT value INTO translated_value
  FROM translations
  WHERE table_name = p_table_name
    AND record_id = p_record_id
    AND field_name = p_field_name
    AND locale = p_locale;
  
  RETURN translated_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔐 Security Best Practices

### RLS (Row Level Security)
- ✅ ყველა ტაბელზე RLS enabled
- ✅ მომხმარებლები ხედავენ მხოლოდ საკუთარ მონაცემებს
- ✅ პუბლიკური კონტენტი ყველასთვის ხელმისაწვდომია
- ✅ ადმინებს სრული წვდომა

### Indexes
- ✅ Foreign Keys-ზე
- ✅ Slug ველებზე
- ✅ Status და Boolean ველებზე
- ✅ Timestamp ველებზე (sorting-ისთვის)

### Data Integrity
- ✅ UUID Primary Keys
- ✅ Foreign Key Constraints
- ✅ CHECK Constraints (enum values)
- ✅ UNIQUE Constraints
- ✅ NOT NULL Constraints

---

*მონაცემთა ბაზა ოპტიმიზირებულია Supabase-ისთვის და მხარს უჭერს მრავალენოვან, მაღალი უსაფრთხოების სისტემას.*
