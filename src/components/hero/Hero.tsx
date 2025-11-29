'use client'

import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'

export default function Hero() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-16 pt-16">
      {/* Background Images - both loaded, visibility controlled by CSS */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=75&w=1200&auto=format&fit=crop"
          alt="Night cityscape"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          fetchPriority="high"
        />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=75&w=1200&auto=format&fit=crop"
          alt="Day cityscape"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Overlay gradient */}
        <div className={`absolute inset-0 transition-colors duration-150 ${
          isDark 
            ? 'bg-gradient-to-r from-black/80 via-black/60 to-transparent' 
            : 'bg-gradient-to-r from-white/80 via-white/60 to-transparent'
        }`} />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-20">
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
            {/* დაგვიკავშირდით Button - Pure CSS hover */}
            <Link
              href={`/${locale}/contact`}
              className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl border ${
                isDark 
                  ? 'bg-white text-black border-white hover:bg-white/10 hover:text-white hover:border-white/20 hover:backdrop-blur-md' 
                  : 'bg-black text-white border-black hover:bg-white hover:text-black'
              }`}
            >
              <Phone className="w-4 h-4" />
              დაგვიკავშირდით
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {/* იხილეთ პრაქტიკა Button - Pure CSS hover */}
            <Link
              href={`/${locale}/practices`}
              className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border ${
                isDark 
                  ? 'bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white' 
                  : 'bg-transparent text-black border-black/30 hover:bg-black/10 hover:border-black'
              }`}
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
