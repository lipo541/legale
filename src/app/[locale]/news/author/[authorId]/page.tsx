import { createStaticClient } from '@/lib/supabase/static'
import { notFound } from 'next/navigation'
import AuthorPageClient from './AuthorPageClient'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'

interface PageProps {
  params: Promise<{
    locale: string
    authorId: string
  }>
}

export default async function AuthorPage({ params }: PageProps) {
  const { locale, authorId } = await params
  const supabase = createStaticClient()

  // Fetch author info - get all fields like company detail page
  const { data: author, error: authorError } = await supabase
    .from('profiles')
    .select('*')
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

  // Fetch company translations if author is a company
  let companyBio = author.bio || author.summary
  const companyAvatar = author.avatar_url || author.logo_url
  
  if (author.role === 'COMPANY' && locale !== 'ka') {
    // For non-Georgian languages, get translated info from company_translations
    const { data: translation } = await supabase
      .from('company_translations')
      .select('summary, company_overview')
      .eq('company_id', authorId)
      .eq('language', locale)
      .single()
    
    // Use translated summary as bio, or fall back to company_overview
    if (translation) {
      companyBio = translation.summary || translation.company_overview || companyBio
    }
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
        full_name: author.full_name || author.company_name,
        avatar_url: companyAvatar,
        bio: companyBio,
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
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { authorId, locale } = await params
  const supabase = createStaticClient()

  const { data: author } = await supabase
    .from('profiles')
    .select('full_name, email, role, avatar_url, logo_url')
    .eq('id', authorId)
    .single()

  if (!author) {
    return {
      title: 'ავტორი ვერ მოიძებნა',
    }
  }

  const authorName = author.full_name || author.email
  const avatarUrl = author.avatar_url || author.logo_url
  const canonicalUrl = `${siteConfig.baseUrl}/${locale}/news/author/${authorId}`
  
  const titles: Record<string, { title: string; description: string; pageType: string }> = {
    ka: {
      title: `${authorName} - ${author.role === 'COMPANY' ? 'კომპანიის' : 'ავტორის'} პოსტები`,
      description: `ყველა სტატია ${authorName}-${author.role === 'COMPANY' ? 'ისგან' : 'მ დაწერა'}`,
      pageType: author.role === 'COMPANY' ? 'კომპანიის' : 'ავტორის',
    },
    en: {
      title: `${authorName} - ${author.role === 'COMPANY' ? 'Company' : 'Author'} Posts`,
      description: `All articles by ${authorName}`,
      pageType: author.role === 'COMPANY' ? 'Company' : 'Author',
    },
    ru: {
      title: `${authorName} - Статьи ${author.role === 'COMPANY' ? 'компании' : 'автора'}`,
      description: `Все статьи от ${authorName}`,
      pageType: author.role === 'COMPANY' ? 'компании' : 'автора',
    },
  }

  const meta = titles[locale] || titles.ka

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(`/news/author/${authorId}`),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      type: 'profile',
      images: avatarUrl ? [avatarUrl] : [],
      locale: locale === 'ka' ? 'ka_GE' : locale === 'ru' ? 'ru_RU' : 'en_US',
    },
    twitter: {
      card: avatarUrl ? 'summary_large_image' : 'summary',
      title: meta.title,
      description: meta.description,
      images: avatarUrl ? [avatarUrl] : [],
    },
  }
}

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600
