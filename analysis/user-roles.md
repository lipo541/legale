# 👥 მომხმარებლის როლები და უფლებები (Supabase Auth + RLS)

## როლების სისტემა

პროექტში გამოყენებულია **5 ძირითადი როლი**, რომლებიც მართულია Supabase Authentication-ითა და Row Level Security (RLS) policies-ით.

---

## 🎭 როლების მიმოხილვა

| როლი | აღწერა | წვდომის დონე |
|------|--------|--------------|
| **user** | ჩვეულებრივი მომხმარებელი | შეზღუდული |
| **author** | კონტენტის შემქმნელი | პოსტების მართვა |
| **specialist** | იურიდიული სპეციალისტი | პროფილის და სერვისების მართვა |
| **company** | კომპანიის წარმომადგენელი | კომპანიის სრული მართვა |
| **admin** | ადმინისტრატორი | სრული წვდომა |

---

## 1️⃣ USER (ჩვეულებრივი მომხმარებელი)

### როლის მიზანი:
საჯარო კონტენტის ნახვა და სერვისების მოთხოვნა.

### უფლებები:

#### ✅ რას შეუძლია:
- **პროფილი:**
  - საკუთარი პროფილის ნახვა და რედაქტირება
  - ავატარის ატვირთვა
  
- **კონტენტის ნახვა:**
  - გამოქვეყნებული პოსტების წაკითხვა
  - სერვისების ნახვა
  - კომპანიების და სპეციალისტების ნახვა
  - პრაქტიკის სფეროების მიმოხილვა
  
- **მოთხოვნები:**
  - სერვისის მოთხოვნის შექმნა
  - საკუთარი მოთხოვნების ნახვა
  - მოთხოვნების სტატუსის თვალყურის დევნება

#### ❌ რას არ შეუძლია:
- პოსტების შექმნა/რედაქტირება
- სერვისების დამატება
- სხვა მომხმარებლების მონაცემების ნახვა
- ადმინ პანელზე წვდომა

### RLS Policy მაგალითი:

```sql
-- User can view own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- User can update own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- User can create requests
CREATE POLICY "Users can create requests"
ON requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can view own requests
CREATE POLICY "Users can view own requests"
ON requests FOR SELECT
USING (auth.uid() = user_id);
```

---

## 2️⃣ AUTHOR (კონტენტის შემქმნელი)

### როლის მიზანი:
ბლოგის პოსტების შექმნა და მართვა.

### უფლებები:

#### ✅ რას შეუძლია:
- **User-ის ყველა უფლება** +
- **პოსტების მართვა:**
  - საკუთარი პოსტების შექმნა
  - საკუთარი პოსტების რედაქტირება
  - საკუთარი პოსტების წაშლა
  - დრაფტების შენახვა
  - პოსტების გამოქვეყნება
  - კატეგორიების მინიჭება
  - გამოსახულებების ატვირთვა (Supabase Storage)
  
- **მედია:**
  - სურათების ატვირთვა
  - მედია ბიბლიოთეკის ნახვა

#### ❌ რას არ შეუძლია:
- სხვა ავტორების პოსტების რედაქტირება
- სერვისების დამატება
- კომპანიების/სპეციალისტების მართვა
- ადმინ ფუნქციები

### RLS Policy მაგალითი:

```sql
-- Authors can create posts
CREATE POLICY "Authors can create posts"
ON posts FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('author', 'admin')
  )
);

-- Authors can edit own posts
CREATE POLICY "Authors can edit own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete own posts
CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = author_id);

-- Anyone can view published posts
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
USING (published = true OR auth.uid() = author_id);
```

---

## 3️⃣ SPECIALIST (იურიდიული სპეციალისტი)

### როლის მიზანი:
პროფესიონალური სერვისების გაწევა და კონსულტაციები.

### უფლებები:

#### ✅ რას შეუძლია:
- **User + Author-ის ყველა უფლება** +
- **სპეციალისტის პროფილი:**
  - დეტალური პროფილის შექმნა/რედაქტირება
  - ბიოგრაფიის დამატება
  - სერტიფიკატების ატვირთვა
  - გამოცდილების მითითება
  - ხელმისაწვდომობის სტატუსის განახლება
  
- **სერვისები:**
  - საკუთარი სერვისების დამატება
  - სერვისების რედაქტირება
  - ფასების განსაზღვრა
  - პრაქტიკის სფეროების არჩევა
  
