import { Suspense } from 'react'
import CategoriesPageClient from '@/components/service/CategoriesPageClient'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates, getAssetUrl } from '@/lib/config'
import { createStaticClient } from '@/lib/supabase/static'

type Props = {
  params: Promise<{ locale: 'ka' | 'en' | 'ru' }>
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600

// Pre-generate pages for all locales at build time
export async function generateStaticParams() {
  return [{ locale: 'ka' }, { locale: 'en' }, { locale: 'ru' }]
}

// Types for category data
interface CategoryTranslation {
  name: string
  slug: string
}

interface CategoryData {
  id: string
  parent_id: string | null
  sort_order: number
  is_active: boolean
  service_category_translations: CategoryTranslation[]
  services: { count: number }[]
}

// Server-side data fetching function
async function fetchCategoriesData(locale: string) {
  const supabase = createStaticClient()
  
  // Fetch categories with translations and service count
  const { data: categoriesData, error } = await supabase
    .from('service_categories')
    .select(`
      id,
      parent_id,
      sort_order,
      is_active,
      service_category_translations!inner (
        name,
        slug
      ),
      services:services!category_id(count)
    `)
    .eq('is_active', true)
    .eq('service_category_translations.language', locale)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], parentCategories: [], childCategories: {} }
  }

  const categories = (categoriesData || []) as CategoryData[]

  // Separate parent and child categories
  const parentCategories = categories.filter(c => c.parent_id === null)
  
  // Group children by parent_id
  const childCategories: Record<string, CategoryData[]> = {}
  categories.forEach(cat => {
    if (cat.parent_id) {
      if (!childCategories[cat.parent_id]) {
        childCategories[cat.parent_id] = []
      }
      childCategories[cat.parent_id].push(cat)
    }
  })

  return { categories, parentCategories, childCategories }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata = {
    ka: {
      title: 'სერვისების კატეგორიები | Legal.ge',
      description: 'გაეცანით იურიდიული სერვისების კატეგორიებს. იპოვეთ თქვენთვის საჭირო იურიდიული მომსახურება კატეგორიების მიხედვით.',
    },
    en: {
      title: 'Service Categories | Legal.ge',
      description: 'Browse legal service categories. Find the legal services you need organized by category.',
    },
    ru: {
      title: 'Категории услуг | Legal.ge',
      description: 'Ознакомьтесь с категориями юридических услуг. Найдите нужные юридические услуги по категориям.',
    },
  }

  const currentMetadata = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/service`
  const ogImage = getAssetUrl(siteConfig.defaultOgImage)

  // CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: currentMetadata.title,
    description: currentMetadata.description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Legal.ge',
      url: siteConfig.baseUrl,
    },
  }

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/service'),
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
    other: {
      'application/ld+json': JSON.stringify(collectionSchema),
    },
  }
}

// Server Component - fetches data at build time / ISR
export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params
  
  // Server-side data fetching (cached with ISR)
  const initialData = await fetchCategoriesData(locale)
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <CategoriesPageClient initialData={initialData} locale={locale} />
    </Suspense>
  )
}
