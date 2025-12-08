import SpecialistDetailPage from '@/components/specialists/specialist-detail/SpecialistDetailPage'
import { createStaticClient } from '@/lib/supabase/static'
import { Metadata } from 'next'
import { siteConfig, getAssetUrl } from '@/lib/config'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

// Helper function to get specialist data by slug (checks language match)
async function getSpecialistBySlug(slug: string, locale: string) {
  const supabase = createStaticClient()
  
  // First check if slug exists in ANY language
  const { data: slugCheck } = await supabase
    .from('specialist_translations')
    .select('specialist_id, language, slug')
    .eq('slug', slug)
    .single()
  
  if (!slugCheck) {
    return { specialist: null, shouldRedirect: false, redirectLocale: null }
  }
  
  // If slug's language doesn't match current locale, we need to redirect
  if (slugCheck.language !== locale) {
    return { 
      specialist: null, 
      shouldRedirect: true, 
      redirectLocale: slugCheck.language,
      redirectSlug: slugCheck.slug 
    }
  }
  
  return { specialist: slugCheck, shouldRedirect: false, redirectLocale: null }
}

// Helper function to get all language alternates for a specialist
async function getSpecialistAlternates(specialistId: string) {
  const supabase = createStaticClient()
  
  const { data: translations } = await supabase
    .from('specialist_translations')
    .select('language, slug')
    .eq('specialist_id', specialistId)
  
  const alternates: Record<string, string> = {}
  const baseUrl = siteConfig.baseUrl
  
  if (translations) {
    translations.forEach((t) => {
      alternates[t.language] = `${baseUrl}/${t.language}/specialists/${t.slug}`
    })
  }
  
  return alternates
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const { slug, locale } = resolvedParams
  const baseUrl = siteConfig.baseUrl
  const supabase = createStaticClient()

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
      social_image_url,
      seo_title,
      seo_description,
      profiles!inner(
        avatar_url,
        company_id,
        role
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (error || !specialistData) {
    // Try to find in any language for better error handling
    const { data: anyLangData } = await supabase
      .from('specialist_translations')
      .select('specialist_id, language, slug')
      .eq('slug', slug)
      .single()
    
    if (anyLangData && anyLangData.language !== locale) {
      // Slug exists but in different language - metadata for redirect page
      return {
        title: 'Redirecting... | Legal',
        robots: { index: false, follow: true },
      }
    }
    
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

  const canonicalUrl = `${baseUrl}/${locale}/specialists/${slug}`

  // Use social_image_url for OG image (fallback to avatar_url)
  const socialImageUrl = specialist.social_image_url || specialist.profiles?.avatar_url
  
  // Construct proper Supabase Storage URL for social_image_url
  let ogImage: string
  if (socialImageUrl) {
    if (socialImageUrl.startsWith('http')) {
      // Already a full URL (like avatar_url from Supabase)
      ogImage = socialImageUrl
    } else {
      // It's a file path - construct Supabase Storage URL for specialist-social-images bucket
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fbxooowagcadiqpppniy.supabase.co'
      ogImage = `${supabaseUrl}/storage/v1/object/public/specialist-social-images/${socialImageUrl}`
    }
  } else {
    ogImage = getAssetUrl(siteConfig.defaultOgImage)
  }

  // Use social_title and social_description for OpenGraph (with fallbacks)
  const ogTitle = specialist.social_title || specialist.seo_title || title
  const ogDescription = specialist.social_description || specialist.seo_description || description

  // Get correct alternates for each language (with their own slugs)
  const languageAlternates = await getSpecialistAlternates(specialist.specialist_id)

  // Breadcrumb labels by locale
  const breadcrumbLabels = {
    ka: { home: 'მთავარი', specialists: 'სპეციალისტები' },
    en: { home: 'Home', specialists: 'Specialists' },
    ru: { home: 'Главная', specialists: 'Специалисты' },
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
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.specialists,
        item: `${baseUrl}/${locale}/specialists`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: specialist.full_name,
        item: canonicalUrl,
      },
    ],
  }

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
    hasOccupation: {
      '@type': 'Occupation',
      name: specialist.role_title || 'Legal Specialist',
      occupationLocation: {
        '@type': 'Country',
        name: 'Georgia',
      },
    },
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
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
      'application/ld+json': JSON.stringify([breadcrumbSchema, personSchema]),
    },
  }
}

export default async function SpecialistPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const locale = resolvedParams.locale || 'ka'

  // Check if slug belongs to different language - server-side redirect
  const { shouldRedirect, redirectLocale, redirectSlug } = await getSpecialistBySlug(slug, locale)
  
  if (shouldRedirect && redirectLocale && redirectSlug) {
    const { redirect } = await import('next/navigation')
    redirect(`/${redirectLocale}/specialists/${encodeURIComponent(redirectSlug)}`)
  }

  console.log('Page rendered with slug:', slug, 'locale:', locale)

  return <SpecialistDetailPage slug={slug} locale={locale} />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

