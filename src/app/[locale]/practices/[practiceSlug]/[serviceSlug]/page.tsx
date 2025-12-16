import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createStaticClient } from '@/lib/supabase/static'
import { Locale } from '@/lib/enums'
import ServiceDetail from '@/components/service/ServiceDetail'
import { siteConfig } from '@/lib/config'

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600

type Props = {
  params: Promise<{
    locale: Locale
    practiceSlug: string
    serviceSlug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const { locale, serviceSlug: encodedServiceSlug, practiceSlug: encodedPracticeSlug } = resolvedParams
  const supabase = createStaticClient()

  // Decode URL-encoded slugs
  const serviceSlug = decodeURIComponent(encodedServiceSlug)
  const practiceSlug = decodeURIComponent(encodedPracticeSlug)

  // Find the service translation by its slug
  const { data: translationData } = await supabase
    .from('service_translations')
    .select(`
      service_id, 
      title, 
      meta_title, 
      meta_description, 
      og_title, 
      og_description,
      services!inner (
        og_image_url,
        image_url
      )
    `)
    .eq('slug', serviceSlug)
    .eq('language', locale)
    .maybeSingle()

  if (!translationData) {
    // Return default metadata instead of "not found" - the notFound() will handle the page
    return {
      title: 'LegalGE',
      description: 'Legal services platform',
    }
  }

  // Get all language alternates for this service (for hreflang tags)
  const { data: allServiceTranslations } = await supabase
    .from('service_translations')
    .select('slug, language')
    .eq('service_id', translationData.service_id)

  // Get practice ID for this service
  const { data: serviceInfo } = await supabase
    .from('services')
    .select('practice_id')
    .eq('id', translationData.service_id)
    .single()

  // Get all practice translations for hreflang
  const { data: allPracticeTranslations } = await supabase
    .from('practice_translations')
    .select('slug, language')
    .eq('practice_id', serviceInfo?.practice_id)

  // Build language alternates with correct slugs for each language
  const languageAlternates: Record<string, string> = {}
  if (allServiceTranslations && allPracticeTranslations) {
    for (const serviceTrans of allServiceTranslations) {
      const practiceTrans = allPracticeTranslations.find(pt => pt.language === serviceTrans.language)
      if (practiceTrans) {
        // Ensure URLs are properly encoded
        languageAlternates[serviceTrans.language] = encodeURI(
          `${siteConfig.baseUrl}/${serviceTrans.language}/practices/${practiceTrans.slug}/${serviceTrans.slug}`
        )
      }
    }
  }

  // Get the service data
  const serviceData = Array.isArray(translationData.services) 
    ? translationData.services[0] 
    : translationData.services

  // Build metadata
  const title = translationData.meta_title || translationData.title
  const description = translationData.meta_description || translationData.title
  const ogTitle = translationData.og_title || title
  const ogDescription = translationData.og_description || description
  const ogImage = serviceData?.og_image_url || serviceData?.image_url || '/default-og-image.jpg'
  
  // Ensure canonical URL is properly encoded
  const canonicalUrl = encodeURI(`${siteConfig.baseUrl}/${locale}/practices/${practiceSlug}/${serviceSlug}`)

  // Get practice title for breadcrumb
  const { data: practiceTranslation } = await supabase
    .from('practice_translations')
    .select('title')
    .eq('practice_id', serviceInfo?.practice_id)
    .eq('language', locale)
    .single()

  // Breadcrumb labels by locale
  const breadcrumbLabels = {
    ka: { home: 'მთავარი', practices: 'პრაქტიკები' },
    en: { home: 'Home', practices: 'Practices' },
    ru: { home: 'Главная', practices: 'Практики' },
  }
  const labels = breadcrumbLabels[locale as keyof typeof breadcrumbLabels] || breadcrumbLabels.ka

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.home,
        item: `${siteConfig.baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.practices,
        item: `${siteConfig.baseUrl}/${locale}/practices`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: practiceTranslation?.title || 'Practice',
        item: `${siteConfig.baseUrl}/${locale}/practices/${practiceSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: translationData.title,
        item: canonicalUrl,
      },
    ],
  }

  // LegalService Schema
  const legalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: translationData.title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'Legal.ge',
      url: siteConfig.baseUrl,
    },
    url: canonicalUrl,
    image: ogImage,
    areaServed: {
      '@type': 'Country',
      name: 'Georgia',
    },
  }

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      locale: locale === 'ka' ? 'ka_GE' : locale === 'en' ? 'en_US' : 'ru_RU',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    other: {
      'application/ld+json': JSON.stringify([breadcrumbSchema, legalServiceSchema]),
    },
  }
}

