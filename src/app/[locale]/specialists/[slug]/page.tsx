import SpecialistDetailPage from '@/components/specialists/specialist-detail/SpecialistDetailPage'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const { slug, locale } = resolvedParams
  const baseUrl = 'https://www.legal.ge'
  const supabase = await createClient()

  // Fetch specialist data with translations and company info
  const { data: specialistData, error } = await supabase
    .from('specialist_translations')
    .select(`
      full_name,
      role_title,
      bio,
      slug,
      language,
      specialist_id,
      social_title,
      social_description,
      seo_title,
      seo_description,
      profiles!inner(
        avatar_url,
        social_image_url,
        company_id,
        role
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (error || !specialistData) {
    return {
      title: 'Specialist Not Found | Legal',
      description: 'The specialist you are looking for could not be found.',
    }
  }

  // Extract profile data (Supabase returns profiles as array in select query)
  const specialist = {
    ...specialistData,
    profiles: Array.isArray(specialistData.profiles) 
      ? specialistData.profiles[0] 
      : specialistData.profiles
  }

  // Fetch company info if specialist belongs to a company
  let companyName = null
  if (specialist.profiles?.company_id) {
    const { data: company } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', specialist.profiles.company_id)
      .single()
    
    companyName = company?.full_name || null
  }

  // Create dynamic title and description
  const title = specialist.role_title
    ? `${specialist.full_name}, ${specialist.role_title} | Legal`
    : `${specialist.full_name} | Legal`

  const description = specialist.bio
    ? specialist.bio.substring(0, 160) + (specialist.bio.length > 160 ? '...' : '')
    : `Professional profile of ${specialist.full_name} on Legal.`

  const canonicalUrl =
    locale === 'ka'
      ? `${baseUrl}/specialists/${slug}`
      : `${baseUrl}/${locale}/specialists/${slug}`

  // Use social_image_url for OG image (fallback to avatar_url)
  const socialImageUrl = specialist.profiles?.social_image_url || specialist.profiles?.avatar_url
  const ogImage = socialImageUrl
    ? (socialImageUrl.startsWith('http') ? socialImageUrl : `${baseUrl}/${socialImageUrl}`)
    : `${baseUrl}/asset/images/og-image.jpg`

  // Use social_title and social_description for OpenGraph (with fallbacks)
  const ogTitle = specialist.social_title || specialist.seo_title || title
  const ogDescription = specialist.social_description || specialist.seo_description || description

  // Person Schema for structured data
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: specialist.full_name,
    jobTitle: specialist.role_title || 'Legal Specialist',
    image: ogImage,
    description: specialist.bio || `Professional legal specialist ${specialist.full_name}.`,
    ...(companyName && {
      worksFor: {
        '@type': 'Organization',
        name: companyName,
      },
    }),
    url: canonicalUrl,
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ka': `${baseUrl}/ka/specialists/${slug}`,
        'en': `${baseUrl}/en/specialists/${slug}`,
        'ru': `${baseUrl}/ru/specialists/${slug}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: specialist.full_name,
        },
      ],
      locale: locale,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(personSchema),
    },
  }
}

export default async function SpecialistPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const locale = resolvedParams.locale || 'ka'

  console.log('Page rendered with slug:', slug, 'locale:', locale)

  return <SpecialistDetailPage slug={slug} locale={locale} />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

