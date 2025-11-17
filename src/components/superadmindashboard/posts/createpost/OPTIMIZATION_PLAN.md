# 🎨 Posts CreatePost ფოლდერის სრული ოპტიმიზაციის პლანი

> **მიზანი:** აბსოლუტური კონტროლი ვიზუალზე და ფუნქციონალზე  
> **სტილი:** Ultra-compact, Professional, Responsive  
> **პერფორმანსი:** Maximum optimization, Zero lag

---

## 📁 ფაილების სტრუქტურა

```
createpost/
├── 📄 CreatePostPage.tsx      → Main Container & State Management
├── 📝 ContentTab.tsx          → Editor, Images, Translations
├── 🎯 SeoTab.tsx              → Meta Tags, Keywords, OG
├── 📱 SocialTab.tsx           → Social Media Settings
└── 🏷️ CategoryAdd.tsx        → Category Modal
```

---

## 🎯 ნაბიჯი 1: CreatePostPage.tsx - მთავარი კონტეინერი

### 📊 **მიმდინარე მდგომარეობის ანალიზი**

**რა შევამოწმო:**
- [ ] State management არქიტექტურა
- [ ] Form handling logic
- [ ] Tab navigation structure
- [ ] API calls & error handling
- [ ] Loading states
- [ ] TypeScript type definitions
- [ ] Component lifecycle optimization

### 🔧 **დაგეგმილი ოპტიმიზაციები**

#### **1. VISUAL CONTROL - ვიზუალური კონტროლი**

**Layout & Spacing:**
```
✅ Header Section:
   - Ultra-compact title (text-lg/xl)
   - Breadcrumb navigation
   - Action buttons (Save, Cancel, Delete)
   - Status indicator badge

✅ Tab Navigation:
   - Compact tabs (10px-12px text)
   - Active state indicators
   - Smooth transitions
   - Mobile responsive collapse

✅ Content Area:
   - Optimal padding (12px-16px)
   - Responsive grid system
   - Scroll optimization
   - Min-height controls

✅ Footer Section:
   - Sticky bottom bar
   - Save/Cancel buttons
   - Validation indicators
   - Progress feedback
```

**Color System:**
```
✅ Dark/Light theme sync
✅ Consistent border colors (10% opacity)
✅ Status colors (draft/published/archived)
✅ Focus states (ring-2 blue-500)
✅ Hover states (bg-5% opacity)
✅ Error states (red-500 variants)
✅ Success feedback (green-500 variants)
```

**Typography:**
```
✅ Headings: 14px-20px (font-semibold/bold)
✅ Body text: 12px (regular)
✅ Labels: 10px (uppercase, tracking-wide)
✅ Inputs: 12px (medium)
✅ Buttons: 11px-12px (medium)
✅ Monospace: font-mono for slugs/IDs
```

**Spacing System:**
```
✅ Micro: 2px-4px (between related items)
✅ Small: 8px-12px (form fields)
✅ Medium: 16px-24px (sections)
✅ Large: 32px-48px (major divisions)
```

#### **2. FUNCTIONAL CONTROL - ფუნქციონალური კონტროლი**

**State Management:**
```typescript
✅ Centralized form state (useState/useReducer)
✅ Validation state tracking
✅ Loading state per action
✅ Error state per field
✅ Dirty state tracking (unsaved changes)
✅ Draft auto-save state
```

**Form Validation:**
```typescript
✅ Real-time field validation
✅ Submit validation
✅ Cross-field validation (slug uniqueness)
✅ Translation completeness check
✅ Image requirement validation
✅ Category requirement validation
✅ Custom validation rules per field
```

**API Integration:**
```typescript
✅ Optimistic updates
✅ Error retry mechanism
✅ Request cancellation
✅ Debounced auto-save
✅ Image upload progress
✅ Batch operations
✅ Transaction rollback on error
```

**Performance:**
```typescript
✅ React.memo for tabs
✅ useMemo for computed values
✅ useCallback for event handlers
✅ Lazy loading for editor
✅ Image optimization
✅ Debounced search/validation (300ms)
✅ Virtual scrolling for long lists
```

#### **3. USER EXPERIENCE CONTROL**

**Feedback Systems:**
```
✅ Toast notifications (success/error/info)
✅ Inline field errors
✅ Loading spinners/skeletons
✅ Progress bars for uploads
✅ Confirmation modals
✅ Keyboard shortcuts (Ctrl+S save, Esc cancel)
✅ Unsaved changes warning
```

