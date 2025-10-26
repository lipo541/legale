'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { X, Mail, User, Calendar, Shield, Building2, Edit, Ban } from 'lucide-react'
import { Specialist } from './types'

interface ViewSpecialistModalProps {
  specialist: Specialist | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export default function ViewSpecialistModal({ 
  specialist, 
  isOpen, 
  onClose, 
  onEdit 
}: ViewSpecialistModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
            სპეციალისტის დეტალები
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
          {/* Profile Section */}
          <div className="flex items-start gap-6">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${
              specialist.is_blocked
                ? 'bg-red-500/20 border-2 border-red-500/30'
                : isDark ? 'bg-white/10' : 'bg-black/10'
            }`}>
              {specialist.avatar_url ? (
                <img 
                  src={specialist.avatar_url} 
                  alt={specialist.full_name || 'Specialist'} 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className={`h-12 w-12 ${
                  specialist.is_blocked
                    ? 'text-red-500'
                    : isDark ? 'text-white/60' : 'text-black/60'
                }`} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {specialist.full_name || 'N/A'}
                </h3>
                {specialist.is_blocked && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}>
                    <Ban className="h-3 w-3" />
                    დაბლოკილია
                  </span>
                )}
              </div>
              {specialist.role_title && (
                <p className={`mt-1 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {specialist.role_title}
                </p>
              )}
            </div>
          </div>

          {/* Grid Information */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Mail className="h-4 w-4" />
                ელფოსტა
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {specialist.email || 'N/A'}
              </p>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ტელეფონი
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {specialist.phone_number || 'არ არის მითითებული'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Shield className="h-4 w-4" />
                როლი
              </label>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
              }`}>
                <User className="h-3 w-3" />
                კომპანიის სპეციალისტი
              </span>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Building2 className="h-4 w-4" />
                კომპანია
              </label>
              <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {specialist.company_name || 'არ არის მითითებული'}
              </p>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Calendar className="h-4 w-4" />
                რეგისტრაცია
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {new Date(specialist.created_at).toLocaleString('ka-GE')}
              </p>
            </div>

            <div>
              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ბოლო განახლება
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                {new Date(specialist.updated_at).toLocaleString('ka-GE')}
              </p>
            </div>
          </div>

          {/* Languages */}
          {specialist.languages && specialist.languages.length > 0 && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ენები
              </label>
              <div className="flex flex-wrap gap-2">
                {specialist.languages.map((lang) => (
                  <span 
                    key={lang} 
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {specialist.bio && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ბიოგრაფია
              </label>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.bio}
              </p>
            </div>
          )}

          {/* Philosophy */}
          {specialist.philosophy && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ფილოსოფია
              </label>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.philosophy}
              </p>
            </div>
          )}

          {/* Focus Areas */}
          {specialist.focus_areas && specialist.focus_areas.length > 0 && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სპეციალიზაციის სფეროები
              </label>
              <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.focus_areas.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Representative Matters */}
          {specialist.representative_matters && specialist.representative_matters.length > 0 && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                წარმომადგენლობითი საქმეები
              </label>
              <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.representative_matters.map((matter, idx) => (
                  <li key={idx}>{matter}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Teaching, Writing & Speaking */}
          {specialist.teaching_writing_speaking && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სწავლება, წერა და გამოსვლები
              </label>
              <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.teaching_writing_speaking}
              </p>
            </div>
          )}

          {/* Credentials & Memberships */}
          {specialist.credentials_memberships && specialist.credentials_memberships.length > 0 && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სერტიფიკატები და წევრობა
              </label>
              <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {specialist.credentials_memberships.map((cred, idx) => (
                  <li key={idx}>{cred}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Values & How We Work */}
          {specialist.values_how_we_work && Object.keys(specialist.values_how_we_work).length > 0 && (
            <div>
              <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ღირებულებები და მუშაობის სტილი
              </label>
              <div className="space-y-3">
                {Object.entries(specialist.values_how_we_work).map(([key, val]) => (
                  <div key={key} className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <p className={`font-semibold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {key}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex gap-3 border-t p-6 ${
          isDark ? 'border-white/10 bg-black/95 backdrop-blur' : 'border-black/10 bg-white/95 backdrop-blur'
        }`}>
          <button
            onClick={onEdit}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            <Edit className="h-4 w-4" />
            რედაქტირება
          </button>
          <button
            onClick={onClose}
            className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )
}
