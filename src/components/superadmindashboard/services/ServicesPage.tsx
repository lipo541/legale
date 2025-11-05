'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Plus, Search, Edit, Trash2, Eye, Loader2, Lock, Unlock, Filter, ChevronDown } from 'lucide-react'
import ServiceAdd from './ServiceAdd'
import { createClient } from '@/lib/supabase/client'

type Language = 'ka' | 'en' | 'ru'

interface Service {
  id: string
  practice_id: string
  image_url: string
  og_image_url: string | null
  status: string
  created_at: string
  updated_at: string
}

interface ServiceTranslation {
  id: string
  service_id: string
  language: Language
  title: string
  slug: string
  description: string
  image_alt: string
  meta_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  social_hashtags: string | null
  word_count: number
  reading_time: number
}

interface ServiceWithTranslations extends Service {
  service_translations: ServiceTranslation[]
}

interface Practice {
  id: string
  created_at: string
}

interface PracticeTranslation {
  id: string
  practice_id: string
  language: Language
  title: string
  slug: string
}

export default function ServicesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithTranslations | null>(null)
  const [services, setServices] = useState<ServiceWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>('')
  const [practices, setPractices] = useState<{ id: string; title: string }[]>([])

  const supabase = createClient()

  // Fetch practices from database
  const fetchPractices = useCallback(async () => {
    try {
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select('id, created_at')
        .order('created_at', { ascending: false })

      if (practicesError) {
        console.error('Error fetching practices:', practicesError)
        return
      }

      // Fetch practice translations (Georgian only for dropdown)
      const { data: translationsData, error: translationsError } = await supabase
        .from('practice_translations')
        .select('practice_id, title')
        .eq('language', 'ka')

      if (translationsError) {
        console.error('Error fetching practice translations:', translationsError)
        return
      }

      // Combine practices with their Georgian titles
      const practicesWithTitles = (practicesData || []).map(practice => {
        const translation = (translationsData || []).find(t => t.practice_id === practice.id)
        return {
          id: practice.id,
          title: translation?.title || 'N/A'
        }
      })

      setPractices(practicesWithTitles)
    } catch (error) {
      console.error('Fetch practices error:', error)
    }
  }, [supabase])

  // Fetch services from database
  const fetchServices = useCallback(async () => {
    setLoading(true)
    
    try {
      // First, fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Services data:', servicesData)
      console.log('Services error:', servicesError)

      if (servicesError) {
        console.error('Error fetching services:', servicesError)
        setLoading(false)
        return
      }

      // Then fetch translations
      const { data: translationsData, error: translationsError } = await supabase
        .from('service_translations')
        .select('*')

      console.log('Translations data:', translationsData)
      console.log('Translations error:', translationsError)

      if (translationsError) {
        console.error('Error fetching translations:', translationsError)
        setLoading(false)
        return
      }

      // Combine them
      const servicesWithTranslations = (servicesData || []).map(service => ({
        ...service,
        service_translations: (translationsData || []).filter(
          t => t.service_id === service.id
        )
      }))

      console.log('Combined services:', servicesWithTranslations)
      setServices(servicesWithTranslations as ServiceWithTranslations[])
      
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPractices()
    fetchServices()
  }, [fetchPractices, fetchServices])

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ სერვისის წაშლა?')) {
      return
    }

    setDeletingId(id)
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchServices()
    } else {
      alert('შეცდომა წაშლისას: ' + error.message)
    }
    setDeletingId(null)
  }

  // Handle toggle status (publish/unpublish)
  const handleToggleStatus = async (service: ServiceWithTranslations) => {
    const newStatus = service.status === 'published' ? 'draft' : 'published'
    const confirmMessage = newStatus === 'published' 
      ? 'დარწმუნებული ხართ რომ გსურთ ამ სერვისის გამოქვეყნება?'
      : 'დარწმუნებული ხართ რომ გსურთ ამ სერვისის დაბლოკვა?'
    
    if (!confirm(confirmMessage)) {
      return
    }

    setTogglingStatusId(service.id)
    
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', service.id)

      if (error) {
        console.error('Status update error:', error)
        alert('შეცდომა სტატუსის შეცვლისას: ' + error.message)
      } else {
        console.log('Status updated successfully to:', newStatus)
        await fetchServices()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა სტატუსის შეცვლისას')
    } finally {
      setTogglingStatusId(null)
    }
  }

  // Handle edit
  const handleEdit = (service: ServiceWithTranslations) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ სერვისის რედაქტირება?')) {
      return
    }
    setEditingService(service)
    setShowAddForm(true)
  }

  // Filter services based on search and practice
  const filteredServices = services.filter((service) => {
    const kaTranslation = service.service_translations.find(t => t.language === 'ka')
    if (!kaTranslation) return false
    
    // Filter by search query
    const matchesSearch = kaTranslation.title.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Filter by selected practice
    const matchesPractice = selectedPracticeId === '' || service.practice_id === selectedPracticeId
    
    return matchesSearch && matchesPractice
  })

  // Show Add/Edit Form
  if (showAddForm) {
    return (
      <ServiceAdd 
        onBack={() => {
          setShowAddForm(false)
          setEditingService(null)
          fetchServices()
        }}
        editData={editingService}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Services
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            სერვისების მართვა
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
            isDark
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Plus className="h-5 w-5" />
          ახალი სერვისი
        </button>
      </div>

      {/* Search Bar and Filter */}
      <div className="mb-6 flex gap-4">
        <div className={`relative flex-1 rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა სერვისებში..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
            showFilters
              ? isDark
                ? 'bg-blue-500 text-white'
                : 'bg-blue-500 text-white'
              : isDark
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          <Filter className="h-5 w-5" />
          ფილტრაცია
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className={`mb-6 rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <div className="space-y-4">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                პრაქტიკის არჩევა
              </label>
              <select
                value={selectedPracticeId}
                onChange={(e) => setSelectedPracticeId(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition-colors ${
                  isDark
                    ? 'border-white/10 bg-black text-white hover:border-white/20 [&>option]:bg-black [&>option]:text-white'
                    : 'border-black/10 bg-white text-black hover:border-black/20 [&>option]:bg-white [&>option]:text-black'
                }`}
              >
                <option value="">ყველა პრაქტიკა</option>
                {practices.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedPracticeId && (
              <button
                onClick={() => setSelectedPracticeId('')}
                className={`text-sm font-medium transition-colors ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                ფილტრის გასუფთავება
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {/* Services Table */}
      {!loading && filteredServices.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სახელი (ქართული)
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  Slug
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სტატუსი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  თარიღი
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-black' : 'bg-white'}>
              {filteredServices.map((service) => {
                const kaTranslation = service.service_translations.find(t => t.language === 'ka')
                
                return (
                  <tr
                    key={service.id}
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/5'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      {kaTranslation?.title || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {kaTranslation?.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(service)}
                        disabled={togglingStatusId === service.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          service.status === 'published'
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : isDark
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        } ${togglingStatusId === service.id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        title={service.status === 'published' ? 'დაბლოკვა' : 'გამოქვეყნება'}
                      >
                        {togglingStatusId === service.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {service.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}
                          </>
                        ) : (
                          <>
                            {service.status === 'published' ? (
                              <>
                                <Unlock className="h-3 w-3" />
                                გამოქვეყნებული
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                დრაფტი
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(service.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/ka/services/${kaTranslation?.slug}`, '_blank')}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                          title="ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(service)}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                          title="რედაქტირება"
                        >
                          <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === service.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredServices.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'სერვისები ვერ მოიძებნა' : 'სერვისები ჯერ არ არის დამატებული'}
          </p>
        </div>
      )}
    </div>
  )
}
