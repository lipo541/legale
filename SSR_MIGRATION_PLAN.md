# 🔄 SSR მიგრაციის სრული გეგმა

> **დოკუმენტი შექმნილია:** 2024-12-26  
> **პროექტი:** LegaleOfficial  
> **მიზანი:** Client-side გვერდების SSR-ზე გადაყვანა session პრობლემის მოსაგვარებლად

---

## 📋 სარჩევი

1. [პრობლემის აღწერა](#პრობლემის-აღწერა)
2. [Supabase კლიენტების მიმოხილვა](#supabase-კლიენტების-მიმოხილვა)
3. [ყველა Route-ის სრული სია](#ყველა-route-ის-სრული-სია)
4. [მიგრაციის რეკომენდაციები](#მიგრაციის-რეკომენდაციები)
5. [პრიორიტეტების განსაზღვრა](#პრიორიტეტების-განსაზღვრა)
6. [შესრულების ჩეკლისტი](#შესრულების-ჩეკლისტი)

---

## პრობლემის აღწერა

### სიმპტომები:
- ❌ Header-ში "Loading..." რჩება (session არ იტვირთება)
- ❌ `/companies` გვერდზე კონტენტი არ იტვირთება
- ❌ `/news` გვერდზე კონტენტი არ იტვირთება
- ✅ `/practices` გვერდი მუშაობს (SSR)
- ✅ `/specialists` გვერდი მუშაობს (SSR)

### მიზეზი:
Client-side გვერდები იყენებენ `getClientSingleton()` რომელიც დამოკიდებულია browser-ის auth session-ზე. როცა session გაწყდება ან cookies პრობლემურია, ყველა client-side query ჩერდება.

### გადაწყვეტა:
საჯარო გვერდები გადავიყვანოთ SSR-ზე `createStaticClient()`-ის გამოყენებით, რომელიც არ არის დამოკიდებული auth session-ზე.

---

## Supabase კლიენტების მიმოხილვა

| კლიენტი | ფაილი | დანიშნულება | Auth დამოკიდებულება |
|---------|-------|-------------|---------------------|
| `createStaticClient` | `src/lib/supabase/static.ts` | SSR/ISR - საჯარო read-only გვერდები | ❌ არა |
| `getClientSingleton` | `src/lib/supabase/client.ts` | Client-side - browser auth | ✅ დიახ |
| `createClient` (server) | `src/lib/supabase/server.ts` | Server Components - cookies-ით | ✅ დიახ |

---

## ყველა Route-ის სრული სია

### 📊 საჯარო გვერდები (SEO მნიშვნელოვანი)

| # | Route | ფაილი | მიმდინარე | Data Fetching | ISR | SSR საჭირო? |
|---|-------|-------|-----------|---------------|-----|-------------|
| 1 | `/{locale}` | `src/app/[locale]/page.tsx` | Hybrid | Client-side (Hero, News) | ✅ 3600s | ⚠️ ნაწილობრივ |
| 2 | `/{locale}/companies` | `src/app/[locale]/companies/page.tsx` | **Client** | `getClientSingleton` | ✅ 3600s | ✅ **დიახ** |
| 3 | `/{locale}/companies/[slug]` | `src/app/[locale]/companies/[slug]/page.tsx` | SSR | `createStaticClient` | ✅ | ❌ უკვე SSR |
| 4 | `/{locale}/specialists` | `src/app/[locale]/specialists/page.tsx` | SSR | `createStaticClient` | ✅ 3600s | ❌ უკვე SSR |
| 5 | `/{locale}/specialists/[slug]` | `src/app/[locale]/specialists/[slug]/page.tsx` | SSR | `createStaticClient` | ✅ | ❌ უკვე SSR |
| 6 | `/{locale}/news` | `src/app/[locale]/news/page.tsx` | **Client** | `useNewsPosts` hook | ✅ 3600s | ✅ **დიახ** |
| 7 | `/{locale}/news/[slug]` | `src/app/[locale]/news/[slug]/page.tsx` | SSR | `createStaticClient` | ❌ | ❌ უკვე SSR |
| 8 | `/{locale}/news/archive` | `src/app/[locale]/news/archive/page.tsx` | **Client** | API routes | ❌ | ✅ **დიახ** |
| 9 | `/{locale}/news/author/[authorId]` | `src/app/[locale]/news/author/[authorId]/page.tsx` | SSR | `createStaticClient` | ❌ | ❌ უკვე SSR |
| 10 | `/{locale}/news/category/[slug]` | `src/app/[locale]/news/category/[slug]/page.tsx` | SSR | `createStaticClient` | ❌ | ❌ უკვე SSR |
| 11 | `/{locale}/practices` | `src/app/[locale]/practices/page.tsx` | SSR | `createStaticClient` | ✅ 3600s | ❌ უკვე SSR |
| 12 | `/{locale}/practices/[practiceSlug]` | `src/app/[locale]/practices/[practiceSlug]/page.tsx` | SSR | `createStaticClient` | ✅ 3600s | ❌ უკვე SSR |
| 13 | `/{locale}/practices/[practiceSlug]/[serviceSlug]` | `src/app/[locale]/practices/[practiceSlug]/[serviceSlug]/page.tsx` | SSR | `createStaticClient` | ✅ 3600s | ❌ უკვე SSR |
| 14 | `/{locale}/teams/[slug]` | `src/app/[locale]/teams/[slug]/page.tsx` | SSR | `createStaticClient` | ✅ 3600s | ❌ უკვე SSR |
| 15 | `/{locale}/contact` | `src/app/[locale]/contact/page.tsx` | SSR | არა | ✅ | ❌ უკვე SSR |
| 16 | `/{locale}/privacy` | `src/app/[locale]/privacy/page.tsx` | SSR | არა | ✅ 3600s | ❌ უკვე SSR |
| 17 | `/{locale}/terms` | `src/app/[locale]/terms/page.tsx` | SSR | არა | ✅ 3600s | ❌ უკვე SSR |
| 18 | `/{locale}/cookies` | `src/app/[locale]/cookies/page.tsx` | SSR | არა | ❌ | ❌ უკვე SSR |

### 🔐 Auth გვერდები (SEO არ სჭირდება)

| # | Route | ფაილი | მიმდინარე | SSR საჭირო? | მიზეზი |
|---|-------|-------|-----------|-------------|--------|
| 19 | `/{locale}/login` | `src/app/[locale]/login/page.tsx` | Client | ❌ არა | ინტერაქტიული ფორმა |
| 20 | `/{locale}/register` | `src/app/[locale]/register/page.tsx` | Client | ❌ არა | ინტერაქტიული ფორმა |
| 21 | `/{locale}/complete-profile` | `src/app/[locale]/complete-profile/page.tsx` | Client | ❌ არა | Auth აუცილებელი |

### 📊 Dashboard გვერდები (Auth დაცული)

| # | Route | ფაილი | მიმდინარე | Auth Check | SSR საჭირო? | მიზეზი |
|---|-------|-------|-----------|------------|-------------|--------|
| 22 | `/{locale}/admin` | `src/app/[locale]/admin/page.tsx` | SSR | Server-side | ❌ არა | უკვე server auth |
| 23 | `/{locale}/author-dashboard` | `src/app/[locale]/author-dashboard/page.tsx` | Client | Client-side | ❌ არა | Dashboard |
| 24 | `/{locale}/moderator-dashboard` | `src/app/[locale]/moderator-dashboard/page.tsx` | Client | Client-side | ❌ არა | Dashboard |
| 25 | `/{locale}/company-dashboard` | `src/app/[locale]/company-dashboard/page.tsx` | SSR | Server-side | ❌ არა | უკვე server auth |
| 26 | `/{locale}/specialist-dashboard` | `src/app/[locale]/specialist-dashboard/page.tsx` | Client | Client-side | ❌ არა | Dashboard |
| 27 | `/{locale}/solo-specialist-dashboard` | `src/app/[locale]/solo-specialist-dashboard/page.tsx` | SSR | Server-side | ❌ არა | უკვე server auth |

### 📨 სხვა გვერდები

| # | Route | ფაილი | მიმდინარე | SSR საჭირო? | მიზეზი |
|---|-------|-------|-----------|-------------|--------|
| 28 | `/{locale}/messages` | `src/app/[locale]/messages/page.tsx` | Client | ❌ არა | Auth აუცილებელი, real-time |
| 29 | `/` | `src/app/page.tsx` | SSR | ❌ არა | მხოლოდ redirect |
| 30 | `/{locale}/[...not_found]` | `src/app/[locale]/[...not_found]/page.tsx` | SSR | ❌ არა | 404 გვერდი |

---

## მიგრაციის რეკომენდაციები

### ✅ SSR-ზე გადასაყვანი გვერდები (4 გვერდი)

| გვერდი | პრიორიტეტი | სირთულე | მიზეზი |
|--------|------------|---------|--------|
| `/{locale}/companies` | 🔴 **მაღალი** | საშუალო | მთავარი საჯარო გვერდი, SEO კრიტიკული |
| `/{locale}/news` | 🔴 **მაღალი** | საშუალო | მთავარი საჯარო გვერდი, SEO კრიტიკული |
| `/{locale}/news/archive` | 🟡 **საშუალო** | დაბალი | არქივის გვერდი |
| `/{locale}` (მთავარი) | 🟡 **საშუალო** | მაღალი | Hero და News სექციები client-side |

### ❌ Client-side დარჩენილი გვერდები (10 გვერდი)

| გვერდი | მიზეზი |
|--------|--------|
| `/login` | ინტერაქტიული auth ფორმა |
| `/register` | ინტერაქტიული auth ფორმა |
| `/complete-profile` | Auth აუცილებელი |
| `/messages` | Real-time ფუნქციონალი, Auth აუცილებელი |
| `/author-dashboard` | Dashboard - SEO არ სჭირდება |
| `/moderator-dashboard` | Dashboard - SEO არ სჭირდება |
| `/specialist-dashboard` | Dashboard - SEO არ სჭირდება |

### ✅ უკვე SSR გვერდები (16 გვერდი)

| გვერდი | სტატუსი |
|--------|---------|
| `/companies/[slug]` | ✅ მუშაობს |
| `/specialists` | ✅ მუშაობს |
| `/specialists/[slug]` | ✅ მუშაობს |
| `/practices` | ✅ მუშაობს |
| `/practices/[practiceSlug]` | ✅ მუშაობს |
| `/practices/[practiceSlug]/[serviceSlug]` | ✅ მუშაობს |
| `/news/[slug]` | ✅ მუშაობს |
| `/news/author/[authorId]` | ✅ მუშაობს |
| `/news/category/[slug]` | ✅ მუშაობს |
| `/teams/[slug]` | ✅ მუშაობს |
| `/contact` | ✅ მუშაობს |
| `/privacy` | ✅ მუშაობს |
| `/terms` | ✅ მუშაობს |
| `/cookies` | ✅ მუშაობს |
| `/admin` | ✅ მუშაობს |
| `/company-dashboard` | ✅ მუშაობს |
| `/solo-specialist-dashboard` | ✅ მუშაობს |

---

## პრიორიტეტების განსაზღვრა

### 🚨 Phase 1: საჩქარო (Production-ზე პრობლემა)

| # | გვერდი | კომპონენტი | საჭირო ცვლილება |
|---|--------|------------|------------------|
| 1 | `/companies` | `CompaniesPage.tsx` | SSR data fetch + Client component props-ით |
| 2 | `/news` | `NewsLayout.tsx` | SSR data fetch + Client component props-ით |

### 🟡 Phase 2: SEO გაუმჯობესება

| # | გვერდი | კომპონენტი | საჭირო ცვლილება |
|---|--------|------------|------------------|
| 3 | `/news/archive` | `ArchivePage.tsx` | SSR data fetch |
| 4 | `/` (მთავარი) | `HeroSection.tsx`, `NewsSection` | SSR data fetch Hero-სთვის |

### ⚪ Phase 3: არ საჭიროებს ცვლილებას

- ყველა Dashboard გვერდი
- Auth გვერდები (login, register)
- Messages გვერდი

---

## შესრულების ჩეკლისტი

### Phase 1: Companies გვერდი

- [ ] `src/app/[locale]/companies/page.tsx` - SSR data fetching დამატება
- [ ] `src/components/companies/CompaniesPage.tsx` → `CompaniesPageClient.tsx` გადარქმევა
- [ ] `initialData` prop-ის დამატება კომპონენტში
- [ ] `getClientSingleton` წაშლა კომპონენტიდან
- [ ] ტესტირება production-ზე

### Phase 1: News გვერდი

- [ ] `src/app/[locale]/news/page.tsx` - SSR data fetching დამატება
- [ ] `src/components/news/NewsLayout.tsx` → `NewsLayoutClient.tsx` გადარქმევა
- [ ] `posts` prop-ის დამატება კომპონენტში
- [ ] `useNewsPosts` hook-ის ამოშლა კომპონენტიდან
- [ ] ტესტირება production-ზე

### Phase 2: Archive გვერდი

- [ ] `src/app/[locale]/news/archive/page.tsx` - SSR data fetching
- [ ] `src/components/news/ArchivePage.tsx` - Client-side filtering only
- [ ] ტესტირება

### Phase 2: მთავარი გვერდი

- [ ] Hero სექციის SSR გადაყვანა
- [ ] News სექციის SSR გადაყვანა
- [ ] ტესტირება

---

## 📈 მოსალოდნელი შედეგი

| მეტრიკა | მიმდინარე | მოსალოდნელი |
|---------|-----------|-------------|
| Session პრობლემა საჯარო გვერდებზე | ❌ აქვს | ✅ მოგვარებული |
| SEO Indexing | ⚠️ ნაწილობრივი | ✅ სრული |
| First Contentful Paint (FCP) | ნელი | სწრაფი |
| Time to Interactive (TTI) | ნელი | სწრაფი |
| Server Load | დაბალი | საშუალო (ISR cache) |

---

## 🔗 დაკავშირებული ფაილები

- `src/lib/supabase/static.ts` - SSR კლიენტი
- `src/lib/supabase/client.ts` - Client-side კლიენტი
- `src/hooks/useNewsPosts.ts` - News hook (წასაშლელი news page-დან)

---

> **შენიშვნა:** Phase 1-ის დასრულების შემდეგ production-ზე session პრობლემა მოგვარდება საჯარო გვერდებისთვის. Header-ის auth პრობლემა ცალკე საკითხია და `AuthContext`-ის რეფაქტორინგს მოითხოვს.
