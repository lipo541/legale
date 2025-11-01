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
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>პოსტები არ მოიძებნა 3</p>
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
                      className="object-cover opacity-70"
                    />
                    {/* Lighter overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>
                )}
                
                {/* Category Badge - ABSOLUTE TOP RIGHT CORNER */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-white/10 text-white backdrop-blur-sm">
                    {translation.category}
                  </span>
                </div>
                
                {/* Progress indicators - TOP CENTER (CIRCULAR) */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                  {posts.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                        index === activeIndex
                          ? 'bg-white w-6' 
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Spacer for top */}
                <div className="relative z-10"></div>
                
                {/* Content */}
                <div className="relative z-10 space-y-3">
                  <div className="space-y-2">
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight text-white">
                      {translation.title}
                    </h2>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
