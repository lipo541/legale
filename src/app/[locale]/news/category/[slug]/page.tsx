import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CategoryPageClient from './CategoryPageClient'

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

interface PostAuthor {
  id: string
  email: string
  full_name?: string
  role?: string
  company_id?: string
  company?: {
    full_name?: string
    company_slug?: string
  }
}

interface Post {
  id: string
  author?: PostAuthor
  [key: string]: unknown
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  // Fetch category by slug
  const { data: categoryData, error: categoryError } = await supabase
    .from('post_category_translations')
    .select(`
      *,
      category:post_categories!inner(id)
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (categoryError || !categoryData) {
    notFound()
  }

  // Fetch all translations for this category
  const { data: translations } = await supabase
    .from('post_category_translations')
    .select('*')
    .eq('category_id', categoryData.category.id)

  // Fetch ALL categories to build hierarchy
  const { data: allCategories } = await supabase
    .from('post_categories')
    .select('id, parent_id')

  // Recursive function to find all descendant categories
  const findAllDescendants = (parentId: string, categoriesMap: Map<string, string | null>): string[] => {
    const descendants: string[] = []
    
    // Find all direct children
    categoriesMap.forEach((parent, categoryId) => {
      if (parent === parentId) {
        descendants.push(categoryId)
        // Recursively find children of this child
        descendants.push(...findAllDescendants(categoryId, categoriesMap))
      }
    })
    
    return descendants
  }

  // Build category hierarchy map
  const categoryHierarchyMap = new Map<string, string | null>()
  allCategories?.forEach((cat) => {
    categoryHierarchyMap.set(cat.id, cat.parent_id)
  })

  // Find all descendants (subcategories, sub-subcategories, etc.)
  const allDescendantIds = findAllDescendants(categoryData.category.id, categoryHierarchyMap)

  // Create array of category IDs to search: main category + all descendants
  const categoryIdsToSearch = [
    categoryData.category.id,
    ...allDescendantIds
  ]

  // Fetch posts in this category AND all its descendants (recursively)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      *,
      post_translations!inner(
        language,
        title,
        excerpt,
        slug,
        reading_time
      ),
      author:profiles!posts_author_id_fkey(
        id,
        email,
        full_name,
        role,
        company_id
      )
    `)
    .eq('status', 'published')
    .in('category_id', categoryIdsToSearch)
    .eq('post_translations.language', locale)
    .order('published_at', { ascending: false })

  if (postsError) {
    console.error('Error fetching posts:', postsError)
  }

  // Deduplicate posts
  const uniquePosts = posts ? Array.from(
    new Map(posts.map(post => [post.id, post])).values()
  ) : []

  // Fetch company info for specialists
  const companyIds = uniquePosts
    .filter(post => post.author?.role === 'SPECIALIST' && post.author?.company_id)
    .map(post => post.author!.company_id!)

  if (companyIds.length > 0) {
    const { data: companiesData } = await supabase
      .from('profiles')
      .select('id, full_name, company_slug')
      .in('id', [...new Set(companyIds)])

    const companyMap = new Map<string, { full_name: string; company_slug: string }>()
    companiesData?.forEach((company: { id: string; full_name: string | null; company_slug: string | null }) => {
      if (company.id) {
        companyMap.set(company.id, {
          full_name: company.full_name || '',
          company_slug: company.company_slug || ''
        })
      }
    })

    // Attach company info
    uniquePosts.forEach((post: Post) => {
      if (post.author?.company_id && companyMap.has(post.author.company_id)) {
        post.author.company = companyMap.get(post.author.company_id)
      }
    })
  }

  return (
    <CategoryPageClient
      category={{
        id: categoryData.category.id,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        seo_title: categoryData.seo_title,
        seo_description: categoryData.seo_description,
        translations: translations || []
      }}
      posts={uniquePosts}
      locale={locale}
    />
  )
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  // Step 1: Find the category translation by slug and locale to get the category_id
  const { data: categoryData } = await supabase
    .from('post_category_translations')
    .select('category_id, name, seo_title, seo_description')
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!categoryData) {
    return {
      title: 'კატეგორია ვერ მოიძებნა',
      description: 'მოთხოვნილი კატეგორია ვერ მოიძებნა.',
    }
  }

  // Step 2: Fetch all translations for this category to build hreflang tags
  const { data: allTranslations } = await supabase
    .from('post_category_translations')
    .select('language, slug')
    .eq('category_id', categoryData.category_id)

  const languageAlternates: { [key: string]: string } = {}
  if (allTranslations) {
    allTranslations.forEach(trans => {
      languageAlternates[trans.language] = `https://legal.ge/${trans.language}/news/category/${trans.slug}`
    })
  }

  // Build metadata
  const title = categoryData.seo_title || `${categoryData.name} - Legal.ge`
  const description = categoryData.seo_description || `იხილეთ სტატიები კატეგორიაში "${categoryData.name}" Legal.ge-ზე`
  const canonicalUrl = `https://legal.ge/${locale}/news/category/${slug}`
  const ogImage = 'https://legal.ge/asset/images/og-image.jpg'

  // CollectionPage Schema Markup
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryData.name,
    description: description,
    url: canonicalUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Legal.ge',
      url: 'https://www.legal.ge',
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
      'application/ld+json': JSON.stringify(collectionPageSchema),
    },
  }
}

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600
