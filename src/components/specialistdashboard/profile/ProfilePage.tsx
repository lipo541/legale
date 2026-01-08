'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { 
  User, Mail, Phone, Loader2, Upload, X, CheckCircle, Clock, 
  Globe, Briefcase, Lightbulb, Target, BookOpen, Award, MapPin, Lock, Eye, EyeOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FormSection from '@/components/specialistdashboard/profile/components/FormSection'
import FormField from '@/components/specialistdashboard/profile/components/FormField'
import TextAreaField from '@/components/specialistdashboard/profile/components/TextAreaField'
import ListField from '@/components/specialistdashboard/profile/components/ListField'
import ObjectField from '@/components/specialistdashboard/profile/components/ObjectField'
import ServicesField from '@/components/common/ServicesField'
import CityPicker from '@/components/companydashboard/companyprofile/CityPicker'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

interface ProfilePageProps {
  locale: Locale
}

interface ProfileData {
  id: string
  email: string | null
  full_name: string | null
  phone_number: string | null
  slug: string | null
  role_title: string | null
  languages: string[] | null
  bio: string | null
  philosophy: string | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  avatar_url: string | null
  verification_status: string | null
  verification_requested_at: string | null
  verification_reviewed_at: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
}

const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German', 'Spanish']

export default function ProfilePage({ locale }: ProfilePageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { showToast } = useToast()
  const supabase = createClient()
  const t = specialistDashboardTranslations[locale] || specialistDashboardTranslations.ka

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [requestingVerification, setRequestingVerification] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [changingPassword, setChangingPassword] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [selectedCities, setSelectedCities] = useState<Array<{ id: string; name_ka: string; name_en: string; name_ru: string }>>([])
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([])
  const [tempSectionData, setTempSectionData] = useState<Record<string, string | string[] | Record<string, string>>>({})

  // Generate slug from full name - returns null if result would be empty (for Georgian names etc.)
  // NULL doesn't violate UNIQUE constraint, so multiple users can have slug = NULL
  const generateSlug = (name: string): string | null => {
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    return slug.length > 0 ? slug : null
  }

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
        setTempSectionData({})
      }

      // Fetch specialist cities
      const { data: cityData } = await supabase
        .from('specialist_cities')
        .select(`
          city_id,
          cities (
            id,
            name_ka,
            name_en,
            name_ru
          )
        `)
        .eq('specialist_id', user.id)

      if (cityData) {
        const cityList = cityData.map((item: { cities: { id: number; name_ka: string; name_en: string; name_ru: string }[] | null }) => Array.isArray(item.cities) ? item.cities[0] : item.cities).filter((city): city is { id: number; name_ka: string; name_en: string; name_ru: string } => city !== null && city !== undefined).map(city => ({ ...city, id: String(city.id) }))
        setSelectedCities(cityList)
        setSelectedCityIds(cityList.map(c => c.id))
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // Check if profile is complete for verification
  const isProfileComplete = (): boolean => {
    if (!profile) return false
    return !!(profile.full_name && profile.role_title && profile.phone_number && 
              profile.languages && profile.languages.length > 0 && profile.bio && profile.avatar_url)
  }

  // Request verification
  const handleRequestVerification = async () => {
    if (!profile) return
    if (!isProfileComplete()) {
      showToast('გთხოვთ შეავსოთ ყველა აუცილებელი ველი: სრული სახელი, პოზიცია, ტელეფონი, ენები, ბიოგრაფია, ფოტო', 'error')
      return
    }
    if (window.confirm('დარწმუნებული ხართ რომ გსურთ ვერიფიკაციის მოთხოვნა?')) {
      setRequestingVerification(true)
      try {
        const { error } = await supabase.from('profiles').update({
          verification_status: 'pending',
          verification_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', profile.id)

        if (error) {
          showToast('შეცდომა: ' + error.message, 'error')
        } else {
          await fetchProfile()
          showToast('ვერიფიკაციის მოთხოვნა გაიგზავნა! ადმინისტრატორი განიხილავს თქვენს პროფილს.', 'success')
        }
      } catch (error) {
        console.error('Request verification error:', error)
        showToast('შეცდომა მოთხოვნის გაგზავნისას', 'error')
      } finally {
        setRequestingVerification(false)
      }
    }
  }

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showToast('გთხოვთ ატვირთოთ მხოლოდ სურათი (JPEG, PNG, WebP)', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს', 'error')
      return
    }

    setUploadingPhoto(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('გთხოვთ გაიაროთ ავტორიზაცია', 'error')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/photo-${Date.now()}.${fileExt}`

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('specialist-photos').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage.from('specialist-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        showToast('ატვირთვისას მოხდა შეცდომა: ' + uploadError.message, 'error')
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('specialist-photos').getPublicUrl(fileName)

      const { error: updateError } = await supabase.from('profiles').update({ 
        avatar_url: publicUrl, 
        updated_at: new Date().toISOString() 
      }).eq('id', user.id)

      if (updateError) {
        showToast('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message, 'error')
        return
      }

      await fetchProfile()
      showToast('ფოტო წარმატებით აიტვირთა!', 'success')
    } catch (error) {
      console.error('Avatar upload error:', error)
      showToast('ფოტოს ატვირთვისას მოხდა შეცდომა', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Handle save cities
  const handleSaveCities = async (cityIds: string[]) => {
    if (!profile) return

    try {
      // 1. Delete all existing cities for this specialist
      const { error: deleteError } = await supabase
        .from('specialist_cities')
        .delete()
        .eq('specialist_id', profile.id)

      if (deleteError) {
        console.error('Error deleting cities:', deleteError)
        showToast('ქალაქების წაშლისას მოხდა შეცდომა', 'error')
        return
      }

      // 2. Insert new selected cities
      if (cityIds.length > 0) {
        const insertData = cityIds.map(cityId => ({
          specialist_id: profile.id,
          city_id: cityId
        }))

        const { error: insertError } = await supabase
          .from('specialist_cities')
          .insert(insertData)

        if (insertError) {
          console.error('Error inserting cities:', insertError)
          showToast('ქალაქების დამატებისას მოხდა შეცდომა', 'error')
          return
        }
      }

      // 3. Reload cities
      await fetchProfile()
      setShowCityPicker(false)
      showToast('ქალაქები წარმატებით განახლდა!', 'success')
    } catch (error) {
      console.error('Save cities error:', error)
      showToast('ქალაქების შენახვისას მოხდა შეცდომა', 'error')
    }
  }

  // Handle section save
  const handleSaveSection = async (section: string, fields: string[]) => {
    if (!profile) return
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

      fields.forEach(field => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = tempSectionData[field] !== undefined ? tempSectionData[field] : (profile as any)[field]

        if (field === 'full_name' && value !== profile.full_name) {
          updateData.full_name = value
          updateData.slug = generateSlug(value as string)
        } else if (field === 'languages') {
          updateData.languages = value
        } else if (field.endsWith('_text')) {
          const dbField = field.replace('_text', '')
          const text = value as string
          updateData[dbField] = text ? text.split('\n').filter(item => item.trim()) : []
        } else if (field === 'values_how_we_work') {
          updateData.values_how_we_work = value as Record<string, string>
        } else {
          updateData[field] = value
        }
      })

      const { error } = await supabase.from('profiles').update(updateData).eq('id', profile.id)

      if (error) {
        showToast('შეცდომა განახლებისას: ' + error.message, 'error')
      } else {
        await fetchProfile()
        setEditingSection(null)
        setTempSectionData({})
        showToast('მონაცემები წარმატებით განახლდა!', 'success')
      }
    } catch (error) {
      console.error('Save section error:', error)
      showToast('შეცდომა შენახვისას', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      showToast(t.fillAllFields, 'error')
      return
    }
    if (passwordData.new.length < 6) {
      showToast(t.minPasswordLength, 'error')
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      showToast(t.passwordsMismatch, 'error')
      return
    }

    setChangingPassword(true)
    try {
      // First verify current password by signing in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        showToast(t.userNotFound, 'error')
        return
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current
      })

      if (signInError) {
        showToast(t.wrongCurrentPassword, 'error')
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new
      })

      if (updateError) {
        showToast(t.passwordChangeError + updateError.message, 'error')
        return
      }

      showToast(t.passwordChanged, 'success')
      setShowPasswordModal(false)
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Password change error:', error)
      showToast(t.passwordChangeErrorGeneric, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  // Toggle language selection
  const toggleLanguage = (language: string) => {
    const currentLanguages = tempSectionData.languages !== undefined 
      ? tempSectionData.languages as string[]
      : profile?.languages || []
    
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language]
    
    setTempSectionData({ ...tempSectionData, languages: newLanguages })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-white/50' : 'text-black/50'}`} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.profileNotFound}</p>
      </div>
    )
  }

  const isEditing = (section: string) => editingSection === section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getValue = (field: string) => {
    // If temp data exists, use it
    if (tempSectionData[field] !== undefined) {
      return tempSectionData[field] as string
    }
    // For _text fields, convert array to newline-separated text
    if (field.endsWith('_text')) {
      const dbField = field.replace('_text', '')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const arrayValue = (profile as any)[dbField]
      if (Array.isArray(arrayValue) && arrayValue.length > 0) {
        return arrayValue.join('\n')
      }
      return ''
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (profile as any)[field] || ''
  }
  // Use functional update to avoid stale closure issues
  const setValue = (field: string, value: string | string[] | Record<string, string>) => setTempSectionData(prev => ({ ...prev, [field]: value }))

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header with Verification Status */}
      <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{t.profileTitle}</h1>
          <p className={`text-xs lg:text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.profileManagement}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {profile.verification_status === 'verified' && (
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/[0.02] border-black/10 text-black'}`}>
              <CheckCircle className="h-3.5 w-3.5" />
              <span>{t.verified}</span>
            </div>
          )}
          
          {profile.verification_status === 'pending' && (
            <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border ${isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-black/[0.02] border-black/10 text-black/70'}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>{t.pending}</span>
            </div>
          )}
          
          {(profile.verification_status === 'unverified' || profile.verification_status === 'rejected') && (
            <button
              onClick={handleRequestVerification}
              disabled={requestingVerification || !isProfileComplete()}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {requestingVerification ? <><Loader2 className="h-3 w-3 animate-spin" />{t.sending}</> : <><CheckCircle className="h-3 w-3" />{t.verification}</>}
            </button>
          )}
        </div>
      </div>

      {/* Verification Info Banner */}
      {profile.verification_status !== 'verified' && (
        <div className={`mb-4 rounded-xl border p-3 lg:p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
          <div className="flex items-start gap-2.5">
            {profile.verification_status === 'pending' ? <Clock className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            : profile.verification_status === 'rejected' ? <X className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            : <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />}
            <div className="flex-1">
              {profile.verification_status === 'pending' ? (
                <>
                  <h3 className={`font-medium text-xs lg:text-sm ${isDark ? 'text-white' : 'text-black'}`}>{t.verificationPending}</h3>
                  <p className={`text-[10px] lg:text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.profileReviewing}</p>
                </>
              ) : profile.verification_status === 'rejected' ? (
                <>
                  <h3 className={`font-medium text-xs lg:text-sm ${isDark ? 'text-white' : 'text-black'}`}>{t.verificationRejected}</h3>
                  <p className={`text-[10px] lg:text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {profile.verification_notes || t.canUpdateAndRetry}
                  </p>
                </>
              ) : (
                <>
                  <h3 className={`font-medium text-xs lg:text-sm ${isDark ? 'text-white' : 'text-black'}`}>{t.verificationRequired}</h3>
                  <div className={`mt-1.5 text-[10px] lg:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    <p className="font-medium">{t.required}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={profile.full_name ? 'line-through opacity-40' : ''}>{t.name}</span>
                      <span>•</span>
                      <span className={profile.role_title ? 'line-through opacity-40' : ''}>{t.position}</span>
                      <span>•</span>
                      <span className={profile.phone_number ? 'line-through opacity-40' : ''}>{t.phone}</span>
                      <span>•</span>
                      <span className={profile.languages && profile.languages.length > 0 ? 'line-through opacity-40' : ''}>{t.languages}</span>
                      <span>•</span>
                      <span className={profile.bio ? 'line-through opacity-40' : ''}>{t.bio}</span>
                      <span>•</span>
                      <span className={profile.avatar_url ? 'line-through opacity-40' : ''}>{t.photo}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-xl border p-3 lg:p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
        {/* Profile Image Section */}
        <div className={`mb-3 lg:mb-4 pb-3 lg:pb-4 ${isDark ? 'border-b border-white/10' : 'border-b border-black/10'}`}>
          <h2 className={`text-sm lg:text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>{t.photoSection}</h2>
          <div className="flex items-center gap-3 lg:gap-4">
            <div 
              onClick={() => profile.avatar_url && setShowPhotoPreview(true)}
              className={`flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'} ${profile.avatar_url ? 'cursor-pointer hover:ring-2 hover:ring-white/10 transition-all' : ''}`}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className={`h-6 w-6 lg:h-8 lg:w-8 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="avatar-upload" className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer active:scale-95 ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                {uploadingPhoto ? <><Loader2 className="h-3 w-3 animate-spin" />{t.uploading}</> : <><Upload className="h-3 w-3" />{profile.avatar_url ? t.change : t.upload}</>}
              </label>
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingPhoto} className="hidden" />
              <p className={`text-[10px] mt-1 ${isDark ? 'text-white/30' : 'text-black/30'}`}>{t.photoRequirements}</p>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <FormSection
          title={t.basicInfo}
          isEditing={isEditing('basic')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('basic')}
          onSave={() => handleSaveSection('basic', ['full_name', 'role_title', 'phone_number', 'languages', 'bio', 'philosophy'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
          locale={locale}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label={t.fullName} icon={User} value={getValue('full_name')} isEditing={isEditing('basic')} onChange={(v: string) => setValue('full_name', v)} placeholder="John Doe" required isDark={isDark} />
            <FormField label={t.slug} icon={Globe} value={profile.slug || (profile.full_name ? generateSlug(profile.full_name) : null) || t.autoGenerated} isEditing={false} readOnly isDark={isDark} description={t.autoGenerated} />
            <FormField label={t.roleTitle} icon={Briefcase} value={getValue('role_title')} isEditing={isEditing('basic')} onChange={(v: string) => setValue('role_title', v)} placeholder="Senior Legal Counsel" required isDark={isDark} />
            <FormField label={t.email} icon={Mail} value={profile.email || 'N/A'} isEditing={false} type="email" readOnly isDark={isDark} />
            <FormField label={t.phoneNumber} icon={Phone} value={getValue('phone_number')} isEditing={isEditing('basic')} onChange={(v: string) => setValue('phone_number', v)} placeholder="+995 551 911 951" type="tel" required isDark={isDark} />
            
            <div>
              <label className={`mb-2 flex items-center gap-1.5 text-xs lg:text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Globe className="h-3.5 w-3.5" />{t.languages} *
              </label>
              {isEditing('basic') ? (
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const currentLangs = tempSectionData.languages !== undefined ? tempSectionData.languages as string[] : profile.languages || []
                    const isSelected = currentLangs.includes(lang)
                    return (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected ? isDark ? 'bg-white/20 text-white border border-white/30' : 'bg-black/20 text-black border border-black/30' : isDark ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10' : 'bg-black/5 text-black/60 border border-black/10 hover:bg-black/10'}`}>
                        {lang}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages && profile.languages.length > 0 ? profile.languages.map((lang) => (
                    <span key={lang} className={`px-2 lg:px-2.5 py-1 lg:py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-black/10 text-black border border-black/20'}`}>{lang}</span>
                  )) : <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>N/A</p>}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <TextAreaField label={t.bioField} icon={User} value={getValue('bio')} isEditing={isEditing('basic')} onChange={(v: string) => setValue('bio', v)} placeholder="Share your professional background..." rows={4} required isDark={isDark} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label={t.philosophy} icon={Lightbulb} value={getValue('philosophy')} isEditing={isEditing('basic')} onChange={(v: string) => setValue('philosophy', v)} placeholder="Your professional philosophy..." rows={4} isDark={isDark} />
            </div>
          </div>
        </FormSection>

        {/* Cities Section */}
        <div className={`rounded-lg border p-3 lg:p-4 mb-3 lg:mb-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h2 className={`text-sm lg:text-base font-semibold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
              <MapPin className="h-3.5 lg:h-4 w-3.5 lg:w-4" />
              {t.cities}
            </h2>
            <button
              onClick={() => setShowCityPicker(true)}
              className={`text-xs font-medium transition-colors px-2.5 py-1 rounded-lg ${
                isDark 
                  ? 'text-white hover:text-white/80 bg-white/10 hover:bg-white/20' 
                  : 'text-black hover:text-black/80 bg-black/10 hover:bg-black/20'
              }`}
            >
              {selectedCities.length === 0 ? t.add : t.edit}
            </button>
          </div>

          {selectedCities.length === 0 ? (
            <div className={`text-center py-4 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <MapPin className="h-6 w-6 mx-auto mb-1.5 opacity-20" />
              <p className="text-xs">{t.noCitiesSelected}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedCities.map(city => (
                <span
                  key={city.id}
                  className={`px-2 lg:px-2.5 py-1 rounded-lg text-xs font-medium ${
                    isDark 
                      ? 'bg-white/10 text-white border border-white/20' 
                      : 'bg-black/10 text-black border border-black/20'
                  }`}
                >
                  {locale === 'en' ? city.name_en : locale === 'ru' ? city.name_ru : city.name_ka}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Professional Experience Section */}
        <FormSection
          title={t.professionalExperience}
          isEditing={isEditing('experience')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('experience')}
          onSave={() => handleSaveSection('experience', ['focus_areas_text', 'representative_matters_text', 'teaching_writing_speaking'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
          locale={locale}
        >
          <div className="space-y-6">
            <ListField label={t.focusAreas} icon={Target} items={profile.focus_areas || []} isEditing={isEditing('experience')} value={getValue('focus_areas_text')} onChange={(v: string) => setValue('focus_areas_text', v)} placeholder="Corporate Law&#10;Contract Negotiations" isDark={isDark} />
            <ListField label={t.representativeMatters} icon={Briefcase} items={profile.representative_matters || []} isEditing={isEditing('experience')} value={getValue('representative_matters_text')} onChange={(v: string) => setValue('representative_matters_text', v)} placeholder="Represented major corporation..." isDark={isDark} />
            <TextAreaField label={t.teachingWritingSpeaking} icon={BookOpen} value={getValue('teaching_writing_speaking')} isEditing={isEditing('experience')} onChange={(v: string) => setValue('teaching_writing_speaking', v)} placeholder="Describe your teaching activities..." rows={5} isDark={isDark} />
          </div>
        </FormSection>

        {/* Services/Specializations Section */}
        <div className={`mb-3 lg:mb-4 pb-3 lg:pb-4 ${isDark ? 'border-b border-white/10' : 'border-b border-black/10'}`}>
          <h2 className={`text-sm lg:text-base font-semibold mb-2 lg:mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
            {t.servicesSpecializations}
          </h2>
          <ServicesField 
            profileId={profile.id} 
            isDark={isDark} 
            showActions={true}
          />
        </div>

        {/* Credentials & Values Section */}
        <FormSection
          title={t.credentialsValues}
          isEditing={isEditing('credentials')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('credentials')}
          onSave={() => handleSaveSection('credentials', ['credentials_memberships_text', 'values_how_we_work'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
          showBorder={false}
          locale={locale}
        >
          <div className="space-y-6">
            <ListField label={t.credentialsMemberships} icon={Award} items={profile.credentials_memberships || []} isEditing={isEditing('credentials')} value={getValue('credentials_memberships_text')} onChange={(v: string) => setValue('credentials_memberships_text', v)} placeholder="Licensed Attorney, State Bar&#10;Member of ABA" isDark={isDark} />
            <ObjectField label={t.valuesHowWeWork} icon={Lightbulb} value={profile.values_how_we_work || {}} isEditing={isEditing('credentials')} onChange={(v: Record<string, string>) => setValue('values_how_we_work', v)} isDark={isDark} description={t.valuesDescription} locale={locale} />
          </div>
        </FormSection>

        {/* Security Section */}
        <div className={`mt-3 lg:mt-4 pt-3 lg:pt-4 ${isDark ? 'border-t border-white/10' : 'border-t border-black/10'}`}>
          <h2 className={`text-sm lg:text-base font-semibold mb-3 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
            <Lock className="h-3.5 lg:h-4 w-3.5 lg:w-4" />
            {t.security}
          </h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
              isDark 
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' 
                : 'bg-black/10 text-black hover:bg-black/20 border border-black/10'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            {t.changePassword}
          </button>
        </div>
      </div>

      {/* Photo Preview Modal */}
      {showPhotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 lg:p-4 backdrop-blur-sm" onClick={() => setShowPhotoPreview(false)}>
          <div className="relative max-w-[95vw] lg:max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhotoPreview(false)} className="absolute top-2 right-2 lg:-top-4 lg:-right-4 z-10 rounded-full bg-black/70 lg:bg-black/50 p-1.5 lg:p-2 text-white transition-all hover:bg-black/90 lg:hover:bg-black/70 hover:scale-110">
              <X className="h-5 w-5 lg:h-6 lg:w-6" strokeWidth={2} />
            </button>
            <img src={profile.avatar_url || ''} alt={profile.full_name || 'Profile'} className="max-h-[85vh] lg:max-h-[90vh] max-w-full rounded-xl lg:rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* City Picker Modal */}
      {showCityPicker && (
        <CityPicker
          onClose={() => setShowCityPicker(false)}
          onSave={handleSaveCities}
          selectedCityIds={selectedCityIds}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div 
            className={`w-full max-w-md rounded-xl p-4 lg:p-6 ${
              isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base lg:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                <Lock className="h-4 w-4" />
                {t.changePassword}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              >
                <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Current Password */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {t.currentPassword} *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors ${
                      isDark 
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/30' 
                        : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/30'
                    } focus:outline-none`}
                    placeholder={t.enterCurrentPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {t.newPassword} *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new}
                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors ${
                      isDark 
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/30' 
                        : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/30'
                    } focus:outline-none`}
                    placeholder={t.minChars}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {t.confirmPassword} *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors ${
                      isDark 
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/30' 
                        : 'border-black/10 bg-black/[0.02] text-black placeholder:text-black/30 focus:border-black/30'
                    } focus:outline-none`}
                    placeholder={t.repeatNewPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                {t.passwordRequirement}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordData({ current: '', new: '', confirm: '' })
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-black/60 hover:text-black hover:bg-black/10'
                }`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwordData.current || !passwordData.new || !passwordData.confirm}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
                }`}
              >
                {changingPassword ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />{t.changing}</>
                ) : (
                  <><Lock className="h-3 w-3" />{t.change}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
