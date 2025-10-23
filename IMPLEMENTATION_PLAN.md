# 📋 იმპლემენტაციის დეტალური გეგმა (Supabase + Next.js + Tailwind)

## 🎯 მიზანი
იურიდიული სერვისების პლატფორმის აშენება ნულიდან production-ready დონემდე.

---

## 🚀 Phase 1: საწყისი სეთაპი (დღე 1-2)

### ✅ 1.1 Supabase პროექტის შექმნა
**ხანგრძლივობა:** 30 წუთი

**ნაბიჯები:**
1. გადადი [supabase.com](https://supabase.com)
2. შექმენი ახალი Organization
3. შექმენი ახალი Project
   - სახელი: `legalge-prod` (ან თქვენი სახელი)
   - Database Password: **შეინახე უსაფრთხო ადგილას**
   - Region: Europe (Frankfurt) - ყველაზე ახლოს საქართველოსთან
4. დაელოდე project-ის provisioning-ს (2-3 წუთი)

**შედეგი:**
- ✅ Supabase Dashboard ხელმისაწვდომია
- ✅ Database მზადაა
- ✅ API URL და Keys მიღებული

---

### ✅ 1.2 Next.js პროექტის ინიციალიზაცია
**ხანგრძლივობა:** 15 წუთი

**ბრძანებები:**
```powershell
# 1. შექმენი Next.js project
npx create-next-app@latest legaleoffical

# კითხვებზე პასუხები:
# ✓ TypeScript? → Yes
# ✓ ESLint? → Yes
# ✓ Tailwind CSS? → Yes
# ✓ src/ directory? → Yes
# ✓ App Router? → Yes
# ✓ Import alias? → Yes (@/*)

# 2. შედი project folder-ში
cd legaleoffical

# 3. დააინსტალირე Supabase packages
npm install @supabase/supabase-js @supabase/ssr

# 4. დააინსტალირე დამატებითი packages
npm install zod react-hook-form @hookform/resolvers
npm install clsx tailwind-merge class-variance-authority
npm install lucide-react date-fns

# 5. დაარან development server (ტესტისთვის)
npm run dev
```

**შედეგი:**
- ✅ Next.js project მუშაობს `http://localhost:3000`
- ✅ Tailwind CSS კონფიგურირებული
- ✅ TypeScript სეთაპი მზად

---

### ✅ 1.3 Environment Variables სეთაპი
**ხანგრძლივობა:** 5 წუთი

**ნაბიჯები:**
1. შექმენი `.env.local` ფაილი project root-ში:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. გადადი Supabase Dashboard → Settings → API
3. დააკოპირე:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**შედეგი:**
- ✅ Environment variables კონფიგურირებული
- ✅ Supabase connection მზად

---

### ✅ 1.4 Supabase Clients შექმნა
**ხანგრძლივობა:** 15 წუთი

**ფაილები შესაქმნელად:**

1. **`src/lib/supabase/client.ts`** (Browser Client)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

2. **`src/lib/supabase/server.ts`** (Server Client)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component-ში set არ მუშაობს
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component-ში remove არ მუშაობს
          }
        },
      },
    }
  )
}
```

3. **`src/lib/supabase/middleware.ts`** (Auth Middleware)
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

4. **`middleware.ts`** (Root-ში)
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**შედეგი:**
- ✅ Browser Client მზად (Client Components-ისთვის)
- ✅ Server Client მზად (Server Components-ისთვის)
- ✅ Middleware მზად (Auth session-ისთვის)

---

### ✅ 1.5 Utility Functions
**ხანგრძლივობა:** 10 წუთი

**`src/lib/utils.ts`**
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale: string = 'ka'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
```

**შედეგი:**
- ✅ Utility functions მზად

---

## 🗄️ Phase 2: Database Setup (დღე 2-3)

### ✅ 2.1 Database Schema შექმნა
**ხანგრძლივობა:** 1-2 საათი

