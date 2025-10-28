'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import { useState } from 'react'

// Main Feature - Large Fade Slider
export default function Position3() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeIndex, setActiveIndex] = useState(0)

  const features = [
    {
      id: 1,
      icon: '⚖️',
      title: 'სასამართლო პრაქტიკა',
      description: 'უზენაესი სასამართლოს ახალი გადაწყვეტილებები და მათი გავლენა საქართველოს სამართლებრივ სისტემაზე',
      stats: '124 გადაწყვეტილება'
    },
    {
      id: 2,
      icon: '📋',
      title: 'საკანონმდებლო ცვლილებები',
      description: 'პარლამენტის მიერ მიღებული ახალი კანონები და რეგულაციები 2025 წლის პირველ კვარტალში',
      stats: '15 ახალი კანონი'
    },
    {
      id: 3,
      icon: '🌐',
      title: 'საერთაშორისო სამართალი',
      description: 'ევროკავშირის დირექტივები და საქართველოს ასოცირების შეთანხმების იმპლემენტაცია',
      stats: '8 დირექტივა'
    }
  ]

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl ${
      isDark ? 'bg-white/5' : 'bg-black/5'
    }`}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        slidesPerView={1}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        loop={true}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="h-full"
      >
        {features.map((feature) => (
          <SwiperSlide key={feature.id}>
            <div className="flex h-full flex-col justify-between p-10">
              {/* Icon */}
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h2 className={`text-4xl font-semibold leading-tight ${
                    isDark ? 'text-white' : 'text-black'
                  }`}>
                    {feature.title}
                  </h2>
                  
                  <p className={`text-base leading-relaxed ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {feature.description}
                  </p>
                </div>
                
                {/* Stats & CTA */}
                <div className="flex items-center justify-between pt-4">
                  <span className={`text-sm font-medium ${
                    isDark ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {feature.stats}
                  </span>
                  
                  <button className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    isDark 
                      ? 'bg-white text-black hover:bg-white/90' 
                      : 'bg-black text-white hover:bg-black/90'
                  }`}>
                    <span>გაეცანი</span>
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Progress indicators */}
              <div className="flex gap-2">
                {features.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      index === activeIndex
                        ? isDark 
                          ? 'bg-white' 
                          : 'bg-black'
                        : isDark 
                          ? 'bg-white/20' 
                          : 'bg-black/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
