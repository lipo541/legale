import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CategoryPageClient from './CategoryPageClient'

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
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
        email,
        full_name
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

  const { data: categoryData } = await supabase
    .from('post_category_translations')
    .select('name, seo_title, seo_description')
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!categoryData) {
    return {
      title: 'კატეგორია ვერ მოიძებნა',
    }
  }

  return {
    title: categoryData.seo_title || categoryData.name || 'კატეგორია',
    description: categoryData.seo_description || categoryData.name,
  }
}
