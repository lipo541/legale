# 🎨 UI დიზაინის სისტემა - LegalGE

## 🌙 დიზაინის ფილოსოფია

**LegalGE** იყენებს **მუქ, თანამედროვე, პროფესიონალურ დიზაინს** Tailwind CSS-ის საფუძველზე.

### მთავარი პრინციპები:
- 🌙 **Dark Mode First** - ძირითადად მუქი თემა
- 📱 **Mobile-First Responsive** - ყველა კომპონენტი თავსებადია mobile და desktop-ზე
- 🌐 **Multi-Language** - 3 ენა (ქართული, ინგლისური, რუსული)
- ⚡ **Performance** - მსუბუქი, სწრაფი ინტერფეისი
- ♿ **Accessibility** - ხელმისაწვდომობა ყველასთვის

---

## 1. 🎨 ფერების პალიტრა - Apple Minimal Style

### ⚫⚪ მხოლოდ თეთრი და შავი (No Colors!)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Pure Black & White Only
        background: {
          DEFAULT: '#000000',  // სუფთა შავი
          light: '#FFFFFF',    // სუფთა თეთრი
        },
        
        // Text - Always opposite of background
        foreground: {
          DEFAULT: '#FFFFFF',  // თეთრი ტექსტი (dark mode)
          light: '#000000',    // შავი ტექსტი (light mode)
        },
        
        // Borders - Subtle opacity
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',  // თეთრი 10% (dark)
          light: 'rgba(0, 0, 0, 0.1)',          // შავი 10% (light)
        },
        
        // Semantic Colors (minimal use)
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      }
    }
  }
}
```

### CSS Variables (globals.css) - Apple Style:

```css
:root {
  /* Pure Black (Default - Dark Mode) */
  --background: #000000;
  --foreground: #FFFFFF;
  --border: rgba(255, 255, 255, 0.1);
}

/* Pure White (Light Mode) */
.light {
  --background: #FFFFFF;
  --foreground: #000000;
  --border: rgba(0, 0, 0, 0.1);
}

body {
  background: var(--background);
  color: var(--foreground);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## 2. 📝 ტიპოგრაფია

### Font Stack (Georgian Support):

```typescript
// app/layout.tsx
import { Inter, Noto_Sans_Georgian } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian'],
  variable: '--font-georgian',
  display: 'swap',
});

// Usage
<body className={`${inter.variable} ${notoSansGeorgian.variable} font-sans`}>
```

### Typography Scale:

```css
/* globals.css */
.text-xs     { font-size: 0.75rem;   line-height: 1rem; }      /* 12px */
.text-sm     { font-size: 0.875rem;  line-height: 1.25rem; }   /* 14px */
.text-base   { font-size: 1rem;      line-height: 1.5rem; }    /* 16px */
.text-lg     { font-size: 1.125rem;  line-height: 1.75rem; }   /* 18px */
.text-xl     { font-size: 1.25rem;   line-height: 1.75rem; }   /* 20px */
.text-2xl    { font-size: 1.5rem;    line-height: 2rem; }      /* 24px */
.text-3xl    { font-size: 1.875rem;  line-height: 2.25rem; }   /* 30px */
.text-4xl    { font-size: 2.25rem;   line-height: 2.5rem; }    /* 36px */
.text-5xl    { font-size: 3rem;      line-height: 1; }         /* 48px */
```

---

## 3. 📱 Responsive Design (Mobile-First)

### ⚠️ **ᲛᲜᲘᲨᲕᲜᲔᲚᲝᲕᲐᲜᲘ ᲬᲔᲡᲘ:**

**ყველა კომპონენტი უნდა იყოს იდეალურად თავსებადი როგორც Mobile-ზე, ისე Desktop-ზე!**

### Breakpoints:

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',    // Mobile landscape / Small tablets
  'md': '768px',    // Tablets
  'lg': '1024px',   // Desktop / Laptops
  'xl': '1280px',   // Large Desktop
  '2xl': '1536px',  // Extra Large Desktop
}
```

### Responsive Pattern (Mobile-First):

```tsx
// ✅ კარგი - Mobile-First
<div className="
  flex flex-col           /* Mobile: Vertical stack */
  md:flex-row            /* Tablet+: Horizontal */
  gap-4                  /* Mobile: 16px gap */
  md:gap-6               /* Tablet+: 24px gap */
  p-4                    /* Mobile: 16px padding */
  md:p-6                 /* Tablet+: 24px padding */
  lg:p-8                 /* Desktop: 32px padding */
