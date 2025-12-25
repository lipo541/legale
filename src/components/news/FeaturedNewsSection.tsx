'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import NewsCard from './common/NewsCard'
import { newsTranslations } from '@/translations/news'

interface PostTranslation {
  language: string
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
}

interface CategoryTranslation {
  language: string
  name: string
  slug: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  category_id?: string
  post_translations: PostTranslation[]
  category?: {
    id: string
    post_category_translations: CategoryTranslation[]
  }[] | null
}

interface FeaturedNewsSectionProps {
  initialPosts?: Post[]
}

export default function FeaturedNewsSection({ initialPosts }: FeaturedNewsSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>(initialPosts || [])
  const [loading, setLoading] = useState(!initialPosts)

  useEffect(() => {
    if (initialPosts) return

    const fetchPosts = async () => {
      try {
        // First, get featured posts
        const { data: featuredData, error: featuredError } = await supabase
          .from('posts')
          .select(`
            id,
            featured_image_url,
            published_at,
            is_homepage_featured,
            homepage_featured_order,
            category_id,
            post_translations!inner(language, title, excerpt, slug, reading_time),
            category:post_categories(
              id,
              post_category_translations(language, name, slug)
            )
          `)
          .eq('status', 'published')
          .eq('is_homepage_featured', true)
          .order('homepage_featured_order', { ascending: true })

        if (featuredError) {
          console.error('Featured posts error:', featuredError)
        }

        const featuredPosts = featuredData || []
        const featuredCount = featuredPosts.length
        const minPosts = 5
        const neededRegularPosts = Math.max(0, minPosts - featuredCount)

        let regularPosts: Post[] = []

        // If we need more posts to fill to minimum 4
        if (neededRegularPosts > 0) {
          const featuredIds = featuredPosts.map(p => p.id)
          
          const { data: regularData, error: regularError } = await supabase
            .from('posts')
            .select(`
              id,
              featured_image_url,
              published_at,
              is_homepage_featured,
              homepage_featured_order,
              category_id,
              post_translations!inner(language, title, excerpt, slug, reading_time),
              category:post_categories(
                id,
                post_category_translations(language, name, slug)
              )
            `)
            .eq('status', 'published')
            .eq('is_homepage_featured', false)
            .not('id', 'in', featuredIds.length > 0 ? `(${featuredIds.join(',')})` : '()')
            .order('published_at', { ascending: false })
            .limit(neededRegularPosts)

          if (regularError) {
            console.error('Regular posts error:', regularError)
          }

          regularPosts = regularData || []
        }

        // Combine: featured first (by order), then regular (by date)
        const combinedPosts = [...featuredPosts, ...regularPosts]
        setPosts(combinedPosts as Post[])
      } catch (err) {
        console.error('Error fetching homepage posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [initialPosts, supabase])

  // Get category name for a post
  const getCategoryName = (post: Post): string | undefined => {
    // Category is returned as array from Supabase, take first element
    const category = Array.isArray(post.category) ? post.category[0] : post.category
    if (!category?.post_category_translations) return undefined
    const catTranslation = category.post_category_translations.find(
      t => t.language === locale
    )
    return catTranslation?.name
  }

  // Loading skeleton
  if (loading) {
    return (
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <div className={`h-6 w-40 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
          <div className={`h-4 w-24 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`
                flex-shrink-0 w-[calc(25%-12px)] min-w-[200px] max-w-[280px]
                rounded-xl overflow-hidden
                ${isDark ? 'bg-white/5' : 'bg-black/5'}
              `}
            >
              <div className={`aspect-[16/10] ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
              <div className="p-3 space-y-2">
                <div className={`h-3 w-20 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                <div className={`h-4 w-full rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Don't render if no posts
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {t.featuredNews}
        </h2>
        <Link
          href={`/${locale}/news`}
          className={`
            group flex items-center gap-1.5 text-sm font-medium
            transition-colors duration-200
            ${isDark 
              ? 'text-white/60 hover:text-white' 
              : 'text-black/60 hover:text-black'
            }
          `}
        >
          <span>{t.seeAllNews}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Cards Container */}
      {/* Desktop: Grid, Mobile: Horizontal scroll */}
      <div 
        className={`
          flex gap-4 
          overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin
          md:overflow-visible md:pb-0
          md:grid md:grid-cols-5
          ${isDark 
            ? 'scrollbar-thumb-white/20 scrollbar-track-transparent' 
            : 'scrollbar-thumb-black/20 scrollbar-track-transparent'
          }
        `}
      >
        {posts.map((post) => (
          <NewsCard
            key={post.id}
            id={post.id}
            featured_image_url={post.featured_image_url}
            published_at={post.published_at}
            translations={post.post_translations}
            locale={locale}
            categoryName={getCategoryName(post)}
            isHomepageFeatured={post.is_homepage_featured}
            featuredOrder={post.homepage_featured_order || undefined}
          />
        ))}
      </div>
    </section>
  )
}
