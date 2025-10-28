'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

// Horizontal News Carousel - Latest Articles
export default function Position9() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const articles = [
    { id: 1, title: 'საგადასახადო რეფორმა 2025', category: 'ფინანსები', date: '28 ოქტ' },
    { id: 2, title: 'ახალი შრომის კოდექსი', category: 'სოციალური', date: '27 ოქტ' },
    { id: 3, title: 'ციფრული ხელმოწერა', category: 'ტექნოლოგია', date: '26 ოქტ' },
    { id: 4, title: 'მონაცემთა დაცვა GDPR', category: 'IT სამართალი', date: '25 ოქტ' },
  ]

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            რეკომენდებული
          </h3>
          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <div className={`h-1.5 w-1.5 animate-pulse rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Swiper Carousel */}
      <div className="h-[calc(100%-4rem)] p-4">
        <Swiper
          modules={[Autoplay, Navigation]}
          slidesPerView={1}
          spaceBetween={16}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          loop={true}
          navigation={{
            nextEl: '.swiper-button-next-pos9',
            prevEl: '.swiper-button-prev-pos9',
          }}
          className="h-full"
        >
          {articles.map((article) => (
            <SwiperSlide key={article.id}>
              <div className={`group flex h-full cursor-pointer flex-col justify-between rounded-xl p-4 transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {article.date}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                    }`}>
                      {article.category}
                    </span>
                  </div>
                  
                  <h4 className={`text-lg font-semibold leading-snug ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {article.title}
                  </h4>
                  
                  <p className={`text-sm leading-relaxed ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    მოკლე აღწერა სიახლის შესახებ და მთავარი საკითხები რომლებიც განხილულია სტატიაში.
                  </p>
                </div>
                
                <div className={`flex items-center gap-1 text-xs font-medium transition-all group-hover:translate-x-1 ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}>
                  <span>წაიკითხე</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Buttons */}
        <button className={`swiper-button-prev-pos9 absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm transition-all ${
          isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
        }`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className={`swiper-button-next-pos9 absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 backdrop-blur-sm transition-all ${
          isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
        }`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