">
  <div className="w-full md:w-1/2">Content 1</div>
  <div className="w-full md:w-1/2">Content 2</div>
</div>

// ❌ ცუდი - Desktop-First
<div className="flex-row gap-6 p-8 sm:flex-col sm:gap-4 sm:p-4">
  {/* არასწორია! */}
</div>
```

### Grid Responsive Pattern:

```tsx
// Services Grid - Mobile to Desktop
<div className="
  grid 
  grid-cols-1              /* Mobile: 1 column */
  sm:grid-cols-2          /* Tablet: 2 columns */
  lg:grid-cols-3          /* Desktop: 3 columns */
  xl:grid-cols-4          /* Large: 4 columns */
  gap-4                   /* Mobile gap */
  sm:gap-6                /* Tablet gap */
  lg:gap-8                /* Desktop gap */
">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### Text Responsive:

```tsx
// Heading - Mobile to Desktop
<h1 className="
  text-2xl                /* Mobile: 24px */
  sm:text-3xl            /* Tablet: 30px */
  md:text-4xl            /* Desktop: 36px */
  lg:text-5xl            /* Large: 48px */
  font-bold
  leading-tight
">
  თქვენი სათაური
</h1>
```

---

## 4. 🌙 Dark Mode & Light Mode Toggle

### იმპლემენტაცია (next-themes):

**Installation:**
```bash
npm install next-themes
```

**Provider Setup:**
```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark"    // ⚠️ Dark Mode default!
      enableSystem={false}   // არა system preference
      storageKey="legalge-theme"
    >
      {children}
    </ThemeProvider>
  )
}
```

**Layout.tsx:**
```tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Theme Toggle Component:

```tsx
// components/ThemeToggle.tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-foreground" />
      ) : (
        <Moon className="w-5 h-5 text-foreground" />
      )}
    </button>
  )
}
```

---

## 5. 🌐 Multi-Language Support (3 ენა)

### Language Switcher Component:

```tsx
// components/LanguageSwitcher.tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Language = 'ka' | 'en' | 'ru'

