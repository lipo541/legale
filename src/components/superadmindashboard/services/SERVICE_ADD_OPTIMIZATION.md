# ServiceAdd.tsx Deep Analysis & Optimization Plan (v2.0 - Advanced)

## 📊 Current State Assessment
**Score: 4/10**

The current `ServiceAdd.tsx` is functional and handles multi-language translations, image uploads, and SEO fields. However, it lacks modern patterns, has UX issues, and doesn't match the refined architecture of `CreatePostPage.tsx`.

---

## 🔍 Detailed Component Analysis

### Strengths (Why it's not a 2):
1.  ✅ **Multi-language Support:** Properly handles KA, EN, RU translations.
2.  ✅ **Tabbed Interface:** Content / SEO / Social Media tabs exist.
3.  ✅ **Image Upload:** Service image and OG image uploads work.
4.  ✅ **Edit Mode:** Properly loads existing data for editing.
5.  ✅ **Slug Generation:** Auto-generates slugs from titles with transliteration.

### Weaknesses (Why it's a 4):
1.  ❌ **No Context/State Management:** All state is local. `CreatePostPage` uses `PostTranslationsContext` for cleaner state management.
2.  ❌ **No Keyboard Shortcuts:** Missing Ctrl+S to save, Esc to cancel.
3.  ❌ **No Unsaved Changes Warning:** User can accidentally navigate away.
4.  ❌ **Browser Alerts:** Uses `alert()` instead of custom Modals.
5.  ❌ **No Loading Skeleton:** Shows raw content while fetching practices.
6.  ❌ **Inconsistent Styling:** Tab buttons have hardcoded colors (e.g., `text-white/60`) instead of using `isDark` consistently.
7.  ❌ **No Accessibility:** Missing ARIA labels, roles, and focus management.
8.  ❌ **No Memoization:** All components re-render on every state change.
9.  ❌ **Large Monolithic File:** ~600 lines in a single component.
10. ❌ **No DateTimePicker:** Unlike `CreatePostPage`, no scheduled publishing.
11. ❌ **No Status Selector:** Cannot set draft/published from this form (only on list page).

---

## 🎯 Target State (The "CreatePostPage" Standard)
**Goal Score: 9/10**

### Key Requirements:
*   **Context-Based State:** Extract translations to a dedicated `ServiceTranslationsContext`.
*   **Componentization:** Split into `ContentTab.tsx`, `SeoTab.tsx`, `SocialTab.tsx`.
*   **Keyboard Shortcuts:** Ctrl+S, Esc.
*   **Custom Modals:** Replace all `alert()` and `confirm()`.
*   **Accessibility:** Full ARIA support.
*   **Memoized UI:** `memo()` wrapped tab buttons, language selectors.
*   **Compact Design:** Smaller fonts, tighter padding (match `PostsPage` aesthetic).

---

## 🛠 Gap Analysis & Implementation Plan

### Phase 1: Architecture Refactoring
**Objective:** Match `CreatePostPage` architecture.
- [ ] **Create `ServiceTranslationsContext.tsx`:**
    - Store: `translations`, `activeLanguage`, `activeTab`, `serviceImage`, `ogImage`, `practiceId`, `status`, `saving`, `error`.
    - Actions: `setTranslation()`, `saveService()`, `uploadImage()`.
- [ ] **Split into Sub-Components:**
    - `ServiceAdd.tsx` (Main Wrapper with Provider)
    - `ServiceContentTab.tsx` (Title, Slug, Description, Image)
    - `ServiceSeoTab.tsx` (Meta Title, Meta Description, Preview)
    - `ServiceSocialTab.tsx` (OG Title, OG Description, OG Image, Hashtags, Preview)

### Phase 2: UI Standardization
**Objective:** Match `CreatePostPage` and `PostsPage` visual style.
- [ ] **Tab Navigation:**
    - Use memoized `TabButton` component.
    - Use icons from lucide-react (FileText, Search, Share2).
    - Underline style for active tab.
- [ ] **Language Selector:**
    - Use memoized `LanguageButton` component.
    - Flag emoji + label.
    - Rounded button style with `emerald` active state.
- [ ] **Input Fields:**
    - Consistent `text-xs` for labels.
    - `text-sm` for inputs.
    - Character counters for SEO fields.
- [ ] **Buttons:**
    - Primary (Save): `bg-emerald-500 text-white text-xs`
    - Secondary (Cancel): `bg-white/10 text-white text-xs` (dark) / `bg-black/10 text-black text-xs` (light)
    - Back button: Icon + text, ghost style.