- **მოთხოვნები:**
  - მიღებული მოთხოვნების ნახვა
  - მოთხოვნებზე პასუხი
  - სტატუსის განახლება (pending → in_progress → completed)

#### ❌ რას არ შეუძლია:
- სხვა სპეციალისტების პროფილების რედაქტირება
- კომპანიის მართვა
- სისტემის კონფიგურაცია
- ყველა მოთხოვნის ნახვა

### RLS Policy მაგალითი:

```sql
-- Specialist can manage own profile
CREATE POLICY "Specialists can manage own profile"
ON specialists FOR ALL
USING (auth.uid() = user_id);

-- Specialist can manage own services
CREATE POLICY "Specialists can manage own services"
ON services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = services.specialist_id
    AND specialists.user_id = auth.uid()
  )
);

-- Specialist can view assigned requests
CREATE POLICY "Specialists can view assigned requests"
ON requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = requests.specialist_id
    AND specialists.user_id = auth.uid()
  )
);

-- Specialist can update assigned requests
CREATE POLICY "Specialists can update assigned requests"
ON requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM specialists
    WHERE specialists.id = requests.specialist_id
    AND specialists.user_id = auth.uid()
  )
);
```

---

## 4️⃣ COMPANY (კომპანიის წარმომადგენელი)

### როლის მიზანი:
იურიდიული კომპანიის სრული მართვა.

### უფლებები:

#### ✅ რას შეუძლია:
- **User + Author + Specialist-ის ყველა უფლება** +
- **კომპანიის მართვა:**
  - კომპანიის პროფილის შექმნა/რედაქტირება
  - ლოგოს ატვირთვა
  - კონტაქტური ინფორმაციის განახლება
  - აღწერისა და დეტალების დამატება
  
- **სპეციალისტების მართვა:**
  - სპეციალისტების დამატება კომპანიაში
  - სპეციალისტების მართვა
  - როლების მინიჭება
  
- **სერვისების მართვა:**
  - კომპანიის სერვისების დამატება
  - ფასების განსაზღვრა
  - სერვისების აქტივაცია/დეაქტივაცია
  
- **მოთხოვნები:**
  - კომპანიაზე მოსული ყველა მოთხოვნის ნახვა
  - მოთხოვნების განაწილება სპეციალისტებზე
  - სტატისტიკის ნახვა

#### ❌ რას არ შეუძლია:
- სხვა კომპანიების მართვა
- სისტემის კონფიგურაცია
- ყველა მონაცემის წვდომა
- ადმინ ფუნქციები

### RLS Policy მაგალითი:

```sql
-- Company can manage own company
CREATE POLICY "Company owners can manage own company"
ON companies FOR ALL
USING (auth.uid() = user_id);

-- Company can manage own services
CREATE POLICY "Company owners can manage own services"
ON services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = services.company_id
    AND companies.user_id = auth.uid()
  )
);

-- Company can view own specialists
CREATE POLICY "Company can view own specialists"
ON specialists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = specialists.company_id
    AND companies.user_id = auth.uid()
  )
);

-- Company can view own requests
CREATE POLICY "Company can view own requests"
ON requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM services
    JOIN companies ON companies.id = services.company_id
    WHERE services.id = requests.service_id
    AND companies.user_id = auth.uid()
  )
);
```

---

## 5️⃣ ADMIN (ადმინისტრატორი)

### როლის მიზანი:
სისტემის სრული ადმინისტრირება და კონტროლი.

### უფლებები:

#### ✅ რას შეუძლია (ყველაფერი):
- **User + Author + Specialist + Company-ის ყველა უფლება** +
- **მომხმარებლების მართვა:**
  - ყველა მომხმარებლის ნახვა
  - როლების მინიჭება/შეცვლა
  - მომხმარებლების დაბლოკვა/გააქტიურება
  - პროფილების რედაქტირება
  
- **კონტენტის მართვა:**
  - ყველა პოსტის რედაქტირება/წაშლა
  - კატეგორიების CRUD
  - მედია ბიბლიოთეკის სრული წვდომა
  - პრაქტიკის სფეროების მართვა
  
- **კომპანიები და სპეციალისტები:**
  - ყველა კომპანიის მართვა
  - კომპანიების გადამოწმება (verification)
  - სპეციალისტების გადამოწმება
  - სტატუსების განახლება
  
