import CompanyDetailPage from '@/components/companies/company-detail/CompanyDetailPage'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Function to generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = await createClient()

  let companyData: Record<string, unknown> | null = null
  let companyTranslation: Record<string, unknown> | null = null

  if (locale === 'ka') {
    const { data, error } = await supabase.from('profiles').select('*').eq('company_slug', slug).single()
    if (error || !data) {
      console.error('Error fetching Georgian company data:', error)
      notFound()
    }
    companyData = data
  } else {
    const { data: translationData, error: translationError } = await supabase
      .from('company_translations')
      .select('*, company:profiles!inner(*)')
      .eq('slug', slug)
      .eq('language', locale)
      .single()

    if (translationError || !translationData) {
      console.error('Error fetching company translation:', translationError)
      notFound()
    }
    companyData = translationData.company
    companyTranslation = translationData
  }

  if (!companyData) {
    notFound()
  }

  const title = String(companyTranslation?.meta_title || companyData.meta_title || companyTranslation?.company_name || companyData.company_name || 'Company')
  const description = String(companyTranslation?.meta_description || companyData.meta_description || companyTranslation?.summary || companyData.summary || '')
  const ogImage = String(companyData.social_image_url || companyData.logo_url || '/asset/images/og-image.jpg')
  const canonicalUrl = `https://legale.ge/${locale}/companies/${slug}`

  const corporationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: String(companyTranslation?.company_name || companyData.company_name || 'Company'),
    description: String(companyTranslation?.summary || companyData.summary || ''),
    url: canonicalUrl,
    logo: String(companyData.logo_url || ''),
    address: {
      '@type': 'PostalAddress',
      streetAddress: String(companyData.address || ''),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: String(companyData.phone_number || ''),
      contactType: 'customer service',
    },
  }

  return {
    title: `${title} | Legale`,
    description: description,
    keywords: (companyTranslation?.meta_keywords || companyData.meta_keywords) as string | string[] | undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Legale`,
      description: description,
      url: canonicalUrl,
      siteName: 'Legale.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Legale`,
      description: description,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(corporationSchema),
    },
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug, locale } = await params
  
  console.log('Company page rendered with slug:', slug, 'locale:', locale)
  
  return <CompanyDetailPage slug={slug} locale={locale} />
}

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600
