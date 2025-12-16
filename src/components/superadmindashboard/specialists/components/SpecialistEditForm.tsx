'use client'

import { memo } from 'react'
import { 
  X, 
  Upload, 
  Loader2,
  MapPin,
  Building2
} from 'lucide-react'
import ServicesField from '@/components/common/ServicesField'
import type { CompanySpecialistProfile, City, SpecialistEditForm, LoadingStates } from '../types'
import { AVAILABLE_LANGUAGES } from '../types'

// ============================================================================
// Specialist Edit Form - Memoized Component (for Company Specialists)
// ============================================================================

interface SpecialistEditFormProps {
  specialist: CompanySpecialistProfile
  isDark: boolean
  editForm: SpecialistEditForm
  cities: City[]
  loading: LoadingStates
  onUpdateForm: (updates: Partial<SpecialistEditForm>) => void
  onSave: () => void
  onCancel: () => void
  onPhotoUpload: (specialistId: string, file: File) => void
  onOpenCityPicker: () => void
}

const SpecialistEditFormComponent = memo(function SpecialistEditForm({
  specialist,
  isDark,
  editForm,
  cities,
  loading,
  onUpdateForm,
  onSave,
  onCancel,
  onPhotoUpload,
  onOpenCityPicker
}: SpecialistEditFormProps) {
  const isUpdating = loading.updating === specialist.id

  const toggleLanguage = (language: string) => {
    const newLanguages = editForm.languages.includes(language)
      ? editForm.languages.filter(lang => lang !== language)
      : [...editForm.languages, language]
    onUpdateForm({ languages: newLanguages })
  }

  const addValueField = () => {
    const newKey = `New Field ${Object.keys(editForm.values_how_we_work).length + 1}`
    onUpdateForm({
      values_how_we_work: { ...editForm.values_how_we_work, [newKey]: '' }
    })
  }

  const removeValueField = (key: string) => {
    const updated = { ...editForm.values_how_we_work }
    delete updated[key]
    onUpdateForm({ values_how_we_work: updated })
  }

  const updateValueFieldKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    Object.entries(editForm.values_how_we_work).forEach(([k, v]) => {
      updated[k === oldKey ? newKey : k] = v
    })
    onUpdateForm({ values_how_we_work: updated })
  }

  const updateValueFieldValue = (key: string, value: string) => {
    onUpdateForm({
      values_how_we_work: { ...editForm.values_how_we_work, [key]: value }
    })
  }

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიის სპეციალისტის რედაქტირება
          </h3>
          {/* Company Info */}
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-[10px] font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {specialist.company_name || 'კომპანია არ არის'}
            </span>
          </div>
        </div>
        <button
          onClick={onCancel}
          className={`rounded-lg p-1.5 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
        </button>
      </div>

      {/* Form Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            სახელი და გვარი
          </label>
          <input
            type="text"
            value={editForm.full_name}
            onChange={(e) => onUpdateForm({ full_name: e.target.value })}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Email */}
        <div>
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ელფოსტა
          </label>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) => onUpdateForm({ email: e.target.value })}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Photo Upload */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            პროფილის ფოტო
          </label>
          <div className="flex items-center gap-3 mt-1">
            {specialist.avatar_url && (
              <img 
                src={specialist.avatar_url} 
                alt={specialist.full_name || 'Profile'} 
                className={`h-14 w-14 rounded-full object-cover border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}
              />
            )}
            <label className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors cursor-pointer ${
              loading.uploadingPhoto === specialist.id ? 'opacity-50' : ''
            } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
              {loading.uploadingPhoto === specialist.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {specialist.avatar_url ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onPhotoUpload(specialist.id, file)
                  e.target.value = ''
                }}
                className="hidden"
                disabled={loading.uploadingPhoto === specialist.id}
              />
            </label>
            <span className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              JPEG, PNG, WebP. Max 5MB
            </span>
          </div>
        </div>

        {/* Role Title */}
        <div>
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            პოზიცია
          </label>
          <input
            type="text"
            value={editForm.role_title}
            onChange={(e) => onUpdateForm({ role_title: e.target.value })}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Phone */}
        <div>
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ტელეფონი
          </label>
          <input
            type="tel"
            value={editForm.phone_number}
            onChange={(e) => onUpdateForm({ phone_number: e.target.value })}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Slug */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Slug
          </label>
          <input
            type="text"
            value={editForm.slug}
            onChange={(e) => onUpdateForm({ slug: e.target.value })}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] font-mono transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Languages */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ენები
          </label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isSelected = editForm.languages.includes(lang)
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
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
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ბიოგრაფია
          </label>
          <textarea
            value={editForm.bio}
            onChange={(e) => onUpdateForm({ bio: e.target.value })}
            rows={3}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Philosophy */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ფილოსოფია
          </label>
          <textarea
            value={editForm.philosophy}
            onChange={(e) => onUpdateForm({ philosophy: e.target.value })}
            rows={3}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Services */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            სერვისები
          </label>
          <div className="mt-1">
            <ServicesField 
              profileId={specialist.id}
              isDark={isDark}
              isEditing={true}
              showActions={true}
            />
          </div>
        </div>

        {/* Cities */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ქალაქები
          </label>
          <div className={`mt-1 rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {cities.length === 0 ? 'ქალაქები არ არის არჩეული' : `${cities.length} ქალაქი არჩეულია`}
              </span>
              <button
                type="button"
                onClick={onOpenCityPicker}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors ${
                  isDark 
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                }`}
              >
                <MapPin className="h-3 w-3" />
                {cities.length === 0 ? 'დამატება' : 'რედაქტირება'}
              </button>
            </div>
            {cities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cities.map(city => (
                  <span
                    key={city.id}
                    className={`px-2 py-0.5 rounded-md text-[9px] ${
                      isDark 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    }`}
                  >
                    {city.name_ka}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Focus Areas (თითო ხაზზე ერთი)
          </label>
          <textarea
            value={editForm.focus_areas_text}
            onChange={(e) => onUpdateForm({ focus_areas_text: e.target.value })}
            rows={3}
            placeholder="Corporate Law&#10;Contract Negotiations"
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black placeholder:text-black/30 focus:border-black/20'
            }`}
          />
        </div>

        {/* Representative Matters */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Representative Matters (თითო ხაზზე ერთი)
          </label>
          <textarea
            value={editForm.representative_matters_text}
            onChange={(e) => onUpdateForm({ representative_matters_text: e.target.value })}
            rows={3}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Teaching Writing Speaking */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Teaching, Writing & Speaking
          </label>
          <textarea
            value={editForm.teaching_writing_speaking}
            onChange={(e) => onUpdateForm({ teaching_writing_speaking: e.target.value })}
            rows={3}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Credentials & Memberships */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Credentials & Memberships (თითო ხაზზე ერთი)
          </label>
          <textarea
            value={editForm.credentials_memberships_text}
            onChange={(e) => onUpdateForm({ credentials_memberships_text: e.target.value })}
            rows={3}
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[11px] transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>

        {/* Values & How We Work */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Values & How We Work
          </label>
          <div className="space-y-2 mt-1">
            {Object.entries(editForm.values_how_we_work).map(([key, val], index) => (
              <div key={index} className={`flex flex-col sm:flex-row gap-2 sm:items-center p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateValueFieldKey(key, e.target.value)}
                  placeholder="Field Name"
                  className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] font-medium ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20'
                      : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                  }`}
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => updateValueFieldValue(key, e.target.value)}
                    placeholder="Value"
                    className={`flex-1 rounded-md border px-2 py-1.5 text-[10px] ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                        : 'border-black/10 bg-white text-black focus:border-black/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeValueField(key)}
                    className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                      isDark
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-600 hover:bg-red-500/10'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addValueField}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-[1.02] ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              <span className="text-sm">+</span>
              Add Field
            </button>
          </div>
        </div>

        {/* User ID (readonly) */}
        <div className="sm:col-span-2">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            User ID
          </label>
          <input
            type="text"
            value={specialist.id}
            readOnly
            className={`w-full mt-1 rounded-lg border px-3 py-2 text-[10px] font-mono cursor-not-allowed ${
              isDark
                ? 'border-white/10 bg-white/5 text-white/40'
                : 'border-black/10 bg-black/5 text-black/40'
            }`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={`flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <button
          onClick={onSave}
          disabled={isUpdating}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-[11px] font-semibold text-white transition-all duration-300 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600`}
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              შენახვა...
            </>
          ) : (
            'შენახვა'
          )}
        </button>
        <button
          onClick={onCancel}
          className={`flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-[11px] font-semibold transition-all duration-300 ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          გაუქმება
        </button>
      </div>
    </div>
  )
})

export default SpecialistEditFormComponent
