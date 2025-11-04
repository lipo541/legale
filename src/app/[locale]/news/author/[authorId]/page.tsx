import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AuthorPageClient from './AuthorPageClient'

interface PageProps {
  params: Promise<{
    locale: string
    authorId: string
  }>
}

export default async function AuthorPage({ params }: PageProps) {
  const { locale, authorId } = await params
  const supabase = await createClient()

  // Fetch author info
  const { data: author, error: authorError } = await supabase
    .from('profiles')
    .select(`
      id, 
      email, 
      full_name, 
      avatar_url, 
      bio, 
      role,
      company_id,
      company_slug
    `)
    .eq('id', authorId)
    .single()

  if (authorError || !author) {
    notFound()
  }

  // Fetch specialist slug from specialist_translations if author is a specialist
  let specialistSlug = null
  if (author.role === 'SPECIALIST') {
    const { data: slugData } = await supabase
      .from('specialist_translations')
      .select('slug')
      .eq('specialist_id', authorId)
      .eq('language', locale)
      .single()
    
    specialistSlug = slugData?.slug
  }

  // Fetch company info if author is a specialist with company
  let companyInfo = null
  if (author.role === 'SPECIALIST' && author.company_id) {
    const { data: company } = await supabase
      .from('profiles')
      .select('id, full_name, company_slug')
      .eq('id', author.company_id)
      .single()
    
    companyInfo = company
  }

  // Determine which posts to fetch based on role
  let posts
  let postsError

  if (author.role === 'COMPANY') {
    // For companies: ONLY fetch posts where the company itself is the author
    // Do NOT include posts by company specialists
    const result = await supabase
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
        category:post_categories(
          id,
          parent_id,
          post_category_translations!inner(
            name,
            slug,
            language
          )
        )
      `)
      .eq('author_id', authorId)  // Only posts authored by the company
      .eq('status', 'published')
      .eq('post_translations.language', locale)
      .order('published_at', { ascending: false })
    
    posts = result.data
    postsError = result.error
  } else {
    // For specialists and solo specialists: fetch their own posts
    const result = await supabase
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
        category:post_categories(
          id,
          parent_id,
          post_category_translations!inner(
            name,
            slug,
            language
          )
        )
      `)
      .eq('author_id', authorId)
      .eq('status', 'published')
      .eq('post_translations.language', locale)
      .order('published_at', { ascending: false })
    
    posts = result.data
    postsError = result.error
  }

  if (postsError) {
    console.error('Error fetching posts:', postsError)
  }

  // Deduplicate posts
  const uniquePosts = posts ? Array.from(
    new Map(posts.map(post => [post.id, post])).values()
  ) : []

  return (
    <AuthorPageClient
      author={{
        id: author.id,
        email: author.email,
        full_name: author.full_name,
        avatar_url: author.avatar_url,
        bio: author.bio,
        role: author.role,
        company_id: author.company_id,
        company: companyInfo,
        slug: specialistSlug,
        company_slug: author.company_slug
      }}
      posts={uniquePosts}
      locale={locale}
    />
  )
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { authorId } = await params
  const supabase = await createClient()

  const { data: author } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', authorId)
    .single()

  if (!author) {
    return {
      title: 'ავტორი ვერ მოიძებნა',
    }
  }

  const authorName = author.full_name || author.email
  const pageType = author.role === 'COMPANY' ? 'კომპანიის' : 'ავტორის'

  return {
    title: `${authorName} - ${pageType} პოსტები`,
    description: `ყველა სტატია ${authorName}-${author.role === 'COMPANY' ? 'ისგან' : 'მ დაწერა'}`,
  }
}
