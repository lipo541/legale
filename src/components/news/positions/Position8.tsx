'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

// Horizontal Carousel - Latest Updates
export default function Position8() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const articles = [
    { id: 1, title: 'ელექტრონული სასამართლო', category: 'ტექნოლოგია' },
    { id: 2, title: 'კიბერუსაფრთხოება', category: 'IT სამართალი' },
    { id: 3, title: 'მონაცემთა დაცვა GDPR', category: 'რეგულაცია' },
  ]

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            უახლესი სტატიები
          </h3>
        </div>

        {/* Carousel */}
        <div className="flex-1 p-4">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={1}
            spaceBetween={16}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            className="h-full"
          >
            {articles.map((article) => (
              <SwiperSlide key={article.id}>
                <div className={`group flex h-full cursor-pointer flex-col justify-between rounded-lg p-4 transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                }`}>
                  <div className="space-y-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                    }`}>
                      {article.category}
                    </span>
                    
                    <h4 className={`text-base font-medium leading-snug ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {article.title}
                    </h4>
                  </div>
                  
                  <div className={`flex items-center gap-1 text-xs font-medium transition-all group-hover:translate-x-1 ${
                    isDark ? 'text-white/50' : 'text-black/50'
                  }`}>
                    <span>გაეცანი</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  )
}
