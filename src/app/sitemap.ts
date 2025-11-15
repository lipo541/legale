import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Note: Using service_role key for server-side generation to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const baseUrl = 'https://www.legal.ge'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = []
  const locales = ['ka', 'en', 'ru'] // Georgian, English, Russian

  // Helper function to add URLs for all locales
  const addMultiLocaleUrls = (
    path: string,
    lastModified: Date,
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
    priority: number
  ) => {
    locales.forEach((locale) => {
      const url = locale === 'ka' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`
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
  addMultiLocaleUrls('/services', new Date(), 'monthly', 0.8)
  addMultiLocaleUrls('/news', new Date(), 'daily', 0.8)
  addMultiLocaleUrls('/news/archive', new Date(), 'weekly', 0.5)
  addMultiLocaleUrls('/contact', new Date(), 'monthly', 0.7)
  addMultiLocaleUrls('/privacy', new Date(), 'yearly', 0.3)
  addMultiLocaleUrls('/terms', new Date(), 'yearly', 0.3)
  addMultiLocaleUrls('/cookies', new Date(), 'yearly', 0.3)

  try {
    // Fetch ALL specialists from specialist_translations (contains slug per language)
    const { data: specialistTranslations } = await supabase
      .from('specialist_translations')
      .select('slug, language, updated_at')
      .not('slug', 'is', null)

    if (specialistTranslations) {
      specialistTranslations.forEach((translation) => {
        const locale = translation.language
        const slug = translation.slug
        
        if (slug) {
          const url = locale === 'ka' 
            ? `${baseUrl}/specialists/${slug}` 
            : `${baseUrl}/${locale}/specialists/${slug}`
          sitemap.push({
            url,
            lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          })
        }
      })
    }

    // Fetch companies: Georgian slug from profiles, other languages from company_translations
    // First, get Georgian companies from profiles
    const { data: companiesKa } = await supabase
      .from('profiles')
      .select('company_slug, updated_at')
      .eq('role', 'COMPANY')
      .not('company_slug', 'is', null)

    if (companiesKa) {
      companiesKa.forEach((company) => {
        const url = `${baseUrl}/companies/${company.company_slug}`
        sitemap.push({
          url,
          lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }

    // Then, get English and Russian translations from company_translations
    const { data: companyTranslations } = await supabase
      .from('company_translations')
      .select('slug, language, updated_at')
      .not('slug', 'is', null)

    if (companyTranslations) {
      companyTranslations.forEach((translation) => {
        const url = `${baseUrl}/${translation.language}/companies/${translation.slug}`
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }

    // Fetch practices from practice_translations (all languages including Georgian)
    const { data: practiceTranslations } = await supabase
      .from('practice_translations')
      .select('slug, language, updated_at')
      .not('slug', 'is', null)

    if (practiceTranslations) {
      practiceTranslations.forEach((translation) => {
        const locale = translation.language
        const url = `${baseUrl}/${locale}/practices/${translation.slug}`
        
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      })
    }

    // Fetch services with practice slug (hierarchical URL: /practices/{practice_slug}/{service_slug})
    // Need to join: service_translations -> services -> practices -> practice_translations
    const { data: serviceTranslations } = await supabase
      .from('service_translations')
      .select(`
        slug, 
        language, 
        updated_at,
        services!inner(
          status,
          practices!inner(
            practice_translations!inner(slug, language)
          )
        )
      `)
      .eq('services.status', 'published')
      .not('slug', 'is', null)

    if (serviceTranslations) {
      serviceTranslations.forEach((translation) => {
        const locale = translation.language
        
        // Extract nested data from Supabase join with proper type handling
        const servicesData = translation.services as unknown as Record<string, unknown> | Record<string, unknown>[]
        const service = Array.isArray(servicesData) && servicesData.length > 0 
          ? servicesData[0] 
          : servicesData as Record<string, unknown>

        const practicesData = (service as Record<string, unknown>).practices as unknown as Record<string, unknown> | Record<string, unknown>[]
        const practice = Array.isArray(practicesData) && practicesData.length > 0
          ? practicesData[0]
          : practicesData as Record<string, unknown>

        const practiceTranslationsData = (practice as Record<string, unknown>).practice_translations as unknown as Array<{ slug: string; language: string }> | { slug: string; language: string }
        
        // Find practice translation matching the service's language
        const practiceTranslation = Array.isArray(practiceTranslationsData)
          ? practiceTranslationsData.find((pt) => pt.language === locale)
          : practiceTranslationsData?.language === locale 
            ? practiceTranslationsData 
            : null

        const practiceSlug = practiceTranslation?.slug
        
        if (translation.slug && practiceSlug) {
          // Build hierarchical URL: /{locale}/practices/{practice_slug}/{service_slug}
          const url = `${baseUrl}/${locale}/practices/${practiceSlug}/${translation.slug}`

          sitemap.push({
            url,
            lastModified: translation.updated_at 
              ? new Date(translation.updated_at) 
              : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        }
      })
    }

    // Fetch teams from team_translations (all languages)
    const { data: teamTranslations } = await supabase
      .from('team_translations')
      .select('slug, language, updated_at, teams!inner(is_active)')
      .eq('teams.is_active', true)
      .not('slug', 'is', null)

    if (teamTranslations) {
      teamTranslations.forEach((translation) => {
        const locale = translation.language
        const url = `${baseUrl}/${locale}/teams/${translation.slug}`
        
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      })
    }

    // Fetch news posts (published only) from post_translations
    const { data: postTranslations } = await supabase
      .from('post_translations')
      .select('slug, language, updated_at, posts!inner(status, published_at)')
      .eq('posts.status', 'published')
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })

    if (postTranslations) {
      postTranslations.forEach((translation) => {
        const locale = translation.language
        const url = `${baseUrl}/${locale}/news/${translation.slug}`
        
        sitemap.push({
          url,
          lastModified: translation.updated_at ? new Date(translation.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      })
    }

    // Fetch news categories from post_category_translations
    const { data: categoryTranslations } = await supabase
      .from('post_category_translations')
      .select('slug, language')
      .not('slug', 'is', null)

    if (categoryTranslations) {
      categoryTranslations.forEach((translation) => {
        const locale = translation.language
        const url = `${baseUrl}/${locale}/news/category/${translation.slug}`
        
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