**Accessibility:**
```
✅ ARIA labels on all inputs
✅ Focus management
✅ Keyboard navigation (Tab, Enter, Esc)
✅ Screen reader support
✅ Color contrast WCAG AA
✅ Error announcements
```

**Mobile Optimization:**
```
✅ Touch-friendly targets (44px min)
✅ Responsive tab layout
✅ Mobile-optimized modals
✅ Swipe gestures for tabs
✅ Viewport meta optimization
```

### 📋 **კონკრეტული სამუშაო სია**

#### **Phase A: Structure Cleanup**
```
1. ✅ TypeScript strict interfaces
2. ✅ Separate types file (types.ts)
3. ✅ Extract constants (constants.ts)
4. ✅ Component file structure:
   - Imports
   - Types/Interfaces
   - Constants
   - Main Component
   - Helper functions
   - Exports
```

#### **Phase B: State Optimization**
```
1. ✅ Implement useReducer for complex state
2. ✅ Create custom hooks:
   - usePostForm()
   - useAutoSave()
   - useValidation()
   - useImageUpload()
3. ✅ State persistence (localStorage)
4. ✅ State cleanup on unmount
```

#### **Phase C: Visual Polish**
```
1. ✅ Implement design tokens
2. ✅ Consistent spacing classes
3. ✅ Smooth transitions (150ms-300ms)
4. ✅ Loading skeletons
5. ✅ Empty states
6. ✅ Error boundaries
```

#### **Phase D: Functional Enhancement**
```
1. ✅ Validation engine
2. ✅ Error handling system
3. ✅ Auto-save mechanism
4. ✅ Keyboard shortcuts
5. ✅ Undo/Redo functionality
6. ✅ Draft recovery
```

---

## 🎯 ნაბიჯი 2: ContentTab.tsx - კონტენტის მართვა

### 🔧 **ვიზუალური და ფუნქციონალური სპეციფიკაციები**

#### **VISUAL CONTROL:**

**Editor Layout:**
```
✅ TipTap editor full control:
   - Custom toolbar (compact, sticky)
   - Character counter (real-time)
   - Word counter
   - Reading time estimator
   - Full-screen mode toggle
   - Distraction-free mode

✅ Translation tabs:
   - 🇬🇪 Georgian (default)
   - 🇬🇧 English
   - 🇷🇺 Russian
   - Flag icons + language names
   - Completion indicators (%)

✅ Image upload zone:
   - Drag & drop area (dashed border)
   - Preview thumbnail (aspect ratio preserved)
   - Progress bar
   - File size indicator
   - Crop/Edit button
   - Remove button
```

**Form Fields:**
```
✅ Title Input:
   - Max length: 100 chars
   - Character counter
   - Auto-generate slug toggle
   - Validation indicator

✅ Slug Input:
   - Auto-generate from title
   - Manual override
   - Uniqueness check (debounced)
   - Format validation (lowercase, hyphens)
   - Preview URL display

✅ Excerpt Textarea:
   - Max length: 300 chars
   - Character counter
   - Auto-resize
   - Line counter

✅ Category Select:
   - Searchable dropdown
   - Multi-language display
   - "Add new" quick action
   - Required field indicator

✅ Content Editor:
   - Rich text formatting
   - Code blocks with syntax highlight
   - Table support
   - Link insertion
   - Image insertion
   - Video embed
   - List formatting
   - Heading levels (H2-H6)
```

#### **FUNCTIONAL CONTROL:**

```typescript
✅ Image Upload System:
   - File type validation (jpg, png, webp)
   - Size limit: 5MB
   - Auto-compression
   - Thumbnail generation
   - Focal point selector integration
   - CDN upload with progress
   - Error handling & retry

✅ Slug Generation:
   - Transliteration (Georgian → Latin)
   - Special character removal
   - Whitespace → hyphen
   - Duplicate number append
   - Database uniqueness check

✅ Translation Sync:
   - Copy structure between languages
   - Track translation status
   - Missing translation warnings
   - Auto-translate button (optional)

✅ Content Validation:
   - Minimum word count
   - Required fields check
   - Image presence check
   - Link validation
   - HTML sanitization
```

---

## 🎯 ნაბიჯი 3: SeoTab.tsx - SEO ოპტიმიზაცია

