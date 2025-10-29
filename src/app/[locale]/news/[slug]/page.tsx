import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PostPageClient from './PostPageClient'

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export default async function PostPage({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  // Fetch post by slug
  const { data: postData, error: postError } = await supabase
    .from('post_translations')
    .select(`
      *,
      post:posts!inner(
        id,
        author_id,
        practice_id,
        status,
        featured_image_url,
        published_at,
        category_id
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (postError || !postData || postData.post.status !== 'published') {
    notFound()
  }

  // Fetch all translations for this post
  const { data: allTranslations } = await supabase
    .from('post_translations')
    .select('*')
    .eq('post_id', postData.post.id)

  // Fetch author info
  const { data: author } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .eq('id', postData.post.author_id)
    .single()

  // Fetch category info if exists
  let category = null
  if (postData.post.category_id) {
    const { data: categoryData } = await supabase
      .from('post_category_translations')
      .select('name, slug')
      .eq('category_id', postData.post.category_id)
      .eq('language', locale)
      .single()
    
    category = categoryData
  }

  // Fetch related posts from same parent category and all its subcategories
  interface RelatedPost {
    id: string
    category_id: string
    featured_image_url?: string
    published_at: string
    post_translations: Array<{
      title: string
      excerpt?: string
      slug: string
      language: string
    }>
  }

  let relatedPosts: RelatedPost[] = []
  if (postData.post.category_id) {
    // First, get the current category with parent info
    const { data: currentCategory } = await supabase
      .from('post_categories')
      .select('id, parent_id')
      .eq('id', postData.post.category_id)
      .single()

    if (currentCategory) {
      // Determine the parent category ID
      const parentCategoryId = currentCategory.parent_id || currentCategory.id

      // Get all subcategories under this parent (including the parent itself)
      const { data: allSubcategories } = await supabase
        .from('post_categories')
        .select('id')
        .or(`id.eq.${parentCategoryId},parent_id.eq.${parentCategoryId}`)
        .order('id', { ascending: true })

      if (allSubcategories && allSubcategories.length > 0) {
        const categoryIds = allSubcategories.map(cat => cat.id)

        // Fetch posts from all these categories, ordered by category then by date
        const { data: related } = await supabase
          .from('posts')
          .select(`
            id,
            category_id,
            featured_image_url,
            published_at,
            post_translations!inner(
              title,
              excerpt,
              slug,
              language
            )
          `)
          .eq('status', 'published')
          .in('category_id', categoryIds)
          .eq('post_translations.language', locale)
          .neq('id', postData.post.id)
          .order('category_id', { ascending: true })
          .order('published_at', { ascending: false })
          .limit(6)

        relatedPosts = related || []
      }
    }
  }

  return (
    <PostPageClient
      post={{
        id: postData.post.id,
        title: postData.title,
        excerpt: postData.excerpt,
        content: postData.content,
        slug: postData.slug,
        featuredImage: postData.post.featured_image_url,
        publishedAt: postData.post.published_at,
        wordCount: postData.word_count,
        readingTime: postData.reading_time,
        metaTitle: postData.meta_title,
        metaDescription: postData.meta_description,
        keywords: postData.keywords,
        ogTitle: postData.og_title,
        ogDescription: postData.og_description,
        ogImage: postData.og_image,
        translations: allTranslations || []
      }}
      author={author}
      category={category}
      relatedPosts={relatedPosts}
      locale={locale}
    />
  )
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('post_translations')
    .select(`
      title,
      meta_title,
      meta_description,
      keywords,
      og_title,
      og_description,
      og_image,
      post:posts!inner(
        featured_image_url
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!postData) {
    return {
      title: 'სტატია ვერ მოიძებნა',
    }
  }

  interface PostWithImage {
    featured_image_url?: string
  }

  const featuredImage = Array.isArray(postData.post) 
    ? postData.post[0]?.featured_image_url 
    : (postData.post as PostWithImage)?.featured_image_url

  return {
    title: postData.meta_title || postData.title,
    description: postData.meta_description || postData.title,
    keywords: postData.keywords,
    openGraph: {
      title: postData.og_title || postData.title,
      description: postData.og_description || postData.meta_description,
      images: [postData.og_image || featuredImage].filter(Boolean),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: postData.og_title || postData.title,
      description: postData.og_description || postData.meta_description,
      images: [postData.og_image || featuredImage].filter(Boolean),
    },
  }
}
