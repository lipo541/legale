'use client'

import { memo, useState } from 'react'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  MapPin, 
  Edit, 
  ExternalLink,
  CheckCircle, 
  Clock, 
  XCircle, 
  X,
  Loader2,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import ServicesField from '@/components/common/ServicesField'
import type { SoloSpecialistProfile, City, VerificationStatus, LoadingStates } from '../types'

// ============================================================================
// Specialist Details - Memoized Component
// ============================================================================

interface SpecialistDetailsProps {
  specialist: SoloSpecialistProfile
  isDark: boolean
  cities: City[]
  loading: LoadingStates
  onEdit: (specialist: SoloSpecialistProfile) => void
  onChangeVerificationStatus: (specialist: SoloSpecialistProfile, status: VerificationStatus, notes?: string) => void
  onPhotoUpload: (specialistId: string, file: File) => void
}

const SpecialistDetails = memo(function SpecialistDetails({
  specialist,
  isDark,
  cities,
  loading,
  onEdit,
  onChangeVerificationStatus,
  onPhotoUpload
}: SpecialistDetailsProps) {
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)

  const handleReject = () => {
    onChangeVerificationStatus(specialist, 'rejected', rejectionNotes)
    setShowRejectionInput(false)
    setRejectionNotes('')
  }

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
        <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          სოლო სპეციალისტის დეტალები
        </h3>
        <div className="flex gap-2">
          <Link
            href={`/ka/specialists/${specialist.slug || specialist.id}`}
            target="_blank"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 text-[9px] sm:text-[10px] font-medium transition-colors ${
              isDark
                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                : 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20'
            }`}
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden xs:inline">გვერდზე</span> ნახვა
          </Link>
          <button
            onClick={() => onEdit(specialist)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 text-[9px] sm:text-[10px] font-medium transition-colors ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            <Edit className="h-3 w-3" />
            რედაქტირება
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              სახელი და გვარი
            </label>
            <p className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {specialist.full_name || 'N/A'}
            </p>
          </div>
          
          <div>
            <label className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <Mail className="h-2.5 w-2.5" />
              ელფოსტა
            </label>
            <p className={`text-[11px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {specialist.email || 'N/A'}
            </p>
          </div>

          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              პოზიცია
            </label>
            <p className={`text-[11px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {specialist.role_title || 'არ არის მითითებული'}
            </p>
          </div>

          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              ტელეფონი
            </label>
            <p className={`text-[11px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {specialist.phone_number || 'არ არის მითითებული'}
            </p>
          </div>

          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              Slug
            </label>
            <p className={`text-[11px] font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {specialist.slug || 'არ არის მითითებული'}
            </p>
          </div>
        </div>

        {/* Photo & Languages */}
        <div className="space-y-3">
          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              ფოტო
            </label>
            <div className="flex items-center gap-3 mt-1">
              {specialist.avatar_url ? (
                <img 
                  src={specialist.avatar_url} 
                  alt={specialist.full_name || 'Profile'} 
                  className={`h-14 w-14 rounded-full object-cover border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}
                />
              ) : (
                <div className={`h-14 w-14 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                  <User className={`h-6 w-6 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                </div>
              )}
              <label className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-medium transition-colors cursor-pointer ${
                loading.uploadingPhoto === specialist.id ? 'opacity-50' : ''
              } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                {loading.uploadingPhoto === specialist.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {specialist.avatar_url ? 'შეცვლა' : 'ატვირთვა'}
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
            </div>
          </div>

          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              ენები
            </label>
            {specialist.languages && specialist.languages.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {specialist.languages.map((lang) => (
                  <span key={lang} className={`px-2 py-0.5 rounded-md text-[9px] font-medium ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {lang}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                არ არის მითითებული
              </p>
            )}
          </div>

          <div>
            <label className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <MapPin className="h-2.5 w-2.5" />
              ქალაქები
            </label>
            {cities.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {cities.map((city) => (
                  <span key={city.id} className={`px-2 py-0.5 rounded-md text-[9px] font-medium ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {city.name_ka}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                არ არის მითითებული
              </p>
            )}
          </div>
        </div>

        {/* Verification & Status */}
        <div className="space-y-3">
          <div>
            <label className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <Shield className="h-2.5 w-2.5" />
              ვერიფიკაცია
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {/* Status Badge */}
              {specialist.verification_status === 'verified' ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                }`}>
                  <CheckCircle className="h-2.5 w-2.5" />
                  დადასტურებული
                </span>
              ) : specialist.verification_status === 'pending' ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  <Clock className="h-2.5 w-2.5" />
                  განხილვაში
                </span>
              ) : specialist.verification_status === 'rejected' ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                }`}>
                  <XCircle className="h-2.5 w-2.5" />
                  უარყოფილი
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                  isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>
                  არ არის მოთხოვნილი
                </span>
              )}
            </div>

            {/* Verification Actions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {/* Grant/Confirm Verification */}
              {specialist.verification_status !== 'verified' && (
                <button
                  onClick={() => onChangeVerificationStatus(specialist, 'verified')}
                  disabled={loading.changingVerification === specialist.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all disabled:opacity-50 ${
                    isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                  }`}
                >
                  {loading.changingVerification === specialist.id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-2.5 w-2.5" />
                  )}
                  {specialist.verification_status === 'pending' ? 'დადასტურება' : 'ვერიფიკაცია'}
                </button>
              )}

              {/* Reject (for pending) */}
              {specialist.verification_status === 'pending' && !showRejectionInput && (
                <button
                  onClick={() => setShowRejectionInput(true)}
                  disabled={loading.changingVerification === specialist.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all disabled:opacity-50 ${
                    isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                  }`}
                >
                  <XCircle className="h-2.5 w-2.5" />
                  უარყოფა
                </button>
              )}

              {/* Revoke (for verified) */}
              {specialist.verification_status === 'verified' && (
                <button
                  onClick={() => onChangeVerificationStatus(specialist, 'unverified')}
                  disabled={loading.changingVerification === specialist.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all disabled:opacity-50 ${
                    isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                  }`}
                >
                  <X className="h-2.5 w-2.5" />
                  გაუქმება
                </button>
              )}
            </div>

            {/* Rejection Notes Input */}
            {showRejectionInput && (
              <div className="mt-2 space-y-1.5">
                <input
                  type="text"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="უარყოფის მიზეზი (არასავალდებულო)"
                  className={`w-full rounded-md border px-2 py-1 text-[10px] ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                      : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                  }`}
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleReject}
                    className={`flex-1 rounded-md px-2 py-1 text-[9px] font-medium ${
                      isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    უარყოფა
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectionInput(false)
                      setRejectionNotes('')
                    }}
                    className={`flex-1 rounded-md px-2 py-1 text-[9px] font-medium ${
                      isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                    }`}
                  >
                    გაუქმება
                  </button>
                </div>
              </div>
            )}

            {/* Verification Notes */}
            {specialist.verification_notes && (
              <div className={`mt-2 rounded-md p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <p className={`text-[9px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>შენიშვნა:</p>
                <p className={`text-[10px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {specialist.verification_notes}
                </p>
              </div>
            )}

            {/* Verification Date */}
            {specialist.verification_reviewed_at && (
              <p className={`mt-1 text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                განხილულია: {new Date(specialist.verification_reviewed_at).toLocaleDateString('ka-GE')}
              </p>
            )}
          </div>

          <div>
            <label className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <Calendar className="h-2.5 w-2.5" />
              რეგისტრაცია
            </label>
            <p className={`text-[11px] ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              {new Date(specialist.created_at).toLocaleString('ka-GE')}
            </p>
          </div>

          <div>
            <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              User ID
            </label>
            <p className={`text-[9px] font-mono ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {specialist.id}
            </p>
          </div>
        </div>
      </div>

      {/* Bio & Philosophy */}
      {(specialist.bio || specialist.philosophy) && (
        <div className="mt-3 sm:mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {specialist.bio && (
            <div>
              <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                ბიოგრაფია
              </label>
              <p className={`text-[10px] whitespace-pre-wrap line-clamp-4 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {specialist.bio}
              </p>
            </div>
          )}
          {specialist.philosophy && (
            <div>
              <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                ფილოსოფია
              </label>
              <p className={`text-[10px] whitespace-pre-wrap line-clamp-4 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {specialist.philosophy}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Services */}
      <div className="mt-3 sm:mt-4">
        <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          სერვისები
        </label>
        <div className="mt-1">
          <ServicesField 
            profileId={specialist.id}
            isDark={isDark}
            showActions={true}
          />
        </div>
      </div>

      {/* Focus Areas & Representative Matters */}
      {(specialist.focus_areas?.length || specialist.representative_matters?.length) && (
        <div className="mt-3 sm:mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {specialist.focus_areas && specialist.focus_areas.length > 0 && (
            <div>
              <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Focus Areas
              </label>
              <ul className={`text-[10px] list-disc list-inside ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {specialist.focus_areas.slice(0, 5).map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
                {specialist.focus_areas.length > 5 && (
                  <li className={isDark ? 'text-white/40' : 'text-black/40'}>
                    +{specialist.focus_areas.length - 5} მეტი
                  </li>
                )}
              </ul>
            </div>
          )}
          {specialist.representative_matters && specialist.representative_matters.length > 0 && (
            <div>
              <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Representative Matters
              </label>
              <ul className={`text-[10px] list-disc list-inside ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {specialist.representative_matters.slice(0, 5).map((matter, idx) => (
                  <li key={idx}>{matter}</li>
                ))}
                {specialist.representative_matters.length > 5 && (
                  <li className={isDark ? 'text-white/40' : 'text-black/40'}>
                    +{specialist.representative_matters.length - 5} მეტი
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Values & How We Work */}
      {specialist.values_how_we_work && Object.keys(specialist.values_how_we_work).length > 0 && (
        <div className="mt-3 sm:mt-4">
          <label className={`text-[9px] font-medium uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Values & How We Work
          </label>
          <div className="grid gap-2 mt-1 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(specialist.values_how_we_work).map(([key, val]) => (
              <div key={key} className={`rounded-md p-2 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                <p className={`text-[9px] font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {key}
                </p>
                <p className={`text-[9px] mt-0.5 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  {val}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default SpecialistDetails
