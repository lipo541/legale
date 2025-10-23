# 🛠️ ტექნოლოგიური სტეკი

## მთავარი ტექნოლოგიები

### 1. **Next.js 15.5.3**
- **როლი:** React Framework და საიტის საფუძველი
- **რატომ:** 
  - App Router (React Server Components)
  - Server Actions
  - File-based routing
  - Built-in SEO optimization
  - Image optimization
  - TypeScript support

### 2. **Supabase** (Backend as a Service)
- **როლი:** სრული Backend გადაწყვეტა
- **რას გვთავაზობს:**
  - **PostgreSQL Database** - მძლავრი რელაციური ბაზა
  - **Authentication** - Email/Password, OAuth (Google, GitHub), Magic Links
  - **Row Level Security (RLS)** - მონაცემთა დაცვა
  - **Storage** - მედია ფაილების შენახვა
  - **Real-time** - WebSocket subscriptions
  - **Auto-generated REST API** - მოსახერხებელი CRUD
  - **Edge Functions** - Serverless functions
  
- **პაკეტები:**
  - `@supabase/supabase-js` - Browser client
  - `@supabase/ssr` - Server-Side Rendering support

### 3. **Tailwind CSS 3.4.18**
- **როლი:** სტაილების სისტემა
- **რატომ:**
  - Utility-first approach
  - Responsive design utilities
  - Dark mode support
  - Customizable design system
  - Zero runtime
  - Tree-shakeable

---

## 🎨 UI და კომპონენტები

### 4. **Shadcn/UI**
- **როლი:** UI Components Library
- **რას გვთავაზობს:**
  - Radix UI primitives-ზე დაფუძნებული
  - Headless components
  - Customizable styles
  - Accessibility built-in
  - TypeScript support
  
- **კომპონენტები:**
  - Button, Input, Select, Modal
  - Dialog, Dropdown, Toast
  - Tabs, Accordion, Card
  - Form elements
  
- **დამოკიდებულებები:**
  - `@radix-ui/react-*` - UI primitives
  - `class-variance-authority` - Variant management
  - `clsx` & `tailwind-merge` - ClassName utilities

### 5. **Lucide React**
- **როლი:** Icons Library
- **პაკეტი:** `lucide-react`
- **რატომ:** 1000+ მაღალი ხარისხის SVG icons, Tree-shakeable

---

## 📝 Forms & Validation

### 6. **React Hook Form 7.54.2**
- **როლი:** ფორმების მართვა
- **რატომ:**
  - Performance optimized
  - Minimal re-renders
  - TypeScript support
  - Easy validation integration

### 7. **Zod 3.24.1**
- **როლი:** Schema Validation
- **რატომ:**
  - TypeScript-first validation
  - Type inference
  - Supabase-თან თავსებადი
  - Error messages

**მაგალითი:**
```typescript
const postSchema = z.object({
  title: z.string().min(1, "სათაური სავალდებულოა"),
  slug: z.string().min(1, "Slug სავალდებულოა"),
  content: z.string().min(50, "კონტენტი მინიმუმ 50 სიმბოლო უნდა იყოს"),
  status: z.enum(["draft", "published"]),
})
```

---

## 🗄️ მონაცემთა ბაზა - Supabase

### Database Schema
**PostgreSQL** (Supabase-ის ზურგზე)

#### ძირითადი ტაბელები:

```sql
-- მომხმარებლები (Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- კომპანიები
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- სპეციალისტები
CREATE TABLE specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  bio TEXT,
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- პრაქტიკის სფეროები
CREATE TABLE practice_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  locale TEXT DEFAULT 'ka'
);

-- სერვისები
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  practice_area_id UUID REFERENCES practice_areas(id)
);

-- ბლოგის პოსტები
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  author_id UUID REFERENCES profiles(id),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- კატეგორიები
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  locale TEXT DEFAULT 'ka'
);

-- მოთხოვნები
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- მაგალითი: მომხმარებელს ხედავს მხოლოდ საკუთარ პროფილს
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- მაგალითი: პუბლიკურ პოსტებს ყველა ხედავს
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
USING (published = true);

-- მაგალითი: მხოლოდ ავტორს შეუძლია პოსტის რედაქტირება
CREATE POLICY "Authors can edit own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

-- მაგალითი: მხოლოდ ადმინს შეუძლია წაშლა
CREATE POLICY "Only admins can delete"
ON posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### Supabase Client Setup

**Browser Client:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Server Client:**
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

**გამოყენების მაგალითი:**
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function PostsPage() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return <div>{/* render posts */}</div>
}
```

---

## 🔐 Authentication - Supabase Auth

### Providers:
- **Email/Password** - bcrypt hashing
- **Google OAuth** - Social login
- **Magic Links** - Passwordless auth

### ფუნქციონალი:
- Session management
- JWT tokens
- Role-based access control
- Password reset
- Email verification

**Auth მაგალითი:**
```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      full_name: 'John Doe',
    }
  }
})

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
})

// Sign Out
await supabase.auth.signOut()

// Get Session
const { data: { session } } = await supabase.auth.getSession()
```

---

## 🎨 Real-time Subscriptions

```typescript
// Real-time listening
const channel = supabase
  .channel('posts-changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('New post created!', payload.new)
    }
  )
  .subscribe()

// Cleanup
channel.unsubscribe()
```

---

## 📦 Storage - Supabase Storage

```typescript
// ფაილის ატვირთვა
const { data, error } = await supabase.storage
  .from('images')
  .upload('public/avatar.png', file)

// ფაილის ჩამოტვირთვა (URL)
const { data } = supabase.storage
  .from('images')
  .getPublicUrl('public/avatar.png')

console.log(data.publicUrl)
```

---

## 🛠️ დამატებითი ბიბლიოთეკები

### TypeScript 5.x
- სრული type safety
- Strict mode
- Path aliases

### date-fns
- თარიღების ფორმატირება
- Date calculations

### clsx + tailwind-merge
```typescript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 📊 package.json

```json
{
  "dependencies": {
    "next": "^15.5.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.10",
    "@supabase/ssr": "^0.5.2",
    "tailwindcss": "^3.4.18",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-toast": "^1.2.4",
    "lucide-react": "^0.468.0",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "class-variance-authority": "^0.7.1",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.3",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.6",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.18.0",
    "eslint-config-next": "^15.5.3",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "postcss": "^8.5.1",
    "autoprefixer": "^10.4.20"
  }
}
```

---

## ✅ მთავარი უპირატესობები

### Supabase-ის უპირატესობები:
1. **No Backend Code** - API automatically generated
2. **Real-time out of the box** - WebSocket subscriptions
3. **Built-in Auth** - Email, OAuth, Magic Links
4. **Row Level Security** - Database-level security
5. **Free tier** - Generous limits (500MB database, 1GB file storage)
6. **PostgreSQL** - Powerful relational database
7. **Edge Functions** - Serverless Deno functions
8. **Storage CDN** - Global file distribution

### Next.js + Supabase სინერგია:
1. Server Components-დან პირდაპირი Supabase queries
2. Automatic caching და revalidation
3. Server Actions Supabase mutations-ისთვის
4. Edge-ready (Vercel Edge + Supabase)
5. TypeScript end-to-end

### Performance:
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- Incremental Static Regeneration (ISR)
- Edge Caching
- Image Optimization
- Code Splitting
- Real-time updates

---

## 🚀 Deployment

### Vercel (რეკომენდებული)
- Next.js native platform
- Automatic deployments
- Edge functions
- Environment variables

### Supabase Cloud
- Managed PostgreSQL
- Global CDN
- Automatic backups
- 99.9% uptime SLA

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

*პროექტი აშენებულია **Supabase + Next.js + Tailwind CSS** - სამ მძლავრ, თანამედროვე ტექნოლოგიაზე.*