### 🔧 **აბსოლუტური SEO კონტროლი**

#### **VISUAL:**

```
✅ Meta Title:
   - Input field (60 chars max)
   - Character counter with color coding:
     * Green: 50-60 chars (optimal)
     * Yellow: 40-50 or 60-70 chars (acceptable)
     * Red: <40 or >70 chars (poor)
   - Google SERP preview (live)

✅ Meta Description:
   - Textarea (155-160 chars optimal)
   - Character counter
   - Google SERP preview (live)
   - Keyword highlighting

✅ Keywords:
   - Tag input (comma separated)
   - Max 10 keywords
   - Duplicate detection
   - Relevance score (optional)

✅ OG Image:
   - Preview card (Facebook style)
   - Dimensions: 1200x630px
   - File size indicator
   - Upload/Replace button

✅ OG Tags:
   - og:title (different from meta title)
   - og:description
   - og:image
   - og:type
   - Live preview card
```

#### **FUNCTIONAL:**

```typescript
✅ Auto-fill Intelligence:
   - Meta title from post title
   - Meta description from excerpt
   - Keywords from content analysis
   - OG tags from meta tags

✅ SEO Score Calculator:
   - Title length check
   - Description length check
   - Keyword presence
   - Image optimization
   - Readability score
   - Overall SEO score (0-100)

✅ Preview Simulators:
   - Google SERP preview
   - Facebook share preview
   - Twitter card preview
   - LinkedIn preview

✅ Validation Rules:
   - Required meta title
   - Required meta description
   - Image requirements
   - Character limit enforcement
```

---

## 🎯 ნაბიჯი 4: SocialTab.tsx - Social Media

### 🔧 **სოციალური მედიის სრული კონტროლი**

#### **VISUAL:**

```
✅ Platform Previews:
   - Facebook card preview
   - Twitter card preview
   - LinkedIn preview
   - WhatsApp preview
   - Live rendering

✅ Hashtag Manager:
   - Tag input with autocomplete
   - Popular hashtags suggestions
   - Character counter per platform:
     * Twitter: 280 chars
     * Instagram: 2200 chars
     * LinkedIn: 3000 chars
   - Hashtag validation (#format)

✅ Social Images:
   - Platform-specific dimensions
   - Multiple aspect ratios:
     * Square: 1:1 (Instagram)
     * Landscape: 16:9 (Facebook)
     * Portrait: 4:5 (Instagram)
   - Crop tool per platform

✅ Posting Schedule:
   - Date/time picker
   - Timezone selector
   - Best time suggestions
   - Schedule preview
```

#### **FUNCTIONAL:**

```typescript
✅ Hashtag Intelligence:
   - Trending hashtags API
   - Relevance scoring
   - Duplicate detection
   - Platform-specific limits
   - Auto-categorization

✅ Social Validation:
   - Character limits per platform
   - Image dimension checks
   - Hashtag format validation
   - Mention format (@username)
   - Link shortening integration

✅ Analytics Preview:
   - Estimated reach
   - Best posting times
   - Engagement predictions
   - Hashtag performance data
```

---

## 🎯 ნაბიჯი 5: CategoryAdd.tsx - კატეგორიის მართვა

### 🔧 **კატეგორიის სრული კონტროლი**

#### **VISUAL:**

```
✅ Modal Design:
   - Centered modal (max-w-lg)
   - Smooth fade-in animation
   - Backdrop blur
   - Close button (X)
   - ESC key support

✅ Form Layout:
   - 3 language tabs (🇬🇪 🇬🇧 🇷🇺)
   - Name input per language
   - Slug input (auto-generated)
   - Description textarea (optional)
   - Icon/Color picker (optional)
   - Save/Cancel buttons

✅ Feedback:
   - Loading spinner on save
   - Success toast
   - Error messages inline
   - Duplicate warning
```

#### **FUNCTIONAL:**

```typescript
✅ Validation:
   - Required: Georgian name
   - Optional: English, Russian
   - Unique slug check
   - Format validation
   - Duplicate name detection

✅ Auto-generation:
   - Slug from Georgian name
   - Transliteration logic
   - Icon assignment (optional)
   - Color assignment (random)

✅ Integration:
   - Instant add to parent form
   - Real-time category list update
   - No page refresh needed
   - Success callback
```

---

