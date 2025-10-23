'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Phone } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function Hero() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-16 pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {isDark ? (
          <Image
            src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=2064&auto=format&fit=crop"
            alt="Night cityscape"
            fill
            priority
            className="object-cover transition-opacity duration-150"
            quality={90}
          />
        ) : (
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Day cityscape"
            fill
            priority
            className="object-cover transition-opacity duration-150"
            quality={90}
          />
        )}
        
        {/* Overlay gradient */}
        <div className={`absolute inset-0 transition-colors duration-150 ${
          isDark 
            ? 'bg-gradient-to-r from-black/80 via-black/60 to-transparent' 
            : 'bg-gradient-to-r from-white/80 via-white/60 to-transparent'
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Main Heading */}
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 transition-colors duration-150 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            LLC Legal Sandbox Georgia
          </h1>

          {/* Subtitle */}
          <p className={`text-base sm:text-lg lg:text-xl mb-8 transition-colors duration-150 ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}>
            ინოვაცია იურიდიულ სერვისებში საქართველოში
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* დაგვიკავშირდით Button */}
            <Link
              href="/contact"
              style={{
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                borderColor: isDark ? '#FFFFFF' : '#000000',
                color: isDark ? '#000000' : '#FFFFFF',
                borderWidth: '1px',
                borderStyle: 'solid',
                backdropFilter: 'none'
              }}
              onMouseEnter={(e) => {
                if (isDark) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.backdropFilter = 'blur(16px) saturate(150%)'
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                } else {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                  e.currentTarget.style.color = '#000000'
                  e.currentTarget.style.borderColor = '#000000'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                e.currentTarget.style.backdropFilter = 'none'
                e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
              }}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <Phone className="w-4 h-4" />
              დაგვიკავშირდით
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {/* იხილეთ პრაქტიკა Button */}
            <Link
              href="/practice-areas"
              style={{
                backgroundColor: 'transparent',
                borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                color: isDark ? '#FFFFFF' : '#000000',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
              }}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              იხილეთ პრაქტიკა
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (optional) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 transition-colors duration-300 ${
          isDark ? 'border-white/30' : 'border-black/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isDark ? 'bg-white/50' : 'bg-black/50'
          }`} />
        </div>
      </div>
    </section>
  )
}
