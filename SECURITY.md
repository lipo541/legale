# 🔐 უსაფრთხოების ინსტრუქციები

## ⚠️ კრიტიკული წესები

### 1. **არასოდეს** commit-ში არ ჩადო:
- ❌ API Keys
- ❌ Database Passwords
- ❌ Environment Variables
- ❌ Private Keys
- ❌ OAuth Secrets
- ❌ JWT Secrets

---

## 📁 Environment Variables (.env.local)

### რატომ .env.local?

Next.js იყენებს რამდენიმე env ფაილს:
- `.env` - ყველა environment-ისთვის (commit-ში)
- `.env.local` - ლოკალური განვითარებისთვის (**არ commit-დება**)
- `.env.production` - production-ისთვის
- `.env.development` - development-ისთვის

**მთავარი წესი:** საიდუმლო keys **მხოლოდ** `.env.local`-ში!

---

## 🛠️ სწორი სეთაპი

### ნაბიჯი 1: შექმენი `.env.local` ფაილი

```bash
# Project root-ში:
New-Item .env.local -ItemType File
```

### ნაბიჯი 2: დაამატე Supabase Keys

```env
# .env.local

# ========================================
# SUPABASE CONFIGURATION
# ========================================
# Project URL - Public (შეიძლება გაზიარება)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Anon Key - Public (შეიძლება frontend-ში)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key - PRIVATE (არასოდეს frontend-ში!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Password - PRIVATE
DATABASE_PASSWORD=your-super-secure-password

# ========================================
# APPLICATION CONFIGURATION
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ========================================
# OAUTH PROVIDERS (როცა დაგჭირდება)
# ========================================
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ========================================
# EMAIL CONFIGURATION (მომავალში)
# ========================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# ========================================
# OTHER SECRETS
# ========================================
# JWT Secret (თუ custom JWT-ს იყენებ)
# JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# NextAuth Secret (თუ NextAuth-ს დაამატებ)
# NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
# NEXTAUTH_URL=http://localhost:3000
```

### ნაბიჯი 3: დაამატე `.gitignore`-ში

**.gitignore** ფაილში უკვე უნდა იყოს:

```gitignore
# Environment Variables
.env
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Supabase
.supabase

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Testing
coverage/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local files
*.local
*.log
```

---

## 🔑 როგორ მივიღოთ Supabase Keys

### 1. Project URL

```
Supabase Dashboard → Settings → API → Project URL
```

**მაგალითი:** `https://abcdefghijklmnop.supabase.co`

### 2. Anon/Public Key

```
Supabase Dashboard → Settings → API → Project API keys → anon public
```

**რა არის:** JWT token რომელიც Row Level Security-ს იყენებს.

**უსაფრთხოა თუ არა frontend-ში?** ✅ **დიახ!** RLS იცავს მონაცემებს.

### 3. Service Role Key

```
Supabase Dashboard → Settings → API → Project API keys → service_role secret
```

⚠️ **ყურადღება:** ეს key **bypasses** RLS-ს!

**გამოყენება:**
- ✅ Server-side code-ში
- ✅ Admin operations-ისთვის
- ❌ **არასოდეს** client-side code-ში
- ❌ **არასოდეს** commit-ში

---

## 🔐 Database Password

### როდის გჭირდება:

1. **Direct PostgreSQL Connection** (optional)
   ```typescript
   // Server-side only
   import postgres from 'postgres'
   
   const sql = postgres(process.env.DATABASE_URL!)
   ```

2. **Database Migrations** (Drizzle, Prisma)

3. **Backup/Restore operations**

### როგორ ვნახოთ:

```
Supabase Dashboard → Settings → Database → Connection string
```

**მაგალითი:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefgh.supabase.co:5432/postgres
```

---

## 🚀 Production Environment Variables

### Vercel Deployment

1. **გადადი:** Vercel Dashboard → Project → Settings → Environment Variables

2. **დაამატე ყველა variable:**

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... (თუ გჭირდება)
NEXT_PUBLIC_APP_URL = https://yourdomain.com
```

3. **Select Environment:**
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)

---

