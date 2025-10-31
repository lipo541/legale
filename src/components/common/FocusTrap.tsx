'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface FocusTrapProps {
  children: ReactNode
  isActive: boolean
  onEscape?: () => void
  restoreFocus?: boolean
}

/**
 * FocusTrap component - traps keyboard focus within its children
 * Used for modals, dropdowns, and other overlay components
 * 
 * Features:
 * - Traps Tab/Shift+Tab navigation
 * - Handles Escape key
 * - Restores focus when deactivated
 * - WCAG 2.1 AA compliant
 */
export default function FocusTrap({ 
  children, 
  isActive, 
  onEscape,
  restoreFocus = true 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Store the currently focused element
    if (restoreFocus && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement
    }

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return []

      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(containerRef.current.querySelectorAll(selector))
    }

    // Focus first element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus()
    }

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Handle Tab key
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements()
        
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        // Shift+Tab on first element -> go to last
        if (e.shiftKey && activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
          return
        }

        // Tab on last element -> go to first
        if (!e.shiftKey && activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
          return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // Restore focus to previously focused element
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, onEscape, restoreFocus])

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}
