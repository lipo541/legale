'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Loader2, CheckCircle, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Practice {
  id: string
  practice_translations: {
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
  const [practices, setPractices] = useState<Practice[]>([])
  const [selectedPractices, setSelectedPractices] = useState<string[]>([])
  const [tempSelectedPractices, setTempSelectedPractices] = useState<string[]>([])
  const [internalIsEditing, setInternalIsEditing] = useState(false)
  
  // Use external isEditing if provided, otherwise use internal state
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing

  // Fetch all practices and user's selected practices
  useEffect(() => {
    console.log('ServicesField mounted for profile:', profileId)
    fetchData()
  }, [profileId])

  // Reset temp selection when editing starts/stops
  useEffect(() => {
    if (isEditing) {
      setTempSelectedPractices([...selectedPractices])
    }
  }, [isEditing, selectedPractices])

  const fetchData = async () => {
    console.log('Fetching practices and selected services for profile:', profileId)
    setLoading(true)
    try {
      // Fetch all practices
      const { data: practicesData, error: practicesError } = await supabase
        .from('practices')
        .select(`
          id,
          practice_translations (
            title,
            language
          )
        `)
        .eq('practice_translations.language', 'ka')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (practicesError) {
        console.error('Error fetching practices:', practicesError)
      } else {
        console.log('Fetched practices:', practicesData?.length || 0)
        setPractices(practicesData || [])
      }

      // Fetch user's selected practices
      const { data: selectedData, error: selectedError } = await supabase
        .from('specialist_services')
        .select('practice_id')
        .eq('profile_id', profileId)

      if (selectedError) {
        console.error('Error fetching selected practices:', selectedError)
      } else {
        console.log('Fetched selected services:', selectedData?.length || 0)
        const ids = selectedData?.map(item => item.practice_id) || []
        setSelectedPractices(ids)
        setTempSelectedPractices(ids)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePractice = (practiceId: string) => {
    if (!isEditing) return
    
    setTempSelectedPractices(prev => 
      prev.includes(practiceId)
        ? prev.filter(id => id !== practiceId)
        : [...prev, practiceId]
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
      if (tempSelectedPractices.length > 0) {
        const { error: insertError } = await supabase
          .from('specialist_services')
          .insert(
            tempSelectedPractices.map(practice_id => ({
              profile_id: profileId,
              practice_id
            }))
          )

        if (insertError) {
          console.error('Error inserting services:', insertError)
          alert('შეცდომა: ' + insertError.message)
          return
        }
      }

      setSelectedPractices([...tempSelectedPractices])
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
    setTempSelectedPractices([...selectedPractices])
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

  const getPracticeTitle = (practice: Practice) => {
    const translation = practice.practice_translations.find(t => t.language === 'ka')
    return translation?.title || 'N/A'
  }

  const displayPractices = isEditing ? tempSelectedPractices : selectedPractices

  return (
    <div>
      <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        <Briefcase className="h-4 w-4" />
        სერვისები / სპეციალიზაციები
      </label>

      {isEditing ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {practices.map((practice) => {
              const isSelected = tempSelectedPractices.includes(practice.id)
              const title = getPracticeTitle(practice)
              
              return (
                <button
                  key={practice.id}
                  type="button"
                  onClick={() => togglePractice(practice.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                        : 'bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500/50'
                      : isDark
                      ? 'bg-white/5 text-white/80 border-2 border-white/10 hover:bg-white/10 hover:border-white/20'
                      : 'bg-black/5 text-black/80 border-2 border-black/10 hover:bg-black/10 hover:border-black/20'
                  }`}
                >
                  <div className={`flex items-center justify-center w-5 h-5 rounded border-2 flex-shrink-0 ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-500/30 border-emerald-400'
                        : 'bg-emerald-500/30 border-emerald-600'
                      : isDark
                      ? 'border-white/30'
                      : 'border-black/30'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4" fill="currentColor" />}
                  </div>
                  <span className="flex-1">{title}</span>
                </button>
              )
            })}
          </div>

          {/* Save/Cancel Buttons - Only show if showActions is true */}
          {showActions && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    შენახვა...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    შენახვა
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={`rounded-lg px-6 py-2.5 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 ${
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
            <div className="flex justify-end mb-3">
              <button
                onClick={handleStartEdit}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                }`}
              >
                <Edit className="h-3.5 w-3.5" />
                რედაქტირება
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {displayPractices.length > 0 ? (
              displayPractices.map((practiceId) => {
                const practice = practices.find(p => p.id === practiceId)
                if (!practice) return null
                const title = getPracticeTitle(practice)
                
                return (
                  <span
                    key={practiceId}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
              <p className={`text-base ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სერვისები არ არის არჩეული
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Export a version that can get the selected practice IDs
export const getSelectedPractices = (tempSelectedPractices: string[]) => {
  return tempSelectedPractices
}
