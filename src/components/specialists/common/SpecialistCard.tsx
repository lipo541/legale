'use client'

import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { BadgeCheck, Building2, User } from 'lucide-react'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'

interface SpecialistCardProps {
  id: string
  full_name: string
  avatar_url?: string | null
  role_title?: string | null
  slug?: string | null
  role: 'SPECIALIST' | 'SOLO_SPECIALIST'
  company_name?: string | null
  verification_status?: string
  is_homepage_featured?: boolean
  homepage_featured_order?: number | null
  locale: string
  translations: {
    solo: string
    company: string
    verified: string
    viewMore: string
  }
}

export default function SpecialistCard({
  id,
  full_name,
  avatar_url,
  role_title,
  slug,
  role,
  company_name,
  verification_status,
  is_homepage_featured,
  homepage_featured_order,
  locale,
  translations: t
}: SpecialistCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const isSolo = role === 'SOLO_SPECIALIST'
  const isVerified = verification_status === 'verified'
  
  // Get initials for avatar fallback
  const initials = full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const profileLink = slug 
    ? `/${locale}/specialists/${slug}` 
    : `/${locale}/specialists?id=${id}`

  return (
    <Link
      href={profileLink}
      className={`
        group relative flex flex-col overflow-hidden rounded-xl
        transition-all duration-300 hover:scale-[0.98]
        w-[calc(20%-13px)] min-w-[180px] max-w-[220px]
        flex-shrink-0 snap-start
        ${isDark 
          ? 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10' 
          : 'bg-black/[0.02] hover:bg-black/[0.05] border border-black/5 hover:border-black/10'
        }
      `}
    >
      {/* Featured Badge */}
      {is_homepage_featured && homepage_featured_order && (
        <div className={`
          absolute top-2 left-2 z-10
          w-5 h-5 rounded-full flex items-center justify-center
          text-[10px] font-bold
          ${isDark 
            ? 'bg-yellow-500/90 text-black' 
            : 'bg-yellow-400 text-black'
          }
        `}>
          {homepage_featured_order}
        </div>
      )}

      {/* Solo/Company Badge */}
      <div className={`
        absolute top-2 right-2 z-10
        px-2 py-0.5 rounded-full text-[9px] font-medium
        flex items-center gap-1
        ${isSolo 
          ? isDark 
            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
            : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
          : isDark 
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
        }
      `}>
        {isSolo ? (
          <>
            <User className="w-2.5 h-2.5" />
            <span>{t.solo}</span>
          </>
        ) : (
          <>
            <Building2 className="w-2.5 h-2.5" />
            <span>{t.company}</span>
          </>
        )}
      </div>

      {/* Avatar Section */}
      <div className="relative pt-8 pb-3 px-4 flex justify-center">
        <div className="relative">
          {/* Avatar Image Container */}
          <div className={`
            w-20 h-20 rounded-full overflow-hidden
            border-2 transition-colors duration-300
            ${isDark 
              ? 'border-white/10 group-hover:border-white/20' 
              : 'border-black/10 group-hover:border-black/20'
            }
          `}>
            {avatar_url ? (
              <img
                src={getOptimizedImageUrl(avatar_url, imagePresets.avatarMedium)}
                alt={full_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`
                w-full h-full flex items-center justify-center
                text-xl font-bold
                ${isDark 
                  ? 'bg-gradient-to-br from-white/10 to-white/5 text-white/40' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 text-black/40'
                }
              `}>
                {initials}
              </div>
            )}
          </div>
          
          {/* Verified Badge - Outside overflow container */}
          {isVerified && (
            <div className={`
              absolute bottom-0 right-0 
              w-6 h-6 rounded-full flex items-center justify-center
              border-2
              ${isDark ? 'bg-black border-black' : 'bg-white border-white'}
            `}>
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 pb-3 text-center">
        {/* Name */}
        <h3 className={`
          text-sm font-semibold leading-tight line-clamp-1 mb-0.5
          transition-colors duration-200
          ${isDark 
            ? 'text-white group-hover:text-white/90' 
            : 'text-black group-hover:text-black/80'
          }
        `}>
          {full_name}
        </h3>

        {/* Role Title */}
        {role_title && (
          <p className={`
            text-[11px] line-clamp-1 mb-1
            ${isDark ? 'text-white/50' : 'text-black/50'}
          `}>
            {role_title}
          </p>
        )}

        {/* Company Name (for company specialists) */}
        {!isSolo && company_name && (
          <p className={`
            text-[10px] line-clamp-1 mb-1
            ${isDark ? 'text-blue-400/70' : 'text-blue-600/70'}
          `}>
            {company_name}
          </p>
        )}
      </div>
    </Link>
  )
}
