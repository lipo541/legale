'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Briefcase, Loader2, CheckCircle, Edit, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'

const servicesFieldTranslations = {
  ka: {
    services: 'სერვისები',
    search: 'ძებნა...',
    selected: 'არჩეული',
    save: 'შენახვა',
    saving: 'შენახვა...',
    cancel: 'გაუქმება',
    edit: 'რედაქტირება',
    noServicesSelected: 'სერვისები არ არის არჩეული',
    servicesNotFound: 'სერვისები ვერ მოიძებნა',
    servicesUpdated: 'სერვისები წარმატებით განახლდა!',
    error: 'შეცდომა',
    saveError: 'შეცდომა შენახვისას'
  },
  en: {
    services: 'Services',
    search: 'Search...',
    selected: 'Selected',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    edit: 'Edit',
    noServicesSelected: 'No services selected',
    servicesNotFound: 'No services found',
    servicesUpdated: 'Services updated successfully!',
    error: 'Error',
    saveError: 'Error saving'
  },
  ru: {
    services: 'Услуги',
    search: 'Поиск...',
    selected: 'Выбрано',
    save: 'Сохранить',
    saving: 'Сохранение...',
    cancel: 'Отмена',
    edit: 'Редактировать',
    noServicesSelected: 'Услуги не выбраны',
    servicesNotFound: 'Услуги не найдены',
    servicesUpdated: 'Услуги успешно обновлены!',
    error: 'Ошибка',
    saveError: 'Ошибка сохранения'
  }
}

type Locale = 'ka' | 'en' | 'ru'

interface Service {
  id: string
  service_translations: {
    title: string
    language: string
  }[]
}

interface ServicesFieldProps {
  profileId: string
  isDark: boolean
  isEditing?: boolean
  onSave?: () => void
  onCancel?: () => void
  showActions?: boolean
}

