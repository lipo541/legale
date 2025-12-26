'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'

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
  display_settings?: {
    focal_point_x: number
    focal_point_y: number
  }
}

interface Position1Props {
  posts: Post[]
}

// Hero Slider - Main Featured News
export default function Position1({ posts }: Position1Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]

  if (posts.length === 0) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{t.noPostsPosition1}</p>
      </div>
    )
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl border backdrop-blur-md ${
      isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
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
          
          // Get focal point from display_settings or use default (50%, 50% = center)
          const focalPointX = post.display_settings?.focal_point_x ?? 50
          const focalPointY = post.display_settings?.focal_point_y ?? 50
          
          return (
            <SwiperSlide key={post.id}>
              <Link 
                href={`/${locale}/news/${translation.slug}`} 
                className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-lg transition-shadow duration-200"
                aria-label={`${translation.title} - ${translation.category || ''}`}
              >
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  {/* Background Image */}
                  {post.featured_image_url && (
                    <div className="absolute inset-0">
                      <img
                        src={getOptimizedImageUrl(post.featured_image_url, imagePresets.heroBanner)}
                        alt={translation.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          objectPosition: `${focalPointX}% ${focalPointY}%`
                        }}
                        loading="eager"
                      />
                      {/* LIGHTER Gradient for better image visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                  )}
                  
                  {/* Content - LEFT ALIGNED, BOTTOM */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-3 sm:p-4 md:p-5 lg:p-6">
                    <div className="max-w-2xl space-y-2 sm:space-y-3">
                      {/* Category Badge */}
                      {translation.category && (
                        <span className="inline-block rounded-lg px-2.5 py-1 text-[10px] sm:text-[10px] md:text-[10px] font-bold uppercase bg-red-600 text-white backdrop-blur-sm">
                          {translation.category}
                        </span>
                      )}
                      
                      {/* Title */}
                      <h2 className="text-xs sm:text-sm md:text-sm lg:text-base font-bold leading-tight text-white line-clamp-4 sm:line-clamp-5">
                        {translation.title}
                      </h2>
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
