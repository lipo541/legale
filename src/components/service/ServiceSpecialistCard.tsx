'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { UserRole, Locale } from '@/lib/enums'
import { getServiceDetailTranslations } from '@/translations/service-detail'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Specialist {
  id: string
  full_name: string
  role_title: string
  avatar_url: string | null
  slug: string
  role: UserRole.SPECIALIST | UserRole.SOLO_SPECIALIST
}

interface ServiceSpecialistCardProps {
  serviceId: string
  locale: Locale
}

export default function ServiceSpecialistCard({ serviceId, locale }: ServiceSpecialistCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { showToast } = useToast()
  const text = getServiceDetailTranslations(locale)
  const supabase = createClient()

  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpecialists = async () => {
      setLoading(true)
      
      try {
        // Optimized single query with JOINs
        const { data, error } = await supabase
          .from('specialist_services')
          .select(`
            profile_id,
            profiles!inner(
              id,
              avatar_url,
              slug,
              role
            )
          `)
          .eq('service_id', serviceId)
          .in('profiles.role', [UserRole.SPECIALIST, UserRole.SOLO_SPECIALIST])

        if (error) {
          console.error('Error fetching specialist data:', error)
          showToast(text.errorLoadingSpecialists, 'error')
          setSpecialists([])
          setLoading(false)
          return
        }

        if (!data || data.length === 0) {
          setSpecialists([])
          setLoading(false)
          return
        }

        // Extract profile IDs for translation query
        const profileIds = data
          .map(item => {
            // Supabase can return array or single object depending on relationship
            const profiles = item.profiles
            if (!profiles) return null
            return Array.isArray(profiles) ? profiles[0]?.id : (profiles as { id: string }).id
          })
          .filter((id): id is string => typeof id === 'string')

        if (profileIds.length === 0) {
          setSpecialists([])
          setLoading(false)
          return
        }

        // Fetch translations in a separate optimized query
        const { data: translationsData, error: translationsError } = await supabase
          .from('specialist_translations')
          .select('specialist_id, full_name, role_title')
          .in('specialist_id', profileIds)
          .eq('language', locale)

        if (translationsError) {
          console.error('Error fetching translations:', translationsError)
          showToast(text.errorLoadingTranslations, 'error')
          setSpecialists([])
          setLoading(false)
          return
        }

        // Combine data efficiently
        const specialistsWithTranslations: Specialist[] = data
          .map(item => {
            // Supabase can return array or single object depending on relationship
            const profiles = item.profiles
            if (!profiles) return null
            const profile = Array.isArray(profiles) ? profiles[0] : (profiles as { 
              id: string; 
              role: string; 
              avatar_url: string | null; 
              is_blocked: boolean;
              slug: string;
            })
            if (!profile) return null

            const translation = translationsData?.find(t => t.specialist_id === profile.id)
            if (!translation) return null
            
            return {
              id: profile.id,
              full_name: translation.full_name,
              role_title: translation.role_title,
              avatar_url: profile.avatar_url ?? null,
              slug: profile.slug,
              role: profile.role as UserRole.SPECIALIST | UserRole.SOLO_SPECIALIST
            }
          })
          .filter((s): s is Specialist => s !== null)

        setSpecialists(specialistsWithTranslations)
      } catch (error) {
        console.error('Fetch error:', error)
        showToast(text.errorGeneral, 'error')
        setSpecialists([])
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialists()
  }, [serviceId, locale, supabase, showToast, text])

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
              href={`/${locale}/specialists/${specialist.slug}`}
              className={`group rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  : 'bg-black/5 border-gray-200 hover:bg-black/10 hover:border-gray-300'
              }`}
            >
              {/* Profile Image - Wider aspect ratio */}
              <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={specialist.avatar_url ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop'}
                  alt={specialist.full_name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
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
