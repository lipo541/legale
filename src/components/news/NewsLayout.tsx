'use client'

import { useTheme } from '@/contexts/ThemeContext'
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

export default function NewsLayout() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen py-6 md:py-8 lg:py-12 transition-colors duration-300 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      {/* Container - Max Width 1200px (Apple style) */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Minimal Apple-style Header */}
        <div className="mb-8 md:mb-12 lg:mb-16 space-y-2 md:space-y-3">
          <h1 className={`text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            სიახლეები
          </h1>
          <p className={`text-sm md:text-lg lg:text-xl ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            უახლესი ინფორმაცია და განახლებები
          </p>
        </div>

        {/* Main Grid Layout - Apple minimalist approach */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-3 md:gap-3.5 lg:gap-4">
          {/* TOP ROW - 3 POSITIONS */}
          {/* Position 1 - Hero Slider (Left, spans 3 rows) */}
          <div className="md:col-span-6 lg:col-span-3 lg:row-span-3">
            <div className="h-[350px] md:h-[450px] lg:h-[580px]">
              <Position1 />
            </div>
          </div>

          {/* Position 3 - Main Feature Slider (Center, spans 2 rows) */}
          <div className="md:col-span-6 lg:col-span-6 lg:row-span-2">
            <div className="h-[280px] md:h-[350px] lg:h-[380px]">
              <Position3 />
            </div>
          </div>

          {/* Position 5 - News Ticker (Right, spans 2 rows) */}
          <div className="md:col-span-6 lg:col-span-3 lg:row-span-2">
            <div className="h-[240px] md:h-[300px] lg:h-[380px]">
              <Position5 />
            </div>
          </div>

          {/* MIDDLE ROW - 3 EQUAL CARDS (below Position 3 and 5) */}
          {/* Position 4 - Stats Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[140px] md:h-[180px] lg:h-[190px]">
              <Position4 />
            </div>
          </div>

          {/* Position 6 - Category Card */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[140px] md:h-[180px] lg:h-[190px]">
              <Position6 />
            </div>
          </div>

          {/* Position 7 - Quick Link */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="h-[140px] md:h-[180px] lg:h-[190px]">
              <Position7 />
            </div>
          </div>

          {/* BOTTOM ROW - 3 EQUAL CARDS (below Position 1) */}
          {/* Position 2 - Vertical News Feed */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[180px] md:h-[220px] lg:h-[240px]">
              <Position2 />
            </div>
          </div>

          {/* Position 9 - Horizontal News Carousel */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[220px] md:h-[280px] lg:h-[335px]">
              <Position9 />
            </div>
          </div>

          {/* Position 10 - Featured Topics */}
          <div className="md:col-span-2 lg:col-span-4">
            <div className="h-[220px] md:h-[280px] lg:h-[335px]">
              <Position10 />
            </div>
          </div>
        </div>

        {/* ALL POSTS SECTION - Authors' uploaded news before Admin assigns positions */}
        <AllPostsSection />
      </div>
    </div>
  )
}
