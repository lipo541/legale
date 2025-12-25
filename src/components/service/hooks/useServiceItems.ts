/**
 * Custom Hook: useServiceItems
 * Fetches services for a specific practice
 */

'use client'

import { useState, useEffect } from 'react'
import { Locale } from '@/lib/enums'
import { useToast } from '@/contexts/ToastContext'
import { getServiceDetailTranslations } from '@/translations/service-detail'
import { createClient } from '@/lib/supabase/client'
import type { ServiceItem, UseServiceItemsResult } from '../types'

export function useServiceItems(
  practiceId: string,
  locale: Locale
): UseServiceItemsResult {
  const { showToast } = useToast()
  const text = getServiceDetailTranslations(locale)
  const supabase = createClient()

  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      
      try {
        // Fetch services for this practice
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('practice_id', practiceId)
          .eq('status', 'published')

        if (servicesError) {
          console.error('Error fetching services:', servicesError)
          showToast(text.errorLoadingServices, 'error')
          return
        }

        if (!servicesData || servicesData.length === 0) {
          setServices([])
          setLoading(false)
          return
        }

        // Fetch translations for these services
        const serviceIds = servicesData.map(s => s.id)
        const { data: translationsData, error: translationsError } = await supabase
          .from('service_translations')
          .select('service_id, title, slug')
          .in('service_id', serviceIds)
          .eq('language', locale)

        if (translationsError) {
          console.error('Error fetching service translations:', translationsError)
          showToast(text.errorLoadingTranslations, 'error')
          return
        }

        // Combine services with their translations
        const servicesWithTranslations: ServiceItem[] = servicesData
          .map(s => {
            const trans = translationsData?.find(t => t.service_id === s.id)
            if (!trans) return null
            return {
              id: s.id,
              title: trans.title,
              slug: trans.slug
            }
          })
          .filter((s): s is ServiceItem => s !== null)

        setServices(servicesWithTranslations)
      } catch (error) {
        console.error('Fetch error:', error)
        showToast(text.errorGeneral, 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [practiceId, locale, supabase, showToast, text])

  return { services, loading }
}
