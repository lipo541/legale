/**
 * Site configuration - ცენტრალიზებული კონფიგურაცია SEO და URL-ებისთვის
 * 
 * პირველადი დომენი: legal.ge (www გარეშე)
 * www.legal.ge რედირექტდება legal.ge-ზე (308 permanent)
 */

export const siteConfig = {
  /** Base URL - პირველადი დომენი SEO და canonical URL-ებისთვის */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge',
  
  /** Site name */
  name: 'LegalGE',
  
  /** Default OG image path */
  defaultOgImage: '/asset/images/og-image.jpg',
  
  /** Logo path */
  logo: '/asset/images/logo.png',
  
  /** Supported locales */
  locales: ['ka', 'en', 'ru'] as const,
  
  /** Default locale */
  defaultLocale: 'ka' as const,
  
  /** Social media links */
  social: {
    facebook: 'https://www.facebook.com/legal.ge',
    linkedin: 'https://www.linkedin.com/company/legal-ge',
    twitter: 'https://twitter.com/legal_ge',
  },
} as const

export type Locale = typeof siteConfig.locales[number]

/**
 * Helper function to generate canonical URL
 * @param path - path without locale (e.g., '/practices', '/news/article-slug')
 * @param locale - locale code
 * @returns Full canonical URL with locale prefix (always includes /ka/, /en/, /ru/)
 */
export function getCanonicalUrl(path: string = '', locale: Locale = 'ka'): string {
  const { baseUrl } = siteConfig
  
  // Always include locale prefix for all languages including default (ka)
  return `${baseUrl}/${locale}${path}`
}

/**
 * Helper function to generate language alternates for metadata
 * @param path - path without locale prefix (e.g., '/practices', '/news/slug')
 * @returns Object with language alternates (all with /locale/ prefix)
 */
export function getLanguageAlternates(path: string = ''): Record<string, string> {
  const { baseUrl, locales, defaultLocale } = siteConfig
  
  const alternates: Record<string, string> = {}
  
  // All locales get /locale/ prefix including default (ka)
  locales.forEach((locale) => {
    alternates[locale] = `${baseUrl}/${locale}${path}`
  })
  
  // Add x-default pointing to default locale
  alternates['x-default'] = `${baseUrl}/${defaultLocale}${path}`
  
  return alternates
}

/**
 * Get full URL for OG images and assets
 * @param path - relative path starting with /
 * @returns Full URL
 */
export function getAssetUrl(path: string): string {
  return `${siteConfig.baseUrl}${path}`
}