// Main page component
export default async function ServicePage({ params }: Props) {
  const { locale, practiceSlug: encodedPracticeSlug, serviceSlug: encodedServiceSlug } = await params
  const supabase = createStaticClient()

  // Decode URL-encoded slugs
  const practiceSlug = decodeURIComponent(encodedPracticeSlug)
  const serviceSlug = decodeURIComponent(encodedServiceSlug)

  // Step 1: Find the service by slug
  const { data: serviceBySlug } = await supabase
    .from('service_translations')
    .select('service_id, language, slug')
    .eq('slug', serviceSlug)
    .maybeSingle()

  // If slug not found, show 404
  if (!serviceBySlug) {
    notFound()
  }

  // Step 2: If the slug belongs to a different language, redirect to that language's URL (308 permanent)
  if (serviceBySlug.language !== locale) {
    // Get the practice slug in the service's language
    const { data: practiceForService } = await supabase
      .from('services')
      .select('practice_id')
      .eq('id', serviceBySlug.service_id)
      .single()
    
    if (practiceForService) {
      const { data: correctPracticeTranslation } = await supabase
        .from('practice_translations')
        .select('slug')
        .eq('practice_id', practiceForService.practice_id)
        .eq('language', serviceBySlug.language)
        .single()
      
      const correctPracticeSlug = correctPracticeTranslation?.slug || practiceSlug
      const { permanentRedirect } = await import('next/navigation')
      // Encode slugs to handle non-ASCII characters (Georgian, etc.)
      permanentRedirect(`/${serviceBySlug.language}/practices/${encodeURIComponent(correctPracticeSlug)}/${encodeURIComponent(serviceSlug)}`)
    }
  }

  // Step 3: Fetch the full service data with translation
  const { data: serviceData, error } = await supabase
    .from('services')
    .select(`
      id,
      practice_id,
      image_url,
      og_image_url,
      status,
      created_at,
      updated_at,
      service_translations!inner (
        title,
        slug,
        description,
        image_alt,
        word_count,
        reading_time,
        meta_title,
        meta_description,
        og_title,
        og_description,
        language
      )
    `)
    .eq('id', serviceBySlug.service_id)
    .eq('service_translations.language', locale)
    .eq('status', 'published')
    .maybeSingle()

  // If service not found or not published, show 404
  if (error || !serviceData) {
    notFound()
  }

  // Extract translation
  const translation = serviceData.service_translations[0]

  // Step 3: Fetch the practice data for context
  const { data: practiceData } = await supabase
    .from('practices')
    .select(`
      id,
      practice_translations!inner (
        title,
        slug,
        language
      )
    `)
    .eq('id', serviceData.practice_id)
    .eq('practice_translations.language', locale)
    .single()

  if (!practiceData) {
    notFound()
  }

  const practiceTranslation = practiceData.practice_translations[0]

  // If practice slug doesn't match URL, redirect
  if (practiceTranslation.slug !== practiceSlug) {
    const { redirect } = await import('next/navigation')
    redirect(`/${locale}/practices/${encodeURIComponent(practiceTranslation.slug)}/${encodeURIComponent(translation.slug)}`)
  }

  // Prepare data for ServiceDetail component
  const service = {
    id: serviceData.id,
    practiceId: serviceData.practice_id,
    imageUrl: serviceData.image_url,
    ogImageUrl: serviceData.og_image_url,
    status: serviceData.status,
    createdAt: serviceData.created_at,
    updatedAt: serviceData.updated_at,
  }

  const translationData = {
    title: translation.title,
    slug: translation.slug,
    description: translation.description,
    imageAlt: translation.image_alt,
    wordCount: translation.word_count,
    readingTime: translation.reading_time,
    metaTitle: translation.meta_title,
    metaDescription: translation.meta_description,
    ogTitle: translation.og_title,
    ogDescription: translation.og_description,
  }

  const practice = {
    id: practiceData.id,
    title: practiceTranslation.title,
    slug: practiceTranslation.slug,
  }

  return (
    <ServiceDetail
      service={service}
      translation={translationData}
      practice={practice}
      locale={locale}
    />
  )
}

// Generate static params - return empty for faster builds
// ISR will cache pages after first visit (revalidate = 3600)
// This is SEO-safe: meta tags, OG tags, schema.org all render correctly on first request
export async function generateStaticParams() {
  return []
}
