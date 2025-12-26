import { Suspense } from 'react'
import CompaniesPageClient from '@/components/companies/CompaniesPageClient'
import type { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'
import type { 
  Company, 
  CityData, 
  Specialization,
  CompaniesPageInitialData 
} from '@/components/companies/types'

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600

// Pre-generate pages for all locales at build time
export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }, { locale: 'ru' }]
}

type Props = {
  params: Promise<{ locale: string }>
}

// Server-side data fetching function
async function fetchCompaniesData(locale: string): Promise<CompaniesPageInitialData> {
  const supabase = createStaticClient()

  // Fetch all data in parallel for maximum performance
  const [
    companiesResult,
    companyCitiesResult,
    companySpecializationsResult,
    companiesCountResult,
    specialistsCountResult,
    servicesCountResult
  ] = await Promise.all([
    // Companies
    supabase
      .from('profiles')
      .select('id, full_name, company_slug, logo_url, summary, address, phone_number, website, role')
      .eq('role', 'COMPANY')
      .eq('verification_status', 'verified')
      .order('full_name', { ascending: true }),

    // Cities for filter dropdown
    supabase
      .from('company_cities')
      .select('cities(id, name_ka, name_en, name_ru)'),

    // Specializations for filter dropdown
    supabase
      .from('company_specializations')
      .select('specializations(id, name_ka, name_en, name_ru)'),

    // Statistics
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'COMPANY')
      .eq('verification_status', 'verified'),

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'SPECIALIST')
      .eq('verification_status', 'verified'),

    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
  ])

  let companies: Company[] = (companiesResult.data || []).map(c => ({
    id: c.id,
    full_name: c.full_name,
    company_slug: c.company_slug,
    logo_url: c.logo_url,
    summary: c.summary,
    address: c.address,
    phone_number: c.phone_number,
    website: c.website,
    role: c.role,
    status: 'active'
  }))

  // Fetch translations for non-Georgian locales
  if (locale !== 'ka' && companies.length > 0) {
    const { data: translations } = await supabase
      .from('company_translations')
      .select('company_id, slug, company_name, summary')
      .eq('language', locale)
      .in('company_id', companies.map(c => c.id))

    const translationMap = new Map(
      translations?.map(t => [
        t.company_id,
        { slug: t.slug, company_name: t.company_name, summary: t.summary }
      ]) || []
    )

    companies = companies.map(company => {
      const translation = translationMap.get(company.id)
      return {
        ...company,
        company_slug: translation?.slug || company.company_slug,
        full_name: translation?.company_name || company.full_name,
        summary: translation?.summary || company.summary
      }
    })
  }

  // Process cities data
  const processedCities: CityData[] = []
  const seenCityIds = new Set<string>()
  
  if (companyCitiesResult.data) {
    for (const item of companyCitiesResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const citiesData = (item as any).cities
      const cityArray = Array.isArray(citiesData) ? citiesData : citiesData ? [citiesData] : []
      
      for (const city of cityArray) {
        if (city && city.id && !seenCityIds.has(city.id)) {
          seenCityIds.add(city.id)
          const cityName = locale === 'en' ? city.name_en : locale === 'ru' ? city.name_ru : city.name_ka
          processedCities.push({
            id: city.id,
            name: cityName || city.name_ka,
            name_ka: city.name_ka,
            name_en: city.name_en,
            name_ru: city.name_ru,
          })
        }
      }
    }
  }

  // Sort cities by name
  processedCities.sort((a, b) => a.name.localeCompare(b.name, locale))

  // Process specializations data
  const processedSpecializations: Specialization[] = []
  const seenSpecIds = new Set<string>()
  
  if (companySpecializationsResult.data) {
    for (const item of companySpecializationsResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const specsData = (item as any).specializations
      const specArray = Array.isArray(specsData) ? specsData : specsData ? [specsData] : []
      
      for (const spec of specArray) {
        if (spec && spec.id && !seenSpecIds.has(spec.id)) {
          seenSpecIds.add(spec.id)
          const specName = locale === 'en' ? spec.name_en : locale === 'ru' ? spec.name_ru : spec.name_ka
          processedSpecializations.push({
            id: spec.id,
            name: specName || spec.name_ka,
          })
        }
      }
    }
  }

  // Sort specializations by name
  processedSpecializations.sort((a, b) => a.name.localeCompare(b.name, locale))

  return {
    companies,
    stats: {
      totalCompanies: companiesCountResult.count || 0,
      totalSpecialists: specialistsCountResult.count || 0,
      totalServices: servicesCountResult.count || 0,
    },
    cities: processedCities,
    specializations: processedSpecializations,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata: Record<string, { title: string; description: string; ogImage: string }> = {
    ka: {
      title: 'იურიდიული კომპანიები საქართველოში | Legal',
      description: 'აღმოაჩინეთ და შეადარეთ იურიდიული კომპანიები საქართველოში. Legal-ზე თავმოყრილია საუკეთესო იურიდიული ფირმები, რომლებიც გთავაზობენ მრავალფეროვან სერვისებს.',
      ogImage: `${baseUrl}/images/og-companies-ka.jpg`,
    },
    en: {
      title: 'Law Firms in Georgia | Legal',
      description: 'Discover and compare law firms in Georgia. Legal features top legal companies offering a wide range of services.',
      ogImage: `${baseUrl}/images/og-companies-en.jpg`,
    },
    ru: {
      title: 'Юридические компании в Грузии | Legal',
      description: 'Откройте для себя и сравните юридические компании в Грузии. На Legal представлены лучшие юридические фирмы, предлагающие широкий спектр услуг.',
      ogImage: `${baseUrl}/images/og-companies-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/companies`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/companies'),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'LegalGE',
      images: [
        {
          url: meta.ogImage,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [meta.ogImage],
    },
  }
}

// Server Component - fetches data at build time / ISR
export default async function CompaniesPage({ params }: Props) {
  const { locale } = await params

  // Server-side data fetching (cached with ISR)
  const initialData = await fetchCompaniesData(locale)

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CompaniesPageClient initialData={initialData} locale={locale} />
    </Suspense>
  )
}
