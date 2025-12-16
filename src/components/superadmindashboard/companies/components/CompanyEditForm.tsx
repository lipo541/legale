// ============================================================================
// CompanyEditForm Component
// ============================================================================

import { memo } from 'react'
import { X, Loader2, MapPin } from 'lucide-react'
import type { CompanyProfile, CompanyEditForm, City } from '../types'

interface CompanyEditFormProps {
  company: CompanyProfile
  editForm: CompanyEditForm
  setEditForm: React.Dispatch<React.SetStateAction<CompanyEditForm>>
  selectedCities: City[]
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
  onOpenCityPicker: () => void
  isDark: boolean
}

function CompanyEditFormComponent({
  company,
  editForm,
  setEditForm,
  selectedCities,
  isSaving,
  onSave,
  onCancel,
  onOpenCityPicker,
  isDark
}: CompanyEditFormProps) {
  const inputClass = `w-full rounded-lg border px-4 py-2 transition-colors ${
    isDark
      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
  }`

  const labelClass = `mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          კომპანიის რედაქტირება
        </h3>
        <button
          onClick={onCancel}
          className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>კომპანიის სახელი</label>
            <input
              type="text"
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>ელფოსტა</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>ტელეფონი</label>
            <input
              type="text"
              value={editForm.phone_number}
              onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
              placeholder="+995 XXX XXX XXX"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Slug (URL სახელი)</label>
            <input
              type="text"
              value={editForm.company_slug}
              onChange={(e) => setEditForm({ ...editForm, company_slug: e.target.value })}
              placeholder="my-company-name"
              className={inputClass}
            />
            <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              URL: /practices/{editForm.company_slug || 'slug'}
            </p>
          </div>
        </div>

        {/* Company Overview Section */}
        <div>
          <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიის შესახებ
          </h4>
          <div className="grid gap-4">
            <div>
              <label className={labelClass}>მოკლე აღწერა</label>
              <textarea
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>დეტალური აღწერა</label>
              <textarea
                value={editForm.company_overview}
                onChange={(e) => setEditForm({ ...editForm, company_overview: e.target.value })}
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>მისია</label>
              <textarea
                value={editForm.mission_statement}
                onChange={(e) => setEditForm({ ...editForm, mission_statement: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ხედვა და ღირებულებები</label>
              <textarea
                value={editForm.vision_values}
                onChange={(e) => setEditForm({ ...editForm, vision_values: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ისტორია</label>
              <textarea
                value={editForm.history}
                onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>როგორ ვმუშაობთ</label>
              <textarea
                value={editForm.how_we_work}
                onChange={(e) => setEditForm({ ...editForm, how_we_work: e.target.value })}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            საკონტაქტო ინფორმაცია
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>ვებსაიტი</label>
              <input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>მისამართი</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="თბილისი, საქართველო"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>რუკის ლინკი</label>
              <input
                type="url"
                value={editForm.map_link}
                onChange={(e) => setEditForm({ ...editForm, map_link: e.target.value })}
                placeholder="https://maps.google.com/..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Cities Section */}
        <div>
          <label className={labelClass}>ქალაქები</label>
          <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">არჩეული ქალაქები</span>
              <button
                type="button"
                onClick={onOpenCityPicker}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark 
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                {selectedCities.length === 0 ? 'დამატება' : 'რედაქტირება'}
              </button>
            </div>
            {selectedCities.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                ქალაქები არ არის არჩეული
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedCities.map(city => (
                  <span
                    key={city.id}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
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

        {/* Social Links */}
        <div>
          <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            სოციალური ქსელები
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Facebook</label>
              <input
                type="url"
                value={editForm.facebook_link}
                onChange={(e) => setEditForm({ ...editForm, facebook_link: e.target.value })}
                placeholder="https://facebook.com/..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Instagram</label>
              <input
                type="url"
                value={editForm.instagram_link}
                onChange={(e) => setEditForm({ ...editForm, instagram_link: e.target.value })}
                placeholder="https://instagram.com/..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>LinkedIn</label>
              <input
                type="url"
                value={editForm.linkedin_link}
                onChange={(e) => setEditForm({ ...editForm, linkedin_link: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Twitter</label>
              <input
                type="url"
                value={editForm.twitter_link}
                onChange={(e) => setEditForm({ ...editForm, twitter_link: e.target.value })}
                placeholder="https://twitter.com/..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Company ID */}
        <div>
          <label className={labelClass}>Company ID</label>
          <input
            type="text"
            value={company.id}
            readOnly
            className={`${inputClass} cursor-not-allowed opacity-50`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                შენახვა...
              </span>
            ) : (
              'შენახვა'
            )}
          </button>
          <button
            onClick={onCancel}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all duration-300 ${
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

export default memo(CompanyEditFormComponent)