export default function ServicesField({ 
  profileId, 
  isDark, 
  isEditing: externalIsEditing,
  onSave,
  onCancel,
  showActions = true 
}: ServicesFieldProps) {
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] || 'ka') as Locale
  const t = servicesFieldTranslations[locale] || servicesFieldTranslations.ka
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>([])
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Use external isEditing if provided, otherwise use internal state
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing

  // Fetch all services and user's selected services
  const fetchData = useCallback(async () => {
    console.log('Fetching services and selected services for profile:', profileId)
    setLoading(true)
    try {
      // Fetch all services with translations for all languages
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          service_translations (
            title,
            language
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (servicesError) {
        console.error('Error fetching services:', servicesError)
      } else {
        console.log('Fetched services:', servicesData?.length || 0)
        setServices(servicesData || [])
      }

      // Fetch user's selected services
      const { data: selectedData, error: selectedError } = await supabase
        .from('specialist_services')
        .select('service_id')
        .eq('profile_id', profileId)

      if (selectedError) {
        console.error('Error fetching selected services:', selectedError)
      } else {
        console.log('Fetched selected services:', selectedData?.length || 0)
        const ids = selectedData?.map(item => item.service_id) || []
        setSelectedServices(ids)
        setTempSelectedServices(ids)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [profileId, supabase])

  useEffect(() => {
    console.log('ServicesField mounted for profile:', profileId)
    fetchData()
  }, [profileId, fetchData])

  // Reset temp selection when editing starts/stops
  useEffect(() => {
    if (isEditing) {
      setTempSelectedServices([...selectedServices])
    }
  }, [isEditing, selectedServices])

  const toggleService = (serviceId: string) => {
    if (!isEditing) return
    
    setTempSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Delete all existing selections
      const { error: deleteError } = await supabase
        .from('specialist_services')
        .delete()
        .eq('profile_id', profileId)

      if (deleteError) {
        console.error('Error deleting services:', deleteError)
        showToast(t.error + ': ' + deleteError.message, 'error')
        return
      }

      // Insert new selections
      if (tempSelectedServices.length > 0) {
        const { error: insertError } = await supabase
          .from('specialist_services')
          .insert(
            tempSelectedServices.map(service_id => ({
              profile_id: profileId,
              service_id
            }))
          )

        if (insertError) {
          console.error('Error inserting services:', insertError)
          showToast(t.error + ': ' + insertError.message, 'error')
          return
        }
      }

      setSelectedServices([...tempSelectedServices])
      showToast(t.servicesUpdated, 'success')
      setInternalIsEditing(false)
      onSave?.()
    } catch (error) {
      console.error('Save error:', error)
      showToast(t.saveError, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTempSelectedServices([...selectedServices])
    setInternalIsEditing(false)
    onCancel?.()
  }

  const handleStartEdit = () => {
    setInternalIsEditing(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
      </div>
    )
  }

  const getServiceTitle = (service: Service) => {
    const translation = service.service_translations.find((tr: { language: string }) => tr.language === locale)
    return translation?.title || service.service_translations.find((tr: { language: string }) => tr.language === 'ka')?.title || 'N/A'
  }

  // Filter services based on search term
  const filteredServices = services.filter(service => {
    if (!searchTerm) return true
    const title = getServiceTitle(service).toLowerCase()
    return title.includes(searchTerm.toLowerCase())
  })

  const displayServices = isEditing ? tempSelectedServices : selectedServices

  return (
    <div>
      <label className={`mb-2 flex items-center gap-1.5 lg:gap-2 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        <Briefcase className="h-3.5 w-3.5" />
        {t.services}
      </label>

      {isEditing ? (
        <>
          {/* Search Box */}
          <div className="mb-2 lg:mb-3 relative">
            <Search className={`absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className={`w-full pl-8 lg:pl-9 pr-8 lg:pr-9 py-1.5 lg:py-2 rounded-lg text-xs border transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20'
                  : 'bg-black/5 border-black/10 text-black placeholder:text-black/40 focus:bg-black/10 focus:border-black/20'
              } focus:outline-none`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-2.5 lg:right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selected Count */}
          <div className={`mb-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {t.selected}: {tempSelectedServices.length} / {services.length}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 lg:gap-2 mb-2 lg:mb-3 max-h-80 lg:max-h-96 overflow-y-auto pr-1">
            {filteredServices.map((service) => {
              const isSelected = tempSelectedServices.includes(service.id)
              const title = getServiceTitle(service)
              
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-md text-left text-xs font-medium transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-white/20 text-white border border-white/40'
                        : 'bg-black/20 text-black border border-black/40'
                      : isDark
                      ? 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      : 'bg-black/5 text-black/80 border border-black/10 hover:bg-black/10 hover:border-black/20'
                  }`}
                >
                  <div className={`flex items-center justify-center w-3.5 h-3.5 lg:w-4 lg:h-4 rounded border flex-shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-white/30 border-white'
                        : 'bg-black/30 border-black'
                      : isDark
                      ? 'border-white/30'
                      : 'border-black/30'
                  }`}>
                    {isSelected && <CheckCircle className="w-2.5 h-2.5 lg:w-3 lg:h-3" fill="currentColor" />}
                  </div>
                  <span className="flex-1">{title}</span>
                </button>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <p className={`text-center py-4 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {t.servicesNotFound}
            </p>
          )}

          {/* Save/Cancel Buttons - Only show if showActions is true */}
          {showActions && (
            <div className="flex gap-1.5 lg:gap-2 mt-2 lg:mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-1.5 rounded-lg px-3 lg:px-4 py-1.5 lg:py-2 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-black text-white hover:bg-black/90'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t.save}
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={`rounded-lg px-3 lg:px-4 py-1.5 lg:py-2 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                    : 'bg-black/5 text-black/80 hover:bg-black/10 border border-black/10'
                }`}
              >
                {t.cancel}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {showActions && (
            <div className="flex justify-end mb-1.5 lg:mb-2">
              <button
                onClick={handleStartEdit}
                className={`flex items-center gap-1 lg:gap-1.5 rounded-lg px-2.5 lg:px-3 py-1.5 text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                <Edit className="h-3 w-3" />
                {t.edit}
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {displayServices.length > 0 ? (
              displayServices.map((serviceId) => {
                const service = services.find(s => s.id === serviceId)
                if (!service) return null
                const title = getServiceTitle(service)
                
                return (
                  <span
                    key={serviceId}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                      isDark
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-black/10 text-black border border-black/20'
                    }`}
                  >
                    {title}
                  </span>
                )
              })
            ) : (
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.noServicesSelected}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Export a version that can get the selected service IDs
export const getSelectedServices = (tempSelectedServices: string[]) => {
  return tempSelectedServices
}
