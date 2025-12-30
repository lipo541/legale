import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Supabase Image Transformation - ოპტიმიზებული სურათის URL
 * Pro plan-ის ფუნქცია: on-the-fly resize, WebP კონვერტაცია, quality control
 * 
 * @param url - ორიგინალი Supabase storage URL
 * @param options - ტრანსფორმაციის პარამეტრები
 * @returns ოპტიმიზებული URL
 * 
 * @example
 * // Avatar (პატარა, მრგვალი)
 * getOptimizedImageUrl(avatarUrl, { width: 100, height: 100 })
 * 
 * // Card thumbnail
 * getOptimizedImageUrl(imageUrl, { width: 400, quality: 80 })
 * 
 * // Full size with quality
 * getOptimizedImageUrl(imageUrl, { quality: 85 })
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: {
    width?: number
    height?: number
    quality?: number
    resize?: 'cover' | 'contain' | 'fill'
  } = {}
): string {
  // Return empty or placeholder if no URL
  if (!url) return ''
  
  // Only transform Supabase URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url
  }
  
  // Convert object URL to render URL
  // From: /storage/v1/object/public/bucket/path
  // To:   /storage/v1/render/image/public/bucket/path
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  )
  
  // Build query parameters
  const params = new URLSearchParams()
  
  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.resize) params.append('resize', options.resize)
  
  const queryString = params.toString()
  return queryString ? `${renderUrl}?${queryString}` : renderUrl
}

/**
 * პრესეტები ხშირად გამოყენებული ზომებისთვის
 */
export const imagePresets = {
  // Avatar სურათები
  avatarSmall: { width: 48, height: 48, quality: 80, resize: 'cover' as const },
  avatarMedium: { width: 96, height: 96, quality: 80, resize: 'cover' as const },
  avatarLarge: { width: 200, height: 200, quality: 85, resize: 'cover' as const },
  
  // Card thumbnails (with size limit for small cards)
  cardThumbnail: { width: 400, quality: 80, resize: 'contain' as const },
  cardLarge: { width: 800, quality: 85 },
  // Card with aspect ratio for proper cropping (16:10 for h-56 cards ~380x224)
  cardLargeAspect: { width: 800, height: 500, quality: 85, resize: 'cover' as const },
  
  // Practice/Service cards - მხოლოდ WebP + quality (ზომის შეზღუდვის გარეშე)
  practiceCard: { quality: 85 },
  serviceCard: { quality: 85 },
  
  // Hero/Banner სურათები
  heroBanner: { width: 1200, quality: 85 },
  practiceHero: { quality: 85 },  // მხოლოდ quality - კონტეინერის 100% შესავსებად
  
  // OG Images (social sharing)
  ogImage: { width: 1200, height: 630, quality: 90, resize: 'cover' as const },
  
  // Logo
  logo: { width: 200, quality: 90 },
  logoSmall: { width: 100, quality: 85 },
}

export function formatDate(date: Date | string, locale: string = 'ka'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Robust date formatter for posts - handles null, undefined, invalid dates
 * Returns empty string instead of showing "January 1, 1970" (Unix epoch)
 * 
 * @param publishedAt - Primary date field (published_at)
 * @param createdAt - Fallback date field (created_at)
 * @param locale - Locale for formatting
 * @param format - 'short' for "17 Dec 2025", 'long' for "17 December 2025"
 * @returns Formatted date string or empty string if invalid
 */
export function formatPostDate(
  publishedAt: string | null | undefined,
  createdAt?: string | null,
  locale: string = 'ka',
  format: 'short' | 'long' = 'short'
): string {
  const dateString = publishedAt || createdAt
  
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  // Check if date is valid and not Unix epoch (January 1, 1970)
  if (isNaN(date.getTime()) || date.getTime() === 0) return ''
  
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric'
  }).format(date)
}

/**
 * SSR-safe date formatter - returns consistent output on server and client
 * Uses manual month names to avoid locale-dependent Date formatting issues
 * 
 * @param dateStr - Date string to format
 * @param locale - Locale for month names ('ka', 'en', 'ru')
 * @returns Formatted date string like "30 ნოე" or "30 Nov"
 */
export function formatDateSSR(dateStr: string, locale: string = 'ka'): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  
  const day = date.getDate()
  const monthNames: Record<string, string[]> = {
    ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ru: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  }
  const months = monthNames[locale] || monthNames.ka
  const month = months[date.getMonth()]
  return `${day} ${month}`
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
