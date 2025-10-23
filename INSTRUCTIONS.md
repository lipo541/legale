# Legale Project - ინსტრუქციები და მუშაობის პრინციპები

## �️ ტექნოლოგიური სტეკი

**მთავარი ტექნოლოგიები:**
- **Next.js 15** - React Framework (App Router)
- **Supabase** - Backend as a Service (Database, Auth, Storage, Real-time)
- **Tailwind CSS** - Utility-First CSS Framework

**დამატებითი ბიბლიოთეკები:**
- TypeScript - Type Safety
- Shadcn/UI - UI Components
- Zod - Schema Validation
- React Hook Form - Forms Management

## �📁 პროექტის სტრუქტურა

### კომპონენტების ორგანიზაცია
ყველა კომპონენტი უნდა იყოს ორგანიზებული ცალკე ფოლდერებში:

```
src/
├── components/
│   ├── header/
│   │   └── Header.tsx
│   ├── navigation/
│   │   └── Navigation.tsx
│   ├── footer/
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── button/
│   │   │   └── Button.tsx
│   │   ├── input/
│   │   │   └── Input.tsx
│   │   └── modal/
│   │       └── Modal.tsx
│   └── sections/
│       ├── hero/
│       │   └── Hero.tsx
│       ├── services/
│       │   └── Services.tsx
│       └── contact/
│           └── Contact.tsx
├── contexts/
│   ├── HeaderContext.tsx
│   ├── NavigationContext.tsx
│   └── AppContext.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Supabase Client (browser)
│   │   ├── server.ts      # Supabase Client (server)
│   │   └── middleware.ts  # Auth Middleware
│   ├── utils.ts
│   └── types.ts
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── styles/
    └── globals.css (Tailwind CSS)
```

## 🎯 მუშაობის პრინციპები

### 0. Supabase ინტეგრაცია:
- **Supabase Client** - browser-ისთვის (`@supabase/supabase-js`)
- **Supabase SSR** - Server Components-ისთვის (`@supabase/ssr`)
- **Row Level Security (RLS)** - მონაცემთა უსაფრთხოება
- **Real-time Subscriptions** - ცოცხალი განახლებები
- **Storage** - მედია ფაილების შენახვა

### 1. კომპონენტების შექმნის წესები:
- ყველა კომპონენტისთვის ცალკე ფოლდერი
- კომპონენტის სახელი PascalCase-ში (მაგ: `Header.tsx`)
- Tailwind CSS-ის გამოყენება სტაილებისთვის
- **პირდაპირ imports** - არა `index.ts` ფაილები

### 2. ფაილების სახელების კონვენცია:
- კომპონენტები: `ComponentName.tsx`
- Contexts: `ComponentNameContext.tsx`
- ტიპები: `types.ts`
- უტილები: `utils.ts`

### 3. კომპონენტის შექმნის ალგორითმი:
1. შექმენი `components/` ფოლდერში შესაბამისი კომპონენტის ფოლდერი
2. შექმენი `ComponentName.tsx` ფაილი (Tailwind CSS კლასებით)
3. გამოიყენე `export default` კომპონენტისთვის

### 4. კომპონენტების კატეგორიები:

#### `ui/` - საბაზისო UI კომპონენტები
- Button, Input, Modal, Card და ა.შ.
- მრავალჯერ გამოსაყენებელი კომპონენტები
- **მაგალითი:** `components/ui/button/Button.tsx`
- **Import:** `import Button from '@/components/ui/button/Button'`

#### `sections/` - გვერდის სექციები
- Hero, Services, About, Contact და ა.შ.
- გვერდის მთავარი სექციები
- **მაგალითი:** `components/sections/hero/Hero.tsx`
- **Import:** `import Hero from '@/components/sections/hero/Hero'`

#### ლეიაუთის კომპონენტები (ძირითად `components/` ფოლდერში)
- Header, Footer, Navigation, Sidebar და ა.შ.
- **მაგალითი:** `components/header/Header.tsx`
- **Import:** `import Header from '@/components/header/Header'`

