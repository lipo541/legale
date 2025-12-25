'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SpecialistCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

export default function SpecialistCardSkeleton({ viewMode = 'grid' }: SpecialistCardSkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // List view skeleton
  if (viewMode === 'list') {
    return (
      <div 
        className={`relative flex overflow-hidden rounded-xl border animate-pulse ${
          isDark
            ? 'border-white/10 bg-white/5'
            : 'border-black/10 bg-white shadow-sm'
        }`}
      >
        <div className="flex w-full items-center gap-3 p-3 sm:gap-0 sm:p-0">
          {/* Left: Avatar and Name */}
          <div className="flex flex-1 items-center gap-3 sm:w-1/3 sm:gap-4 sm:p-4">
            {/* Avatar skeleton */}
            <div className={`h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 rounded-full ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`} />

            {/* Text skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className={`h-4 w-3/4 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
              <div className={`h-3 w-1/2 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
              <div className={`h-3 w-2/3 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
            </div>
          </div>

          {/* Middle: Contact & Bio - Hidden on mobile */}
          <div className={`hidden sm:flex sm:flex-1 border-l p-4 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="flex-1 space-y-2">
              <div className={`h-3 w-3/4 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
              <div className={`h-3 w-1/2 rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
              <div className={`h-3 w-full rounded ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              }`} />
            </div>
          </div>

          {/* Right: Action Button */}
          <div className={`flex items-center sm:border-l p-0 sm:p-3 ${
            isDark ? 'sm:border-white/10' : 'sm:border-black/10'
          }`}>
            <div className={`h-8 w-16 sm:w-24 rounded-lg ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`} />
          </div>
        </div>
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div 
      className={`relative flex flex-col overflow-hidden rounded-2xl border animate-pulse ${
        isDark
          ? 'border-white/10 bg-white/5'
          : 'border-black/10 bg-white shadow-sm'
      }`}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Avatar and Info Section */}
        <div className="mb-3 flex items-start gap-3">
          {/* Avatar skeleton */}
          <div className={`h-20 w-20 flex-shrink-0 rounded-full ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />

          {/* Name and info skeleton */}
          <div className="flex-1 space-y-2">
            <div className={`h-4 w-3/4 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`} />
            <div className={`h-3 w-1/2 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`} />
            <div className={`h-3 w-2/3 rounded ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`} />
          </div>
        </div>

        {/* Contact skeleton */}
        <div className="mb-3 space-y-1.5">
          <div className={`h-3 w-3/4 rounded ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />
          <div className={`h-3 w-2/3 rounded ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />
        </div>

        {/* Bio skeleton */}
        <div className="space-y-2">
          <div className={`h-3 w-full rounded ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />
          <div className={`h-3 w-full rounded ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />
          <div className={`h-3 w-3/4 rounded ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`} />
        </div>
      </div>

      {/* Button skeleton */}
      <div className={`mt-auto border-t ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}>
        <div className={`m-4 h-6 rounded ${
          isDark ? 'bg-white/10' : 'bg-black/10'
        }`} />
      </div>
    </div>
  );
}
