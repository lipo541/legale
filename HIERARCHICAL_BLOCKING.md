# 🔒 Hierarchical Blocking System

## არქიტექტურა

სისტემა იყენებს იერარქიულ დაბლოკვის მოდელს, სადაც **SUPER_ADMIN**-ს უფლება აქვს გადაწეროს კომპანიის გადაწყვეტილებები.

---

## მონაცემთა ბაზის სტრუქტურა

### profiles ცხრილი - დაბლოკვის ველები

```sql
-- is_blocked: უკვე არსებული ველი (backward compatibility)
is_blocked BOOLEAN DEFAULT false

-- blocked_by: ინახავს ვინ დაბლოკა
blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL

-- blocked_at: როდის დაიბლოკა
blocked_at TIMESTAMPTZ

-- block_reason: რატომ დაიბლოკა
block_reason TEXT
```

### Migration: 025_add_blocked_by_tracking.sql

ახალი migration ამატებს:
- `blocked_by` - ვინც დაბლოკა (company_id ან super_admin_id)
- `blocked_at` - timestamp
- `block_reason` - ტექსტური მიზეზი

---

## 🔐 Blocking Logic

### 1️⃣ კომპანია ბლოკავს სპეციალისტს

**Update Query:**
```typescript
{
  is_blocked: true,
  blocked_by: company_id,  // კომპანიის ID
  blocked_at: '2024-10-26T...',
  block_reason: 'დაბლოკილია კომპანიის მიერ'
}
```

**შედეგი:**
- ✅ სპეციალისტი დაბლოკილია
- ✅ კომპანიას შეუძლია განბლოკვა
- ✅ SUPER_ADMIN-ს შეუძლია განბლოკვა

---

### 2️⃣ SUPER_ADMIN ბლოკავს სპეციალისტს

**Update Query:**
```typescript
{
  is_blocked: true,
  blocked_by: super_admin_id,  // სუპერადმინის ID
  blocked_at: '2024-10-26T...',
  block_reason: 'დაბლოკილია სუპერადმინის მიერ'
}
```

**შედეგი:**
- ✅ სპეციალისტი დაბლოკილია
- ❌ კომპანია **ვერ** განბლოკავს
- ✅ მხოლოდ SUPER_ADMIN-ს შეუძლია განბლოკვა

---

### 3️⃣ განბლოკვის ლოგიკა

#### კომპანიის განბლოკვა:

```typescript
// 1. შემოწმება: ვინ დაბლოკა?
if (specialist.blocked_by) {
  const { data: blockerData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', specialist.blocked_by)
    .single()

  // 2. თუ SUPER_ADMIN-მა დაბლოკა → უარი
  if (blockerData?.role === 'SUPER_ADMIN') {
    alert('⛔️ ამ სპეციალისტის განბლოკვა შეუძლებელია!')
    return
  }
}

// 3. განბლოკვა
{
  is_blocked: false,
  blocked_by: null,
  blocked_at: null,
  block_reason: null
}
```

#### SUPER_ADMIN-ის განბლოკვა:

```typescript
// SUPER_ADMIN-ს შეუძლია ნებისმიერი განბლოკვა
{
  is_blocked: false,
  blocked_by: null,
  blocked_at: null,
  block_reason: null
}
```

---

## 🎨 UI/UX ცვლილებები

### 1. კომპანიის დაშბორდი (ManageSpecialistsPage.tsx)

#### დაბლოკილი Badge:

**თუ კომპანიამ დაბლოკა:**
```tsx
<span className="...">
  <Lock />
  დაბლოკილია
</span>
```

**თუ SUPER_ADMIN-მა დაბლოკა:**
```tsx
<span className="..." title="დაბლოკილია სუპერადმინის მიერ - განბლოკვა შეუძლებელია">
  <Lock />
  დაბლოკილია
  <Shield />  {/* სუპერადმინის ხატულა */}
</span>
```

#### განბლოკვის ღილაკი:

- თუ კომპანიამ დაბლოკა → **ღილაკი აქტიურია** ✅
- თუ SUPER_ADMIN-მა დაბლოკა → **Alert გამოდის** ⛔️

```typescript
if (blockerData?.role === 'SUPER_ADMIN') {
  alert('⛔️ ამ სპეციალისტის განბლოკვა შეუძლებელია!\n\n' +
        'მიზეზი: სპეციალისტი დაბლოკილია სუპერადმინის მიერ.\n' +
        'მხოლოდ სუპერადმინს შეუძლია განბლოკვა.')
  return
}
```

---

### 2. სუპერადმინის დაშბორდი (SpecialistsPage.tsx)

- ✅ ნებისმიერ დაბლოკილ სპეციალისტს შეუძლია განბლოკვა
- ✅ `blocked_by` ველის დათვალიერება (ვინ დაბლოკა)
- ✅ `block_reason` ნახვა

---

## 📊 მაგალითები

### Scenario 1: კომპანია → დაბლოკვა → კომპანია → განბლოკვა ✅

