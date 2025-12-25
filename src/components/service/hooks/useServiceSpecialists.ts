/**
 * Custom Hook: useServiceSpecialists
 * Fetches specialists associated with a specific service
 */

'use client'

import { useState, useEffect } from 'react'
import { UserRole, Locale } from '@/lib/enums'
import { useToast } from '@/contexts/ToastContext'
import { getServiceDetailTranslations } from '@/translations/service-detail'
import { createClient } from '@/lib/supabase/client'
import type { Specialist, UseServiceSpecialistsResult } from '../types'

export function useServiceSpecialists(
  serviceId: string,
  locale: Locale
): UseServiceSpecialistsResult {
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
          .select('specialist_id, full_name, role_title, slug')
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
            const profiles = item.profiles
            if (!profiles) return null
            const profile = Array.isArray(profiles) ? profiles[0] : (profiles as { 
              id: string
              role: string
              avatar_url: string | null
              is_blocked: boolean
              slug: string
            })
            if (!profile) return null

            const translation = translationsData?.find(t => t.specialist_id === profile.id)
            if (!translation) return null
            
            return {
              id: profile.id,
              full_name: translation.full_name,
              role_title: translation.role_title,
              avatar_url: profile.avatar_url ?? null,
              slug: translation.slug ?? null,
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

  return { specialists, loading }
}
