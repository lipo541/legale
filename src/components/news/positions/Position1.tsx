'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

interface PostTranslation {
  title: string
  excerpt?: string
  slug: string
  category?: string
}

interface Post {
  id: string
  featured_image_url?: string
  post_translations: PostTranslation[]
}

// Hero Slider - Main Featured News
export default function Position1() {
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
        .eq('display_position', 1)
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
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ 
          clickable: true,
          bulletClass: `swiper-pagination-bullet ${isDark ? '!bg-white/50' : '!bg-black/50'}`,
          bulletActiveClass: `swiper-pagination-bullet-active ${isDark ? '!bg-white' : '!bg-black'}`
        }}
        loop={posts.length > 1}
        className="h-full"
      >
        {posts.map((post) => {
          const translation = post.post_translations[0]
          
          return (
            <SwiperSlide key={post.id}>
              <Link href={`/${locale}/news/${translation.slug}`} className="block h-full w-full">
                <div className="relative h-full w-full">
                  {/* Background Image */}
                  {post.featured_image_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={post.featured_image_url}
                        alt={translation.title}
                        fill
                        className="object-cover"
                      />
                      <div className={`absolute inset-0 ${
                        isDark 
                          ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/20' 
                          : 'bg-gradient-to-t from-black/70 via-black/30 to-black/10'
                      }`} />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-8">
                    <div className="space-y-2">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        isDark ? 'bg-white/10 text-white' : 'bg-white/90 text-black'
                      }`}>
                        {translation.category}
                      </span>
                      
                      <h2 className={`text-3xl font-semibold leading-tight ${
                        isDark ? 'text-white' : 'text-white'
                      }`}>
                        {translation.title}
                      </h2>
                      
                      <p className={`text-sm ${
                        isDark ? 'text-white/60' : 'text-white/80'
                      }`}>
                        {translation.excerpt}
                      </p>
                      
                      <div className={`mt-4 inline-flex items-center text-sm font-medium transition-opacity hover:opacity-60 ${
                        isDark ? 'text-white' : 'text-white'
                      }`}>
                        ვრცლად
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