### 5. Tailwind CSS გამოყენება:
- ყველა სტაილი იწერება Tailwind utility კლასებით
- კასტომ კლასები მხოლოდ `globals.css`-ში
- Responsive დიზაინი: `sm:`, `md:`, `lg:`, `xl:` პრეფიქსები
- Dark mode მხარდაჭერა: `dark:` პრეფიქსი

### 6. TypeScript კონვენციები:
- **ᲙᲐᲢᲔᲒᲝᲠᲘᲣᲚᲘ ᲛᲝᲗᲮᲝᲕᲜᲐ:** გამოვიყენოთ Context API, არა Props!
- Context-ის ინტერფეისი: `ComponentNameContextType`
- `export default` კომპონენტებისთვის
- Named exports Context-ებისა და Hooks-ისთვის

### 7. Context API გამოყენება:
- ყველა state და მონაცემი Context-ის მეშვეობით გადაეცემა
- თითოეული context ცალკე ფაილში: `contexts/ComponentNameContext.tsx`
- Provider კომპონენტები App-ის ან Layout-ის დონეზე
- Custom hooks თითოეული Context-ისთვის (მაგ: `useHeader`)

## 📊 Supabase მონაცემთა ბაზა

### მონაცემთა ბაზის სტრუქტურა:
- PostgreSQL database (Supabase-ის ზურგზე)
- Row Level Security (RLS) policies
- Realtime subscriptions
- Automatic API generation

### ძირითადი ტაბელები:
1. **users** - მომხმარებლები (Supabase Auth)
2. **profiles** - პროფილების დეტალური ინფო
3. **companies** - კომპანიები
4. **specialists** - სპეციალისტები
5. **practice_areas** - პრაქტიკის სფეროები
6. **services** - სერვისები
7. **posts** - ბლოგის პოსტები
8. **categories** - კატეგორიები
9. **requests** - მომხმარებლის მოთხოვნები

### Supabase Auth:
- Email/Password authentication
- OAuth providers (Google, GitHub და ა.შ.)
- Magic Link authentication
- Row Level Security (RLS)
- User roles და permissions

## 🔐 უსაფრთხოება და წვდომა