const languages = {
  ka: 'KA',
  en: 'EN',
  ru: 'RU',
}

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<Language>('ka')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
      >
        <span className="text-sm font-medium text-foreground">
          {languages[currentLang]}
        </span>
        <ChevronDown className="w-4 h-4 text-foreground-secondary" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-background-secondary border border-border rounded-lg shadow-lg py-1 min-w-[80px]">
          {(Object.keys(languages) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => {
                setCurrentLang(lang)
                setIsOpen(false)
              }}
              className={`
                w-full px-4 py-2 text-left text-sm
                ${currentLang === lang 
                  ? 'text-foreground font-medium bg-accent' 
                  : 'text-foreground-secondary hover:bg-accent hover:text-foreground'
                }
                transition-colors
              `}
            >
              {languages[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 6. 🧩 UI კომპონენტების სტილები - Apple Minimal

### Button Component - Pure Black & White with Props:

```tsx
// components/ui/button/Button.tsx
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'solid' | 'outline'
  children: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
}

export default function Button({ 
  variant = 'solid', 
  children,
  className,
  onClick,
  href
}: ButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center',
    'px-4 py-2 rounded-lg',
    'font-medium text-sm',
    'transition-all duration-300 ease-in-out',
    'hover:scale-[1.02] active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  )
  
  const variants = {
    // Solid: White button (dark mode) → Hover: Black with white text
    solid: cn(
      'bg-white dark:bg-black',
      'text-black dark:text-white',
      'hover:bg-black hover:text-white',
      'dark:hover:bg-white dark:hover:text-black',
      'shadow-sm hover:shadow-lg'
    ),
    
    // Outline: Transparent with border → Hover: Filled
    outline: cn(
      'border border-black/20 dark:border-white/20',
      'bg-transparent',
      'text-black dark:text-white',
      'hover:bg-black hover:text-white hover:border-black',
      'dark:hover:bg-white dark:hover:text-black dark:hover:border-white'
    ),
  }

  const Component = href ? 'a' : 'button'
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </Component>
  )
}

// ✅ გამოყენება Props-ებით:
<Button variant="solid">რეგისტრაცია</Button>
<Button variant="outline">შესვლა</Button>
```

### Card Component:

```tsx
// components/ui/card/Card.tsx
import { cn } from '@/lib/utils'

export function Card({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      'rounded-lg',
      'bg-background-tertiary',      // Dark card background
      'border border-border',
      'hover:border-border-hover',   // Subtle hover
      'transition-all duration-200',
      'p-6',
      className
    )}>
      {children}
    </div>
  )
}
```

### Input Component:

```tsx
// components/ui/input/Input.tsx
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export default function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <input
        className={cn(
          'w-full px-4 py-2 rounded-lg',
          'bg-background-secondary',
          'border border-border',
          'text-foreground placeholder:text-foreground-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'transition-all',
          error && 'border-error focus:ring-error',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  )
}
```

---

## 7. 📐 Spacing & Layout

### Container:

```tsx
// Standard container
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  {/* Content */}
</div>
```

### Section Padding:

```tsx
// Section with responsive padding
<section className="py-12 sm:py-16 lg:py-20">
  {/* Content */}
</section>
```

### Gap Utilities:

```css
gap-2   /* 8px */
gap-4   /* 16px */
gap-6   /* 24px */
gap-8   /* 32px */
gap-12  /* 48px */
```

---

## 8. 🎯 კომპონენტების სტანდარტები

### Header სტრუქტურა - Transparent Glass:

```tsx
<header className="
  sticky top-0 z-50
  bg-black/60 dark:bg-black/60
  backdrop-blur-xl
  border-b border-white/10 dark:border-white/10
">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      {/* Navigation */}
      {/* Theme Toggle + Language + Auth */}
    </div>
  </div>
</header>

/* Header Rules:
- bg-black/60 (60% opacity) - transparent background
- backdrop-blur-xl - ძლიერი blur უკან კონტენტზე
- border-white/10 - subtle border
- ყოველთვის მუქი, transparent glass effect
*/
```

### Card სტრუქტურა:

```tsx
<Card className="
  hover:shadow-lg 
  hover:scale-[1.02]
  transition-all duration-200
">
  <h3 className="text-xl font-semibold text-foreground mb-2">
    Title
  </h3>
  <p className="text-foreground-secondary">
    Description
  </p>
</Card>
```

---

## 9. ✨ მიკრო ანიმაციები - Apple Style

### Hover Effects (Smooth & Elegant):

```css
/* ✅ ᲬᲔᲡᲘ: ყველა transition უნდა იყოს 300ms ease-in-out */

/* Button Hover - Color Invert */
.button-hover {
  transition: all 0.3s ease-in-out;
}

.button-hover:hover {
  transform: scale(1.02);
  /* თეთრი → შავი და პირიქით */
}

/* Button Press - Micro Scale */
.button-press:active {
  transform: scale(0.98);
}

/* Card Hover - Subtle Scale + Shadow */
.card-hover {
  transition: all 0.3s ease-in-out;
}

.card-hover:hover {
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* ⚠️ ᲛᲜᲘᲨᲕᲜᲔᲚᲝᲕᲐᲜᲘ ᲬᲔᲡᲔᲑᲘ:
1. duration-300 (არა 200!) - უფრო smooth
2. ease-in-out - ბუნებრივი acceleration
3. scale-[1.02] hover-ზე (2% growth)
4. scale-[0.98] active-ზე (2% shrink)
5. ფერების შეცვლა უნდა იყოს smooth (bg + text ერთდროულად)
*/
```

---

## 10. 📋 Checklist კომპონენტის შექმნისას

### ✅ უნდა გადამოწმდეს:

- [ ] **Mobile Responsive** - მუშაობს 375px width-ზე
- [ ] **Tablet Responsive** - მუშაობს 768px width-ზე
- [ ] **Desktop Responsive** - მუშაობს 1024px+ width-ზე
- [ ] **Dark Mode** - ფერები სწორად გამოიყურება dark theme-ში
- [ ] **Light Mode** - ფერები სწორად გამოიყურება light theme-ში (optional)
- [ ] **3 Language Support** - ტექსტი ჩანს ქართულად, ინგლისურად, რუსულად
- [ ] **Hover States** - interactive elements-ს აქვს hover effect
- [ ] **Focus States** - keyboard navigation-ისთვის
- [ ] **Loading States** - თუ async operation
- [ ] **Error States** - თუ form ან data fetching
- [ ] **Accessibility** - semantic HTML, ARIA labels

---

## 📌 მთავარი წესები (SUMMARY) - Apple Minimal Design

### 🎨 ფერები (STRICT RULES):
- ✅ **მხოლოდ თეთრი (#FFFFFF) და შავი (#000000)**
- ❌ **არა** ნაცრისფერი, არა ლურჯი, არა სხვა ფერები
- ✅ Opacity-ს გამოყენება borders-ისთვის (10-20%)
- ✅ Dark Mode: შავი ფონი + თეთრი ტექსტი
- ✅ Light Mode: თეთრი ფონი + შავი ტექსტი

### 📱 Responsive:
- ✅ **Mobile-First** approach
- ✅ ყველა კომპონენტი იდეალურად mobile + desktop
- ✅ Breakpoints: sm (640), md (768), lg (1024), xl (1280)

### 🌙 Theme:
- ✅ Dark Mode **default**
- ✅ Light Mode **optional**
- ✅ Theme Toggle ყველა გვერდზე
- ✅ **სუფთა React Context** - არა next-themes ან სხვა ბიბლიოთეკა
- ✅ localStorage + document.documentElement.classList

### 🌐 Languages:
- ✅ 3 ენა: KA, EN, RU
- ✅ Language Switcher Header-ში

### ⚡ Performance & Architecture - **100% სუფთა Tailwind**:
- ✅ **მხოლოდ სუფთა Tailwind utility classes**
- ❌ **არა cn() helper**, **არა clsx**, **არა tailwind-merge**
- ❌ **არა next-themes** ან სხვა styling ბიბლიოთეკები
- ✅ Template literals: `${condition ? 'class-a' : 'class-b'}`
- ✅ React Context - theme, language, auth state management
- ✅ Smooth transitions (300ms ease-in-out)
- ✅ Micro-interactions (scale: 1.02 hover, 0.98 active)

### 🎯 Button Rules (ABSOLUTE):
- **თეთრი button hover → შავი ფონი + თეთრი ტექსტი**
- **შავი button hover → თეთრი ფონი + შავი ტექსტი**
- **Outline button hover → filled (ფერი იბრუნდება)**
- **Duration: 300ms** (არა 200ms!)
- **Scale: 1.02 hover, 0.98 active**

### 🪟 Header Rules:
- ✅ **Transparent**: bg-black/60 (60% opacity)
- ✅ **Blur**: backdrop-blur-xl
- ✅ **Border**: border-white/10 (subtle)
- ✅ ყოველთვის მუქი, glass effect

### 💻 Code Style - **100% სუფთა Tailwind**:
```tsx
// ❌ WRONG - cn helper:
<div className={cn('bg-white', isDark && 'bg-black')}>

// ✅ CORRECT - Template literals:
<div className={`bg-white ${isDark ? 'bg-black' : ''}`}>

// ✅ CORRECT - Ternary operator:
<div className={`${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>

// ❌ WRONG - External libraries:
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

// ✅ CORRECT - Custom Context:
import { useTheme } from '@/contexts/ThemeContext'
const { theme } = useTheme()
const isDark = theme === 'dark'
```

### 📦 Allowed Dependencies:
- ✅ **React** (useState, useEffect, useContext, etc.)
- ✅ **Next.js** (Link, Image, routing)
- ✅ **Tailwind CSS** (utility classes only)
- ✅ **lucide-react** (icons)
- ✅ **react-icons** (provider icons: Google, Facebook, etc.)
- ❌ **next-themes** - გამოვიყენეთ custom Context
- ❌ **clsx / tailwind-merge / cn** - template literals
- ❌ **styled-components / emotion** - Tailwind only

---

*განახლებულია: 2025-01-21 (Pure Tailwind Version)*
