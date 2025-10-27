import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import ServiceDetail from '@/components/service/ServiceDetail'

export const revalidate = 0

type Props = {
  params: Promise<{
    locale: 'ka' | 'en' | 'ru'
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

  // Find the service translation by slug and language
  const { data: serviceTranslation } = await supabase
    .from('service_translations')
    .select(`
      title,
      description,
      meta_title,
      meta_description,
      og_title,
      og_description,
      og_image_url,
      service_id
    `)
    .eq('slug', serviceSlug)
    .eq('language', locale)
    .single()

  if (!serviceTranslation) {
    return {
      title: 'Service Not Found',
      description: 'The requested service could not be found.',
    }
  }

  const title = serviceTranslation.meta_title || serviceTranslation.title
  const description = serviceTranslation.meta_description || serviceTranslation.description || 'Service description'
  const ogTitle = serviceTranslation.og_title || title
  const ogDescription = serviceTranslation.og_description || description
  const ogImage = serviceTranslation.og_image_url || '/default-og-image.jpg'

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      locale: locale === 'ka' ? 'ka_GE' : locale === 'en' ? 'en_US' : 'ru_RU',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://legale-opal.vercel.app/${locale}/practices/${practiceSlug}/${serviceSlug}`,
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

  // Step 1: Find the service translation by slug
  const { data: serviceBySlug } = await supabase
    .from('service_translations')
    .select('service_id, language, slug')
    .eq('slug', serviceSlug)
    .eq('language', locale)
    .single()

  if (!serviceBySlug) {
    notFound()
  }

  // Step 2: Fetch the full service data
  const { data: serviceData, error: serviceError } = await supabase
    .from('services')
    .select(`
      id,
      practice_id,
      status,
      created_at,
      updated_at
    `)
    .eq('id', serviceBySlug.service_id)
    .eq('status', 'published')
    .single()

  if (serviceError || !serviceData) {
    notFound()
  }

  // Step 3: Fetch service translation
  const { data: translation } = await supabase
    .from('service_translations')
    .select('*')
    .eq('service_id', serviceData.id)
    .eq('language', locale)
    .single()

  if (!translation) {
    notFound()
  }

  // Step 4: Fetch practice translation to verify the practice slug
  const { data: practiceTranslation } = await supabase
    .from('practice_translations')
    .select('*')
    .eq('practice_id', serviceData.practice_id)
    .eq('language', locale)
    .single()

  if (!practiceTranslation || practiceTranslation.slug !== practiceSlug) {
    notFound()
  }

  // Step 5: Fetch practice data
  const { data: practice } = await supabase
    .from('practices')
    .select('*')
    .eq('id', serviceData.practice_id)
    .single()

  if (!practice) {
    notFound()
  }

  // Prepare data for ServiceDetail component
  const service = {
    id: serviceData.id,
    practiceId: serviceData.practice_id,
    imageUrl: translation.og_image_url || '/default-service-image.jpg',
    ogImageUrl: translation.og_image_url,
    status: serviceData.status,
    createdAt: serviceData.created_at,
    updatedAt: serviceData.updated_at,
  }

  const translationData = {
    title: translation.title,
    slug: translation.slug,
    description: translation.description,
    imageAlt: translation.title,
    wordCount: translation.word_count,
    readingTime: translation.reading_time,
    metaTitle: translation.meta_title,
    metaDescription: translation.meta_description,
    focusKeyword: translation.focus_keyword,
    ogTitle: translation.og_title,
    ogDescription: translation.og_description,
    ogImageUrl: translation.og_image_url,
  }

  const practiceData = {
    id: practice.id,
    title: practiceTranslation.title,
    slug: practiceTranslation.slug,
    heroImageUrl: practice.hero_image_url,
    pageHeroImageUrl: practice.page_hero_image_url,
  }

  return (
    <ServiceDetail
      service={service}
      translation={translationData}
      practice={practiceData}
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
