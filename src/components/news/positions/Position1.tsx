'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import Image from 'next/image'

// Hero Slider - Main Featured News
export default function Position1() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const slides = [
    {
      id: 1,
      title: 'სამართლებრივი რეფორმა 2025',
      subtitle: 'ახალი კანონმდებლობა და ცვლილებები',
      image: '/news-placeholder-1.jpg'
    },
    {
      id: 2,
      title: 'ციფრული ტრანსფორმაცია',
      subtitle: 'იურიდიული სერვისების მომავალი',
      image: '/news-placeholder-2.jpg'
    },
    {
      id: 3,
      title: 'საერთაშორისო პარტნიორობა',
      subtitle: 'გლობალური სამართლებრივი ინტეგრაცია',
      image: '/news-placeholder-3.jpg'
    }
  ]

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
        loop={true}
        className="h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              {/* Background with gradient overlay */}
              <div className={`absolute inset-0 ${
                isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/5' 
                  : 'bg-gradient-to-br from-black/10 to-black/5'
              }`} />
              
              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-end p-8">
                <div className="space-y-2">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                  }`}>
                    მთავარი სიახლე
                  </span>
                  
                  <h2 className={`text-3xl font-semibold leading-tight ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {slide.title}
                  </h2>
                  
                  <p className={`text-sm ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {slide.subtitle}
                  </p>
                  
                  <button className={`mt-4 inline-flex items-center text-sm font-medium transition-opacity hover:opacity-60 ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    ვრცლად
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
