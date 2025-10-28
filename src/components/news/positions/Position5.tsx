'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

// Vertical Auto-scroll News Ticker
export default function Position5() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const updates = [
    { id: 1, text: 'ახალი საგადასახადო კოდექსი ძალაშია', time: '10:30' },
    { id: 2, text: 'ევროკავშირის რეგულაციის ადაპტაცია', time: '09:15' },
    { id: 3, text: 'სასამართლო რეფორმის განხილვა', time: '08:45' },
    { id: 4, text: 'ციფრული ხელმოწერის სტანდარტები', time: '07:20' },
  ]

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 animate-pulse rounded-full ${
            isDark ? 'bg-white' : 'bg-black'
          }`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            ახალი ამბები
          </span>
        </div>
      </div>

      {/* Vertical Slider */}
      <div className="h-[calc(100%-4rem)] p-4">
        <Swiper
          modules={[Autoplay]}
          direction="vertical"
          slidesPerView={3}
          spaceBetween={12}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          loop={true}
          className="h-full"
        >
          {updates.map((update) => (
            <SwiperSlide key={update.id}>
              <div className={`rounded-lg p-3 transition-colors hover:${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {update.time}
                  </span>
                </div>
                <p className={`text-sm leading-snug ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {update.text}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}
