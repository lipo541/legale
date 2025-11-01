'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { newsTranslations } from '@/translations/news'

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
              <Link 
                href={`/${locale}/news/${translation.slug}`} 
                className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded-lg transition-shadow duration-200"
                aria-label={`${translation.title} - ${translation.category || ''}`}
              >
                <div className="relative h-full w-full rounded-lg overflow-hidden">
                  {/* Background Image */}
                  {post.featured_image_url && (
                    <div className="absolute inset-0">
                      <Image
                        src={post.featured_image_url}
                        alt={translation.title}
                        fill
                        className="object-cover"
                        quality={90}
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* LIGHTER Gradient for better image visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                  )}
                  
                  {/* Content - LEFT ALIGNED, BOTTOM */}
                  <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8 lg:p-10">
                    <div className="max-w-2xl space-y-3">
                      {/* Category Badge */}
                      {translation.category && (
                        <span className="inline-block rounded-lg px-2 py-0.5 text-[8px] md:text-[9px] font-bold uppercase bg-white/20 text-white backdrop-blur-sm">
                          {translation.category}
                        </span>
                      )}
                      
                      {/* Title */}
                      <h2 className="text-sm md:text-base lg:text-lg font-bold leading-tight text-white">
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
