import Hero from '@/components/hero/Hero'
import HomepageBanner from '@/components/news/HomepageBanner'
import FeaturedNewsSection from '@/components/news/FeaturedNewsSection'
import { FeaturedSpecialistsSection } from '@/components/specialists'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'
import type { HeroSlide } from '@/lib/types/hero'

// Types for SSR data

interface BannerData {
  id: string
  image_url_ka: string
  image_url_en: string
  image_url_ru: string
  category_id: string | null
  category_slug?: string | null
}

interface PostTranslation {
  language: string
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
}

interface CategoryTranslation {
  language: string
  name: string
  slug: string
}

interface FeaturedPost {
  id: string
  featured_image_url?: string
  published_at: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  category_id?: string
  post_translations: PostTranslation[]
  category?: {
    id: string
    post_category_translations: CategoryTranslation[]
  }[] | null
}

interface SpecialistTranslation {
  slug: string
  language: string
}

interface FeaturedSpecialistRaw {
  id: string
  full_name: string
  avatar_url?: string | null
  role_title?: string | null
  slug?: string | null
  role: 'SPECIALIST' | 'SOLO_SPECIALIST'
  company_id?: string | null
  verification_status?: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  specialist_translations?: SpecialistTranslation[] | null
  company?: {
    full_name: string
  } | null
}

interface FeaturedSpecialist {
  id: string
  full_name: string
  avatar_url?: string | null
  role_title?: string | null
  slug?: string | null
  role: 'SPECIALIST' | 'SOLO_SPECIALIST'
  company_id?: string | null
  verification_status?: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  company?: {
    full_name: string
  } | null
}

interface HomepageData {
  slides: HeroSlide[]
  banner: BannerData | null
  featuredPosts: FeaturedPost[]
  featuredSpecialists: FeaturedSpecialist[]
}

