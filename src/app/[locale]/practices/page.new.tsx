import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates, getAssetUrl } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'
import PracticePageClient from '@/components/practice/PracticePageClient'
import type { PracticeData, ServiceData, LocaleString } from '@/components/practice/types'

type Props = {
  params: Promise<{ locale: 'ka' | 'en' | 'ru' }>
}

// ==================== Server-Side Data Fetching ====================
async function fetchPracticesData(locale: LocaleString) {
  const supabase = createStaticClient()

  try {
    // Fetch practices
    const { data: practicesData, error: practicesError } = await supabase
      .from('practices')
      .select(
        `
        id,
        hero_image_url,
        practice_translations!inner (
          title,
          slug,
          description,
          hero_image_alt,
          category
        ),
        services:services!practice_id(count)
      `
      )
      .eq('practice_translations.language', locale)
      .eq('services.status', 'published')

    if (practicesError) {
      console.error('Server: Practices fetch error:', practicesError)
      throw practicesError
    }

    // Fetch services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select(
        `
        id,
        image_url,
        practice_id,
        service_translations!inner (
          title,
          slug,
          description,
          image_alt
        ),
        practices!inner (
          practice_translations!inner (
            title,
            slug
          )
        )
      `
      )
      .eq('service_translations.language', locale)
      .eq('status', 'published')

    if (servicesError) {
      console.error('Server: Services fetch error:', servicesError)
      throw servicesError
    }

    // Filter valid practices
    const practices = (practicesData || []).filter(
      (practice) =>
        practice.practice_translations &&
        practice.practice_translations.length > 0
    ) as PracticeData[]

    // Filter valid services
    const services = (servicesData || []).filter(
      (service) =>
        service.service_translations &&
        service.service_translations.length > 0
    ) as ServiceData[]

    // Extract unique categories
    const categories = Array.from(
      new Set(
        practices
          .map((p) => p.practice_translations[0]?.category)
          .filter(Boolean) as string[]
      )
    )

    return { practices, services, categories }
  } catch (error) {
    console.error('Server: Failed to fetch practices data:', error)
    // Return empty data on error - client will show empty state
    return { practices: [], services: [], categories: [] }
  }
}

// ==================== Static Generation ====================
export async function generateStaticParams() {
  return [
    { locale: 'ka' },
    { locale: 'en' },
    { locale: 'ru' },
  ]
}

// ==================== Metadata ====================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata = {
    ka: {
      title: 'პრაქტიკის სფეროები | Legal',
      description: 'გაეცანით ჩვენს იურიდიულ პრაქტიკებს და სერვისებს. პროფესიონალური იურიდიული მომსახურება ყველა სფეროში - კორპორატიული სამართალი, უძრავი ქონება, საგადასახადო კონსულტაციები და სხვა.',
    },
    en: {
      title: 'Practice Areas | Legal',
      description: 'Explore our legal practice areas and services. Professional legal assistance in all areas - Corporate Law, Real Estate, Tax Consulting, and more.',
    },
    ru: {
      title: 'Области практики | Legal',
      description: 'Ознакомьтесь с нашими юридическими практиками и услугами. Профессиональная юридическая помощь во всех сферах - Корпоративное право, Недвижимость, Налоговое консультирование и др.',
    },
  }

  const currentMetadata = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/practices`
  const ogImage = getAssetUrl(siteConfig.defaultOgImage)

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/practices'),
    },
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: currentMetadata.title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: currentMetadata.title,
      description: currentMetadata.description,
      images: [ogImage],
    },
  }
}

// ==================== Page Component (Server) ====================
export default async function PracticesPage({ params }: Props) {
  const { locale } = await params
  
  // Fetch data on server - will be cached by ISR
  const initialData = await fetchPracticesData(locale)

  return (
    <PracticePageClient 
      initialData={initialData} 
      locale={locale} 
    />
  )
}

// ==================== ISR Configuration ====================
// Revalidate every 1 hour (3600 seconds)
// This ACTUALLY works now because data is fetched server-side!
export const revalidate = 3600
