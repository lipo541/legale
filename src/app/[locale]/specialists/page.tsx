import { Suspense } from 'react'
import SpecialistsPageClient from '@/components/specialists/SpecialistsPageClient'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'
import type { 
  SoloSpecialist, 
  CompanySpecialist, 
  CityData, 
  ServiceData,
  SpecialistsPageInitialData 
} from '@/components/specialists/types'

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600

// Pre-generate pages for all locales at build time
export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }, { locale: 'ru' }]
}

// Server-side data fetching function
async function fetchSpecialistsData(locale: string): Promise<SpecialistsPageInitialData> {
  const supabase = createStaticClient()

  // Fetch all data in parallel for maximum performance
  const [
    soloResult,
    companyResult,
    companiesCountResult,
    specialistsCountResult,
    servicesCountResult,
    citiesResult,
    servicesListResult
  ] = await Promise.all([
    // Solo specialists
    supabase
      .from('profiles')
      .select('id, full_name, role_title, bio, avatar_url, slug, email, phone_number, info_activate')
      .ilike('role', '%solo%')
      .eq('verification_status', 'verified'),
    
    // Company specialists with company info
    supabase
      .from('profiles')
      .select('id, full_name, role_title, bio, avatar_url, company_id, slug, email, phone_number, info_activate')
      .eq('role', 'SPECIALIST')
      .not('company_id', 'is', null)
      .eq('verification_status', 'verified'),
    
    // Statistics
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'COMPANY')
      .eq('verification_status', 'verified'),
    
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('role.eq.SPECIALIST,role.ilike.%solo%')
      .eq('verification_status', 'verified'),
    
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    
    // Cities for filter dropdown
    supabase
      .from('specialist_cities')
      .select('cities(id, name_ka, name_en, name_ru)'),
    
    // Services for filter dropdown
    supabase
      .from('service_translations')
      .select('service_id, title, language, services!inner(id)')
      .eq('language', locale)
      .order('title')
  ])

  const soloData = soloResult.data || []
  const companyData = companyResult.data || []

  // Fetch translations for solo specialists
  let soloWithTranslations: SoloSpecialist[] = []
  if (soloData.length > 0) {
    const { data: soloTranslations } = await supabase
      .from('specialist_translations')
      .select('specialist_id, slug, full_name, role_title, bio')
      .eq('language', locale)
      .in('specialist_id', soloData.map(s => s.id))

    const translationMap = new Map(
      soloTranslations?.map(t => [
        t.specialist_id,
        { slug: t.slug, full_name: t.full_name, role_title: t.role_title, bio: t.bio }
      ]) || []
    )

    soloWithTranslations = soloData.map(specialist => {
      const translation = translationMap.get(specialist.id)
      return {
        ...specialist,
        slug: translation?.slug || specialist.slug,
        full_name: translation?.full_name || specialist.full_name,
        role_title: translation?.role_title || specialist.role_title,
        bio: translation?.bio || specialist.bio,
      }
    })
  }

  // Fetch company info and translations for company specialists
  let companyWithTranslations: CompanySpecialist[] = []
  if (companyData.length > 0) {
    const companyIds = [...new Set(companyData.map(s => s.company_id).filter(Boolean))]

    const [companiesResult, companyTranslationsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, company_slug, email, phone_number')
        .in('id', companyIds)
        .eq('role', 'COMPANY'),
      
      supabase
        .from('specialist_translations')
        .select('specialist_id, slug, full_name, role_title, bio')
        .eq('language', locale)
        .in('specialist_id', companyData.map(s => s.id))
    ])

    const companyMap = new Map(
      companiesResult.data?.map(c => [
        c.id,
        { name: c.full_name, slug: c.company_slug, email: c.email, phone: c.phone_number }
      ]) || []
    )

    const translationMap = new Map(
      companyTranslationsResult.data?.map(t => [
        t.specialist_id,
        { slug: t.slug, full_name: t.full_name, role_title: t.role_title, bio: t.bio }
      ]) || []
    )

    companyWithTranslations = companyData.map(s => {
      const companyInfo = companyMap.get(s.company_id)
      const translation = translationMap.get(s.id)
      return {
        id: s.id,
        full_name: translation?.full_name || s.full_name,
        role_title: translation?.role_title || s.role_title,
        bio: translation?.bio || s.bio,
        avatar_url: s.avatar_url,
        company: companyInfo?.name || 'Company',
        company_slug: companyInfo?.slug,
        company_email: companyInfo?.email,
        company_phone: companyInfo?.phone,
        slug: translation?.slug || s.slug,
        email: s.email,
        phone_number: s.phone_number,
        info_activate: s.info_activate,
      }
    })
  }

  // Process cities data
  const processedCities: CityData[] = []
  const seenCityIds = new Set<string>()
  
  if (citiesResult.data) {
    for (const item of citiesResult.data) {
      // cities could be array or single object from Supabase join
      const citiesData = item.cities
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

  // Process services data
  const processedServices: ServiceData[] = (servicesListResult.data || []).map(s => {
    // services is array from Supabase inner join
    const servicesArray = s.services as Array<{ id: string }> | undefined
    const serviceId = servicesArray?.[0]?.id
    return {
      id: s.service_id || serviceId || '',
      title: s.title,
      service_id: s.service_id,
    }
  }).filter(s => s.id)

  return {
    soloSpecialists: soloWithTranslations,
    companySpecialists: companyWithTranslations,
    stats: {
      totalCompanies: companiesCountResult.count || 0,
      totalSpecialists: specialistsCountResult.count || 0,
      totalServices: servicesCountResult.count || 0,
    },
    cities: processedCities,
    services: processedServices,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata: Record<
    string,
    { title: string; description: string; ogImage: string }
  > = {
    ka: {
      title: 'სპეციალისტების სია | იპოვეთ იურისტი საქართველოში - Legal',
      description:
        'მოძებნეთ და დაუკავშირდით პროფესიონალ იურისტებსა და სპეციალისტებს საქართველოს მასშტაბით. Legal-ზე ნახავთ დამოწმებულ სპეციალისტებს სხვადასხვა პრაქტიკის სფეროში.',
      ogImage: `${baseUrl}/images/og-specialists-ka.jpg`,
    },
    en: {
      title: 'List of Specialists | Find a Lawyer in Georgia - Legal',
      description:
        'Search and connect with professional lawyers and specialists across Georgia. Find verified specialists in various practice areas on Legal.',
      ogImage: `${baseUrl}/images/og-specialists-en.jpg`,
    },
    ru: {
      title: 'Список специалистов | Найти юриста в Грузии - Legal',
      description:
        'Ищите и связывайтесь с профессиональными юристами и специалистами по всей Грузии. На Legal вы найдёте проверенных специалистов в различных областях практики.',
      ogImage: `${baseUrl}/images/og-specialists-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/specialists`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/specialists'),
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
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Server-side data fetching (cached with ISR)
  const initialData = await fetchSpecialistsData(locale)

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SpecialistsPageClient initialData={initialData} locale={locale} />
    </Suspense>
  )
}
