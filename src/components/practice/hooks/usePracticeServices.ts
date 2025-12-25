// ==================== usePracticeServices Hook ====================
// Fetches and manages services for a specific practice

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { getClientSingleton } from '@/lib/supabase/client'
import type { Locale } from '@/lib/enums'
import type { Service } from '../types'

interface UsePracticeServicesProps {
  practiceId: string
  locale: Locale
}

interface UsePracticeServicesReturn {
  services: Service[]
  filteredServices: Service[]
  loading: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  refetch: () => Promise<void>
}

export function usePracticeServices({ 
  practiceId, 
  locale 
}: UsePracticeServicesProps): UsePracticeServicesReturn {
  const supabase = getClientSingleton()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const isFetching = useRef(false)

  const fetchServices = useCallback(async () => {
    if (isFetching.current) return
    isFetching.current = true
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
        setServices([])
        return
      }

      if (!servicesData || servicesData.length === 0) {
        setServices([])
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
        setServices([])
        return
      }

      // Combine services with their translations
      const servicesWithTranslations: Service[] = servicesData
        .map(service => {
          const translation = translationsData?.find(t => t.service_id === service.id)
          if (!translation) return null
          return {
            id: service.id,
            title: translation.title,
            slug: translation.slug,
          }
        })
        .filter((s): s is Service => s !== null)

      setServices(servicesWithTranslations)
    } catch (error) {
      console.error('Fetch error:', error)
      setServices([])
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [practiceId, locale, supabase])

  // Initial fetch
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services
    return services.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [services, searchTerm])

  return {
    services,
    filteredServices,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: fetchServices,
  }
}

export default usePracticeServices