- **სერვისები:**
  - ყველა სერვისის ნახვა/რედაქტირება
  - ფასების კონტროლი
  - აქტივაცია/დეაქტივაცია
  
- **მოთხოვნები:**
  - ყველა მოთხოვნის ნახვა
  - პრიორიტეტების მინიჭება
  - სტატუსების განახლება
  - სპეციალისტებზე განაწილება
  
- **სისტემის კონფიგურაცია:**
  - Database-ის პირდაპირი წვდომა
  - Settings და Configuration
  - Logs და Analytics
  - Backups და Exports

#### ❌ შეზღუდვები:
არ არის (Super Admin)

### RLS Policy მაგალითი:

```sql
-- Admins can do everything
CREATE POLICY "Admins have full access to profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins have full access to posts"
ON posts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins have full access to companies"
ON companies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- და ა.შ. ყველა ტაბელისთვის...
```

---

## 🔐 როლების მართვა Supabase-ში

### 1. როლის მინიჭება რეგისტრაციისას

```typescript
// Sign Up with role
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'user', // default role
    }
  }
})

// შემდეგ profiles ტაბელში ჩაიწერება
```

### 2. როლის შეცვლა (ადმინის მიერ)

```typescript
// Server Action
'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()
  
  // Check if current user is admin
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()
  
  if (currentUser?.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  
  // Update role
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  
  if (error) throw error
}
```

### 3. როლის შემოწმება Client-ზე

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  
  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setRole(profile?.role || 'user')
      }
    }
    
    getRole()
  }, [])
  
  return role
}

// Usage
function AdminPanel() {
  const role = useUserRole()
  
  if (role !== 'admin') {
    return <div>Access Denied</div>
  }
  
  return <div>Admin Panel</div>
}
```

### 4. როლის შემოწმება Server-ზე

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/')
  }
  
  return <div>Admin Content</div>
}
```

---

## 🎯 უფლებების მატრიცა

| ფუნქცია | user | author | specialist | company | admin |
|---------|------|--------|------------|---------|-------|
| საკუთარი პროფილის ნახვა | ✅ | ✅ | ✅ | ✅ | ✅ |
| საკუთარი პროფილის რედაქტირება | ✅ | ✅ | ✅ | ✅ | ✅ |
| სხვის პროფილის რედაქტირება | ❌ | ❌ | ❌ | ❌ | ✅ |
| პოსტის შექმნა | ❌ | ✅ | ✅ | ✅ | ✅ |
| საკუთარი პოსტის რედაქტირება | ❌ | ✅ | ✅ | ✅ | ✅ |
| სხვის პოსტის რედაქტირება | ❌ | ❌ | ❌ | ❌ | ✅ |
| სერვისის დამატება | ❌ | ❌ | ✅ | ✅ | ✅ |
| კომპანიის შექმნა | ❌ | ❌ | ❌ | ✅ | ✅ |
| კომპანიის მართვა | ❌ | ❌ | ❌ | ✅ (own) | ✅ (all) |
| მოთხოვნის შექმნა | ✅ | ✅ | ✅ | ✅ | ✅ |
| მოთხოვნაზე პასუხი | ❌ | ❌ | ✅ | ✅ | ✅ |
| ყველა მოთხოვნის ნახვა | ❌ | ❌ | ❌ | ❌ | ✅ |
| როლების მინიჭება | ❌ | ❌ | ❌ | ❌ | ✅ |
| Database წვდომა | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 როლის აპგრეიდის პროცესი

### User → Author

```typescript
// მომხმარებელი აგზავნის მოთხოვნას
async function requestAuthorRole() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  await supabase
    .from('role_requests')
    .insert({
      user_id: user!.id,
      requested_role: 'author',
      reason: 'I want to write blog posts',
      status: 'pending'
    })
}

// ადმინი ამტკიცებს
async function approveRoleRequest(requestId: string) {
  // ... admin check
  
  const { data: request } = await supabase
    .from('role_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  
  await supabase
    .from('profiles')
    .update({ role: request.requested_role })
    .eq('id', request.user_id)
  
  await supabase
    .from('role_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)
}
```

---

*როლების სისტემა მართულია Supabase Authentication და Row Level Security-ით, რაც უზრუნველყოფს მაღალი უსაფრთხოების დონეს.*
