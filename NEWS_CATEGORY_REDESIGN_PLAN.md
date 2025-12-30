# News Page Category Organization Redesign

## 📋 Overview

**პრობლემა:** "უკატეგორიო" აჩვენებს კატეგორიის სახელის ნაცვლად, რადგან:
- `categoryMap` მხოლოდ ROOT კატეგორიებს ტვირთავს (parent_id = null)
- პოსტები მინიჭებულია სუბკატეგორიებზე, არა ROOT-ებზე
- 27 სუბკატეგორია → ძალიან ბევრი სექცია horizontal scroll-ით

**გადაწყვეტა:** Smart Tabs + Parent Grouping სტრატეგია

---

## 🗂️ მონაცემთა სტრუქტურა

### კატეგორიების იერარქია (5 ROOT + 27 SUB)

```
📂 ადვოკატთა ასოციაცია (ROOT)
   ├── ადვოკატთა ასოციაცია
   └── ...

📂 სოციალური საკითხები (ROOT)
   ├── განათლება
   ├── ჯანმრთელობა
   ├── შრომა
   └── ...

📂 ლეგალ სენდბოქს ჯორჯია (ROOT)
   └── ...

📂 ჩვენი საქმეები (ROOT)
   └── ...

📂 სამართალი (ROOT)
   ├── ბიზნეს სამართალი
   ├── სისხლის სამართალი
   ├── კონსტიტუციური სამართალი
   ├── ადმინისტრაციული სამართალი
   └── ...
```

---

## 🎯 სტრატეგია: "Smart Tabs + Parent Grouping"

### მთავარი პრინციპები:

1. **Category Tabs** - 5 ROOT კატეგორია ზედა ნავიგაციაში
2. **Parent Grouping** - პოსტები დაჯგუფებულია ROOT-ის მიხედვით
3. **Subcategory Badges** - პოსტზე სუბკატეგორიის badge
4. **Mobile-First** - ჰორიზონტალური scroll tabs + cards

---

## 📱 UI/UX დიზაინი

### Mobile Layout (< 768px)

```
┌─────────────────────────────────────┐
│ [ყველა] [სამართ.] [სოციალ.] → scroll│  ← Category Tabs (horizontal scroll)
├─────────────────────────────────────┤
│ 📰 სამართალი (12 პოსტი)            │  ← Section Header
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│ │Card│ │Card│ │Card│ │Card│ →     │  ← Horizontal scroll cards
│ │[ბიზ]│ │[სის]│ │[კონ]│ │[ადმ]│       │  ← Subcategory badges
│ └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│ 📰 სოციალური საკითხები (8 პოსტი)   │
│ ┌────┐ ┌────┐ ┌────┐              │
│ │Card│ │Card│ │Card│ →            │
│ │[განა]│ │[ჯანმ]│ │[შრომ]│            │
│ └────┘ └────┘ └────┘              │
└─────────────────────────────────────┘
```

### Desktop Layout (≥ 768px)

```
┌──────────────────────────────────────────────────────────────┐
│  [ყველა]  [სამართალი]  [სოციალური]  [ასოციაცია]  [ლეგალ]   │  ← Fixed Tabs
├──────────────────────────────────────────────────────────────┤
│ 📰 სამართალი                                    [ნახე ყველა →]│
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │ Card │ │ Card │ │ Card │ │ Card │ │ Card │               │
│ │[ბიზნ]│ │[სისხ]│ │[კონს]│ │[ადმი]│ │[სამო]│               │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
├──────────────────────────────────────────────────────────────┤
│ 📰 სოციალური საკითხები                          [ნახე ყველა →]│
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │ Card │ │ Card │ │ Card │ │ Card │                        │
│ │[განათ]│ │[ჯანმრ]│ │[შრომა]│ │[...] │                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan

### Phase 1: Fix Category Loading

**File:** `src/app/[locale]/news/page.tsx`

**ცვლილება:**
```typescript
// BEFORE: მხოლოდ ROOT კატეგორიები
const categoriesResult = await supabase
  .from('post_categories')
  .select('id, slug, post_category_translations!inner(language, name)')
  .is('parent_id', null)  // ← პრობლემა!
  
// AFTER: ყველა კატეგორია (root + sub)
const categoriesResult = await supabase
  .from('post_categories')
  .select('id, slug, parent_id, post_category_translations!inner(language, name)')
  // parent_id ფილტრი წაშლილია
