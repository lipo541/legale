'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import { useNewsPosts, getPostsByPosition } from '@/hooks/useNewsPosts'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import SkipLink from '@/components/common/SkipLink'
import Position1 from './positions/Position1'
import Position2 from './positions/Position2'
import Position3 from './positions/Position3'
import Position4 from './positions/Position4'
import Position5 from './positions/Position5'
import Position6 from './positions/Position6'
import Position7 from './positions/Position7'
import Position9 from './positions/Position9'
import Position10 from './positions/Position10'
import AllPostsSection from './AllPostsSection'
import NewsBanner from './newsbanner/NewsBanner'
import TeamBannerSlider from './TeamBannerSlider'
import { newsTranslations } from '@/translations/news'

export default function NewsLayout() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  // const prefersReducedMotion = useReducedMotion() // TODO: Use for animations in future
  
  // Single API call for all posts - PERFORMANCE OPTIMIZATION
  const { posts, loading, error } = useNewsPosts(locale)
  
  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen py-4 md:py-8 lg:py-12 transition-colors duration-300 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}>
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
          <div className={`flex items-center justify-center py-20 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="ml-3 text-lg">{t.loading}</span>
          </div>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className={`min-h-screen py-4 md:py-8 lg:py-12 transition-colors duration-300 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}>
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
          <div className={`py-20 text-center ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            <p className="text-lg">{t.error || 'Error loading posts'}</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Filter posts by position for each component
  const position1Posts = getPostsByPosition(posts, 1, 5)
  const position2Posts = getPostsByPosition(posts, 2, 4)
  const position3Posts = getPostsByPosition(posts, 3, 5)
  const position5Posts = getPostsByPosition(posts, 5, 10)
  const position6Posts = getPostsByPosition(posts, 6, 1)
  const position7Posts = getPostsByPosition(posts, 7, 1)
  const position9Posts = getPostsByPosition(posts, 9, 10)
  const position10Posts = getPostsByPosition(posts, 10, 1)

  return (
    <>
      {/* Skip to main content - WCAG 2.1 - 2.4.1 Bypass Blocks */}
      <SkipLink />

      {/* Screen Reader Announcement - ARIA live region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {t.postsLoaded?.replace('{count}', posts.length.toString()) || `${posts.length} posts loaded`}
      </div>

      <div className={`min-h-screen pt-2 pb-4 md:pt-3 md:pb-8 lg:pt-4 lg:pb-12 transition-colors duration-300 ${
        isDark ? 'bg-black' : 'bg-white'
      }`}>
        {/* Container - Max Width 1200px (Apple style) */}
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
          {/* Main content area */}
          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            {/* Team Banners Slider - Top Section */}
            <div className="mb-6">
              <TeamBannerSlider language={locale} />
            </div>

            {/* Main Grid Layout - Apple minimalist approach */}
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-2.5 md:gap-3.5 lg:gap-4">
          {/* TOP ROW - 3 POSITIONS */}
          {/* Position 1 - Hero Slider (Left, spans 3 rows) */}
          <div className="md:col-span-6 lg:col-span-3 lg:row-span-3">
            <div className="h-[320px] md:h-[450px] lg:h-[580px]">
              <Position1 posts={position1Posts} />
            </div>
          </div>

          {/* Position 3 - Main Feature Slider (Center, spans 2 rows) */}
          <div className="md:col-span-6 lg:col-span-6 lg:row-span-2">
            <div className="h-[240px] md:h-[350px] lg:h-[380px]">
              <Position3 posts={position3Posts} />
            </div>
          </div>

          {/* Position 5 - News Ticker (Right, spans 2 rows) */}
          <div className="md:col-span-6 lg:col-span-3 lg:row-span-2">
            <div className="h-[200px] md:h-[300px] lg:h-[380px]">
              <Position5 posts={position5Posts} />
            </div>
          </div>

          {/* MIDDLE ROW - 3 EQUAL CARDS (below Position 3 and 5) */}
          {/* Position 4 - Stats Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[120px] md:h-[180px] lg:h-[190px]">
              <Position4 />
            </div>
          </div>

          {/* Position 6 - Category Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[120px] md:h-[180px] lg:h-[190px]">
              <Position6 posts={position6Posts} />
            </div>
          </div>

          {/* Position 7 - Quick Link */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[120px] md:h-[180px] lg:h-[190px]">
              <Position7 posts={position7Posts} />
            </div>
          </div>
        </div>

        {/* News Banner - After Position 6 & 7 */}
        <div className="my-6">
          <NewsBanner />
        </div>

        {/* Second Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-2.5 md:gap-3.5 lg:gap-4">
          {/* BOTTOM ROW - 3 EQUAL CARDS (below Position 1) */}
          {/* Position 2 - Vertical News Feed */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[160px] md:h-[220px] lg:h-[240px]">
              <Position2 posts={position2Posts} />
            </div>
          </div>

          {/* Position 9 - Horizontal News Carousel */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[180px] md:h-[280px] lg:h-[335px]">
              <Position9 posts={position9Posts} />
            </div>
          </div>

          {/* Position 10 - Featured Topics */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[180px] md:h-[280px] lg:h-[335px]">
              <Position10 posts={position10Posts} />
            </div>
          </div>
        </div>

        {/* ALL POSTS SECTION - Authors' uploaded news before Admin assigns positions */}
        <AllPostsSection />
      </main>
      </div>
    </div>
    </>
  )
}