### Phase 3: UX Enhancements
**Objective:** Match `CreatePostPage` user experience.
- [ ] **Keyboard Shortcuts:**
    - `Ctrl+S` / `Cmd+S` → Save.
    - `Esc` → Cancel (with confirmation if dirty).
- [ ] **Unsaved Changes Warning:**
    - `beforeunload` event listener.
    - Show Modal on navigation attempt.
- [ ] **Loading States:**
    - Skeleton loader for Practice dropdown while fetching.
    - Button loading state with `Loader2` spinner.
- [ ] **Error Handling:**
    - Replace `alert()` with custom `Modal` component.
    - Toast notifications for success messages.
- [ ] **Status Selector:**
    - Add inline status dropdown (Draft/Published) in the footer, like `CreatePostPage`.

### Phase 4: Accessibility (A11y)
**Objective:** WCAG 2.1 AA compliance.
- [ ] **ARIA Roles:**
    - `role="tablist"` for tab navigation.
    - `role="tab"` and `aria-selected` for tab buttons.
    - `role="tabpanel"` for tab content.
- [ ] **Labels:**
    - `aria-label` for all buttons.
    - `<label htmlFor>` for all inputs.
    - `aria-describedby` for helper text.
- [ ] **Focus Management:**
    - Auto-focus first input on tab change.
    - Trap focus in modals.

### Phase 5: Performance Optimization
**Objective:** Prevent unnecessary re-renders.
- [ ] **Memoization:**
    - `memo()` for `TabButton`, `LanguageButton`, `PracticeDropdownItem`.
    - `useMemo()` for computed values (readingStats, slug).
    - `useCallback()` for all event handlers.
- [ ] **Lazy Loading:**
    - Already uses `dynamic()` for `RichTextEditor`. ✓

---

## 📐 Detailed UI Changes

### Current vs. Target Comparison

| Element | Current | Target |
| :--- | :--- | :--- |
| **Header Font** | `text-xl md:text-2xl` | `text-lg` (more compact) |
| **Tab Font** | `text-xs md:text-sm` | `text-xs` |
| **Tab Style** | Colored background | Underline indicator |
| **Language Buttons** | `px-3 md:px-4 py-1.5` | `px-3 py-1.5` (consistent) |
| **Input Labels** | `text-xs` | `text-xs` ✓ |
| **Input Fields** | `text-sm` | `text-sm` ✓ |
| **Save Button** | `text-sm` | `text-xs font-semibold` |
| **Error Display** | Inline alert box | Custom Modal |

### New Components to Add

1.  **Status Footer:**
    ```tsx
    <footer className="flex gap-2 pt-4 border-t">
      <select>Draft | Published</select>
      <button>შენახვა (Ctrl+S)</button>
      <button>გაუქმება (Esc)</button>
    </footer>
    ```

2.  **Keyboard Shortcut Hints:**
    ```tsx
    <span className="text-[10px] opacity-70">(Ctrl+S)</span>
    ```

---

## ⚠️ Risk Mitigation

1.  **Data Integrity:** 
    - Must preserve all existing translation fields during refactoring.
    - Test edit mode thoroughly to ensure existing services load correctly.
2.  **Image Uploads:** 
    - Supabase storage paths must remain unchanged.
    - Preserve image preview functionality.
3.  **Practice Linking:**
    - Ensure `practice_id` selection works correctly with the new Context.

---

## 🚀 Execution Order

1.  **Create Context:** `ServiceTranslationsContext.tsx`.
2.  **Extract Tabs:** `ServiceContentTab.tsx`, `ServiceSeoTab.tsx`, `ServiceSocialTab.tsx`.
3.  **Wrap Main Component:** `ServiceAdd.tsx` with `ServiceTranslationsProvider`.
4.  **Add UX Features:** Keyboard shortcuts, unsaved changes warning.
5.  **Standardize UI:** Tab buttons, language buttons, status footer.
6.  **Add Accessibility:** ARIA attributes.
7.  **Test Thoroughly:** Create new service, edit existing service, all languages.

---

## 📝 Notes

- The current `ServiceAdd.tsx` is approximately **600 lines**. After refactoring, it should be closer to **150-200 lines** with logic extracted to Context and UI to sub-components.
- Consider whether to fully mirror `CreatePostPage` (including DateTimePicker for scheduled publishing) or keep it simpler since services might not need scheduled publishing.
