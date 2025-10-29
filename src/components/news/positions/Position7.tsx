'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface PostTranslation {
  title: string
  slug: string
  category?: string
  reading_time?: number
}

interface Post {
  id: string
  featured_image_url?: string
  post_translations: PostTranslation[]
}

// Single Post Card
export default function Position7() {
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
        .eq('display_position', 7)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('position_order', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Error fetching post:', error)
        setPost(null)
        return
      }
      
      // Get first post from array
      setPost(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error('Unexpected error:', error)
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex h-full items-center justify-center rounded-2xl ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className={`flex h-full items-center justify-center rounded-2xl ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>პოსტი არ მოიძებნა</p>
      </div>
    )
  }

  const translation = post.post_translations[0]

  return (
    <div className={`group relative h-full cursor-pointer overflow-hidden rounded-2xl p-6 transition-all ${
      isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
    }`}>
      {/* Background Image */}
      {post.featured_image_url && (
        <div className="absolute inset-0 z-0">
          <Image
            src={post.featured_image_url}
            alt={translation.title}
            fill
            className="object-cover opacity-10 transition-opacity group-hover:opacity-20"
          />
        </div>
      )}
      
      <div className="relative z-10 flex h-full flex-col justify-between">
        <span className={`inline-block self-start rounded-full px-2.5 py-1 text-xs font-medium ${
          isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black/80'
        }`}>
          {translation.category}
        </span>
        
        <div>
          <h3 className={`mb-2 text-lg font-semibold leading-tight line-clamp-3 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {translation.title}
          </h3>
          
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            {translation.reading_time} წთ წაკითხვა
          </p>
        </div>
      </div>
    </div>
  )
}
