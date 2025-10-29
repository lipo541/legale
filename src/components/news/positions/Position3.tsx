'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Image from 'next/image'

interface PostTranslation {
  title: string
  excerpt?: string
  slug: string
  category?: string
  reading_time?: number
}

interface Post {
  id: string
  featured_image_url?: string
  post_translations: PostTranslation[]
}

// Main Feature - Large Fade Slider
export default function Position3() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const [activeIndex, setActiveIndex] = useState(0)
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
        .eq('display_position', 3)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('position_order', { ascending: true })
        .limit(5)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>პოსტები არ მოიძებნა</p>
      </div>
    )
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        slidesPerView={1}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={posts.length > 1}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="h-full"
      >
        {posts.map((post) => {
          const translation = post.post_translations[0]
          
          return (
            <SwiperSlide key={post.id}>
              <div className="flex h-full flex-col justify-between p-10">
                {/* Featured Image (optional) */}
                {post.featured_image_url && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={post.featured_image_url}
                      alt={translation.title}
                      fill
                      className="object-cover opacity-20"
                    />
                  </div>
                )}
                
                {/* Category Badge */}
                <div className={`relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  📰
                </div>
                
                {/* Content */}
                <div className="relative z-10 space-y-4">
                  <div className="space-y-3">
                    <h2 className={`text-4xl font-semibold leading-tight ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {translation.title}
                    </h2>
                    
                    <p className={`text-base leading-relaxed line-clamp-3 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {translation.excerpt}
                    </p>
                  </div>
                  
                  {/* Stats & CTA */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-black/80'
                      }`}>
                        {translation.category}
                      </span>
                      <span className={`text-sm ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}>
                        {translation.reading_time} წთ
                      </span>
                    </div>
                    
                    <button className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                      isDark 
                        ? 'bg-white text-black hover:bg-white/90' 
                        : 'bg-black text-white hover:bg-black/90'
                    }`}>
                      <span>გაეცანი</span>
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Progress indicators */}
                <div className="relative z-10 flex gap-2">
                  {posts.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        index === activeIndex
                          ? isDark 
                            ? 'bg-white' 
                            : 'bg-black'
                          : isDark 
                            ? 'bg-white/20' 
                            : 'bg-black/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
