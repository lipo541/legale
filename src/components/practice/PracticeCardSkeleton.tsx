'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function PracticeCardSkeleton() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={`rounded-lg overflow-hidden border animate-pulse ${
        isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-black/10 shadow-sm'
      }`}
    >
      {/* Image Skeleton */}
      <div className={`aspect-[4/3] ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`h-12 w-12 rounded-full ${
              isDark ? 'bg-white/20' : 'bg-black/10'
            }`}
          />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title - 2 lines */}
        <div className="space-y-2">
          <div
            className={`h-5 rounded ${
              isDark ? 'bg-white/20' : 'bg-black/10'
            } w-3/4`}
          />
          <div
            className={`h-5 rounded ${
              isDark ? 'bg-white/20' : 'bg-black/10'
            } w-1/2`}
          />
        </div>

        {/* Description - 2 lines */}
        <div className="space-y-2">
          <div
            className={`h-3 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            } w-full`}
          />
          <div
            className={`h-3 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            } w-4/5`}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <div
            className={`h-3 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            } w-20`}
          />
          <div
            className={`h-3 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            } w-16`}
          />
        </div>
      </div>
    </div>
  )
}
