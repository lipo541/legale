/**
 * Accessibility Utilities
 * WCAG 2.1 AA Compliant helpers
 */

/**
 * Announces message to screen readers
 * Uses aria-live region pattern
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return

  // Create or get existing announcement region
  let announcer = document.getElementById('screen-reader-announcer')
  
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'screen-reader-announcer'
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    document.body.appendChild(announcer)
  } else {
    // Update priority if different
    announcer.setAttribute('aria-live', priority)
  }

  // Clear and set new message
  announcer.textContent = ''
  
  // Use setTimeout to ensure screen readers pick up the change
  setTimeout(() => {
    announcer!.textContent = message
  }, 100)

  // Clear after announcement
  setTimeout(() => {
    announcer!.textContent = ''
  }, 1000)
}

/**
 * Get contrast ratio between two colors
 * Used for WCAG compliance checking
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Simple hex to RGB conversion
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const [rLum, gLum, bLum] = [r, g, b].map(val => 
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    )

    return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum
  }

  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsWCAGAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsWCAGAAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 7.0
}

/**
 * Trap focus within a container
 * Used for modals and dropdowns
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement?.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement?.focus()
  }
}

/**
 * Generate unique ID for ARIA attributes
 * Ensures unique IDs across components
 */
let idCounter = 0
export function generateAriaId(prefix: string = 'aria'): string {
  idCounter++
  return `${prefix}-${idCounter}-${Date.now()}`
}

/**
 * Get consistent focus ring styles for interactive elements
 * WCAG 2.1 - 2.4.7 Focus Visible (Level AA)
 * 
 * @param isDark - Whether dark mode is active
 * @returns Tailwind CSS classes for focus styles
 */
export function getFocusStyles(isDark: boolean = false): string {
  return [
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    isDark ? 'focus:ring-white' : 'focus:ring-black',
    isDark ? 'focus:ring-offset-black' : 'focus:ring-offset-white',
    'transition-shadow',
    'duration-200'
  ].join(' ')
}

/**
 * Get focus styles for card/container elements
 * Softer focus for larger interactive areas
 */
export function getCardFocusStyles(isDark: boolean = false): string {
  return [
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    isDark ? 'focus:ring-white/50' : 'focus:ring-black/50',
    isDark ? 'focus:ring-offset-black' : 'focus:ring-offset-white',
    'focus-visible:ring-2',
    'transition-all',
    'duration-200'
  ].join(' ')
}
