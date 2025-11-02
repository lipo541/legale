'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { newsTranslations } from '@/translations/news'

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

interface Position3Props {
  posts: Post[]
}

// Main Feature - Large Fade Slider
export default function Position3({ posts }: Position3Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  const [activeIndex, setActiveIndex] = useState(0)

  if (posts.length === 0) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-white/60'}`}>{t.noPostsPosition3}</p>
      </div>
    )
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black'
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
              <Link href={`/${locale}/news/${translation.slug}`} className="block h-full">
                <div className="flex h-full flex-col justify-between p-10 cursor-pointer">
                  {/* Featured Image (optional) */}
                  {post.featured_image_url && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={post.featured_image_url}
                        alt={translation.title}
                        fill
                        className="object-cover opacity-70 transition-transform duration-500 hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
                        loading="lazy"
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
                      <h2 className="text-lg md:text-xl lg:text-2xl font-semibold leading-tight text-white hover:opacity-80 transition-opacity">
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
