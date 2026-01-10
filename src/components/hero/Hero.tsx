'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useParams, useRouter } from 'next/navigation'
import { getClientSingleton } from '@/lib/supabase/client'
import { HeroSlide, HeroSlideButton } from '@/lib/types/hero'
import Snowfall from 'react-snowfall'

interface HeroProps {
  initialSlides?: HeroSlide[]
}

export default function Hero({ initialSlides }: HeroProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'
  const supabase = getClientSingleton()

  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(!initialSlides)
  
  // Swipe state
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch slides if not provided
  useEffect(() => {
    if (!initialSlides) {
      const fetchSlides = async () => {
        const { data, error } = await supabase
          .from('hero_slides')
          .select(`*, buttons:hero_slide_buttons(*)`)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (!error && data) {
          setSlides(data)
        }
        setLoading(false)
      }
      fetchSlides()
    }
  }, [initialSlides, supabase])

  // Auto-advance slider
  useEffect(() => {
    if (slides.length <= 1 || isDragging) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [slides.length, isDragging])

  // Navigate to slide
  const goToSlide = useCallback((index: number) => {
    if (index < 0) {
      setCurrentIndex(slides.length - 1)
    } else if (index >= slides.length) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(index)
    }
  }, [slides.length])

  // Touch/Mouse handlers for swipe
  const handleDragStart = useCallback((clientX: number) => {
    if (slides.length <= 1) return
    setIsDragging(true)
    startX.current = clientX
    setDragOffset(0)
  }, [slides.length])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX.current
    setDragOffset(diff)
    setSwipeDirection(diff > 0 ? 'right' : diff < 0 ? 'left' : null)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    const threshold = 80 // minimum swipe distance
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swiped right - go to previous
        goToSlide(currentIndex - 1)
      } else {
        // Swiped left - go to next
        goToSlide(currentIndex + 1)
      }
    }
    
    // Reset
    setTimeout(() => {
      setDragOffset(0)
      setSwipeDirection(null)
    }, 50)
  }, [isDragging, dragOffset, currentIndex, goToSlide])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const handleMouseUp = () => handleDragEnd()
  const handleMouseLeave = () => { if (isDragging) handleDragEnd() }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const handleTouchEnd = () => handleDragEnd()

  // Handle button action
  const handleButtonClick = (button: HeroSlideButton) => {
    switch (button.action_type) {
      case 'link':
        if (button.action_url) {
          if (button.open_in_new_tab || button.action_url.startsWith('http')) {
            window.open(button.action_url, '_blank')
          } else {
            router.push(button.action_url)
          }
        }
        break
      case 'contact':
        router.push(`/${locale}/contact`)
        break
      case 'specialist':
        if (button.specialist_id) router.push(`/${locale}/specialists/${button.specialist_id}`)
        break
      case 'practice':
        if (button.practice_id) router.push(`/${locale}/practices/${button.practice_id}`)
        break
      case 'company':
        if (button.company_id) router.push(`/${locale}/companies/${button.company_id}`)
        break
    }
  }

  // Fallback static content if no slides
  if (!loading && slides.length === 0) {
    return <StaticHero isDark={isDark} locale={locale} />
  }

  // Loading state
  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center overflow-hidden -mt-16 pt-16">
        <div className={`absolute inset-0 ${isDark ? 'bg-black' : 'bg-white'}`} />
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
          <div className="animate-pulse">
            <div className={`h-12 w-2/3 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            <div className={`h-6 w-1/2 rounded mt-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
          </div>
        </div>
      </section>
    )
  }

  const currentSlide = slides[currentIndex]

  // Calculate transform based on drag
  const getSlideTransform = (index: number) => {
    const baseOffset = (index - currentIndex) * 100
    const dragPercent = isDragging ? (dragOffset / (containerRef.current?.offsetWidth || 1)) * 100 : 0
    return baseOffset + dragPercent
  }

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden -mt-16 pt-16 select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: slides.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Background Images with swipe effect */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0"
            style={{
              transform: `translateX(${getSlideTransform(index)}%)`,
              transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              opacity: Math.abs(index - currentIndex) <= 1 ? 1 : 0,
            }}
          >
            <img
              src={isDark ? slide.image_url_dark : slide.image_url_light}
              alt={slide[`title_${locale}`] || slide.title_ka}
              className="absolute inset-0 w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              draggable={false}
              style={!isDark ? { filter: 'brightness(1.25)' } : undefined}
            />
          </div>
        ))}
        
        {/* Overlay gradient - Dark mode only for text readability */}
        {isDark && (
          <div className="absolute inset-0 transition-colors duration-300 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        )}
        
        {/* Bottom fade for smooth transition to next section - Light mode only */}
        {!isDark && (
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        )}

        {/* Snowfall Effect - Only in Hero */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <Snowfall
            color={isDark ? "#ffffff" : "#000000"}
            snowflakeCount={100}
            speed={[0.5, 1.5]}
            wind={[-0.5, 1.0]}
            radius={[0.5, 2.0]}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Wave ripple effect on swipe */}
        {isDragging && swipeDirection && (
          <div 
            className={`
              absolute inset-y-0 w-32 z-10 pointer-events-none
              ${swipeDirection === 'left' ? 'right-0' : 'left-0'}
            `}
          >
            <div 
              className={`
                absolute inset-0 
                ${isDark 
                  ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-black/5 to-transparent'
                }
                animate-pulse
              `}
              style={{
                transform: `scaleX(${Math.min(Math.abs(dragOffset) / 50, 2)})`,
                opacity: Math.min(Math.abs(dragOffset) / 100, 0.8)
              }}
            />
            {/* Ripple circles */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`
                  absolute top-1/2 -translate-y-1/2
                  w-4 h-4 rounded-full
                  ${isDark ? 'bg-white/20' : 'bg-black/10'}
                  ${swipeDirection === 'left' ? 'right-4' : 'left-4'}
                `}
                style={{
                  transform: `scale(${1 + (Math.abs(dragOffset) / 80) * (i + 1)})`,
                  opacity: Math.max(0, 0.5 - (i * 0.15) - (Math.abs(dragOffset) / 300)),
                  transition: 'transform 0.1s ease-out, opacity 0.1s ease-out'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content with parallax effect */}
      <div 
        className="relative z-10 mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-20"
        style={{
          transform: isDragging ? `translateX(${dragOffset * 0.1}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <div className="max-w-3xl">
          {/* Main Heading - H1 only for first slide, p for others */}
          {currentIndex === 0 ? (
            <h1 
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 transition-colors duration-150 ${
                isDark ? 'text-white' : 'text-black'
              }`}
              style={!isDark ? { textShadow: '0 0 8px #fff, 0 0 8px #fff, 0 0 15px #fff, 0 0 20px #fff' } : undefined}
            >
              {currentSlide[`title_${locale}`] || currentSlide.title_ka}
            </h1>
          ) : (
            <p 
              role="heading" 
              aria-level={2}
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 transition-colors duration-150 ${
                isDark ? 'text-white' : 'text-black'
              }`}
              style={!isDark ? { textShadow: '0 0 8px #fff, 0 0 8px #fff, 0 0 15px #fff, 0 0 20px #fff' } : undefined}
            >
              {currentSlide[`title_${locale}`] || currentSlide.title_ka}
            </p>
          )}

          {/* Subtitle */}
          {(currentSlide[`description_${locale}`] || currentSlide.description_ka) && (
            <p 
              className={`text-base sm:text-lg lg:text-xl mb-8 transition-colors duration-150 ${
                isDark ? 'text-white/70' : 'text-black'
              }`}
              style={!isDark ? { textShadow: '0 0 8px #fff, 0 0 8px #fff, 0 0 15px #fff, 0 0 20px #fff' } : undefined}
            >
              {currentSlide[`description_${locale}`] || currentSlide.description_ka}
            </p>
          )}

          {/* CTA Buttons */}
          {currentSlide.buttons && currentSlide.buttons.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              {currentSlide.buttons
                .sort((a, b) => a.display_order - b.display_order)
                .map((button) => (
                  <button
                    key={button.id}
                    onClick={() => handleButtonClick(button)}
                    className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-xl ${
                      button.variant === 'primary'
                        ? isDark 
                          ? 'bg-white/90 text-black border border-white/50 hover:bg-white shadow-lg' 
                          : 'bg-black/80 text-white border border-black/30 hover:bg-black/90 shadow-lg'
                        : isDark
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40'
                          : 'bg-white/40 text-black border border-white/50 hover:bg-white/60 hover:border-white/70'
                    }`}
                  >
                    {button.action_type === 'contact' && <Phone className="w-4 h-4" />}
                    {button[`text_${locale}`] || button.text_ka}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Slider Navigation - Apple-style dots indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-3 items-center">
          {slides.map((_, index) => {
            const distance = Math.abs(index - currentIndex)
            const isActive = index === currentIndex
            const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15)
            
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  relative rounded-full transition-all duration-500 ease-out
                  ${isActive 
                    ? isDark ? 'bg-white' : 'bg-black'
                    : isDark ? 'bg-white/30 hover:bg-white/50' : 'bg-black/30 hover:bg-black/50'
                  }
                `}
                style={{
                  width: isActive ? '24px' : '8px',
                  height: '8px',
                  transform: `scale(${scale})`,
                }}
                aria-label={`Go to slide ${index + 1}`}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <span 
                    className={`
                      absolute inset-0 rounded-full animate-ping
                      ${isDark ? 'bg-white/30' : 'bg-black/20'}
                    `}
                    style={{ animationDuration: '2s' }}
                  />
                )}
              </button>
            )
          })}
          
          {/* Swipe hint on first visit */}
          {!isDragging && slides.length > 1 && (
            <div 
              className={`
                ml-4 flex items-center gap-2 opacity-40 text-xs
                ${isDark ? 'text-white' : 'text-black'}
              `}
            >
              <svg 
                className="w-4 h-4 animate-bounce-x" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
          isDark ? 'border-white/30' : 'border-black/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/50' : 'bg-black/50'}`} />
        </div>
      </div>
    </section>
  )
}

// Fallback static hero (original design)
function StaticHero({ isDark, locale }: { isDark: boolean; locale: string }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-16 pt-16">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=30&w=1200&auto=format&fit=crop&fm=webp"
          alt="Cityscape"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=30&w=1200&auto=format&fit=crop&fm=webp"
          alt="Cityscape"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-r from-black/80 via-black/60 to-transparent' 
            : 'bg-gradient-to-r from-white/80 via-white/60 to-transparent'
        }`} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-20">
        <div className="max-w-3xl">
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            LLC Legal Sandbox Georgia
          </h1>
          <p className={`text-base sm:text-lg lg:text-xl mb-8 ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}>
            ინოვაცია იურიდიულ სერვისებში საქართველოში
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}/contact`}
              className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg border ${
                isDark 
                  ? 'bg-white text-black border-white hover:bg-white/10 hover:text-white' 
                  : 'bg-black text-white border-black hover:bg-white hover:text-black'
              }`}
            >
              <Phone className="w-4 h-4" />
              დაგვიკავშირდით
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={`/${locale}/practices`}
              className={`group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all border ${
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
          isDark ? 'border-white/30' : 'border-black/30'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/50' : 'bg-black/50'}`} />
        </div>
      </div>
    </section>
  )
}