```

---

### Phase 2: Create CategoryTabs Component

**New File:** `src/components/news/CategoryTabs.tsx`

**Features:**
- ჰორიზონტალური scroll მობილურზე
- Fixed tabs დესკტოპზე
- Active state animation
- Touch-friendly (44px min height)
- Snap scrolling

**Props:**
```typescript
interface CategoryTabsProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    postCount: number;
  }>;
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  isDark: boolean;
  locale: string;
}
```

**Styling (consistent with existing design):**
```css
/* Tab Container */
flex overflow-x-auto snap-x snap-mandatory scrollbar-thin
md:overflow-visible md:justify-center
gap-2 md:gap-3
pb-2 md:pb-0

/* Tab Button */
flex-shrink-0 snap-start
px-4 py-2 md:px-5 md:py-2.5
rounded-full
text-sm font-medium
transition-all duration-200
active:scale-[0.98]

/* Active State */
bg-red-600 text-white

/* Inactive State (dark) */
bg-white/10 text-white/70 hover:bg-white/20

/* Inactive State (light) */
bg-black/5 text-black/70 hover:bg-black/10
```

---

### Phase 3: Refactor AllPostsSection

**File:** `src/components/news/AllPostsSection.tsx`

**ცვლილებები:**

1. **Props Update:**
```typescript
interface AllPostsSectionProps {
  posts: Post[];
  categoryMap: Map<string, {
    name: string;
    slug: string;
    parentId: string | null;  // ← NEW
  }>;
  rootCategories: Array<{     // ← NEW
    id: string;
    name: string;
    slug: string;
  }>;
  locale: string;
  totalPosts: number;
  isDark: boolean;
}
```

2. **Grouping Logic Update:**
```typescript
// BEFORE: Group by category_id directly
const grouped = posts.reduce((acc, post) => {
  const catId = post.category_id;
  // ...
}, {});

// AFTER: Group by ROOT category (via parent_id)
const grouped = posts.reduce((acc, post) => {
  const category = categoryMap.get(post.category_id);
  const rootId = category?.parentId || post.category_id; // Use parent if exists
  // ...
}, {});
```

3. **Add Subcategory Badge to Cards:**
```typescript
// In card component, show subcategory name
{category?.name && (
  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-red-600 text-white">
    {category.name}
  </span>
)}
```

4. **Add CategoryTabs Integration:**
```typescript
const [activeRootCategory, setActiveRootCategory] = useState<string | null>(null);

// Filter sections based on active tab
const visibleSections = activeRootCategory 
  ? groupedPosts.filter(g => g.rootId === activeRootCategory)
  : groupedPosts;
```

---

### Phase 4: Add Translations

**File:** `src/translations/news.ts`

**New Keys:**
```typescript
// Category Tabs
allCategories: 'ყველა კატეგორია',
categoryPosts: 'პოსტი', // for count badge

// Section Headers  
viewAllInCategory: 'ნახე ყველა',
postsInCategory: 'პოსტი ამ კატეგორიაში',

// Empty States
noCategoryPosts: 'ამ კატეგორიაში პოსტები არ არის',
```

---

## 📁 Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/[locale]/news/page.tsx` | MODIFY | Load all categories, pass rootCategories |
| `src/components/news/AllPostsSection.tsx` | MODIFY | Add tabs, refactor grouping |
| `src/components/news/CategoryTabs.tsx` | CREATE | New tab navigation component |
| `src/translations/news.ts` | MODIFY | Add new translation keys |

---

## ✅ Acceptance Criteria

1. ✅ კატეგორიის სახელი აჩვენებს სწორად (არა "უკატეგორიო")
2. ✅ 5 ROOT კატეგორია tabs-ში
3. ✅ პოსტები დაჯგუფებულია ROOT-ის მიხედვით
4. ✅ სუბკატეგორიის badge თითოეულ პოსტზე
5. ✅ Mobile: ჰორიზონტალური scroll tabs და cards
6. ✅ Desktop: Fixed tabs, grid cards
7. ✅ Consistent დიზაინი არსებულ კომპონენტებთან
8. ✅ Dark/Light mode support
9. ✅ Touch-friendly (44px targets)
10. ✅ კატეგორიის გვერდზე (/news/category/[slug]) მუშაობს

---

## 🚀 Implementation Order

1. **Phase 1:** Fix category loading in page.tsx
2. **Phase 2:** Create CategoryTabs component  
3. **Phase 3:** Update AllPostsSection
4. **Phase 4:** Add translations
5. **Phase 5:** Test & verify

---

## 📝 Notes

- არსებული NewsFilter კომპონენტი რჩება სუბკატეგორიების ფილტრისთვის
- Position 1-9 კომპონენტები უცვლელია
- SEO: კატეგორიის გვერდები (/news/category/[slug]) უცვლელია
- ISR revalidation period უცვლელია (3600 წამი)