**ნაბიჯები:**
1. გადადი Supabase Dashboard → SQL Editor
2. შექმენი ახალი Query
3. დააკოპირე და გაუშვი SQL კოდი `analysis/database-schema.md`-დან

**SQL Schema (მოკლედ):**
```sql
-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
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

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- ... (ყველა ტაბელი database-schema.md-დან)
```

**თანმიმდევრობა:**
1. ✅ `profiles` - მომხმარებლები
2. ✅ `companies` - კომპანიები
3. ✅ `specialists` - სპეციალისტები
4. ✅ `practice_areas` - პრაქტიკის სფეროები
5. ✅ `services` - სერვისები
6. ✅ `posts` - პოსტები
7. ✅ `categories` - კატეგორიები
8. ✅ `post_categories` - Many-to-Many
9. ✅ `requests` - მოთხოვნები
10. ✅ `translations` - თარგმანები

**შედეგი:**
- ✅ 10 ტაბელი შექმნილი
- ✅ RLS Policies კონფიგურირებული
- ✅ Indexes დამატებული

---

### ✅ 2.2 Helper Functions და Triggers
**ხანგრძლივობა:** 30 წუთი

**SQL:**
```sql
-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (ყველა ტაბელისთვის)

-- Translation helper
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

**შედეგი:**
- ✅ Auto-update timestamps
- ✅ Translation helper function

---

### ✅ 2.3 TypeScript Types Generation
**ხანგრძლივობა:** 15 წუთი

**ნაბიჯები:**
1. დააინსტალირე Supabase CLI:
```powershell
npm install -D supabase
```

2. Generate Types:
```powershell
npx supabase gen types typescript --project-id "your-project-id" > src/lib/supabase/database.types.ts
```

3. შექმენი helper types - **`src/lib/types.ts`**:
```typescript
import { Database } from './supabase/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Specialist = Database['public']['Tables']['specialists']['Row']
export type PracticeArea = Database['public']['Tables']['practice_areas']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Request = Database['public']['Tables']['requests']['Row']
export type Translation = Database['public']['Tables']['translations']['Row']

export type UserRole = 'user' | 'author' | 'specialist' | 'company' | 'admin'
```

**შედეგი:**
- ✅ Type-safe database queries
- ✅ Auto-completion მუშაობს

---

## 🔐 Phase 3: Authentication (დღე 3-4)

### ✅ 3.1 Supabase Auth კონფიგურაცია
**ხანგრძლივობა:** 30 წუთი

**ნაბიჯები:**
1. Supabase Dashboard → Authentication → Settings
2. **Email Auth:**
   - Enable Email provider
   - Confirm email: OFF (development), ON (production)
   
3. **OAuth Providers (Google):**
   - Enable Google provider
   - გადადი [Google Cloud Console](https://console.cloud.google.com)
   - შექმენი OAuth 2.0 Client ID
   - დააკოპირე Client ID და Secret
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

4. **Email Templates:**
   - Customize confirmation email (ქართულად)
   - Customize password reset email

**შედეგი:**
- ✅ Email/Password authentication მზად
- ✅ Google OAuth კონფიგურირებული

---

### ✅ 3.2 Auth Context Provider
**ხანგრძლივობა:** 1 საათი

**`src/contexts/AuthContext.tsx`**
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**შედეგი:**
- ✅ Auth Context მზად
- ✅ useAuth hook გამოყენებისთვის

---

### ✅ 3.3 Auth Pages შექმნა
**ხანგრძლივობა:** 2 საათი

**ფაილები:**
1. `src/app/(auth)/login/page.tsx` - Login page
2. `src/app/(auth)/register/page.tsx` - Register page
3. `src/app/(auth)/layout.tsx` - Auth layout
4. `src/app/auth/callback/route.ts` - OAuth callback

**მაგალითი Login Page:**
```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        <h1 className="text-2xl font-bold">შესვლა</h1>
        
        <input
          type="email"
          placeholder="ელ.ფოსტა"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        
        <input
          type="password"
          placeholder="პაროლი"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          შესვლა
        </button>
        
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="w-full bg-white border py-2 rounded"
        >
          Google-ით შესვლა
        </button>
      </form>
    </div>
  )
}
```

**შედეგი:**
- ✅ Login page მუშაობს
- ✅ Register page მუშაობს
- ✅ Google OAuth მუშაობს

---

## 🎨 Phase 4: UI Components (Shadcn/UI) (დღე 4-5)

### ✅ 4.1 Shadcn/UI სეთაპი
**ხანგრძლივობა:** 30 წუთი

**ბრძანებები:**
```powershell
# 1. Init Shadcn
npx shadcn-ui@latest init

