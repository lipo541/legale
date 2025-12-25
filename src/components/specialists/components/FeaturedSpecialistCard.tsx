'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { CheckCircle, Building2, UserCircle } from 'lucide-react'

interface FeaturedSpecialistCardProps {
  id: string
  full_name: string
  avatar_url?: string | null
  role_title?: string | null
  slug?: string | null
  role: 'SPECIALIST' | 'SOLO_SPECIALIST'
  company_name?: string | null
  verification_status?: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  locale: string
  translations: {
    solo: string
    company: string
    verified: string
    viewMore: string
  }
}

export default function FeaturedSpecialistCard({
  id,
  full_name,
  avatar_url,
  role_title,
  slug,
  role,
  company_name,
  verification_status,
  locale,
  translations: t
}: FeaturedSpecialistCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const isSolo = role === 'SOLO_SPECIALIST'
  const isVerified = verification_status === 'VERIFIED'

  // Generate specialist URL
  const specialistUrl = slug 
    ? `/${locale}/specialists/${slug}` 
    : `/${locale}/specialists/${id}`

  return (
    <Link
      href={specialistUrl}
      className={`
        group flex-shrink-0 
        w-[calc(50%-8px)] min-w-[160px] max-w-[200px]
        sm:w-[calc(33.333%-11px)]
        md:w-auto md:min-w-0 md:max-w-none
        snap-center
        rounded-xl overflow-hidden
        transition-all duration-300
        ${isDark 
          ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20' 
          : 'bg-white hover:bg-gray-50 border border-black/10 hover:border-black/20 shadow-sm hover:shadow-md'
        }
      `}
    >
      {/* Avatar */}
      <div className="pt-6 pb-3 px-4 flex justify-center">
        <div className={`
          relative w-20 h-20 rounded-full overflow-hidden
          ${isDark ? 'bg-white/10' : 'bg-gray-100'}
        `}>
          {avatar_url ? (
            <img
              src={avatar_url}
              alt={full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle className={`w-12 h-12 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
            </div>
          )}
          
          {/* Verified badge */}
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-4 text-center">
        {/* Name */}
        <h3 className={`
          text-sm font-semibold truncate mb-1
          ${isDark ? 'text-white' : 'text-gray-900'}
        `}>
          {full_name}
        </h3>

        {/* Role Title */}
        {role_title && (
          <p className={`
            text-xs truncate mb-2
            ${isDark ? 'text-white/60' : 'text-gray-500'}
          `}>
            {role_title}
          </p>
        )}

        {/* Type Badge */}
        <div className="flex justify-center">
          <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
            ${isSolo
              ? isDark 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'bg-blue-100 text-blue-700'
              : isDark
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-purple-100 text-purple-700'
            }
          `}>
            {isSolo ? (
              <>
                <UserCircle className="w-3 h-3" />
                {t.solo}
              </>
            ) : (
              <>
                <Building2 className="w-3 h-3" />
                {t.company}
              </>
            )}
          </span>
        </div>

        {/* Company name for non-solo */}
        {!isSolo && company_name && (
          <p className={`
            text-xs truncate mt-2
            ${isDark ? 'text-white/40' : 'text-gray-400'}
          `}>
            {company_name}
          </p>
        )}
      </div>
    </Link>
  )
}
