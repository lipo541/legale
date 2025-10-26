'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, Mail, Phone, Loader2, Upload, X, CheckCircle, Clock, 
  Globe, Briefcase, Lightbulb, Target, BookOpen, Award
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import FormSection from './components/FormSection'
import FormField from './components/FormField'
import TextAreaField from './components/TextAreaField'
import ListField from './components/ListField'
import ObjectField from './components/ObjectField'
import ServicesField from '@/components/common/ServicesField'

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

const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German']

export default function ProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [requestingVerification, setRequestingVerification] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [tempSectionData, setTempSectionData] = useState<Record<string, string | string[] | Record<string, string>>>({})

  // Generate slug from full name
  const generateSlug = (name: string): string => {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  // Fetch profile data
  const fetchProfile = async () => {
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
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

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
      alert('გთხოვთ შეავსოთ ყველა აუცილებელი ველი:\n- სრული სახელი\n- პოზიცია\n- ტელეფონი\n- ენები\n- ბიოგრაფია\n- ფოტო')
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
          alert('შეცდომა: ' + error.message)
        } else {
          await fetchProfile()
          alert('ვერიფიკაციის მოთხოვნა გაიგზავნა! ✅\n\nადმინისტრატორი განიხილავს თქვენს პროფილს და მალე მიიღებთ პასუხს.')
        }
      } catch (err) {
        alert('შეცდომა მოთხოვნის გაგზავნისას')
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
      alert('გთხოვთ ატვირთოთ მხოლოდ სურათი (JPEG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    setUploadingPhoto(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია')
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
        alert('ატვირთვისას მოხდა შეცდომა: ' + uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('specialist-photos').getPublicUrl(fileName)

      const { error: updateError } = await supabase.from('profiles').update({ 
        avatar_url: publicUrl, 
        updated_at: new Date().toISOString() 
      }).eq('id', user.id)

      if (updateError) {
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      await fetchProfile()
      alert('ფოტო წარმატებით აიტვირთა! ✅')
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('ფოტოს ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Handle section save
  const handleSaveSection = async (section: string, fields: string[]) => {
    if (!profile) return
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

      fields.forEach(field => {
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
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchProfile()
        setEditingSection(null)
        setTempSectionData({})
        alert('სექცია წარმატებით განახლდა!')
      }
    } catch (err) {
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>პროფილი ვერ მოიძებნა</p>
      </div>
    )
  }

  const isEditing = (section: string) => editingSection === section
  const getValue = (field: string) => tempSectionData[field] !== undefined ? tempSectionData[field] as string : (profile as any)[field] || ''
  const setValue = (field: string, value: string | string[] | Record<string, string>) => setTempSectionData({ ...tempSectionData, [field]: value })

  return (
    <div className="pb-10">
      {/* Header with Verification Status */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Solo Specialist Profile</h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>პროფესიული პროფილის მართვა</p>
        </div>
        
        <div className="flex items-center gap-3">
          {profile.verification_status === 'verified' && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 border border-emerald-500/30">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold text-emerald-500">ვერიფიცირებული</span>
            </div>
          )}
          
          {profile.verification_status === 'pending' && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 border border-amber-500/30">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-amber-500">განხილვაში</span>
            </div>
          )}
          
          {(profile.verification_status === 'unverified' || profile.verification_status === 'rejected') && (
            <button
              onClick={handleRequestVerification}
              disabled={requestingVerification || !isProfileComplete()}
              className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
              }`}
            >
              {requestingVerification ? <><Loader2 className="h-4 w-4 animate-spin" />იგზავნება...</> : <><CheckCircle className="h-4 w-4" />ვერიფიკაციის მოთხოვნა</>}
            </button>
          )}
        </div>
      </div>

      {/* Verification Info Banner */}
      {profile.verification_status !== 'verified' && (
        <div className={`mb-6 rounded-xl border p-6 ${
          profile.verification_status === 'pending' ? isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-500/30 bg-amber-500/5'
          : profile.verification_status === 'rejected' ? isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-500/30 bg-red-500/5'
          : isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/30 bg-blue-500/5'
        }`}>
          <div className="flex items-start gap-4">
            {profile.verification_status === 'pending' ? <Clock className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            : profile.verification_status === 'rejected' ? <X className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            : <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />}
            <div className="flex-1">
              {profile.verification_status === 'pending' ? (
                <>
                  <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>ვერიფიკაცია განხილვაშია</h3>
                  <p className={`text-sm ${isDark ? 'text-amber-300/80' : 'text-amber-700/80'}`}>თქვენი პროფილი განიხილება ადმინისტრატორის მიერ.</p>
                </>
              ) : profile.verification_status === 'rejected' ? (
                <>
                  <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>ვერიფიკაცია უარყოფილია</h3>
                  <p className={`text-sm ${isDark ? 'text-red-300/80' : 'text-red-700/80'}`}>
                    {profile.verification_notes || 'შეგიძლიათ განაახლოთ პროფილი და ხელახლა მოითხოვოთ ვერიფიკაცია.'}
                  </p>
                </>
              ) : (
                <>
                  <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>ვერიფიკაცია საჭიროა</h3>
                  <div className={`mt-3 text-sm ${isDark ? 'text-blue-300/80' : 'text-blue-700/80'}`}>
                    <p className="font-medium mb-1">აუცილებელი ველები:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li className={profile.full_name ? 'line-through opacity-50' : ''}>სრული სახელი</li>
                      <li className={profile.role_title ? 'line-through opacity-50' : ''}>პოზიცია</li>
                      <li className={profile.phone_number ? 'line-through opacity-50' : ''}>ტელეფონი</li>
                      <li className={profile.languages && profile.languages.length > 0 ? 'line-through opacity-50' : ''}>ენები</li>
                      <li className={profile.bio ? 'line-through opacity-50' : ''}>ბიოგრაფია</li>
                      <li className={profile.avatar_url ? 'line-through opacity-50' : ''}>პროფილის სურათი</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-xl border p-8 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        {/* Profile Image Section */}
        <div className="mb-8 pb-8 border-b border-white/10">
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Profile Image</h2>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => profile.avatar_url && setShowPhotoPreview(true)}
              className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'} ${profile.avatar_url ? 'cursor-pointer hover:ring-2 hover:ring-white/20 transition-all' : ''}`}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || 'Profile'} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className={`h-12 w-12 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="avatar-upload" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:scale-[1.02] ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                {uploadingPhoto ? <><Loader2 className="h-4 w-4 animate-spin" />ატვირთვა...</> : <><Upload className="h-4 w-4" />{profile.avatar_url ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}</>}
              </label>
              <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingPhoto} className="hidden" />
              <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>JPEG, PNG, WebP (მაქს. 5MB)</p>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <FormSection
          title="ძირითადი ინფორმაცია"
          isEditing={isEditing('basic')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('basic')}
          onSave={() => handleSaveSection('basic', ['full_name', 'role_title', 'phone_number', 'languages', 'bio', 'philosophy'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="სრული სახელი" icon={User} value={getValue('full_name')} isEditing={isEditing('basic')} onChange={(v) => setValue('full_name', v)} placeholder="John Doe" required isDark={isDark} />
            <FormField label="Slug (URL)" icon={Globe} value={profile.slug || (profile.full_name ? generateSlug(profile.full_name) : 'N/A')} isEditing={false} readOnly isDark={isDark} description="ავტომატურად გენერირდება" />
            <FormField label="Role / Title" icon={Briefcase} value={getValue('role_title')} isEditing={isEditing('basic')} onChange={(v) => setValue('role_title', v)} placeholder="Senior Legal Counsel" required isDark={isDark} />
            <FormField label="Email (read-only)" icon={Mail} value={profile.email || 'N/A'} isEditing={false} type="email" readOnly isDark={isDark} />
            <FormField label="Phone Number" icon={Phone} value={getValue('phone_number')} isEditing={isEditing('basic')} onChange={(v) => setValue('phone_number', v)} placeholder="+995 551 911 951" type="tel" required isDark={isDark} />
            
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Globe className="h-4 w-4" />Languages *
              </label>
              {isEditing('basic') ? (
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const currentLangs = tempSectionData.languages !== undefined ? tempSectionData.languages as string[] : profile.languages || []
                    const isSelected = currentLangs.includes(lang)
                    return (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSelected ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' : isDark ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10' : 'bg-black/5 text-black/60 border border-black/10 hover:bg-black/10'}`}>
                        {lang}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.languages && profile.languages.length > 0 ? profile.languages.map((lang) => (
                    <span key={lang} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'}`}>{lang}</span>
                  )) : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>N/A</p>}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <TextAreaField label="Bio" icon={User} value={getValue('bio')} isEditing={isEditing('basic')} onChange={(v) => setValue('bio', v)} placeholder="Share your professional background..." rows={4} required isDark={isDark} />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Philosophy" icon={Lightbulb} value={getValue('philosophy')} isEditing={isEditing('basic')} onChange={(v) => setValue('philosophy', v)} placeholder="Your professional philosophy..." rows={4} isDark={isDark} />
            </div>
          </div>
        </FormSection>

        {/* Professional Experience Section */}
        <FormSection
          title="Professional Experience"
          isEditing={isEditing('experience')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('experience')}
          onSave={() => handleSaveSection('experience', ['focus_areas_text', 'representative_matters_text', 'teaching_writing_speaking'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
        >
          <div className="space-y-6">
            <ListField label="Focus Areas (one per line)" icon={Target} items={profile.focus_areas || []} isEditing={isEditing('experience')} value={getValue('focus_areas_text')} onChange={(v) => setValue('focus_areas_text', v)} placeholder="Corporate Law&#10;Contract Negotiations" isDark={isDark} />
            <ListField label="Representative Matters (one per line)" icon={Briefcase} items={profile.representative_matters || []} isEditing={isEditing('experience')} value={getValue('representative_matters_text')} onChange={(v) => setValue('representative_matters_text', v)} placeholder="Represented major corporation..." isDark={isDark} />
            <TextAreaField label="Teaching, Writing & Speaking" icon={BookOpen} value={getValue('teaching_writing_speaking')} isEditing={isEditing('experience')} onChange={(v) => setValue('teaching_writing_speaking', v)} placeholder="Describe your teaching activities..." rows={5} isDark={isDark} />
          </div>
        </FormSection>

        {/* Services/Specializations Section */}
        <FormSection
          title="სერვისები და სპეციალიზაციები"
          isEditing={isEditing('services')}
          isDark={isDark}
          saving={false}
          onEdit={() => setEditingSection('services')}
          onSave={() => setEditingSection(null)}
          onCancel={() => setEditingSection(null)}
        >
          <ServicesField 
            profileId={profile.id} 
            isDark={isDark} 
            isEditing={isEditing('services')}
          />
        </FormSection>

        {/* Credentials & Values Section */}
        <FormSection
          title="Credentials & Values"
          isEditing={isEditing('credentials')}
          isDark={isDark}
          saving={saving}
          onEdit={() => setEditingSection('credentials')}
          onSave={() => handleSaveSection('credentials', ['credentials_memberships_text', 'values_how_we_work'])}
          onCancel={() => { setEditingSection(null); setTempSectionData({}) }}
          showBorder={false}
        >
          <div className="space-y-6">
            <ListField label="Credentials & Memberships (one per line)" icon={Award} items={profile.credentials_memberships || []} isEditing={isEditing('credentials')} value={getValue('credentials_memberships_text')} onChange={(v) => setValue('credentials_memberships_text', v)} placeholder="Licensed Attorney, State Bar&#10;Member of ABA" isDark={isDark} />
            <ObjectField label="Values & How We Work" icon={Lightbulb} value={profile.values_how_we_work || {}} isEditing={isEditing('credentials')} onChange={(v) => setValue('values_how_we_work', v)} isDark={isDark} description="Add key-value pairs for your values and work approach" />
          </div>
        </FormSection>
      </div>

      {/* Photo Preview Modal */}
      {showPhotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowPhotoPreview(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPhotoPreview(false)} className="absolute -top-4 -right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 hover:scale-110">
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            <img src={profile.avatar_url || ''} alt={profile.full_name || 'Profile'} className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
