'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { UserRole, Locale } from '@/lib/enums'
import { getServiceDetailTranslations } from '@/translations/service-detail'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import Link from 'next/link'

// Import from local modules
import { useServiceSpecialists } from './hooks'
import type { ServiceSpecialistCardProps } from './types'

export default function ServiceSpecialistCard({ serviceId, locale }: ServiceSpecialistCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const text = getServiceDetailTranslations(locale)

  // Use extracted hook
  const { specialists, loading } = useServiceSpecialists(serviceId, locale)

  // Don't render if no specialists
  if (!loading && specialists.length === 0) {
    return null
  }

  return (
    <div className={`rounded-2xl p-6 md:p-8 border ${
      isDark 
        ? 'border-white/10' 
        : 'border-gray-200'
    }`}>
      {/* Section Title */}
      <h2 className="text-xl md:text-2xl font-bold mb-6">
        {text.specialistsTitle}
      </h2>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            {text.loading}
          </p>
        </div>
      ) : (
        /* Specialists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
            <Link
              key={specialist.id}
              href={specialist.slug ? `/${locale}/specialists/${specialist.slug}` : '#'}
              className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] ${
                specialist.slug ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  : 'bg-black/5 border-gray-200 hover:bg-black/10 hover:border-gray-300'
              }`}
            >
              {/* Profile Image - Wider aspect ratio */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={getOptimizedImageUrl(specialist.avatar_url, imagePresets.cardLarge) || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop'}
                  alt={specialist.full_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Badge - Top Right */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-[11px] font-medium ${
                    specialist.role === UserRole.SOLO_SPECIALIST
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {specialist.role === UserRole.SOLO_SPECIALIST ? text.soloSpecialist : text.companySpecialist}
                  </span>
                </div>
              </div>

              {/* Info Section - Dark background at bottom */}
              <div className={`p-5 ${
                isDark 
                  ? 'bg-black/60 backdrop-blur-sm' 
                  : 'bg-white/90 backdrop-blur-sm'
              }`}>
                {/* Name */}
                <h3 className={`text-base md:text-lg font-bold mb-1 ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {specialist.full_name}
                </h3>

                {/* Position */}
                <p className={`text-xs md:text-sm ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  {specialist.role_title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