## 📊 ოპტიმიზაციის მეტრიკები (გაზომვადი შედეგები)

### **Performance Targets:**
```
✅ First Contentful Paint: <1s
✅ Time to Interactive: <2s
✅ Bundle Size: <200KB (minified + gzipped)
✅ API Response: <300ms average
✅ Image Upload: <5s for 5MB file
✅ Auto-save Debounce: 3s after last keystroke
✅ Form Validation: <100ms per field
✅ Tab Switch: <50ms (instant feel)
```

### **Code Quality Metrics:**
```
✅ TypeScript Coverage: 100%
✅ ESLint Errors: 0
✅ Component Lines: <500 per file
✅ Function Lines: <50 per function
✅ Cyclomatic Complexity: <10
✅ Test Coverage: >80%
```

### **UX Metrics:**
```
✅ Click to Action: <200ms feedback
✅ Error to Fix: Clear path in <5s
✅ Form Completion: <5min average
✅ Mobile Usability: 100% score
✅ Accessibility: WCAG AA compliant
```

---

## 🛠️ ტექნიკური სტეკი და ინსტრუმენტები

### **Core:**
```typescript
✅ Next.js 15+ (App Router)
✅ React 18+ (Server & Client Components)
✅ TypeScript 5+ (Strict mode)
✅ Tailwind CSS 4+ (Custom config)
```

### **Form & Validation:**
```typescript
✅ React Hook Form (form state)
✅ Zod (schema validation)
✅ TipTap (rich text editor)
✅ React Dropzone (file upload)
```

### **UI Components:**
```typescript
✅ Radix UI (headless components)
✅ Lucide React (icons)
✅ Framer Motion (animations)
✅ Sonner (toast notifications)
```

### **Utilities:**
```typescript
✅ clsx + tailwind-merge (classnames)
✅ date-fns (date formatting)
✅ slugify (slug generation)
✅ sharp (image processing)
```

---

## ⚠️ სტრიქონი წესები და შეზღუდვები

### **🚫 რასაც არ შევეხებით:**
```
❌ Supabase database schema changes
❌ Backend API endpoints modification
❌ Authentication/Authorization logic
❌ Routing structure
❌ Global styles breakage
❌ Existing functionality removal
```

### **✅ რასაც დავიცავთ:**
```
✅ Backward compatibility
✅ Existing data structures
✅ API contract consistency
✅ Theme system compatibility
✅ Mobile responsiveness
✅ Accessibility standards
✅ Performance benchmarks
```

### **🔥 CRITICAL: ფუნქციონალობის შენარჩუნება და გაუმჯობესება**

#### **არსებული ფუნქციები რომლებიც 100% უნდა იმუშაოს:**
```typescript
✅ Post Creation (Draft/Published/Archived)
   - ყველა ველის შენახვა
   - Translation support (ka/en/ru)
   - Featured image upload
   - Category assignment
   - Display position management
   - Position order setting

✅ Post Editing
   - არსებული პოსტის ჩატვირთვა
   - ყველა ველის რედაქტირება
   - სურათის შეცვლა/წაშლა
   - Real-time updates
   - Draft auto-save

✅ Image Upload System
   - Supabase storage integration
   - File validation (type, size)
   - Progress tracking
   - Error handling
   - Focal point selector integration
   - Image URL generation

✅ Category Management
   - კატეგორიების ჩატვირთვა
   - ახალი კატეგორიის დამატება (modal)
   - Multi-language support
   - Category selection

✅ Slug Generation
   - Auto-generation from title
   - Manual override capability
   - Uniqueness validation
   - Format sanitization (lowercase, hyphens)

✅ SEO Fields
   - Meta title/description
   - Keywords
   - OG tags (title, description, image)
   - Schema markup preparation

✅ Form Validation
   - Required fields check
   - Field-specific validation
   - Cross-field validation
   - Submit validation

✅ Status Management
   - Draft/Published/Archived switching
   - Status-based UI changes
   - Confirmation dialogs

✅ Navigation
   - Tab switching (Content/SEO/Social)
   - Breadcrumb navigation
   - Cancel/Back functionality
   - Unsaved changes warning

✅ Theme Integration
   - Dark/Light mode support
   - Dynamic theme switching
   - Color consistency
```

