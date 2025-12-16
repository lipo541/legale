import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/config'

// Enable ISR: Revalidate sitemap every hour
export const revalidate = 3600

// Note: Using service_role key for server-side generation to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const baseUrl = siteConfig.baseUrl

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = []
  const locales = ['ka', 'en', 'ru'] // Georgian, English, Russian

  // Helper function to add URLs for all locales
  // All URLs should include locale prefix (/ka/, /en/, /ru/)
  const addMultiLocaleUrls = (
    path: string,
    lastModified: Date,
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    priority: number
  ) => {
    locales.forEach((locale) => {
      // Always include locale prefix for consistency
      // Ensure URL is properly encoded (handling Georgian characters)
      const url = encodeURI(`${baseUrl}/${locale}${path}`)
      sitemap.push({
        url,
        lastModified,
        changeFrequency,
        priority,
      })
    })
  }

  // Static pages - Main pages
  addMultiLocaleUrls('', new Date(), 'daily', 1)
  addMultiLocaleUrls('/specialists', new Date(), 'weekly', 0.9)
  addMultiLocaleUrls('/companies', new Date(), 'weekly', 0.9)
  addMultiLocaleUrls('/practices', new Date(), 'monthly', 0.8)
  // Note: /services page does not exist - services are accessed via /practices/{practiceSlug}/{serviceSlug}
  addMultiLocaleUrls('/news', new Date(), 'daily', 0.9)
  addMultiLocaleUrls('/news/archive', new Date(), 'weekly', 0.4)
  addMultiLocaleUrls('/contact', new Date(), 'monthly', 0.7)
  addMultiLocaleUrls('/privacy', new Date(), 'yearly', 0.2)
  addMultiLocaleUrls('/terms', new Date(), 'yearly', 0.2)
  addMultiLocaleUrls('/cookies', new Date(), 'yearly', 0.2)

  try {
    // Fetch all data in parallel for better performance
    const [
      { data: specialistTranslations },
      { data: companiesKa },
      { data: companyTranslations },
      { data: practices },
      { data: services },
      { data: teamTranslations },
      { data: postTranslations },
      { data: categoryTranslations }
    ] = await Promise.all([
      // 1. Specialists
      supabase
        .from('specialist_translations')
        .select('slug, language, updated_at, profiles!inner(is_blocked)')
        .eq('profiles.is_blocked', false)
        .not('slug', 'is', null),

      // 2. Companies (Georgian)
      supabase
        .from('profiles')
        .select('company_slug, updated_at')
        .eq('role', 'COMPANY')
        .eq('is_blocked', false)
        .not('company_slug', 'is', null),

      // 3. Companies (Other languages)
      supabase
        .from('company_translations')
        .select('slug, language, updated_at, profiles!inner(is_blocked)')
        .eq('profiles.is_blocked', false)
        .not('slug', 'is', null)
        .neq('language', 'ka'),

      // 4. Practices
      supabase
        .from('practices')
        .select(`
          id,
          status,
          practice_translations (
            slug,
            language,
            updated_at
          )
        `)
        .eq('status', 'published'),

      // 5. Services
      supabase
        .from('services')
        .select(`
          id,
          practice_id,
          status,
          service_translations (
            slug,
            language,
            updated_at
          )
        `)
        .eq('status', 'published'),

      // 6. Teams
      supabase
        .from('team_translations')
        .select('slug, language, updated_at, teams!inner(is_active)')
        .eq('teams.is_active', true)
        .not('slug', 'is', null),

      // 7. News Posts
      supabase
        .from('post_translations')
        .select('slug, language, updated_at, posts!inner(status, published_at)')
        .eq('posts.status', 'published')
        .not('slug', 'is', null)
        .order('updated_at', { ascending: false }),

      // 8. News Categories
      supabase
        .from('post_category_translations')
        .select('slug, language')
        .not('slug', 'is', null)
    ])

    // Process Specialists
    if (specialistTranslations) {
      specialistTranslations.forEach((translation) => {
        const locale = translation.language
        const slug = translation.slug
        
        if (slug) {
          const url = encodeURI(`${baseUrl}/${locale}/specialists/${slug}`)
          sitemap.push({
            url,
            lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          })
        }
      })
    }

    // Process Companies (Georgian)
    if (companiesKa) {
      companiesKa.forEach((company) => {
        const url = encodeURI(`${baseUrl}/ka/companies/${company.company_slug}`)
        sitemap.push({
          url,
          lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })
    }

    // Process Companies (Other languages)
    if (companyTranslations) {
      companyTranslations.forEach((translation) => {
        const url = encodeURI(`${baseUrl}/${translation.language}/companies/${translation.slug}`)
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })
    }

    // Process Practices
    // Map to store practice slugs: "practiceId:language" -> slug
    const practiceSlugMap = new Map<string, string>()

    if (practices) {
      practices.forEach((practice) => {
        const translations = Array.isArray(practice.practice_translations)
          ? practice.practice_translations
          : [practice.practice_translations]

        translations.forEach((translation) => {
          if (translation && translation.slug && translation.language) {
            const locale = translation.language
            const url = encodeURI(`${baseUrl}/${locale}/practices/${translation.slug}`)
            
            sitemap.push({
              url,
              lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
              changeFrequency: 'monthly',
              priority: 0.9,
            })

            practiceSlugMap.set(`${practice.id}:${locale}`, translation.slug)
          }
        })
      })
    }

    // Process Services
    if (services) {
      services.forEach((service) => {
        if (service.practice_id) {
          const translations = Array.isArray(service.service_translations)
            ? service.service_translations
            : [service.service_translations]

          translations.forEach((translation) => {
            if (translation && translation.slug && translation.language) {
              const locale = translation.language
              const practiceSlug = practiceSlugMap.get(`${service.practice_id}:${locale}`)

              if (practiceSlug) {
                const url = encodeURI(`${baseUrl}/${locale}/practices/${practiceSlug}/${translation.slug}`)

                sitemap.push({
                  url,
                  lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
                  changeFrequency: 'monthly',
                  priority: 0.9,
                })
              }
            }
          })
        }
      })
    }

    // Process Teams
    if (teamTranslations) {
      teamTranslations.forEach((translation) => {
        const locale = translation.language
        const url = encodeURI(`${baseUrl}/${locale}/teams/${translation.slug}`)
        
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      })
    }

    // Process News Posts
    if (postTranslations) {
      postTranslations.forEach((translation) => {
        const locale = translation.language
        const url = encodeURI(`${baseUrl}/${locale}/news/${translation.slug}`)
        
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }

    // Process News Categories
    if (categoryTranslations) {
      categoryTranslations.forEach((translation) => {
        const locale = translation.language
        const url = encodeURI(`${baseUrl}/${locale}/news/category/${translation.slug}`)
        
        sitemap.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.5,
        })
      })
    }

    // Note: Author pages are excluded from sitemap as they use UUID-based URLs
    // and are less important for SEO. Users can find authors through their posts.
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return sitemap
}
