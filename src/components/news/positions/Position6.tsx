'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PostTranslation {
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
  category?: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at?: string
  post_translations: PostTranslation[]
}

// Featured Post Card - Compact & Visual
export default function Position6() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [locale])

  const fetchPost = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_translations!inner (*)
        `)
        .eq('display_position', 6)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('position_order', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Position 6 - Error fetching post:', error)
        setPost(null)
        return
      }
      
      // Get first post from array
      const firstPost = data && data.length > 0 ? data[0] : null
      console.log('Position 6 - Post data:', firstPost)
      setPost(firstPost)
    } catch (error) {
      console.error('Position 6 - Unexpected error:', error)
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex h-full items-center justify-center rounded-xl ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className={`flex h-full flex-col items-center justify-center rounded-xl border border-dashed p-4 ${
        isDark ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'
      }`}>
        <BookOpen className={`mb-2 h-6 w-6 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
        <p className={`text-xs text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          პოზიცია 6-ზე პოსტი არ არის დაყენებული
        </p>
      </div>
    )
  }

  const translation = post.post_translations?.[0]
  
  if (!translation) {
    return (
      <div className={`flex h-full items-center justify-center rounded-xl ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>თარგმანი არ მოიძებნა</p>
      </div>
    )
  }

  return (
    <Link href={`/${locale}/news/${translation.slug}`} className="block h-full">
      <div className={`group relative h-full overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 hover:border-white/20' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-black/10 hover:border-black/20'
      }`}>
        {/* Image Section (Top Half) */}
        {post.featured_image_url && (
          <div className="relative h-[70%] w-full overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={translation.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-t from-zinc-900 via-transparent to-transparent' 
                : 'bg-gradient-to-t from-white via-transparent to-transparent'
            }`} />
            
            {/* Category Badge on Image */}
            <div className="absolute top-2 left-2">
              <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-black'
              }`}>
                {translation.category}
              </span>
            </div>
          </div>
        )}

        {/* Content Section (Bottom Half) */}
        <div className="relative flex h-[30%] flex-col justify-center p-2">
          <h3 className={`text-[11px] md:text-xs font-semibold leading-snug line-clamp-2 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {translation.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
