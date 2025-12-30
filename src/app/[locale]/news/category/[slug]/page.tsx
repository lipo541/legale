import { createStaticClient } from '@/lib/supabase/static'
import { notFound, permanentRedirect } from 'next/navigation'
import CategoryPageClient from './CategoryPageClient'
import { siteConfig, getAssetUrl } from '@/lib/config'

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

// Helper function to check slug ownership and get redirect info
async function getCategoryBySlug(slug: string, locale: string) {
  const supabase = createStaticClient()
  
  // Check if slug exists in ANY language
  const { data: slugCheck } = await supabase
    .from('post_category_translations')
    .select('category_id, language, slug')
    .eq('slug', slug)
    .single()
  
  if (!slugCheck) {
    return { shouldRedirect: false, categoryId: null }
  }
  
  // If slug's language doesn't match current locale, we need to redirect
  if (slugCheck.language !== locale) {
    return { 
      shouldRedirect: true, 
      redirectLocale: slugCheck.language,
      redirectSlug: slugCheck.slug,
      categoryId: slugCheck.category_id
    }
  }
  
  return { shouldRedirect: false, categoryId: slugCheck.category_id }
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug: encodedSlug } = await params
  const slug = decodeURIComponent(encodedSlug)
  const supabase = createStaticClient()

  // Check if slug belongs to different language - server-side redirect (308 permanent)
  const { shouldRedirect, redirectLocale, redirectSlug } = await getCategoryBySlug(slug, locale)
  
  if (shouldRedirect && redirectLocale && redirectSlug) {
    permanentRedirect(`/${redirectLocale}/news/category/${encodeURIComponent(redirectSlug)}`)
  }

  // Fetch category by slug with parent_id
  const { data: categoryData, error: categoryError } = await supabase
    .from('post_category_translations')
    .select(`
      *,
      category:post_categories!inner(id, parent_id)
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

  // Fetch ALL categories with translations to build hierarchy and breadcrumbs
  const { data: allCategories } = await supabase
    .from('post_categories')
    .select('id, parent_id')
    
  // Fetch all category translations for breadcrumb names
  const { data: allCategoryTranslations } = await supabase
    .from('post_category_translations')
    .select('category_id, name, slug')
    .eq('language', locale)

  // Build parent hierarchy (breadcrumbs)
  const buildBreadcrumbs = (categoryId: string): Array<{ id: string; name: string; slug: string }> => {
    const breadcrumbs: Array<{ id: string; name: string; slug: string }> = []
    let currentId: string | null = categoryId
    
    // Find the parent_id for current category
    const categoryMap = new Map<string, string | null>()
    allCategories?.forEach(cat => categoryMap.set(cat.id, cat.parent_id))
    
    // Translation map for names/slugs
    const translationMap = new Map<string, { name: string; slug: string }>()
    allCategoryTranslations?.forEach(t => {
      translationMap.set(t.category_id, { name: t.name, slug: t.slug })
    })
    
    // Walk up the hierarchy
    while (currentId) {
      const parentId = categoryMap.get(currentId)
      if (parentId) {
        const parentTranslation = translationMap.get(parentId)
        if (parentTranslation) {
          breadcrumbs.unshift({
            id: parentId,
            name: parentTranslation.name,
            slug: parentTranslation.slug
          })
        }
        currentId = parentId
      } else {
        break
      }
    }
    
    return breadcrumbs
  }

  const parentBreadcrumbs = buildBreadcrumbs(categoryData.category.id)

  // Fetch ALL published posts with their category_id to count posts per category
  const { data: allPublishedPosts } = await supabase
    .from('posts')
    .select('category_id')
    .eq('status', 'published')
    .not('category_id', 'is', null)

  // Build post counts per category (direct posts only)
  const postCountsByCategory = new Map<string, number>()
  allPublishedPosts?.forEach(post => {
    if (post.category_id) {
      postCountsByCategory.set(post.category_id, (postCountsByCategory.get(post.category_id) || 0) + 1)
    }
  })

  // Build category hierarchy map (needed for recursive post counting)
  const categoryHierarchyMap = new Map<string, string | null>()
  allCategories?.forEach((cat) => {
    categoryHierarchyMap.set(cat.id, cat.parent_id)
  })

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

  // Helper function to count total posts in category + all its descendants
  const getTotalPostsInCategory = (categoryId: string): number => {
    const directPosts = postCountsByCategory.get(categoryId) || 0
    const descendants = findAllDescendants(categoryId, categoryHierarchyMap)
    const descendantPosts = descendants.reduce((sum, descId) => {
      return sum + (postCountsByCategory.get(descId) || 0)
    }, 0)
    return directPosts + descendantPosts
  }

  // Get sibling categories (same parent_id as current category) - only with posts (including descendants)
  const currentParentId = categoryData.category.parent_id
  const siblingCategories = allCategories
    ?.filter(cat => cat.parent_id === currentParentId && cat.id !== categoryData.category.id)
    .map(cat => {
      const translation = allCategoryTranslations?.find(t => t.category_id === cat.id)
      const totalPosts = getTotalPostsInCategory(cat.id)
      return {
        id: cat.id,
        name: translation?.name || '',
        slug: translation?.slug || '',
        postCount: totalPosts
      }
    })
    .filter(cat => cat.name && cat.postCount > 0) || []

  // Get ALL descendants of current category (for filtering) - not just direct children
  // This includes children, grandchildren, etc. - flat list for filter UI
  const allDescendantIdsForFilter = findAllDescendants(categoryData.category.id, categoryHierarchyMap)
  const childCategories = allDescendantIdsForFilter
    .map(catId => {
      const cat = allCategories?.find(c => c.id === catId)
      const translation = allCategoryTranslations?.find(t => t.category_id === catId)
      const totalPosts = getTotalPostsInCategory(catId)
      return {
        id: catId,
        name: translation?.name || '',
        slug: translation?.slug || '',
        postCount: totalPosts,
        depth: getDepth(catId, categoryData.category.id, categoryHierarchyMap) // For indentation
      }
    })
    .filter(cat => cat.name && cat.postCount > 0) || []

  // Helper to calculate depth from current category
  function getDepth(categoryId: string, rootId: string, hierarchyMap: Map<string, string | null>): number {
    let depth = 0
    let currentId: string | null = categoryId
    while (currentId && currentId !== rootId) {
      const parentId = hierarchyMap.get(currentId)
      if (parentId === rootId) {
        depth++
        break
      }
      if (parentId) {
        depth++
        currentId = parentId
      } else {
        break
      }
    }
    return depth
  }

  // Find all descendants (subcategories, sub-subcategories, etc.)
  const allDescendantIds = findAllDescendants(categoryData.category.id, categoryHierarchyMap)

  // Build subcategory map for badge display (all descendant categories with their translations)
  const subcategoryMap = allDescendantIds.map(catId => {
    const translation = allCategoryTranslations?.find(t => t.category_id === catId)
    const categoryInfo = allCategories?.find(c => c.id === catId)
    return {
      id: catId,
      name: translation?.name || '',
      slug: translation?.slug || '',
      parent_id: categoryInfo?.parent_id || null
    }
  })

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
      parentBreadcrumbs={parentBreadcrumbs}
      siblingCategories={siblingCategories}
      childCategories={childCategories}
      subcategoryMap={subcategoryMap}
    />
  )
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug: encodedSlug } = await params
  const slug = decodeURIComponent(encodedSlug)
  const supabase = createStaticClient()

  // Step 1: Find the category translation by slug and locale to get the category_id
  const { data: categoryData } = await supabase
    .from('post_category_translations')
    .select('category_id, name, seo_title, seo_description')
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!categoryData) {
    // Check if slug exists in other language
    const { data: otherLang } = await supabase
      .from('post_category_translations')
      .select('language')
      .eq('slug', slug)
      .single()
    
    if (otherLang) {
      return {
        title: 'Redirecting... | Legal',
        robots: { index: false, follow: true },
      }
    }
    
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
      languageAlternates[trans.language] = encodeURI(`${siteConfig.baseUrl}/${trans.language}/news/category/${trans.slug}`)
    })
  }

  // Build metadata
  const title = categoryData.seo_title || `${categoryData.name} - Legal.ge`
  const description = categoryData.seo_description || `იხილეთ სტატიები კატეგორიაში "${categoryData.name}" Legal.ge-ზე`
  const canonicalUrl = encodeURI(`${siteConfig.baseUrl}/${locale}/news/category/${slug}`)
  const ogImage = getAssetUrl(siteConfig.defaultOgImage)

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
      name: siteConfig.name,
      url: siteConfig.baseUrl,
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
