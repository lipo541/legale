'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'

// Coverflow Effect Slider - Featured Content
export default function Position10() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const featured = [
    { id: 1, icon: '⚖️', title: 'სასამართლო პრეცედენტები', count: 45 },
    { id: 2, icon: '📊', title: 'ფინანსური ანგარიშები', count: 28 },
    { id: 3, icon: '🔒', title: 'კონფიდენციალურობა', count: 62 },
    { id: 4, icon: '💼', title: 'კორპორატიული სამართალი', count: 34 },
  ]

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          პოპულარული თემები
        </h3>
      </div>

      {/* 3D Coverflow Slider */}
      <div className="flex h-[calc(100%-4rem)] items-center p-4">
        <Swiper
          modules={[Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={1.5}
          spaceBetween={20}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2,
            slideShadows: false,
          }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop={true}
          className="h-full w-full"
        >
          {featured.map((item) => (
            <SwiperSlide key={item.id}>
              <div className={`group flex h-full cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
              }`}>
                {/* Icon */}
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110 ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  {item.icon}
                </div>
                
                {/* Title */}
                <h4 className={`mb-2 text-base font-semibold ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {item.title}
                </h4>
                
                {/* Count */}
                <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>
                  {item.count} დოკუმენტი
                </div>
                
                {/* Action */}
                <div className={`mt-4 flex items-center gap-1 text-xs font-medium opacity-0 transition-all group-hover:opacity-100 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  <span>იხილე</span>
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
  )
}
