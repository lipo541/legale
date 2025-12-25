// ==================== Service Module Utilities ====================

/**
 * Formats a date string based on locale
 */
export function formatServiceDate(dateString: string, locale: string): string {
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
