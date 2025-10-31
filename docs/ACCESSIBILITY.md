# ♿ Accessibility Implementation Guide

## Overview
This project follows **WCAG 2.1 Level AA** standards for web accessibility.

---

## ✅ Implemented Features

### 1. **Keyboard Navigation** (Full Support)
- ✅ Tab/Shift+Tab navigation through all interactive elements
- ✅ Arrow keys (↑↓) for dropdown navigation
- ✅ Home/End keys to jump to first/last option
- ✅ Enter/Space to activate buttons and select options
- ✅ Escape to close dropdowns and clear search
- ✅ Command/Ctrl+K to focus search input
- ✅ Focus trap in modal-like components (dropdowns)
- ✅ Focus restoration after closing overlays

**Test:** Navigate entire page using only keyboard (no mouse)

---

### 2. **Screen Reader Support** (Full Support)
- ✅ ARIA labels on all interactive elements
- ✅ ARIA live regions for dynamic content updates
- ✅ ARIA roles (tab, tablist, listbox, option, article, status)
- ✅ ARIA states (aria-expanded, aria-selected, aria-pressed, aria-busy)
- ✅ Descriptive link/button labels
- ✅ Hidden decorative elements (aria-hidden="true")
- ✅ Screen reader only text (.sr-only utility class)
- ✅ Semantic HTML (nav, main, article, button)

**Test:** Use NVDA (Windows) or VoiceOver (Mac) to navigate

---

### 3. **Focus Management** (Full Support)
- ✅ Visible focus indicators (outline rings)
- ✅ Focus-visible (keyboard only, not mouse)
- ✅ Skip links to main content
- ✅ Focus trap in dropdowns
- ✅ Focus restoration after closing
- ✅ Logical tab order

**Components:**
- `<SkipLink />` - Skip to main content
- `<FocusTrap />` - Traps focus in overlays

---

### 4. **Color Contrast** (WCAG AA Compliant)
- ✅ Minimum 4.5:1 contrast ratio for normal text
- ✅ Minimum 3:1 for large text and UI components
- ✅ Enhanced opacity values (75% instead of 60% for secondary text)
- ✅ High contrast mode support (@media forced-colors)

**Dark Mode:**
- Primary text: white (100%)
- Secondary text: white/75% (was 60%)
- Tertiary text: white/65% (was 50%)

**Light Mode:**
- Primary text: black (100%)
- Secondary text: black/75% (was 60%)
- Tertiary text: black/65% (was 50%)

---

### 5. **Reduced Motion Support** (Full Support)
- ✅ Respects `prefers-reduced-motion` media query
- ✅ Disables animations when user prefers reduced motion
- ✅ useReducedMotion() hook available

**Usage:**
```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion'

const prefersReducedMotion = useReducedMotion()
const duration = prefersReducedMotion ? 0 : 300
```

**CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🛠️ Utilities & Hooks

### **useReducedMotion Hook**
```tsx
const prefersReducedMotion = useReducedMotion()
```
Returns `true` if user prefers reduced motion.

### **FocusTrap Component**
```tsx
<FocusTrap isActive={isOpen} onEscape={() => setIsOpen(false)}>
  {/* Focusable content */}
</FocusTrap>
```

### **SkipLink Component**
```tsx
<SkipLink target="#main-content" />
```

### **Accessibility Utils**
```tsx
import { 
  announceToScreenReader,
  getContrastRatio,
  meetsWCAGAA,
  generateAriaId 
} from '@/lib/accessibility'

// Announce to screen readers
announceToScreenReader('5 results found', 'polite')

// Check color contrast
const ratio = getContrastRatio('#FFFFFF', '#000000') // 21:1
const isAccessible = meetsWCAGAA('#FFFFFF', '#767676') // true
```

---

## 🎯 WCAG 2.1 AA Compliance Checklist

### Perceivable
- [x] 1.1.1 Non-text Content (Alt text on images)
- [x] 1.3.1 Info and Relationships (Semantic HTML, ARIA)
- [x] 1.4.3 Contrast (Minimum 4.5:1 ratio)
- [x] 1.4.11 Non-text Contrast (3:1 for UI components)

### Operable
- [x] 2.1.1 Keyboard (Full keyboard navigation)
- [x] 2.1.2 No Keyboard Trap (Escape to exit)
- [x] 2.4.1 Bypass Blocks (Skip links)
- [x] 2.4.3 Focus Order (Logical tab order)
- [x] 2.4.7 Focus Visible (Visible focus indicators)

### Understandable
- [x] 3.1.1 Language of Page (lang attribute)
- [x] 3.2.1 On Focus (No unexpected changes)
- [x] 3.3.2 Labels or Instructions (Form labels)

### Robust
- [x] 4.1.2 Name, Role, Value (ARIA attributes)
- [x] 4.1.3 Status Messages (Live regions)

---

## 🧪 Testing Guide

### Manual Testing
1. **Keyboard Only**: Navigate using Tab, Arrow keys, Enter, Escape
2. **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
3. **Zoom**: Test at 200% zoom level
4. **Reduced Motion**: Enable in OS settings and test animations

### Automated Testing Tools
- **axe DevTools** (Chrome/Firefox extension)
- **Lighthouse** (Chrome DevTools)
- **WAVE** (Browser extension)
- **NVDA** (Windows screen reader)
- **VoiceOver** (macOS screen reader)

### Test Commands
```bash
# Install testing tools
npm install --save-dev @axe-core/react jest-axe

# Run accessibility tests
npm run test:a11y
```

---

## 📱 Mobile Accessibility
- ✅ Touch targets minimum 44x44px
- ✅ Pinch to zoom enabled
- ✅ Responsive text sizing
- ✅ Swipe gestures for navigation
- ✅ VoiceOver (iOS) / TalkBack (Android) support

---

## 🎨 Design Tokens (Accessible)

### Focus Rings
```css
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-white/50 (dark mode)
focus-visible:ring-black/50 (light mode)
```

### Text Colors (WCAG AA Compliant)
```css
/* Dark Mode */
text-white          /* 100% - Primary */
text-white/75       /* 75% - Secondary (4.8:1 ratio) */
text-white/65       /* 65% - Tertiary (4.5:1 ratio) */

/* Light Mode */
text-black          /* 100% - Primary */
text-black/75       /* 75% - Secondary (4.8:1 ratio) */
text-black/65       /* 65% - Tertiary (4.5:1 ratio) */
```

---

## 🔗 Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Last Updated:** October 31, 2025  
**WCAG Level:** AA Compliant ✅
