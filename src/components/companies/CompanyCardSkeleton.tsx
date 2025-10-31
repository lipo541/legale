'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function CompanyCardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`group relative block overflow-hidden rounded-lg border ${
        isDark
          ? 'border-white/10 bg-white/5'
          : 'border-black/10 bg-white shadow-sm'
      }`}
    >
      {/* Logo Section */}
      <div className={`flex flex-col items-center justify-center border-b p-2.5 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        {/* Avatar Skeleton */}
        <div
          className={`h-16 w-16 rounded-full animate-pulse ${
            isDark ? 'bg-white/10' : 'bg-black/5'
          }`}
        />
        
        {/* Company Name Skeleton */}
        <div
          className={`mt-2 h-5 w-32 rounded animate-pulse ${
            isDark ? 'bg-white/10' : 'bg-black/5'
          }`}
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-3 h-[200px]">
        {/* Summary Skeleton */}
        <div className="mb-2 space-y-2">
          <div
            className={`h-3 w-full rounded animate-pulse ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          />
          <div
            className={`h-3 w-4/5 rounded animate-pulse ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          />
        </div>

        {/* Info Items Skeleton */}
        <div className="space-y-1.5 mb-2 flex-grow">
          {/* Address Skeleton */}
          <div className="flex items-start gap-2">
            <div
              className={`h-3.5 w-3.5 rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
            <div
              className={`h-3 w-full rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
          </div>

          {/* Phone Skeleton */}
          <div className="flex items-center gap-2">
            <div
              className={`h-3.5 w-3.5 rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
            <div
              className={`h-3 w-24 rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
          </div>

          {/* Website Skeleton */}
          <div className="flex items-center gap-2">
            <div
              className={`h-3.5 w-3.5 rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
            <div
              className={`h-3 w-20 rounded animate-pulse ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
            />
          </div>
        </div>

        {/* Button Skeleton */}
        <div
          className={`h-8 w-full rounded animate-pulse ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`}
        />
      </div>
    </div>
  );
}
