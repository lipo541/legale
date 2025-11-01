'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { newsTranslations } from '@/translations/news'

interface PostTranslation {
  title: string
  language: string
  slug: string
  category?: string
}

interface Post {
  id: string
  published_at?: string
  post_translations: PostTranslation[]
}

interface Position5Props {
  posts: Post[]
}

// Vertical Auto-scroll News Ticker
export default function Position5({ posts }: Position5Props) {
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
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          {t.noPostsPosition5}
        </p>
      </div>
    )
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Header */}
      <div className="border-b p-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 animate-pulse rounded-full ${
            isDark ? 'bg-white' : 'bg-black'
          }`} />
          <span className={`text-[10px] font-medium uppercase tracking-wider ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {t.newsTitle}
          </span>
        </div>
      </div>

      {/* Vertical Slider */}
      <div className="h-[calc(100%-3.5rem)] p-3">
        <Swiper
          modules={[Autoplay]}
          direction="vertical"
          slidesPerView={3}
          spaceBetween={0}
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
                <div className="py-1">
                  <Link 
                    href={`/${locale}/news/${translation.slug}`}
                    className={`block cursor-pointer rounded-lg p-2.5 transition-colors hover:${
                      isDark ? 'bg-white/10' : 'bg-black/10'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        {publishedTime}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                        isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                      }`}>
                        {translation.category}
                      </span>
                    </div>
                    <p className={`text-xs leading-snug line-clamp-2 ${
                      isDark ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {translation.title}
                    </p>
                  </Link>
                  
                  {/* Centered divider line */}
                  <div className="flex justify-center mt-1">
                    <div className={`h-px w-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}
