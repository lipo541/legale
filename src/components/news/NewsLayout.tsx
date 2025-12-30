'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useNewsData, getPostsByPosition } from './hooks/useNewsData'
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
import type { NewsLayoutProps } from './types'

export default function NewsLayout({ locale, initialData }: NewsLayoutProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  // Use SSR data - no client-side fetching needed
  const { posts, loading } = useNewsData({
    initialPosts: initialData.posts,
    categories: initialData.categories,
    locale,
    uncategorizedLabel: t.uncategorized
  })
  
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

      <div className="min-h-screen pt-2 pb-4 md:pt-3 md:pb-8 lg:pt-4 lg:pb-12 transition-colors duration-300">
        {/* Container - Max Width 1200px (Apple style) */}
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10">
          {/* Main content area */}
          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            {/* Team Banners Slider - Top Section */}
            <div className="mb-6">
              <TeamBannerSlider language={locale} />
            </div>

            {/* Main Grid Layout - Apple minimalist approach */}
            {/* Mobile: Single column stack | Tablet: 2-column | Desktop: Complex grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3.5 lg:grid-cols-12 lg:gap-4">
          {/* Position 1 - Hero Slider */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 lg:row-span-3 order-1 overflow-hidden">
            <div className="h-[280px] sm:h-[320px] md:h-[350px] lg:h-[580px] overflow-hidden">
              <Position1 posts={position1Posts} />
            </div>
          </div>

          {/* Position 3 - Main Feature Slider */}
          <div className="col-span-1 md:col-span-1 lg:col-span-6 lg:row-span-2 order-2 overflow-hidden">
            <div className="h-[220px] sm:h-[240px] md:h-[280px] lg:h-[380px] overflow-hidden">
              <Position3 posts={position3Posts} />
            </div>
          </div>

          {/* Position 5 - News Ticker */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 lg:row-span-2 order-3 overflow-hidden">
            <div className="h-[180px] sm:h-[200px] md:h-[280px] lg:h-[380px] overflow-hidden">
              <Position5 posts={position5Posts} />
            </div>
          </div>

          {/* MIDDLE ROW - 3 Cards: 2-column grid on mobile, 3-column on desktop */}
          {/* Position 4 - Stats Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 order-4 overflow-hidden">
            <div className="h-[80px] sm:h-[100px] md:h-[140px] lg:h-[190px] overflow-hidden">
              <Position4 />
            </div>
          </div>

          {/* Position 6 - Category Card */}
          <div className="col-span-1 md:col-span-1 lg:col-span-3 order-5 overflow-hidden">
            <div className="h-[80px] sm:h-[100px] md:h-[140px] lg:h-[190px] overflow-hidden">
              <Position6 posts={position6Posts} />
            </div>
          </div>

          {/* Position 7 - Quick Link */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 order-6 overflow-hidden">
            <div className="h-[80px] sm:h-[100px] md:h-[140px] lg:h-[190px] overflow-hidden">
              <Position7 posts={position7Posts} />
            </div>
          </div>
        </div>

        {/* News Banner - After Position 6 & 7 */}
        <div className="my-6">
          <NewsBanner />
        </div>

        {/* Second Grid Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3.5 lg:grid-cols-3 lg:gap-4">
          {/* Position 2 - Vertical News Feed */}
          <div className="col-span-1 overflow-hidden">
            <div className="h-[180px] sm:h-[200px] md:h-[240px] lg:h-[280px] overflow-hidden">
              <Position2 posts={position2Posts} />
            </div>
          </div>

          {/* Position 9 - Horizontal News Carousel */}
          <div className="col-span-1 overflow-hidden">
            <div className="h-[180px] sm:h-[200px] md:h-[240px] lg:h-[280px] overflow-hidden">
              <Position9 posts={position9Posts} />
            </div>
          </div>

          {/* Position 10 - Featured Topics */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 overflow-hidden">
            <div className="h-[80px] sm:h-[100px] md:h-[140px] lg:h-[280px] overflow-hidden">
              <Position10 posts={position10Posts} />
            </div>
          </div>
        </div>

        {/* ALL POSTS SECTION - Authors' uploaded news before Admin assigns positions */}
        <AllPostsSection 
          initialPosts={initialData.posts}
          categories={initialData.categories}
          rootCategories={initialData.rootCategories}
          locale={locale}
        />
      </main>
      </div>
    </div>
    </>
  )
}
