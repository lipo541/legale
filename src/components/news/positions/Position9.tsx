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
  slug: string
  category?: string
}

interface Post {
  id: string
  published_at?: string
  post_translations: PostTranslation[]
}

interface Position9Props {
  posts: Post[]
}

// Vertical Auto-scroll News Ticker
export default function Position9({ posts }: Position9Props) {
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
          {t.noPostsPosition}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Apple-style compact list */}
      <div className={`md:hidden rounded-xl border backdrop-blur-md overflow-hidden ${
        isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center gap-2 px-3 py-2 border-b ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          <span className={`text-[10px] font-medium uppercase tracking-wider ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {t.newsTitle}
          </span>
        </div>
        
        {/* News items */}
        <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          {posts.slice(0, 3).map((post) => {
            const translation = post.post_translations[0]
            const publishedTime = post.published_at ? new Date(post.published_at).toLocaleTimeString(locale, { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }) : ''
            return (
              <Link 
                key={post.id}
                href={`/${locale}/news/${translation.slug}`}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors active:scale-[0.99] ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug line-clamp-1 ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {translation.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {publishedTime}
                    </span>
                    <span className="rounded px-1 py-0.5 text-[10px] bg-red-600 text-white">
                      {translation.category}
                    </span>
                  </div>
                </div>
                <svg className={`h-4 w-4 flex-shrink-0 ${isDark ? 'text-white/20' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Desktop: Original vertical ticker */}
      <div className={`hidden md:block relative h-full overflow-hidden rounded-2xl border backdrop-blur-md ${
        isDark ? 'bg-black/40 border-white/10' : 'bg-white/20 border-white/30 shadow-xl'
      }`}>
        {/* Header */}
        <div className="border-b p-2 md:p-2 lg:p-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className={`text-[10px] md:text-[10px] lg:text-[10px] font-medium uppercase tracking-wider ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              {t.newsTitle}
            </span>
          </div>
        </div>

        {/* Vertical slider */}
        <div className="h-[calc(100%-2.5rem)] md:h-[calc(100%-2.5rem)] lg:h-[calc(100%-3.5rem)] p-2 md:p-2 lg:p-3">
          <Swiper
            modules={[Autoplay]}
            direction="vertical"
            slidesPerView={3}
            spaceBetween={6}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={posts.length > 3}
            className="h-full"
          >
            {posts.map((post) => {
              const translation = post.post_translations[0]
              const publishedTime = post.published_at ? new Date(post.published_at).toLocaleTimeString(locale, { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }) : ''

              return (
                <SwiperSlide key={post.id}>
                  <Link
                    href={`/${locale}/news/${translation.slug}`}
                    className={`block cursor-pointer rounded-lg p-1.5 md:p-1.5 lg:p-2.5 transition-colors hover:${
                      isDark ? 'bg-white/10' : 'bg-black/10'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        {publishedTime}
                      </span>
                      <span className="rounded-full px-1 py-0.5 text-[10px] bg-red-600 text-white">
                        {translation.category}
                      </span>
                    </div>
                    <p className={`text-[10px] md:text-[10px] lg:text-xs leading-snug line-clamp-2 ${
                      isDark ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {translation.title}
                    </p>
                  </Link>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </>
  )
}
