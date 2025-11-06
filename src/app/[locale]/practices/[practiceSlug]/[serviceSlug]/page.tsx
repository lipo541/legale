import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Locale } from '@/lib/enums'
import ServiceDetail from '@/components/service/ServiceDetail'

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
  const supabase = await createClient()

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
      canonical: `https://legal.ge/${locale}/practices/${practiceSlug}/${serviceSlug}`,
    },
  }
}

// Main page component
export default async function ServicePage({ params }: Props) {
  const { locale, practiceSlug: encodedPracticeSlug, serviceSlug: encodedServiceSlug } = await params
  const supabase = await createClient()

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

  // Step 2: Fetch the full service data with translation
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
    redirect(`/${locale}/practices/${practiceTranslation.slug}/${translation.slug}`)
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

// Generate static params for all services
export async function generateStaticParams() {
  const supabase = createBrowserClient()

  // Fetch all published services with their practice slugs
  const { data: services } = await supabase
    .from('services')
    .select(`
      practice_id,
      service_translations (
        slug,
        language
      )
    `)
    .eq('status', 'published')

  if (!services) return []

  // For each service, get its practice slug
  const params: Array<{ locale: string; practiceSlug: string; serviceSlug: string }> = []

  for (const service of services) {
    if (!service.service_translations) continue

    // Fetch practice slugs
    const { data: practice } = await supabase
      .from('practices')
      .select('practice_translations (slug, language)')
      .eq('id', service.practice_id)
      .single()

    if (!practice?.practice_translations) continue

    // Combine practice and service slugs
    service.service_translations.forEach((serviceTranslation: { slug: string; language: string }) => {
      const practiceTranslation = practice.practice_translations.find(
        (pt: { slug: string; language: string }) => pt.language === serviceTranslation.language
      )

      if (practiceTranslation) {
        params.push({
          locale: serviceTranslation.language,
          practiceSlug: practiceTranslation.slug,
          serviceSlug: serviceTranslation.slug,
        })
      }
    })
  }

  return params
}
