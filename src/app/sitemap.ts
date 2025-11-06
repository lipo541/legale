import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    // Fetch ALL specialists (company specialists, solo specialists - approved only)
    const { data: specialists } = await supabase
      .from('profiles')
      .select('company_slug, updated_at')
      .in('role', ['specialist', 'solo_specialist'])
      .eq('is_approved', true)
      .not('company_slug', 'is', null)

    if (specialists) {
      specialists.forEach((specialist) => {
        locales.forEach((locale) => {
          const url = locale === 'ka' 
            ? `${baseUrl}/specialists/${specialist.company_slug}` 
            : `${baseUrl}/${locale}/specialists/${specialist.company_slug}`
          sitemap.push({
            url,
            lastModified: specialist.updated_at ? new Date(specialist.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          })
        })
      })
    }

    // Fetch companies (approved only)
    const { data: companies } = await supabase
      .from('profiles')
      .select('company_slug, updated_at')
      .eq('role', 'company')
      .eq('is_approved', true)
      .not('company_slug', 'is', null)

    if (companies) {
      companies.forEach((company) => {
        locales.forEach((locale) => {
          const url = locale === 'ka'
            ? `${baseUrl}/companies/${company.company_slug}`
            : `${baseUrl}/${locale}/companies/${company.company_slug}`
          sitemap.push({
            url,
            lastModified: company.updated_at ? new Date(company.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          })
        })
      })
    }

    // Fetch practices
    const { data: practices } = await supabase
      .from('practices')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (practices) {
      practices.forEach((practice) => {
        locales.forEach((locale) => {
          const url = locale === 'ka'
            ? `${baseUrl}/practices/${practice.slug}`
            : `${baseUrl}/${locale}/practices/${practice.slug}`
          sitemap.push({
            url,
            lastModified: practice.updated_at ? new Date(practice.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          })
        })
      })
    }

    // Fetch services with translations in ONE query (fixing N+1 problem)
    const { data: serviceTranslations } = await supabase
      .from('service_translations')
      .select('slug, language, service_id, services!inner(status, updated_at)')
      .eq('services.status', 'published')

    if (serviceTranslations) {
      serviceTranslations.forEach((translation) => {
        const locale = translation.language
        const url = locale === 'ka'
          ? `${baseUrl}/services/${translation.slug}`
          : `${baseUrl}/${locale}/services/${translation.slug}`
        
        // Access the first element of services array
        const service = Array.isArray(translation.services) && translation.services.length > 0 
          ? translation.services[0] 
          : null
        
        sitemap.push({
          url,
          lastModified: service?.updated_at 
            ? new Date(service.updated_at) 
            : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      })
    }

    // Fetch news posts (published only)
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (posts) {
      posts.forEach((post) => {
        locales.forEach((locale) => {
          const url = locale === 'ka'
            ? `${baseUrl}/news/${post.slug}`
            : `${baseUrl}/${locale}/news/${post.slug}`
          sitemap.push({
            url,
            lastModified: new Date(post.updated_at),
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        })
      })
    }

    // Fetch news categories
    const { data: categories } = await supabase
      .from('categories')
      .select('slug')

    if (categories) {
      categories.forEach((category) => {
        locales.forEach((locale) => {
          const url = locale === 'ka'
            ? `${baseUrl}/news/category/${category.slug}`
            : `${baseUrl}/${locale}/news/category/${category.slug}`
          sitemap.push({
            url,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
          })
        })
      })
    }

    // Fetch news authors (who have published posts)
    const { data: authors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'author')

    if (authors) {
      authors.forEach((author) => {
        locales.forEach((locale) => {
          const url = locale === 'ka'
            ? `${baseUrl}/news/author/${author.id}`
            : `${baseUrl}/${locale}/news/author/${author.id}`
          sitemap.push({
            url,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4,
          })
        })
      })
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return sitemap
}