#### **გასაუმჯობესებელი ფუნქციები (არსებულის გაძლიერება):**
```typescript
🔥 Enhanced Validation
   ❌ ძველი: მხოლოდ submit-ზე validation
   ✅ ახალი: Real-time field validation + submit validation
   
🔥 Better Error Handling
   ❌ ძველი: console.error + generic alert
   ✅ ახალი: Toast notifications + inline errors + retry options
   
🔥 Improved Loading States
   ❌ ძველი: "იტვირთება..." text
   ✅ ახალი: Skeleton loaders + progress indicators + optimistic UI
   
🔥 Enhanced Image Upload
   ❌ ძველი: Basic upload + wait
   ✅ ახალი: Progress bar + preview + compression + error recovery
   
🔥 Auto-save Functionality
   ❌ ძველი: არ არის
   ✅ ახალი: Debounced auto-save to localStorage/drafts
   
🔥 Keyboard Shortcuts
   ❌ ძველი: არ არის
   ✅ ახალი: Ctrl+S (save), Esc (cancel), etc.
   
🔥 Form Recovery
   ❌ ძველი: Data loss on crash
   ✅ ახალი: Draft recovery from localStorage
   
🔥 Better UX Feedback
   ❌ ძველი: Silent operations
   ✅ ახალი: Toast notifications + status indicators + confirmations
   
🔥 Accessibility
   ❌ ძველი: Basic HTML
   ✅ ახალი: Full ARIA labels + keyboard navigation + screen reader
   
🔥 Mobile Optimization
   ❌ ძველი: Desktop-first
   ✅ ახალი: Mobile-first responsive + touch-friendly
   
🔥 Performance
   ❌ ძველი: Re-renders on every change
   ✅ ახალი: React.memo + useMemo + debouncing + lazy loading
```

#### **ტესტირების გეგმა თითოეული ფუნქციისთვის:**
```typescript
📋 Before Optimization:
   1. დავადოკუმენტო ყველა არსებული ფუნქციის ქცევა
   2. შევქმნა test cases list
   3. ვიდეო ჩაწერა ძველი ქცევისა (reference)

📋 During Optimization:
   1. ვინარჩუნებ API calls სტრუქტურას
   2. ვინარჩუნებ data flow-ს
   3. ვამატებ comments არსებული ლოგიკისთვის
   4. ვითვალისწინებ edge cases

📋 After Optimization:
   1. ვტესტავ ყველა create scenario-ს
   2. ვტესტავ ყველა edit scenario-ს
   3. ვტესტავ error cases
   4. ვტესტავ mobile/desktop
   5. ვტესტავ dark/light theme
   6. ვადარებ ძველ და ახალ ქცევას
```

#### **Rollback გეგმა:**
```typescript
🔄 თუ რაიმე გატყდა:
   1. კოდი git branch-ში იქნება
   2. ყოველი ცვლილება დოკუმენტირებული
   3. Original file backup შენახული
   4. Step-by-step rollback გეგმა მზადაა
   5. თითოეული step დამოუკიდებლად testable
```

### **🎯 Approval Checkpoints:**
```
📋 Checkpoint 1: ფაილის ანალიზის შემდეგ
   → ვაჩვენებ არსებულ ფუნქციების სრულ სიას
   → ვაჩვენებ რას ვაპირებ შევცვალო
   → **მოლოდინი დადასტურებისა**

📋 Checkpoint 2: კოდის წერამდე
   → ვაჩვენებ კონკრეტულ ცვლილებებს (diff preview)
   → ვახსენებ რომელი ფუნქციები იცვლება
   → **მოლოდინი დადასტურებისა**

📋 Checkpoint 3: იმპლემენტაციის შემდეგ
   → ვთხოვ ტესტირებას
   → ვაჩვენებ რა იმუშავა
   → **მოლოდინი დადასტურებისა**

📋 Checkpoint 4: მომდევნო step-მდე
   → ვადასტურებ რომ ყველაფერი მუშაობს
   → ვახსენებ რა მოდის შემდეგ
   → **მოლოდინი დადასტურებისა**
```

### **💡 ფუნქციონალობის გარანტია:**
```
✅ არსებული API calls → არ შეიცვლება
✅ Supabase integration → იგივე დარჩება
✅ Data structure → თავსებადი იქნება
✅ Props interface → backward compatible
✅ Event handlers → იგივე სახელები
✅ State management → გაუმჯობესებული მაგრამ თავსებადი
✅ Side effects → დაცული და optimized

❌ არაფერი გატყდება
❌ არაფერი წაიშლება
❌ არაფერი შეუთავსებელი არ იქნება
```

