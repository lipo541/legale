import { Metadata } from 'next'
import NewsLayout from '@/components/news/NewsLayout'
import { siteConfig, getLanguageAlternates, getAssetUrl } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'
import type { Post, Category, NewsPageInitialData } from '@/components/news/types'

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

// Pre-generate pages for all locales at build time
export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }, { locale: 'ru' }]
}

type Props = {
  params: Promise<{
    locale: 'ka' | 'en' | 'ru'
  }>
}

// ============================================================================
// SERVER-SIDE DATA FETCHING
// ============================================================================

async function fetchNewsData(locale: string): Promise<NewsPageInitialData> {
  const supabase = createStaticClient()

  // Fetch posts and categories in parallel
  const [postsResult, categoriesResult, postsCountResult] = await Promise.all([
    // Fetch all published posts with translations
    supabase
      .from('posts')
      .select(`
        *,
        post_translations!inner (*),
        display_settings:post_display_settings(focal_point_x, focal_point_y),
        author:profiles!posts_author_id_fkey(id, email, full_name, role, company_id)
      `)
      .eq('status', 'published')
      .eq('post_translations.language', locale)
      .order('published_at', { ascending: false }),

    // Fetch root categories for filters
    supabase
      .from('post_category_translations')
      .select(`
        category_id,
        name,
        slug,
        post_categories!inner(parent_id)
      `)
      .eq('language', locale)
      .is('post_categories.parent_id', null),

    // Get total posts count
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
  ])

  // Process posts - deduplicate by ID
  const posts: Post[] = postsResult.data 
    ? Array.from(new Map(postsResult.data.map((post: Post) => [post.id, post])).values())
    : []

  // Process categories
  const categories: Category[] = (categoriesResult.data || []).map((cat: { 
    category_id: string
    name: string
    slug: string 
  }) => ({
    id: cat.category_id,
    name: cat.name,
    slug: cat.slug,
    parent_id: null
  }))

  return {
    posts,
    categories,
    stats: {
      totalPosts: postsCountResult.count || 0,
      totalCategories: categories.length
    }
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata = {
    ka: {
      title: 'სიახლეები - Legal.ge | იურიდიული სიახლეები და ანალიტიკა',
      description: 'იყავით საქმის კურსში საქართველოსა და მსოფლიოს უახლესი იურიდიული სიახლეების, კანონმდებლობის ცვლილებებისა და ექსპერტული ანალიზის შესახებ Legal.ge-ზე.',
    },
    en: {
      title: 'News - Legal.ge | Legal News and Analysis',
      description: 'Stay informed about the latest legal news, legislative changes, and expert analysis from Georgia and around the world on Legal.ge.',
    },
    ru: {
      title: 'Новости - Legal.ge | Юридические новости и аналитика',
      description: 'Будьте в курсе последних юридических новостей, изменений в законодательстве и экспертного анализа из Грузии и со всего мира на Legal.ge.',
    },
  }

  const { title, description } = metadata[locale]
  const canonicalUrl = `${baseUrl}/${locale}/news`
  const ogImage = getAssetUrl(siteConfig.defaultOgImage)

  // WebPage Schema Markup
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: description,
    url: canonicalUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: baseUrl,
    },
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/news'),
    },
    openGraph: {
      title,
      description,
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
      title,
      description,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(webPageSchema),
    },
  }
}

export default async function NewsPage({ params }: Props) {
  const { locale } = await params
  
  // Fetch data on the server
  const initialData = await fetchNewsData(locale)
  
  return <NewsLayout locale={locale} initialData={initialData} />
}
