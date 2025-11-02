import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import PracticeDetail from '@/components/practice/PracticeDetail'

export const revalidate = 0

type Props = {
  params: Promise<{
    locale: 'ka' | 'en' | 'ru'
    practiceSlug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, practiceSlug: encodedSlug } = await params;
  const supabase = await createClient(); // Use server client

  // Decode URL-encoded slug
  const slug = decodeURIComponent(encodedSlug);

  // Step 1: Find the translation by slug and locale to get the practice_id
  const { data: translationData } = await supabase
    .from('practice_translations')
    .select('practice_id, title, meta_title, meta_description, focus_keyword, og_title, og_description, og_image_url')
    .eq('slug', slug)
    .eq('language', locale)
    .single();

  // If no translation found, return "Not Found" metadata
  if (!translationData) {
    return {
      title: 'Practice Not Found',
      description: 'The requested practice could not be found.',
    };
  }

  // Step 2: Check if the practice itself is published
  const { data: practiceData } = await supabase
    .from('practices')
    .select('status')
    .eq('id', translationData.practice_id)
    .eq('status', 'published')
    .single();

  // If practice is not found or not published, return "Not Found" metadata
  if (!practiceData) {
    return {
      title: 'Practice Not Found',
      description: 'The requested practice could not be found.',
    };
  }

  // Use the fetched translation data to build metadata
  const title = translationData.meta_title || translationData.title;
  const description = translationData.meta_description || 'Default description if none provided'; // Provide a fallback
  const ogTitle = translationData.og_title || title;
  const ogDescription = translationData.og_description || description;
  const ogImage = translationData.og_image_url || '/default-og-image.jpg'; // Ensure this default image exists in /public

  return {
    title,
    description,
    keywords: translationData.focus_keyword || undefined,
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
      // Make sure the canonical URL is correct
      canonical: `https://legale-opal.vercel.app/${locale}/practices/${slug}`,
    },
  };
}

// Main page component
export default async function PracticePage({ params }: Props) {
  const { locale, practiceSlug: encodedSlug } = await params
  const supabase = await createClient()

  // Decode URL-encoded slug (for Georgian/Cyrillic characters)
  const slug = decodeURIComponent(encodedSlug)

  // Step 1: Find the practice by slug (in any language)
  const { data: practiceBySlug } = await supabase
    .from('practice_translations')
    .select('practice_id, language, slug')
    .eq('slug', slug)
    .single()

  // If slug not found in any language, show 404
  if (!practiceBySlug) {
    notFound()
  }

  // Step 2: Fetch the full practice data with the translation for the requested locale
  const { data: practiceData, error } = await supabase
    .from('practices')
    .select(`
      id,
      hero_image_url,
      page_hero_image_url,
      status,
      created_at,
      updated_at,
      practice_translations!inner (
        title,
        slug,
        description,
        hero_image_alt,
        page_hero_image_alt,
        word_count,
        reading_time,
        meta_title,
        meta_description,
        focus_keyword,
        og_title,
        og_description,
        og_image_url,
        language
      )
    `)
    .eq('id', practiceBySlug.practice_id)
    .eq('practice_translations.language', locale)
    .eq('status', 'published')
    .maybeSingle()

  // If practice not found or not published, show 404
  if (error || !practiceData) {
    notFound()
  }

  // Extract translation
  const translation = practiceData.practice_translations[0]

  // If the current slug doesn't match the locale's slug, redirect to correct slug
  if (translation.slug !== slug) {
    const { redirect } = await import('next/navigation')
    redirect(`/${locale}/practices/${translation.slug}`)
  }

  // Prepare data for PracticeDetail component
  const practice = {
    id: practiceData.id,
    heroImageUrl: practiceData.hero_image_url,
    pageHeroImageUrl: practiceData.page_hero_image_url,
    status: practiceData.status,
    createdAt: practiceData.created_at,
    updatedAt: practiceData.updated_at,
  }

  const translationData = {
    title: translation.title,
    slug: translation.slug,
    description: translation.description,
    heroImageAlt: translation.hero_image_alt,
    pageHeroImageAlt: translation.page_hero_image_alt,
    wordCount: translation.word_count,
    readingTime: translation.reading_time,
    metaTitle: translation.meta_title,
    metaDescription: translation.meta_description,
    focusKeyword: translation.focus_keyword,
    ogTitle: translation.og_title,
    ogDescription: translation.og_description,
    ogImageUrl: translation.og_image_url,
  }

  return (
    <PracticeDetail
      practice={practice}
      translation={translationData}
      locale={locale}
    />
  )
}

// Generate static params for all practices (optional - for static generation)
export async function generateStaticParams() {
  // Use browser client for build-time data fetching (no cookies needed)
  const supabase = createBrowserClient()

  // Fetch all published practice slugs for all languages
  const { data: practices } = await supabase
    .from('practices')
    .select(`
      practice_translations (
        slug,
        language
      )
    `)
    .eq('status', 'published')

  if (!practices) return []

  // Flatten and map to params format
  const params: Array<{ locale: string; practiceSlug: string }> = []
  
  practices.forEach((practice: Record<string, unknown>) => {
    if (practice.practice_translations) {
      (practice.practice_translations as Array<{ language: string; slug: string }>).forEach((translation) => {
        params.push({
          locale: translation.language,
          practiceSlug: translation.slug,
        })
      })
    }
  })

  return params
}
