'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface PostTranslation {
  title: string
  slug: string
  category?: string
  excerpt?: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  created_at?: string
  post_translations: PostTranslation[]
}

// Vertical News Feed
export default function Position2() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [locale])

  const fetchPosts = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          display_position,
          position_order,
          status,
          published_at,
          created_at,
          featured_image_url,
          post_translations!inner (
            language,
            title,
            excerpt,
            category,
            slug
          )
        `)
        .eq('display_position', 2)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('position_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(3)

      console.log('Position 2 - Query result:', { data, error })
      console.log('Position 2 - Posts count:', data?.length)
      if (data && data.length > 0) {
        console.log('Position 2 - First post:', data[0])
      }
      
      if (error) {
        console.error('Position 2 - Supabase error:', error)
        throw error
      }
      
      setPosts(data || [])
    } catch (error) {
      console.error('Position 2 - Catch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>პოსტები არ მოიძებნა</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {posts.map((post) => {
        const translation = post.post_translations?.[0]
        if (!translation) return null
        
        const publishedDate = post.published_at 
          ? new Date(post.published_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
          : post.created_at ? new Date(post.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : ''

        return (
          <Link
            key={post.id}
            href={`/${locale}/news/${translation.slug}`}
            onMouseEnter={() => setHoveredId(post.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`group relative block cursor-pointer rounded-xl p-4 transition-all duration-300 ${
              isDark 
                ? 'bg-white/5 hover:bg-white/10' 
                : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {/* Animated border */}
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
              hoveredId === post.id 
                ? isDark 
                  ? 'opacity-100 ring-1 ring-white/20' 
                  : 'opacity-100 ring-1 ring-black/20'
                : 'opacity-0'
            }`} />
            
            <div className="relative space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {publishedDate}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>
                  {translation.category}
                </span>
              </div>
              
              <h3 className={`text-sm font-medium leading-snug transition-opacity ${
                isDark ? 'text-white' : 'text-black'
              } ${hoveredId === post.id ? 'opacity-60' : 'opacity-100'}`}>
                {translation.title}
              </h3>
              
              {translation.excerpt && (
                <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  {translation.excerpt.slice(0, 80)}...
                </p>
              )}
              
              {/* Arrow indicator */}
              <div className={`flex items-center gap-1 text-xs font-medium transition-all duration-300 ${
                isDark ? 'text-white/60' : 'text-black/60'
              } ${hoveredId === post.id ? 'translate-x-1' : 'translate-x-0'}`}>
                <span>წაიკითხე</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