// Server-side data fetching
async function fetchHomepageData(locale: string): Promise<HomepageData> {
  const supabase = createStaticClient()

  // Fetch all data in parallel for maximum performance
  const [
    slidesResult,
    bannerResult,
    featuredPostsResult,
    featuredSpecialistsResult
  ] = await Promise.all([
    // Hero slides
    supabase
      .from('hero_slides')
      .select('*, buttons:hero_slide_buttons(*)')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),

    // Homepage banner
    supabase
      .from('news_banners')
      .select('id, image_url_ka, image_url_en, image_url_ru, category_id')
      .eq('is_active', true)
      .eq('is_homepage_featured', true)
      .single(),

    // Featured posts
    supabase
      .from('posts')
      .select(`
        id,
        featured_image_url,
        published_at,
        is_homepage_featured,
        homepage_featured_order,
        category_id,
        post_translations!inner(language, title, excerpt, slug, reading_time),
        category:post_categories(
          id,
          post_category_translations(language, name, slug)
        )
      `)
      .eq('status', 'published')
      .eq('is_homepage_featured', true)
      .order('homepage_featured_order', { ascending: true })
      .limit(8),

    // Featured specialists - join with translations to get proper slug
    supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        role_title,
        slug,
        role,
        company_id,
        verification_status,
        is_homepage_featured,
        homepage_featured_order,
        specialist_translations(slug, language)
      `)
      .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
      .eq('verification_status', 'verified')
      .eq('is_homepage_featured', true)
      .order('homepage_featured_order', { ascending: true })
      .limit(8)
  ])

  // Process banner - fetch category slug if needed
  let banner: BannerData | null = null
  if (bannerResult.data && !bannerResult.error) {
    const bannerData = bannerResult.data
    if (bannerData.category_id) {
      const { data: categoryData } = await supabase
        .from('post_category_translations')
        .select('slug')
        .eq('category_id', bannerData.category_id)
        .eq('language', locale)
        .single()
      
      banner = {
        ...bannerData,
        category_slug: categoryData?.slug || null
      }
    } else {
      banner = {
        ...bannerData,
        category_slug: null
      }
    }
  }

  // If not enough featured posts, get regular posts
  let featuredPosts = (featuredPostsResult.data || []) as FeaturedPost[]
  if (featuredPosts.length < 5) {
    const featuredIds = featuredPosts.map(p => p.id)
    const neededCount = 5 - featuredPosts.length
    
    const { data: regularPosts } = await supabase
      .from('posts')
      .select(`
        id,
        featured_image_url,
        published_at,
        is_homepage_featured,
        homepage_featured_order,
        category_id,
        post_translations!inner(language, title, excerpt, slug, reading_time),
        category:post_categories(
          id,
          post_category_translations(language, name, slug)
        )
      `)
      .eq('status', 'published')
      .eq('is_homepage_featured', false)
      .not('id', 'in', featuredIds.length > 0 ? `(${featuredIds.join(',')})` : '()')
      .order('published_at', { ascending: false })
      .limit(neededCount)

    featuredPosts = [...featuredPosts, ...(regularPosts || [])] as FeaturedPost[]
  }

  // Helper function to process specialist and get correct slug for locale
  const processSpecialist = (specialist: FeaturedSpecialistRaw): FeaturedSpecialist => {
    // Try to get slug from translations for current locale
    const translation = specialist.specialist_translations?.find(t => t.language === locale)
    const translatedSlug = translation?.slug
    
    // Check if profiles.slug is valid (not null, empty, or just dash)
    const profileSlug = specialist.slug && specialist.slug.trim() && specialist.slug !== '-' 
      ? specialist.slug 
      : null
    
    // Use translation slug > valid profiles.slug > null
    const finalSlug = translatedSlug || profileSlug || null
    
    return {
      id: specialist.id,
      full_name: specialist.full_name,
      avatar_url: specialist.avatar_url,
      role_title: specialist.role_title,
      slug: finalSlug,
      role: specialist.role,
      company_id: specialist.company_id,
      verification_status: specialist.verification_status,
      is_homepage_featured: specialist.is_homepage_featured,
      homepage_featured_order: specialist.homepage_featured_order,
      company: specialist.company
    }
  }

  // Process featured specialists to get correct slugs
  let featuredSpecialists = (featuredSpecialistsResult.data || [])
    .map((s: unknown) => processSpecialist(s as FeaturedSpecialistRaw))
  
  if (featuredSpecialists.length < 5) {
    const featuredIds = featuredSpecialists.map(s => s.id)
    const neededCount = 5 - featuredSpecialists.length
    
    const { data: randomSpecialists } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        role_title,
        slug,
        role,
        company_id,
        verification_status,
        is_homepage_featured,
        homepage_featured_order,
        specialist_translations(slug, language)
      `)
      .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
      .eq('verification_status', 'verified')
      .eq('is_homepage_featured', false)
      .not('id', 'in', featuredIds.length > 0 ? `(${featuredIds.join(',')})` : '()')
      .limit(neededCount)

    const processedRandom = (randomSpecialists || [])
      .map((s: unknown) => processSpecialist(s as FeaturedSpecialistRaw))
    
    featuredSpecialists = [...featuredSpecialists, ...processedRandom]
  }

  return {
    slides: (slidesResult.data || []) as HeroSlide[],
    banner,
    featuredPosts,
    featuredSpecialists
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
      title: 'იურიდიული მომსახურება და კონსულტაცია | Legal',
      description:
        'იპოვეთ საუკეთესო იურიდიული სპეციალისტები და კომპანიები საქართველოში. პროფესიონალური იურისტები, იურიდიული კონსულტაცია და მომსახურება ყველა სფეროში.',
      ogImage: `${baseUrl}/images/og-home-ka.jpg`,
    },
    en: {
      title: 'Legal Services and Consultation | Legal',
      description:
        'Find the best legal specialists and law firms in Georgia. Professional lawyers, legal consultation and services in all practice areas.',
      ogImage: `${baseUrl}/images/og-home-en.jpg`,
    },
    ru: {
      title: 'Юридические услуги и консультации | Legal',
      description:
        'Найдите лучших юристов и юридические компании в Грузии. Профессиональные адвокаты, юридические консультации и услуги во всех областях.',
      ogImage: `${baseUrl}/images/og-home-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(''),
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

// Pre-generate pages for all locales at build time
export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }, { locale: 'ru' }]
}

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Fetch all homepage data server-side
  const { slides, banner, featuredPosts, featuredSpecialists } = await fetchHomepageData(locale)

  return (
    <>
      <Hero initialSlides={slides} />
      <HomepageBanner initialBanner={banner} />
      <FeaturedNewsSection initialPosts={featuredPosts} />
      <FeaturedSpecialistsSection initialSpecialists={featuredSpecialists} />
    </>
  )
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600
