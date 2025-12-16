
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const baseUrl = 'https://legal.ge'

async function generateSitemap() {
  console.log('🚀 Starting Sitemap Generation Test (Parallel Fetching)...')
  const start = Date.now()
  const sitemap: any[] = []
  const locales = ['ka', 'en', 'ru']

  // Helper function
  const addMultiLocaleUrls = (path: string) => {
    locales.forEach((locale) => {
      sitemap.push(`${baseUrl}/${locale}${path}`)
    })
  }

  // 1. Static Pages
  addMultiLocaleUrls('')
  addMultiLocaleUrls('/specialists')
  addMultiLocaleUrls('/companies')
  addMultiLocaleUrls('/practices')
  addMultiLocaleUrls('/news')
  addMultiLocaleUrls('/news/archive')
  addMultiLocaleUrls('/contact')
  addMultiLocaleUrls('/privacy')
  addMultiLocaleUrls('/terms')
  addMultiLocaleUrls('/cookies')
  console.log(`✅ Static Pages: Added ${sitemap.length} URLs`)

  console.log('⏳ Fetching data from Supabase...')
  
  // Fetch all data in parallel (Mirroring production code)
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
    specialistTranslations.forEach((t) => {
      sitemap.push(`${baseUrl}/${t.language}/specialists/${t.slug}`)
    })
  }

  // Process Companies
  if (companiesKa) {
    companiesKa.forEach(c => sitemap.push(`${baseUrl}/ka/companies/${c.company_slug}`))
  }
  if (companyTranslations) {
    companyTranslations.forEach(t => sitemap.push(`${baseUrl}/${t.language}/companies/${t.slug}`))
  }

  // Process Practices
  const practiceSlugMap = new Map<string, string>()
  if (practices) {
    practices.forEach((practice) => {
      const translations = Array.isArray(practice.practice_translations)
        ? practice.practice_translations
        : [practice.practice_translations]

      translations.forEach((translation: any) => {
        if (translation && translation.slug && translation.language) {
          sitemap.push(`${baseUrl}/${translation.language}/practices/${translation.slug}`)
          practiceSlugMap.set(`${practice.id}:${translation.language}`, translation.slug)
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

        translations.forEach((translation: any) => {
          if (translation && translation.slug && translation.language) {
            const practiceSlug = practiceSlugMap.get(`${service.practice_id}:${translation.language}`)
            if (practiceSlug) {
              sitemap.push(`${baseUrl}/${translation.language}/practices/${practiceSlug}/${translation.slug}`)
            }
          }
        })
      }
    })
  }

  // Process Teams
  if (teamTranslations) {
    teamTranslations.forEach(t => sitemap.push(`${baseUrl}/${t.language}/teams/${t.slug}`))
  }

  // Process News
  if (postTranslations) {
    postTranslations.forEach(n => sitemap.push(`${baseUrl}/${n.language}/news/${n.slug}`))
  }

  // Process Categories
  if (categoryTranslations) {
    categoryTranslations.forEach(c => sitemap.push(`${baseUrl}/${c.language}/news/category/${c.slug}`))
  }

  const end = Date.now()
  console.log('\n-----------------------------------')
  console.log(`✅ TOTAL URLs Generated: ${sitemap.length}`)
  console.log(`⏱️  Execution Time: ${(end - start) / 1000}s`)
  console.log('-----------------------------------')
  
  console.log('\n📊 Breakdown:')
  console.log(`- Specialists: ${specialistTranslations?.length || 0}`)
  console.log(`- Companies (KA): ${companiesKa?.length || 0}`)
  console.log(`- Companies (Other): ${companyTranslations?.length || 0}`)
  console.log(`- Practices: ${practices?.length ? practices.length * 3 : 0} (approx)`)
  console.log(`- Services: ${services?.length ? services.length * 3 : 0} (approx)`)
  console.log(`- News: ${postTranslations?.length || 0}`)
  console.log(`- Categories: ${categoryTranslations?.length || 0}`)

  console.log('\n🔍 Random Sample URLs:')
  for(let i=0; i<5; i++) {
    const randomIdx = Math.floor(Math.random() * sitemap.length)
    console.log(sitemap[randomIdx])
  }
}

generateSitemap().catch(console.error)