### Row Level Security (RLS):
```sql
-- მაგალითი: მომხმარებელს ხედავს მხოლოდ საკუთარ პროფილს
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- მაგალითი: მხოლოდ ადმინს შეუძლია პოსტების რედაქტირება
CREATE POLICY "Only admins can edit posts"
ON posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## 🛠️ Supabase Client Setup

### Browser Client:
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Server Client:
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

## 📝 SEO სტრატეგია (Maximum Effectiveness)

პროექტის მთავარი პრიორიტეტია მაქსიმალური SEO ოპტიმიზაცია. ამისთვის გამოვიყენებთ Next.js-ის ყველა თანამედროვე შესაძლებლობას.

### 1. დინამიური საიტის რუკა (`sitemap.ts`)
- **მიზანი:** საძიებო სისტემებს მივაწოდოთ საიტის ყველა გვერდის სრული, განახლებადი სია.
- **იმპლემენტაცია:**
    - `src/app/` ფოლდერში შეიქმნება `sitemap.ts` ფაილი.
    - ის დინამიურად შეაგროვებს ყველა საჯარო გვერდის URL-ს Supabase-დან.
    - თითოეულ URL-ს ექნება `lastModified` პარამეტრი, რაც Google-ს განახლებების შესახებ აცნობებს.

```typescript
// app/sitemap.ts
import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const supabase = await createClient()
  
  // სტატიკური გვერდები
  const routes = ['', '/about', '/services', '/contact'].map((route) => ({
    url: `https://yourdomain.com${route}`,
    lastModified: new Date().toISOString(),
  }))

  // დინამიური გვერდები (მაგ. ბლოგის პოსტები)
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('published', true)

  const postRoutes = posts?.map((post) => ({
    url: `https://yourdomain.com/blog/${post.slug}`,
    lastModified: post.updated_at,
  })) || []

  return [...routes, ...postRoutes]
}
```

### 2. დინამიური მეტა-თეგები (`generateMetadata`)
- **მიზანი:** თითოეულ გვერდს ჰქონდეს უნიკალური, რელევანტური და მიმზიდველი სათაური, აღწერა და სოციალური ქსელის თეგები.
- **იმპლემენტაცია:**
    - ყველა დინამიური გვერდის (`page.tsx`) ფაილში გამოყენებული იქნება `generateMetadata` ფუნქცია.
    - მონაცემები ჩამოვტვირთავთ Supabase-დან.

```typescript
// app/blog/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, description, image_url')
    .eq('slug', params.slug)
    .single()

  return {
    title: post?.title,
    description: post?.description,
    openGraph: {
      title: post?.title,
      description: post?.description,
      images: [post?.image_url],
    },
  }
}
```

### 3. სტრუქტურირებული მონაცემები (JSON-LD)
- **მიზანი:** Google-ს მივაწოდოთ დეტალური ინფორმაცია კონტენტის შესახებ, რათა ძიების შედეგებში გამოჩნდეს "Rich Snippets".
- **იმპლემენტაცია:**
    - შეიქმნება `JsonLd` კომპონენტი, რომელიც მიიღებს `data` ობიექტს.
    - ეს კომპონენტი დაემატება შესაბამის გვერდებს (`Article`, `Service`, `FAQPage` და ა.შ. სქემებით).
    - **მაგალითი:** ბლოგის პოსტს ექნება `Article` სქემა (ავტორი, გამოქვეყნების თარიღი, გამომცემელი).

### 4. `robots.ts` ფაილი
- **მიზანი:** საძიებო სისტემების ბოტების ქცევის კონტროლი.
- **იმპლემენტაცია:**
    - `src/app/` ფოლდერში შეიქმნება `robots.ts` ფაილი.
    - ის აკრძალავს არასაჯარო გვერდების (მაგ. `/admin`) ინდექსაციას.
    - მიუთითებს `sitemap.xml`-ის მისამართს.

### 5. სემანტიკური HTML და ხელმისაწვდომობა (Accessibility)
- **მიზანი:** კოდის სტრუქტურა იყოს ლოგიკური და გასაგები როგორც საძიებო სისტემებისთვის, ისე დამხმარე ტექნოლოგიებისთვის.
- **იმპლემენტაცია:**
    - გამოვიყენებთ სემანტიკურ თეგებს: `<main>`, `<article>`, `<section>`, `<nav>`, `<h1>-<h6>`.
    - ყველა სურათს ექნება აღწერითი `alt` ატრიბუტი.
    - ლინკებს ექნება გასაგები ტექსტი.

##  დასაწყისი

### პირველი ნაბიჯები:
1. ✅ Supabase პროექტის შექმნა (https://supabase.com)
2. ✅ Environment Variables-ის კონფიგურაცია (.env.local):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. ✅ Supabase Client-ების სეთაპი (browser & server)
4. ✅ კომპონენტების ფოლდერების შექმნა
5. ✅ Database Schema-ს შექმნა Supabase-ში
6. ✅ Row Level Security (RLS) Policies-ის კონფიგურაცია

## 📝 მნიშვნელოვანი დეტალები

### Context-ის შექმნის მაგალითი:
```typescript
// contexts/HeaderContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

interface HeaderContextType {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <HeaderContext.Provider value={{ isMenuOpen, toggleMenu }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider');
  }
  return context;
}
```

### კომპონენტის მაგალითი (Context-ით):
```typescript
// components/header/Header.tsx
'use client';

import { useHeader } from '@/contexts/HeaderContext';

export default function Header() {
  const { isMenuOpen, toggleMenu } = useHeader();
  
  return (
    <header className="bg-white shadow-md">
      <button onClick={toggleMenu}>
        {isMenuOpen ? 'Close' : 'Open'} Menu
      </button>
    </header>
  );
}
```

### Import-ის მაგალითი (პირდაპირი):
```typescript
// სხვა ფაილში - app/page.tsx
import Header from '@/components/header/Header';
import { useHeader } from '@/contexts/HeaderContext';

export default function Page() {
  return (
    <div>
      <Header />
    </div>
  );
}
```

---
*ეს ფაილი განახლდება პროექტის განვითარების პროცესში*