---

## 📝 Progress Tracking System

| Step | File | Status | Visual | Functional | Testing | Done % |
|------|------|--------|--------|------------|---------|--------|
| 1 | CreatePostPage.tsx | ⏸️ Pending | ⬜ | ⬜ | ⬜ | 0% |
| 2 | ContentTab.tsx | ⏸️ Pending | ⬜ | ⬜ | ⬜ | 0% |
| 3 | SeoTab.tsx | ⏸️ Pending | ⬜ | ⬜ | ⬜ | 0% |
| 4 | SocialTab.tsx | ⏸️ Pending | ⬜ | ⬜ | ⬜ | 0% |
| 5 | CategoryAdd.tsx | ⏸️ Pending | ⬜ | ⬜ | ⬜ | 0% |

**Legend:** ⬜ Not Started | 🟨 In Progress | ✅ Completed

---

## 🚀 შემდეგი მოქმედება

**სტატუსი:** 📋 დეტალური პლანი მზადაა  
**მოლოდინის რეჟიმი:** დადასტურება ნაბიჯი 1-ის დასაწყებად

### **რას ველოდებით:**
1. ✅ CreatePostPage.tsx ფაილის წაკითხვა
2. ✅ დეტალური ანალიზის წარდგენა
3. ⏸️ **თქვენი დადასტურება** → "დაიწყე ოპტიმიზაცია"
4. ⏸️ ცვლილებების განხორციელება
5. ⏸️ Review და Testing
6. ⏸️ მომდევნო ნაბიჯზე გადასვლა

---

**💎 აბსოლუტური კონტროლი = Perfect Code + Perfect Design + Perfect UX**

---

## 📊 ოპტიმიზაციის პრინციპები

### **1. Performance:**
- React.memo for expensive renders
- useMemo/useCallback for heavy computations
- Lazy loading for heavy components
- Debounce for search/validation

### **2. TypeScript:**
- Strict type definitions
- Proper interfaces
- Type safety for all props & state
- Generic types where needed

### **3. UI/UX:**
- Super compact design (10px-12px fonts)
- Loading states everywhere
- Error boundaries
- Success feedback
- Smooth animations

### **4. Code Quality:**
- Clean code principles
- Single responsibility
- DRY (Don't Repeat Yourself)
- Meaningful variable names
- Proper comments

### **5. Accessibility:**
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

---

## ⚠️ წესები ოპტიმიზაციისას

1. **არ წავშალო არსებული ფუნქციონალი** - მხოლოდ გავაუმჯობესო
2. **არ შევცვალო Supabase schema** - მხოლოდ frontend ოპტიმიზაცია
3. **შევინახო თავსებადობა** - არსებულ PostsPage.tsx-თან
4. **ყოველი ცვლილება დავადასტურო** - მომხმარებელთან
5. **ნაბიჯ-ნაბიჯ** - ერთი ფაილი ერთ დროს

---

## 📝 Progress Tracker

| ნაბიჯი | ფაილი | სტატუსი | დასრულების % |
|--------|-------|---------|---------------|
| 1 | CreatePostPage.tsx | ⏸️ მოლოდინში | 0% |
| 2 | ContentTab.tsx | ⏸️ მოლოდინში | 0% |
| 3 | SeoTab.tsx | ⏸️ მოლოდინში | 0% |
| 4 | SocialTab.tsx | ⏸️ მოლოდინში | 0% |
| 5 | CategoryAdd.tsx | ⏸️ მოლოდინში | 0% |

---

## 🚀 შემდეგი ნაბიჯი

**ახლა მზად ვარ დავიწყო ნაბიჯი 1: CreatePostPage.tsx**

1. ✅ ფაილის წაკითხვა
2. ✅ პრობლემების იდენტიფიცირება
3. ✅ დეტალური ოპტიმიზაციის პლანის წარდგენა
4. ⏸️ **მოლოდინი დადასტურებისთვის**
5. ⏸️ ოპტიმიზაციის განხორციელება
6. ⏸️ ტესტირება და დადასტურება

---

**სტატუსი:** 📋 დოკუმენტი შექმნილია, მოლოდინის რეჟიმში დეტალური ანალიზისთვის