## 🔒 უსაფრთხოების Best Practices

### 1. პაროლის გენერაცია

**სუსტი პაროლი:**
```
❌ password123
❌ myproject2024
❌ admin123456
```

**ძლიერი პაროლი:**
```
✅ K8#mP2$vN9@xQ5&rL7!wT3
✅ გამოიყენე Password Manager (1Password, Bitwarden)
✅ მინიმუმ 32 სიმბოლო
✅ შერეული: A-Z, a-z, 0-9, !@#$%^&*
```

**Generator:**
```powershell
# PowerShell-ში
Add-Type -AssemblyName System.Web
[System.Web.Security.Membership]::GeneratePassword(32, 10)
```

### 2. Git-ში შემოწმება

**დარწმუნდი რომ `.env.local` არ არის tracked:**

```powershell
# შეამოწმე
git status

# თუ ჩანს .env.local:
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
```

### 3. `.env.example` ფაილის შექმნა

**შექმენი `.env.example`** (ეს commit-ში ჩაიდება):

```env
# .env.example
# Copy this to .env.local and fill with your values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🛡️ Supabase RLS (Row Level Security)

### რატომ უსაფრთხოა ANON Key Frontend-ში?

1. **RLS Policies** იცავს მონაცემებს database დონეზე
2. Anon Key-ით **მხოლოდ** authorized operations
3. JWT token ვერიფიცირდება server-ზე

### მაგალითი:

```sql
-- მომხმარებელს ხედავს მხოლოდ საკუთარ profile-ს
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

**რა მოხდება თუ:**
- ✅ Authenticated user თავის profile-ს ხედავს
- ❌ Authenticated user სხვის profile-ს არ ხედავს
- ❌ Unauthenticated user არაფერს არ ხედავს

---

## 🔐 Service Role Key გამოყენება

### ⚠️ მხოლოდ Server-Side!

```typescript
// ❌ WRONG - Client Component
'use client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ❌ ეს გამჟღავნდება!
)
```

```typescript
// ✅ CORRECT - Server Component
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ უსაფრთხო
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Admin operations
  const { data } = await supabase
    .from('users')
    .select('*') // RLS bypassed
  
  return Response.json(data)
}
```

---

## 📋 Checklist

### Setup Phase:
- [ ] `.env.local` შექმნილი
- [ ] `.gitignore` განახლებული
- [ ] `.env.example` შექმნილი (template)
- [ ] Supabase Keys დაკოპირებული
- [ ] Git status შემოწმებული (არ ჩანს .env.local)

### Development Phase:
- [ ] ANON Key მხოლოდ client-side
- [ ] SERVICE_ROLE Key მხოლოდ server-side
- [ ] არ არის hardcoded secrets
- [ ] Environment variables სწორად იყენებს

### Production Phase:
- [ ] Vercel Environment Variables დაყენებული
- [ ] Production URLs სწორია
- [ ] RLS Policies ტესტირებული
- [ ] Security audit გავლილი

---

## 🚨 თუ გაჟონა Secret

### 1. დაუყოვნებლივ:

**Supabase Dashboard:**
```
Settings → API → Reset Keys → Generate New Keys
```

**ან:**
```
Settings → Database → Reset Database Password
```

### 2. განაახლე ყველა environment:
- Local (.env.local)
- Vercel (Environment Variables)
- CI/CD (GitHub Secrets)

### 3. Rotate All Keys:
- Database Password
- Service Role Key
- OAuth Secrets

### 4. Git History Cleanup (თუ commit-ში ჩავარდა):

```powershell
# ⚠️ ეს გარდავა git history-ს
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (საფრთხელია!)
git push origin --force --all
```

**უმჯობესია:** უბრალოდ rotate keys და არ იდარდო history-ზე.

---

## 🔗 დამატებითი რესურსები

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

---

## ✅ კარგი პრაქტიკა

```typescript
// ✅ Environment variable validation
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// ✅ Type-safe environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string
      NEXT_PUBLIC_APP_URL: string
    }
  }
}
```

---

*უსაფრთხოება პირველ ადგილზეა! 🔐*
