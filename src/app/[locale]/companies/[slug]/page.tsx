import CompanyDetailPage from '@/components/companies/company-detail/CompanyDetailPage'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { siteConfig } from '@/lib/config'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Helper function to check slug ownership and get redirect info
async function getCompanyBySlug(slug: string, locale: string) {
  const supabase = await createClient()
  
  // Check if slug exists in profiles (Georgian slug)
  const { data: kaCompany } = await supabase
    .from('profiles')
    .select('id, company_slug')
    .eq('company_slug', slug)
    .single()
  
  if (kaCompany) {
    // This is a Georgian slug
    if (locale !== 'ka') {
      // User is on non-ka locale with ka slug - redirect to ka
      return { shouldRedirect: true, redirectLocale: 'ka', redirectSlug: slug, companyId: kaCompany.id }
    }
    return { shouldRedirect: false, companyId: kaCompany.id }
  }
  
  // Check in translations table (en, ru slugs)
  const { data: translation } = await supabase
    .from('company_translations')
    .select('company_id, language, slug')
    .eq('slug', slug)
    .single()
  
  if (translation) {
    if (translation.language !== locale) {
      // Slug belongs to different language - redirect
      return { 
        shouldRedirect: true, 
        redirectLocale: translation.language, 
        redirectSlug: slug,
        companyId: translation.company_id 
      }
    }
    return { shouldRedirect: false, companyId: translation.company_id }
  }
  
  return { shouldRedirect: false, companyId: null }
}

// Helper function to get all language alternates for a company
async function getCompanyAlternates(companyId: string) {
  const supabase = await createClient()
  const baseUrl = siteConfig.baseUrl
  const alternates: Record<string, string> = {}
  
  // Get Georgian slug from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_slug')
    .eq('id', companyId)
    .single()
  
  if (profile?.company_slug) {
    alternates['ka'] = `${baseUrl}/ka/companies/${profile.company_slug}`
  }
  
  // Get other language slugs from translations
  const { data: translations } = await supabase
    .from('company_translations')
    .select('language, slug')
    .eq('company_id', companyId)
  
  if (translations) {
    translations.forEach((t) => {
      alternates[t.language] = `${baseUrl}/${t.language}/companies/${t.slug}`
    })
  }
  
  return alternates
}

// Function to generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = await createClient()

  let companyData: Record<string, unknown> | null = null
  let companyTranslation: Record<string, unknown> | null = null
  let companyId: string | null = null

  if (locale === 'ka') {
    const { data, error } = await supabase.from('profiles').select('*').eq('company_slug', slug).single()
    if (error || !data) {
      // Check if slug exists in other languages
      const { data: otherLang } = await supabase
        .from('company_translations')
        .select('language, slug')
        .eq('slug', slug)
        .single()
      
      if (otherLang) {
        return {
          title: 'Redirecting... | Legal',
          robots: { index: false, follow: true },
        }
      }
      console.error('Error fetching Georgian company data:', error)
      notFound()
    }
    companyData = data
    companyId = data.id
  } else {
    const { data: translationData, error: translationError } = await supabase
      .from('company_translations')
      .select('*, company:profiles!inner(*)')
      .eq('slug', slug)
      .eq('language', locale)
      .single()

    if (translationError || !translationData) {
      // Check if it's a Georgian slug or other language slug
      const { data: kaCompany } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_slug', slug)
        .single()
      
      if (kaCompany) {
        return {
          title: 'Redirecting... | Legal',
          robots: { index: false, follow: true },
        }
      }
      
      const { data: otherLang } = await supabase
        .from('company_translations')
        .select('language')
        .eq('slug', slug)
        .single()
      
      if (otherLang) {
        return {
          title: 'Redirecting... | Legal',
          robots: { index: false, follow: true },
        }
      }
      
      console.error('Error fetching company translation:', translationError)
      notFound()
    }
    companyData = translationData.company
    companyTranslation = translationData
    companyId = translationData.company_id
  }

  if (!companyData || !companyId) {
    notFound()
  }

  const title = String(companyTranslation?.meta_title || companyData.meta_title || companyTranslation?.company_name || companyData.company_name || 'Company')
  const description = String(companyTranslation?.meta_description || companyData.meta_description || companyTranslation?.summary || companyData.summary || '')
  const ogImage = String(companyData.social_image_url || companyData.logo_url || '/asset/images/og-image.jpg')
  const canonicalUrl = `${siteConfig.baseUrl}/${locale}/companies/${slug}`

  // Get correct alternates for each language
  const languageAlternates = await getCompanyAlternates(companyId)

  // Breadcrumb labels by locale
  const breadcrumbLabels = {
    ka: { home: 'მთავარი', companies: 'კომპანიები' },
    en: { home: 'Home', companies: 'Companies' },
    ru: { home: 'Главная', companies: 'Компании' },
  }
  const labels = breadcrumbLabels[locale as keyof typeof breadcrumbLabels] || breadcrumbLabels.ka
  const companyName = String(companyTranslation?.company_name || companyData.company_name || 'Company')

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
        name: labels.companies,
        item: `${siteConfig.baseUrl}/${locale}/companies`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: companyName,
        item: canonicalUrl,
      },
    ],
  }

  const corporationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: companyName,
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
    title: `${title} | Legal`,
    description: description,
    keywords: (companyTranslation?.meta_keywords || companyData.meta_keywords) as string | string[] | undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    openGraph: {
      title: `${title} | Legal`,
      description: description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
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
      title: `${title} | Legal`,
      description: description,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify([breadcrumbSchema, corporationSchema]),
    },
  }
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug, locale } = await params
  
  // Check if slug belongs to different language - server-side redirect
  const { shouldRedirect, redirectLocale, redirectSlug } = await getCompanyBySlug(slug, locale)
  
  if (shouldRedirect && redirectLocale && redirectSlug) {
    redirect(`/${redirectLocale}/companies/${encodeURIComponent(redirectSlug)}`)
  }
  
  console.log('Company page rendered with slug:', slug, 'locale:', locale)
  
  return <CompanyDetailPage slug={slug} locale={locale} />
}

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600