# კითხვებზე პასუხები:
# ✓ TypeScript? → yes
# ✓ Style? → Default
# ✓ Base color? → Slate
# ✓ CSS variables? → yes

# 2. დააინსტალირე კომპონენტები
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add form
```

**შედეგი:**
- ✅ Shadcn/UI კონფიგურირებული
- ✅ 12+ UI კომპონენტი მზად

---

### ✅ 4.2 Layout Components შექმნა
**ხანგრძლივობა:** 3 საათი

**კომპონენტები:**
1. **Header** - `src/components/header/Header.tsx`
2. **Navigation** - `src/components/navigation/Navigation.tsx`
3. **Footer** - `src/components/footer/Footer.tsx`
4. **Sidebar** - `src/components/sidebar/Sidebar.tsx`

**შედეგი:**
- ✅ Layout კომპონენტები მზად

---

## 📝 Phase 5: Core Features (დღე 5-10)

### ✅ 5.1 პრაქტიკის სფეროები (Practice Areas)
**ხანგრძლივობა:** 1 დღე

**რა უნდა გაკეთდეს:**
1. Admin page პრაქტიკის სფეროების მართვისთვის
2. Public page სფეროების ჩვენებისთვის
3. CRUD operations (Create, Read, Update, Delete)
4. Translation support (ka, en, ru)

**ფაილები:**
- `src/app/admin/practice-areas/page.tsx`
- `src/app/practice-areas/page.tsx`
- `src/app/practice-areas/[slug]/page.tsx`

---

### ✅ 5.2 კომპანიები (Companies)
**ხანგრძლივობა:** 2 დღე

**რა უნდა გაკეთდეს:**
1. კომპანიის რეგისტრაცია
2. კომპანიის პროფილის რედაქტირება
3. კომპანიების სია (public)
4. კომპანიის დეტალური გვერდი
5. Verification workflow (admin)

---

### ✅ 5.3 სპეციალისტები (Specialists)
**ხანგრძლივობა:** 2 დღე

**რა უნდა გაკეთდეს:**
1. სპეციალისტის პროფილის შექმნა
2. პროფილის რედაქტირება
3. სპეციალისტების სია (public)
4. ფილტრაცია (სფერო, გამოცდილება, ფასი)
5. Verification workflow

---

### ✅ 5.4 სერვისები (Services)
**ხანგრძლივობა:** 1.5 დღე

**რა უნდა გაკეთდეს:**
1. სერვისის დამატება (company/specialist)
2. სერვისების სია
3. სერვისის დეტალური გვერდი
4. ფასების მართვა
5. Featured services

---

### ✅ 5.5 ბლოგი (Blog/Posts)
**ხანგრძლივობა:** 2 დღე

**რა უნდა გაკეთდეს:**
1. Rich Text Editor ინტეგრაცია (Tiptap)
2. პოსტის შექმნა (Author)
3. პოსტების სია (public)
4. პოსტის დეტალური გვერდი
5. კატეგორიები
6. Featured posts
7. Search functionality

---

### ✅ 5.6 მოთხოვნები (Requests)
**ხანგრძლივობა:** 1.5 დღე

**რა უნდა გაკეთდეს:**
1. მოთხოვნის ფორმა
2. მოთხოვნების Dashboard (user)
3. მოთხოვნების მართვა (specialist/company)
4. Status tracking
5. Notifications

---

## 🔍 Phase 6: SEO Optimization (დღე 11)

### ✅ 6.1 Metadata Setup
**ხანგრძლივობა:** 2 საათი

**ყველა page-ზე:**
```typescript
import { Metadata } from 'next'

