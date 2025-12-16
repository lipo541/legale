import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createStaticClient } from '@/lib/supabase/static'
import { Locale } from '@/lib/enums'
import PracticeDetail from '@/components/practice/PracticeDetail'
import { siteConfig, getAssetUrl } from '@/lib/config'

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600

type Props = {
  params: Promise<{
    locale: Locale
    practiceSlug: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, practiceSlug: encodedSlug } = await params;
  const supabase = createStaticClient(); // Use static client for ISR

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

  // Step 3: Fetch all translations for the practice to build hreflang tags
  const { data: allTranslations } = await supabase
    .from('practice_translations')
    .select('language, slug')
    .eq('practice_id', translationData.practice_id);

  const languageAlternates: { [key: string]: string } = {};
  if (allTranslations) {
    allTranslations.forEach(trans => {
      // Ensure URLs are properly encoded
      languageAlternates[trans.language] = encodeURI(
        `${siteConfig.baseUrl}/${trans.language}/practices/${trans.slug}`
      );
    });
  }

  // Use the fetched translation data to build metadata
  const title = `${translationData.meta_title || translationData.title} - იურიდიული კონსულტაცია | Legal`;
  const description = translationData.meta_description || 'პროფესიონალური იურიდიული კონსულტაცია და მომსახურება Legal.ge-ზე';
  const ogTitle = translationData.og_title || translationData.meta_title || translationData.title;
  const ogDescription = translationData.og_description || description;
  const ogImage = translationData.og_image_url || getAssetUrl(siteConfig.defaultOgImage);
  
  // Ensure canonical URL is properly encoded
  const canonicalUrl = encodeURI(`${siteConfig.baseUrl}/${locale}/practices/${slug}`);

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
        name: translationData.title,
        item: canonicalUrl,
      },
    ],
  }

  // Service Schema Markup (for legal practice area)
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: translationData.title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'Legal.ge',
    },
    url: canonicalUrl,
    serviceType: 'Legal Service',
  };

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
          alt: ogTitle,
        },
      ],
      locale: locale,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify([breadcrumbSchema, serviceSchema]),
    },
  };
}

// Main page component
export default async function PracticePage({ params }: Props) {
  const { locale, practiceSlug: encodedSlug } = await params
  const supabase = createStaticClient()

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

  // Step 2: If the slug belongs to a different language, redirect to that language's URL
  // This ensures /ka/practices/tax-and-accounting redirects to /en/practices/tax-and-accounting
  // Using permanentRedirect (308) so Google treats this as permanent and updates index
  if (practiceBySlug.language !== locale) {
    const { permanentRedirect } = await import('next/navigation')
    // Encode slug to handle non-ASCII characters (Georgian, etc.)
    permanentRedirect(`/${practiceBySlug.language}/practices/${encodeURIComponent(slug)}`)
  }

  // Step 3: Fetch the full practice data with the translation for the requested locale
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

  // Extract translation (slug already matches locale at this point)
  const translation = practiceData.practice_translations[0]

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
  // Use static client for build-time data fetching (no cookies needed)
  const supabase = createStaticClient()

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