1. **Company** blocks Specialist A
   ```sql
   is_blocked: true
   blocked_by: company_123
   ```

2. **Company** unblocks Specialist A
   ```sql
   is_blocked: false
   blocked_by: null
   ```

✅ **შედეგი:** წარმატებული

---

### Scenario 2: SUPER_ADMIN → დაბლოკვა → კომპანია → განბლოკვა ❌

1. **SUPER_ADMIN** blocks Specialist B
   ```sql
   is_blocked: true
   blocked_by: super_admin_456
   ```

2. **Company** tries to unblock → **BLOCKED**
   ```
   ⛔️ Alert: "ამ სპეციალისტის განბლოკვა შეუძლებელია!
              მხოლოდ სუპერადმინს შეუძლია განბლოკვა."
   ```

❌ **შედეგი:** უარყოფილია

---

### Scenario 3: კომპანია → დაბლოკვა → SUPER_ADMIN → განბლოკვა ✅

1. **Company** blocks Specialist C
   ```sql
   is_blocked: true
   blocked_by: company_123
   ```

2. **SUPER_ADMIN** unblocks Specialist C
   ```sql
   is_blocked: false
   blocked_by: null
   ```

✅ **შედეგი:** წარმატებული (SUPER_ADMIN-ს შეუძლია ყველაფერი)

---

## 🔍 როგორ მუშაობს?

```
┌─────────────────────────────────────────────┐
│         Blocking Hierarchy                   │
├─────────────────────────────────────────────┤
│                                              │
│  SUPER_ADMIN (უმაღლესი)                     │
│       │                                      │
│       ├─ შეუძლია: Block / Unblock ყველას     │
│       └─ შეუძლია: Override კომპანიის block    │
│                                              │
│  COMPANY (შუალედური)                        │
│       │                                      │
│       ├─ შეუძლია: Block თავის სპეციალისტს    │
│       ├─ შეუძლია: Unblock თუ თავმა დაბლოკა  │
│       └─ ვერ შეუძლია: Unblock თუ SUPER_ADMIN │
│                        დაბლოკა               │
│                                              │
│  SPECIALIST (ყველაზე დაბალი)                 │
│       │                                      │
│       └─ ვერაფერს                            │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🧪 ტესტირება

### Test Cases:

1. ✅ კომპანიამ დაბლოკოს თავისი სპეციალისტი
2. ✅ კომპანიამ განბლოკოს თავისი დაბლოკილი სპეციალისტი
3. ✅ SUPER_ADMIN-მა დაბლოკოს ნებისმიერი სპეციალისტი
4. ✅ SUPER_ADMIN-მა განბლოკოს ნებისმიერი დაბლოკილი სპეციალისტი
5. ❌ კომპანიამ ცადოს SUPER_ADMIN-ის მიერ დაბლოკილის განბლოკვა (უნდა უარყოს)
6. ✅ SUPER_ADMIN-მა განბლოკოს კომპანიის მიერ დაბლოკილი სპეციალისტი

---

## 🛠️ განხორციელება

### Files Changed:

1. **Migration:**
   - `025_add_blocked_by_tracking.sql`

2. **Company Dashboard:**
   - `src/components/companydashboard/specialists/ManageSpecialistsPage.tsx`

3. **Super Admin Dashboard:**
   - `src/components/superadmindashboard/specialists/SpecialistsPage.tsx`

### Key Functions:

#### ManageSpecialistsPage.tsx (Company):
```typescript
const toggleBlock = async (specialist: Specialist) => {
  // Check if blocked by SUPER_ADMIN
  if (specialist.blocked_by) {
    const { data: blockerData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', specialist.blocked_by)
      .single()

    if (blockerData?.role === 'SUPER_ADMIN') {
      alert('⛔️ განბლოკვა შეუძლებელია!')
      return
    }
  }
  
  // Proceed with block/unblock
}
```

#### SpecialistsPage.tsx (Super Admin):
```typescript
const handleToggleBlock = async (specialist: SpecialistProfile) => {
  // SUPER_ADMIN can always block/unblock
  const updateData = specialist.is_blocked
    ? { is_blocked: false, blocked_by: null, ... }
    : { is_blocked: true, blocked_by: user.id, ... }
    
  await supabase.from('profiles').update(updateData).eq('id', specialist.id)
}
```

---

## 📝 Notes

- **Backward Compatibility:** `is_blocked` ველი რჩება თავსებადობისთვის
- **Source of Truth:** `blocked_by` არის მთავარი წყარო - თუ `blocked_by IS NOT NULL` → `is_blocked = true`
- **Security:** RLS policies უზრუნველყოფს რომ მხოლოდ უფლებამოსილმა მომხმარებლებმა შეძლონ დაბლოკვა
- **Audit Trail:** `blocked_at` და `block_reason` ქმნიან აუდიტის კვალს

---

*დაბლოკვის სისტემა უზრუნველყოფს მკაფიო იერარქიას და უსაფრთხოების კონტროლს* 🔐

