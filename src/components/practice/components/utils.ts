// ==================== Practice Component Utils ====================
// Shared utility functions for practice components

import type { Locale } from '@/lib/enums'
import type { PracticeTranslation, LocaleString } from '../types'

/**
 * Generates localized aria-label for practice cards
 */
export function generatePracticeAriaLabel(
  translation: PracticeTranslation,
  locale: LocaleString
): string {
  const servicesCount = translation.services_count ?? 0
  const category = translation.category
  
  if (locale === 'ka') {
    return `პრაქტიკა: ${translation.title}. სერვისები: ${servicesCount}. ${category ? `კატეგორია: ${category}` : ''}`
  }
  
  if (locale === 'en') {
    return `Practice: ${translation.title}. Services: ${servicesCount}. ${category ? `Category: ${category}` : ''}`
  }
  
  // ru
  return `Практика: ${translation.title}. Услуги: ${servicesCount}. ${category ? `Категория: ${category}` : ''}`
}

/**
 * Formats a date string based on locale
 */
export function formatPracticeDate(dateString: string, locale: string): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  
  const localeMap: Record<string, string> = {
    ka: 'ka-GE',
    en: 'en-US',
    ru: 'ru-RU',
  }
  
  return date.toLocaleDateString(localeMap[locale] || 'en-US', options)
}
