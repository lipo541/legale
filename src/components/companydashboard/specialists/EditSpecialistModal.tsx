'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Save, Loader2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Specialist, AVAILABLE_LANGUAGES } from './types'
import ServicesField from '@/components/common/ServicesField'

interface EditSpecialistModalProps {
  specialist: Specialist | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function EditSpecialistModal({ 
  specialist, 
  isOpen, 
  onClose, 
  onSave 
}: EditSpecialistModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)
  const [isEditingServices, setIsEditingServices] = useState(false)

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role_title: '',
    phone_number: '',
    bio: '',
    philosophy: '',
    languages: [] as string[],
    focus_areas_text: '',
    representative_matters_text: '',
    teaching_writing_speaking: '',
    credentials_memberships_text: '',
    values_how_we_work: {} as Record<string, string>
  })

  useEffect(() => {
    if (specialist && isOpen) {
      console.log('EditSpecialistModal opened for specialist:', specialist.id, specialist.full_name)
      setEditForm({
        full_name: specialist.full_name || '',
        email: specialist.email || '',
        role_title: specialist.role_title || '',
        phone_number: specialist.phone_number || '',
        bio: specialist.bio || '',
        philosophy: specialist.philosophy || '',
        languages: specialist.languages || [],
        focus_areas_text: specialist.focus_areas?.join('\n') || '',
        representative_matters_text: specialist.representative_matters?.join('\n') || '',
        teaching_writing_speaking: specialist.teaching_writing_speaking || '',
        credentials_memberships_text: specialist.credentials_memberships?.join('\n') || '',
        values_how_we_work: specialist.values_how_we_work || {}
      })
      setCurrentPhotoUrl(specialist.avatar_url)
    }
  }, [specialist, isOpen])

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !specialist) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('გთხოვთ ატვირთოთ მხოლოდ JPEG, PNG ან WebP ფორმატის სურათი')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    setUploadingPhoto(true)
    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${specialist.id}/photo-${Date.now()}.${fileExt}`

      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('specialist-photos').remove([oldPath])
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('specialist-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('ატვირთვისას მოხდა შეცდომა: ' + uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('specialist-photos')
        .getPublicUrl(fileName)

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', specialist.id)

      if (updateError) {
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      setCurrentPhotoUrl(publicUrl)
      alert('ფოტო წარმატებით აიტვირთა! ✅')
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('ფოტოს ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const toggleLanguage = (language: string) => {
    const currentLanguages = editForm.languages
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language]
    
    setEditForm({ ...editForm, languages: newLanguages })
  }

  const addValueField = () => {
    const newKey = `New Field ${Object.keys(editForm.values_how_we_work).length + 1}`
    setEditForm({
      ...editForm,
      values_how_we_work: { ...editForm.values_how_we_work, [newKey]: '' }
    })
  }

  const removeValueField = (key: string) => {
    const updated = { ...editForm.values_how_we_work }
    delete updated[key]
    setEditForm({ ...editForm, values_how_we_work: updated })
  }

  const updateValueFieldKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    Object.entries(editForm.values_how_we_work).forEach(([k, v]) => {
      updated[k === oldKey ? newKey : k] = v
    })
    setEditForm({ ...editForm, values_how_we_work: updated })
  }

  const updateValueFieldValue = (key: string, value: string) => {
    setEditForm({
      ...editForm,
      values_how_we_work: { ...editForm.values_how_we_work, [key]: value }
    })
  }

  const handleSave = async () => {
    if (!specialist) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        role_title: editForm.role_title,
        phone_number: editForm.phone_number,
        bio: editForm.bio,
        philosophy: editForm.philosophy,
        languages: editForm.languages,
        focus_areas: editForm.focus_areas_text ? editForm.focus_areas_text.split('\n').filter(item => item.trim()) : [],
        representative_matters: editForm.representative_matters_text ? editForm.representative_matters_text.split('\n').filter(item => item.trim()) : [],
        teaching_writing_speaking: editForm.teaching_writing_speaking,
        credentials_memberships: editForm.credentials_memberships_text ? editForm.credentials_memberships_text.split('\n').filter(item => item.trim()) : [],
        values_how_we_work: editForm.values_how_we_work,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', specialist.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        alert('სპეციალისტი წარმატებით განახლდა! ✅')
        onSave()
        onClose()
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !specialist) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${
          isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between border-b p-6 ${
          isDark ? 'border-white/10 bg-black/95 backdrop-blur' : 'border-black/10 bg-white/95 backdrop-blur'
        }`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            სპეციალისტის რედაქტირება
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
          >
            <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Photo Upload */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პროფილის ფოტო
            </label>
            <div className="flex items-center gap-4">
              {currentPhotoUrl && (
                <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                  <img 
                    src={currentPhotoUrl} 
                    alt={specialist.full_name || 'Profile'} 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <label 
                htmlFor="photo-upload"
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                  uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ატვირთვა...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {currentPhotoUrl ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}
                  </>
                )}
              </label>
              <input 
                id="photo-upload"
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden" 
              />
            </div>
            <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              JPEG, PNG ან WebP. მაქსიმუმ 5MB
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სახელი და გვარი *
              </label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ელფოსტა *
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                პოზიცია
              </label>
              <input
                type="text"
                value={editForm.role_title}
                onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ტელეფონი
              </label>
              <input
                type="tel"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ენები
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = editForm.languages.includes(lang)
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                        : isDark
                        ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                        : 'bg-black/5 text-black/60 border border-black/10 hover:bg-black/10'
                    }`}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ბიოგრაფია
            </label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              rows={4}
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Philosophy */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ფილოსოფია
            </label>
            <textarea
              value={editForm.philosophy}
              onChange={(e) => setEditForm({ ...editForm, philosophy: e.target.value })}
              rows={4}
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Focus Areas */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სპეციალიზაციის სფეროები (თითო ხაზზე ერთი)
            </label>
            <textarea
              value={editForm.focus_areas_text}
              onChange={(e) => setEditForm({ ...editForm, focus_areas_text: e.target.value })}
              rows={4}
              placeholder="კორპორაციული სამართალი&#10;ხელშეკრულებების მოლაპარაკება"
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Representative Matters */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              წარმომადგენლობითი საქმეები (თითო ხაზზე ერთი)
            </label>
            <textarea
              value={editForm.representative_matters_text}
              onChange={(e) => setEditForm({ ...editForm, representative_matters_text: e.target.value })}
              rows={4}
              placeholder="წარმოვადგენდი მსხვილ კორპორაციას..."
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Teaching, Writing & Speaking */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სწავლება, წერა და გამოსვლები
            </label>
            <textarea
              value={editForm.teaching_writing_speaking}
              onChange={(e) => setEditForm({ ...editForm, teaching_writing_speaking: e.target.value })}
              rows={5}
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Credentials & Memberships */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სერტიფიკატები და წევრობა (თითო ხაზზე ერთი)
            </label>
            <textarea
              value={editForm.credentials_memberships_text}
              onChange={(e) => setEditForm({ ...editForm, credentials_memberships_text: e.target.value })}
              rows={4}
              placeholder="ლიცენზირებული ადვოკატი&#10;ABA-ს წევრი"
              className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>

          {/* Values & How We Work */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ღირებულებები და მუშაობის სტილი
            </label>
            <div className="space-y-3">
              {Object.entries(editForm.values_how_we_work).map(([key, val], index) => (
                <div key={index} className={`flex gap-2 items-start p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => updateValueFieldKey(key, e.target.value)}
                      placeholder="ველის სახელი"
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors font-medium ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20'
                          : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                      }`}
                    />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateValueFieldValue(key, e.target.value)}
                      placeholder="მნიშვნელობა"
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        isDark
                          ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                          : 'border-black/10 bg-white text-black focus:border-black/20'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeValueField(key)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      isDark
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-600 hover:bg-red-500/10'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addValueField}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                <span className="text-lg">+</span>
                ველის დამატება
              </button>
            </div>
          </div>

          {/* Services/Specializations - ALWAYS VISIBLE */}
          <div className={`border-t pt-6 mt-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  სერვისები და სპეციალიზაციები
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  აირჩიეთ სერვისები რომლებშიც სპეციალისტი მუშაობს
                </p>
              </div>
              {!isEditingServices && (
                <button
                  type="button"
                  onClick={() => setIsEditingServices(true)}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all hover:scale-[1.02] ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
                  }`}
                >
                  რედაქტირება
                </button>
              )}
            </div>
            
            {specialist?.id && (
              <ServicesField
                profileId={specialist.id}
                isDark={isDark}
                isEditing={isEditingServices}
                onSave={() => setIsEditingServices(false)}
                onCancel={() => setIsEditingServices(false)}
                showActions={true}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex gap-3 border-t p-6 ${
          isDark ? 'border-white/10 bg-black/95 backdrop-blur' : 'border-black/10 bg-white/95 backdrop-blur'
        }`}>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                შენახვა...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                შენახვა
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            გაუქმება
          </button>
        </div>
      </div>
    </div>
  )
}
