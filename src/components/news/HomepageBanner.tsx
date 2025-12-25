'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BannerData {
  id: string
  image_url_ka: string
  image_url_en: string
  image_url_ru: string
  category_id: string | null
  category_slug?: string | null
}

export default function HomepageBanner() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'ka'
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Fetch the homepage featured banner
        const { data: bannerData, error: bannerError } = await supabase
          .from('news_banners')
          .select('id, image_url_ka, image_url_en, image_url_ru, category_id')
          .eq('is_active', true)
          .eq('is_homepage_featured', true)
          .single()

        if (bannerError || !bannerData) {
          setLoading(false)
          return
        }

        // Fetch category slug if banner has category_id
        if (bannerData.category_id) {
          const { data: categoryData } = await supabase
            .from('post_category_translations')
            .select('slug')
            .eq('category_id', bannerData.category_id)
            .eq('language', locale)
            .single()

          setBanner({
            ...bannerData,
            category_slug: categoryData?.slug || null
          })
        } else {
          setBanner({
            ...bannerData,
            category_slug: null
          })
        }
      } catch (error) {
        console.error('Error fetching homepage banner:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanner()
  }, [locale])

  // Don't render if no banner or loading
  if (loading || !banner) {
    return null
  }

  // Get the correct image URL based on locale
  const imageUrl = locale === 'ka' 
    ? banner.image_url_ka 
    : locale === 'en' 
      ? banner.image_url_en 
      : banner.image_url_ru

  // Handle click - navigate to news category if available
  const handleClick = () => {
    if (banner.category_slug) {
      router.push(`/${locale}/news/category/${banner.category_slug}`)
    } else {
      router.push(`/${locale}/news`)
    }
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div 
        onClick={handleClick}
        className={`w-full overflow-hidden rounded-lg border transition-all cursor-pointer ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}
      >
        {/* Banner Image Container - Same aspect ratio as news page */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '12.5%' }}>
          <img
            src={imageUrl}
            alt="Featured Banner"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
