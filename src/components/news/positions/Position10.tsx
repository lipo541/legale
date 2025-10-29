'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

interface PostTranslation {
  title: string
  category?: string
}

interface Post {
  id: string
  published_at?: string
  post_translations: PostTranslation[]
}

// Horizontal Auto-scroll News Ticker
export default function Position10() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
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
          *,
          post_translations!inner (*)
        `)
        .eq('display_position', 10)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('position_order', { ascending: true })
        .limit(10)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || posts.length === 0) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          {loading ? 'იტვირთება...' : 'პოსტები არ მოიძებნა'}
        </p>
      </div>
    )
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 animate-pulse rounded-full ${
            isDark ? 'bg-white' : 'bg-black'
          }`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            ახალი ამბები
          </span>
        </div>
      </div>

      {/* Vertical Slider */}
      <div className="h-[calc(100%-4rem)] p-4">
        <Swiper
          modules={[Autoplay]}
          direction="vertical"
          slidesPerView={3}
          spaceBetween={12}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop={posts.length > 3}
          className="h-full"
        >
          {posts.map((post) => {
            const translation = post.post_translations[0]
            const publishedTime = post.published_at ? new Date(post.published_at).toLocaleTimeString(locale, { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : ''

            return (
              <SwiperSlide key={post.id}>
                <div className={`cursor-pointer rounded-lg p-3 transition-colors hover:${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {publishedTime}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                    }`}>
                      {translation.category}
                    </span>
                  </div>
                  <p className={`text-sm leading-snug line-clamp-2 ${
                    isDark ? 'text-white/80' : 'text-black/80'
                  }`}>
                    {translation.title}
                  </p>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}