export async function generateMetadata({ params }): Promise<Metadata> {
  // Supabase-დან მონაცემების მიღება
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single()

  return {
    title: data?.title,
    description: data?.excerpt,
    openGraph: {
      title: data?.title,
      description: data?.excerpt,
      images: [data?.image_url],
    },
  }
}
```

---

### ✅ 6.2 Sitemap Generation
**ხანგრძლივობა:** 1 საათი

**`src/app/sitemap.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function sitemap() {
  const supabase = await createClient()
  
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')
    .eq('published', true)

  const postUrls = posts?.map((post) => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`,
    lastModified: post.updated_at,
  })) || []

  return [
    {
      url: process.env.NEXT_PUBLIC_APP_URL!,
      lastModified: new Date(),
    },
    ...postUrls,
  ]
}
```

---

### ✅ 6.3 Robots.txt და JSON-LD
**ხანგრძლივობა:** 1 საათი

**`src/app/robots.ts`**
```typescript
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  }
}
```

---

## 🚀 Phase 7: Testing & Optimization (დღე 12-13)

### ✅ 7.1 Testing
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)

### ✅ 7.2 Performance Optimization
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies

### ✅ 7.3 Security Audit
- RLS policies ტესტირება
- SQL injection protection
- XSS protection
- CSRF protection

---

## 🌍 Phase 8: Production Deployment (დღე 14)

### ✅ 8.1 Vercel Deployment
**ხანგრძლივობა:** 1 საათი

**ნაბიჯები:**
1. Git repository (GitHub)
2. Vercel-ზე import
3. Environment variables კონფიგურაცია
4. Domain კონფიგურაცია
5. Deploy

### ✅ 8.2 Production Supabase
**ხანგრძლივობა:** 30 წუთი

1. Database migrations გაშვება
2. RLS policies გადამოწმება
3. Backups კონფიგურაცია

---

## 📊 Timeline Summary

| Phase | დრო | აღწერა |
|-------|-----|--------|
| **Phase 1** | 1-2 დღე | საწყისი სეთაპი |
| **Phase 2** | 2-3 დღე | Database setup |
| **Phase 3** | 3-4 დღე | Authentication |
| **Phase 4** | 4-5 დღე | UI Components |
| **Phase 5** | 5-10 დღე | Core Features |
| **Phase 6** | 11 დღე | SEO |
| **Phase 7** | 12-13 დღე | Testing |
| **Phase 8** | 14 დღე | Deployment |

**სულ:** ~14 დღე full-time მუშაობა

---

## ✅ Checklist

### Week 1:
- [ ] Supabase project შექმნილი
- [ ] Next.js setup მზად
- [ ] Database schema გაშვებული
- [ ] Authentication მუშაობს
- [ ] Shadcn/UI კომპონენტები დამატებული

### Week 2:
- [ ] პრაქტიკის სფეროები
- [ ] კომპანიები
- [ ] სპეციალისტები
- [ ] სერვისები
- [ ] ბლოგი
- [ ] მოთხოვნები

### Week 3 (Optional):
- [ ] SEO optimization
- [ ] Testing
- [ ] Production deployment

---

## 🎯 პრიორიტეტები

### Must Have (MVP):
1. ✅ Authentication
2. ✅ პრაქტიკის სფეროები
3. ✅ კომპანიები
4. ✅ სერვისები
5. ✅ მოთხოვნები

### Should Have:
6. ✅ სპეციალისტები
7. ✅ ბლოგი
8. ✅ SEO

### Nice to Have:
9. Real-time notifications
10. Advanced search
11. Analytics dashboard

---

*ეს გეგმა მოქნილია და შეიძლება მორგებული იყოს თქვენი საჭიროებების მიხედვით.*
