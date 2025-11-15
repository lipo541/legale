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
    .select(`
      id, 
      email, 
      full_name, 
      avatar_url,
      role,
      company_id
    `)
    .eq('id', postData.post.author_id)
    .single()

  // Fetch company info if author is a specialist
  let companyInfo = null
  if (author?.role === 'SPECIALIST' && author?.company_id) {
    const { data: company } = await supabase
      .from('profiles')
      .select('full_name, company_slug')
      .eq('id', author.company_id)
      .single()
    
    companyInfo = company
  }

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
      author={author ? {
        ...author,
        company: companyInfo || undefined
      } : null}
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

  // Step 1: Find the post translation by slug and locale to get the post_id
  const { data: postData } = await supabase
    .from('post_translations')
    .select(`
      post_id,
      title,
      excerpt,
      meta_title,
      meta_description,
      keywords,
      og_title,
      og_description,
      og_image,
      post:posts!inner(
        id,
        featured_image_url,
        published_at,
        updated_at,
        author_id
      )
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!postData) {
    return {
      title: 'სტატია ვერ მოიძებნა',
      description: 'მოთხოვნილი სტატია ვერ მოიძებნა.',
    }
  }

  interface PostWithDetails {
    id?: string
    featured_image_url?: string
    published_at?: string
    updated_at?: string
    author_id?: string
  }

  const post = Array.isArray(postData.post) 
    ? postData.post[0] 
    : (postData.post as PostWithDetails)

  // Step 2: Fetch all translations for this post to build hreflang tags
  const { data: allTranslations } = await supabase
    .from('post_translations')
    .select('language, slug')
    .eq('post_id', postData.post_id)

  const languageAlternates: { [key: string]: string } = {}
  if (allTranslations) {
    allTranslations.forEach(trans => {
      languageAlternates[trans.language] = `https://www.legal.ge/${trans.language}/news/${trans.slug}`
    })
  }

  // Step 3: Fetch author info for schema
  let authorName = 'Legal.ge'
  if (post?.author_id) {
    const { data: authorData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', post.author_id)
      .single()
    
    if (authorData?.full_name) {
      authorName = authorData.full_name
    }
  }

  // Build metadata
  const featuredImage = post?.featured_image_url
  const ogImage = postData.og_image || featuredImage || 'https://www.legal.ge/asset/images/og-image.jpg'
  const title = postData.meta_title || postData.title
  const description = postData.meta_description || postData.excerpt || postData.title
  const canonicalUrl = `https://www.legal.ge/${locale}/news/${slug}`

  // Article Schema Markup
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postData.title,
    description: description,
    image: ogImage,
    datePublished: post?.published_at,
    dateModified: post?.updated_at || post?.published_at,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Legal.ge',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.legal.ge/asset/images/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  }

  return {
    title,
    description,
    keywords: postData.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    openGraph: {
      title: postData.og_title || postData.title,
      description: postData.og_description || description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: postData.title,
        },
      ],
      locale: locale,
      type: 'article',
      publishedTime: post?.published_at,
      modifiedTime: post?.updated_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: postData.og_title || postData.title,
      description: postData.og_description || description,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(articleSchema),
    },
  }
}

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600
