'use client'

import { useState, useEffect, useCallback } from 'react'
import { Briefcase, Loader2, CheckCircle, Edit, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
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
      // Fetch all services with translations
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          service_translations (
            title,
            language
          )
        `)
        .eq('service_translations.language', 'ka')
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
        alert('შეცდომა: ' + deleteError.message)
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
          alert('შეცდომა: ' + insertError.message)
          return
        }
      }

      setSelectedServices([...tempSelectedServices])
      alert('სერვისები წარმატებით განახლდა! ✅')
      setInternalIsEditing(false)
      onSave?.()
    } catch (error) {
      console.error('Save error:', error)
      alert('შეცდომა შენახვისას')
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
    const translation = service.service_translations.find((t: { language: string }) => t.language === 'ka')
    return translation?.title || 'N/A'
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
      <label className={`mb-2 flex items-center gap-2 text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        <Briefcase className="h-3.5 w-3.5" />
        სერვისები
      </label>

      {isEditing ? (
        <>
          {/* Search Box */}
          <div className="mb-3 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძებნა..."
              className={`w-full pl-9 pr-9 py-2 rounded-lg text-xs border transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20'
                  : 'bg-black/5 border-black/10 text-black placeholder:text-black/40 focus:bg-black/10 focus:border-black/20'
              } focus:outline-none`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Selected Count */}
          <div className={`mb-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            არჩეული: {tempSelectedServices.length} / {services.length}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 max-h-96 overflow-y-auto pr-1">
            {filteredServices.map((service) => {
              const isSelected = tempSelectedServices.includes(service.id)
              const title = getServiceTitle(service)
              
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-left text-xs font-medium transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/50'
                      : isDark
                      ? 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      : 'bg-black/5 text-black/80 border border-black/10 hover:bg-black/10 hover:border-black/20'
                  }`}
                >
                  <div className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/30 border-emerald-400'
                        : 'bg-emerald-500/30 border-emerald-600'
                      : isDark
                      ? 'border-white/30'
                      : 'border-black/30'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3" fill="currentColor" />}
                  </div>
                  <span className="flex-1">{title}</span>
                </button>
              )
            })}
          </div>

          {filteredServices.length === 0 && (
            <p className={`text-center py-4 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              სერვისები ვერ მოიძებნა
            </p>
          )}

          {/* Save/Cancel Buttons - Only show if showActions is true */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    შენახვა...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" />
                    შენახვა
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                    : 'bg-black/5 text-black/80 hover:bg-black/10 border border-black/10'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {showActions && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleStartEdit}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                <Edit className="h-3 w-3" />
                რედაქტირება
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
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                    }`}
                  >
                    {title}
                  </span>
                )
              })
            ) : (
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სერვისები არ არის არჩეული
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
