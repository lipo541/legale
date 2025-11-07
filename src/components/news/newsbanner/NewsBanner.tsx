'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface BannerData {
  id: string
  image_url_ka: string
  image_url_en: string
  image_url_ru: string
  category_id: string | null
  category_slug?: string | null
  display_order: number
}

export default function NewsBanner() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'ka'
  const [banners, setBanners] = useState<BannerData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartTime = useRef(0)
  const isDragging = useRef(false)
  const mouseStartX = useRef(0)
  const mouseEndX = useRef(0)
  const isMouseDown = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Fetch all active banners
        const { data: bannersData, error: bannersError } = await supabase
          .from('news_banners')
          .select('id, image_url_ka, image_url_en, image_url_ru, category_id, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })

        if (bannersError || !bannersData || bannersData.length === 0) {
          setLoading(false)
          return
        }

        // Fetch category slugs for all banners with category_id
        const bannersWithSlugs = await Promise.all(
          bannersData.map(async (banner) => {
            if (banner.category_id) {
              const { data: categoryData } = await supabase
                .from('post_category_translations')
                .select('slug')
                .eq('category_id', banner.category_id)
                .eq('language', locale)
                .single()

              return {
                ...banner,
                category_slug: categoryData?.slug || null
              }
            }
            return {
              ...banner,
              category_slug: null
            }
          })
        )

        setBanners(bannersWithSlugs)
      } catch (error) {
        console.error('Error fetching banners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [locale])

  // Keyboard navigation
  useEffect(() => {
    if (banners.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [banners.length, currentIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartTime.current = Date.now()
    isDragging.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    const diff = Math.abs(touchStartX.current - e.touches[0].clientX)
    // Mark as dragging if moved more than 10px
    if (diff > 10) {
      isDragging.current = true
    }
  }

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current
    const swipeTime = Date.now() - touchStartTime.current
    
    // Only process if it was a swipe (moved > 50px) and not a long press
    if (Math.abs(swipeDistance) > 50 && swipeTime < 500) {
      if (swipeDistance > 50) {
        handleNext()
      } else if (swipeDistance < -50) {
        handlePrevious()
      }
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isMouseDown.current = true
    mouseStartX.current = e.clientX
    mouseEndX.current = e.clientX
    isDragging.current = false
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current) return
    
    mouseEndX.current = e.clientX
    const diff = Math.abs(mouseStartX.current - e.clientX)
    
    if (diff > 10) {
      isDragging.current = true
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current) return
    
    e.currentTarget.style.cursor = 'grab'
    
    const dragDistance = mouseStartX.current - mouseEndX.current
    
    if (Math.abs(dragDistance) > 50) {
      if (dragDistance > 50) {
        handleNext()
      } else if (dragDistance < -50) {
        handlePrevious()
      }
    }
    
    isMouseDown.current = false
    // Reset isDragging after a short delay to prevent click
    setTimeout(() => {
      isDragging.current = false
    }, 10)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMouseDown.current) {
      e.currentTarget.style.cursor = 'grab'
    }
    isMouseDown.current = false
  }

  const handleBannerClick = (e: React.MouseEvent) => {
    // Don't navigate if user was dragging
    if (isDragging.current) {
      e.preventDefault()
      isDragging.current = false
      return
    }
    
    const currentBanner = banners[currentIndex]
    if (currentBanner?.category_slug) {
      router.push(`/${locale}/news/category/${currentBanner.category_slug}`)
    }
  }

  // Don't render anything if loading or no banners
  if (loading || banners.length === 0) {
    return null
  }

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative group">
      <div 
        onClick={handleBannerClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`w-full overflow-hidden rounded-lg border transition-all select-none ${
          currentBanner?.category_slug 
            ? 'cursor-grab active:cursor-grabbing' 
            : 'cursor-default'
        } ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}
      >
        {/* Banner Images Container - Horizontal Scroll */}
        <div 
          ref={containerRef}
          className="relative w-full overflow-hidden" 
          style={{ paddingBottom: '12.5%' }}
        >
          <div 
            className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, index) => {
              const imageUrl = locale === 'en' 
                ? banner.image_url_en 
                : locale === 'ru' 
                ? banner.image_url_ru 
                : banner.image_url_ka

              return (
                <div 
                  key={banner.id} 
                  className="relative flex-shrink-0 w-full h-full"
                >
                  <Image
                    src={imageUrl}
                    alt={`News Banner ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Removed */}
      {/* Swipe Hint Animation - Always visible */}
      {banners.length > 1 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {/* Animated gradient wave */}
          <div 
            className="absolute top-0 bottom-0 w-32 opacity-30"
            style={{
              background: isDark
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent)',
              animation: 'swipeWave 3s ease-in-out infinite',
              animationDelay: '1s'
            }}
          />
          
          {/* Swipe icon indicators */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white/40' : 'bg-black/40'
                }`}
                style={{
                  animation: 'slideRight 2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-white/40' : 'bg-black/40'
                }`}
                style={{
                  animation: 'slideLeft 2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dots Indicator - Always show if multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? isDark
                    ? 'bg-white w-6'
                    : 'bg-black w-6'
                  : isDark
                  ? 'bg-white/40 w-2 hover:bg-white/60'
                  : 'bg-black/40 w-2 hover:bg-black/60'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
