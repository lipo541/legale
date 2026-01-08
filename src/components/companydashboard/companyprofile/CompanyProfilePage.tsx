'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2, Mail, Phone, Globe, MapPin, Edit, Save, X, Loader2,
  Upload, Facebook, Instagram, Linkedin, Twitter, ChevronDown, ChevronUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const MapPicker = dynamic<{
  onLocationSelect: (lat: number, lng: number) => void
  initialPosition?: { lat: number; lng: number }
  isDark?: boolean
}>(() => import('@/components/companydashboard/companyprofile/MapPicker'), { ssr: false })

const CityPicker = dynamic(() => import('@/components/companydashboard/companyprofile/CityPicker'), { ssr: false })
const SpecializationPicker = dynamic(() => import('@/components/companydashboard/companyprofile/SpecializationPicker'), { ssr: false })

interface CompanyProfileData {
  id: string
  email: string | null
  full_name: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
  company_overview: string | null
  summary: string | null
  mission_statement: string | null
  vision_values: string | null
  history: string | null
  how_we_work: string | null
  website: string | null
  address: string | null
  map_link: string | null
  facebook_link: string | null
  instagram_link: string | null
  linkedin_link: string | null
  twitter_link: string | null
  logo_url: string | null
}

export default function CompanyProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [showLogoPreview, setShowLogoPreview] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [profile, setProfile] = useState<CompanyProfileData | null>(null)
  const [selectedCities, setSelectedCities] = useState<Array<{ id: string; name_ka: string; name_en: string }>>([])
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([])
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<string[]>([])
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    logo: true,
    basic: true,
    summary: false,
    mission: false,
    vision: false,
    history: false,
    work: false,
    contact: true,
    cities: false,
    specializations: false,
    social: false
  })

  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone_number: '', company_overview: '',
    summary: '', mission_statement: '', vision_values: '', history: '',
    how_we_work: '', website: '', address: '', map_link: '',
    facebook_link: '', instagram_link: '', linkedin_link: '', twitter_link: '', logo_url: ''
  })
  const [tempSectionData, setTempSectionData] = useState<Record<string, string>>({})

  const supabase = createClient()

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setMarkerPosition({ lat, lng })
  }

  const handleSaveMapLocation = () => {
    if (markerPosition) {
      const googleMapsUrl = `https://www.google.com/maps?q=${markerPosition.lat},${markerPosition.lng}`
      setEditForm({ ...editForm, map_link: googleMapsUrl })
      setShowMapPicker(false)
      alert('მდებარეობა შენახულია! ✅')
    } else {
      alert('გთხოვთ მონიშნოთ მდებარეობა რუკაზე')
    }
  }

  const handleTextareaChange = (field: string, value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [field]: value })
    const textarea = event.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      alert('გთხოვთ ატვირთოთ მხოლოდ სურათი (JPEG, PNG, WebP, SVG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

      if (profile.logo_url) {
        const oldPath = profile.logo_url.split('/').slice(-2).join('/')
        await supabase.storage.from('company-logos').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, { cacheControl: '3600', upsert: true })

      if (uploadError) {
        alert('ატვირთვისას მოხდა შეცდომა: ' + uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) {
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      setEditForm({ ...editForm, logo_url: publicUrl })
      await fetchProfile()
      alert('ლოგო წარმატებით აიტვირთა! ✅')
    } catch (error) {
      console.error('Logo upload error:', error)
      alert('ლოგოს ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploadingLogo(false)
    }
  }

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
        setEditForm({
          full_name: data.full_name || '', email: data.email || '', phone_number: data.phone_number || '',
          company_overview: data.company_overview || '', summary: data.summary || '',
          mission_statement: data.mission_statement || '', vision_values: data.vision_values || '',
          history: data.history || '', how_we_work: data.how_we_work || '',
          website: data.website || '', address: data.address || '', map_link: data.map_link || '',
          facebook_link: data.facebook_link || '', instagram_link: data.instagram_link || '',
          linkedin_link: data.linkedin_link || '', twitter_link: data.twitter_link || '',
          logo_url: data.logo_url || ''
        })
      }

      await fetchCompanyCities(user.id)
      await fetchCompanySpecializations(user.id)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchCompanyCities = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_cities')
        .select('city_id, cities(id, name_ka, name_en, name_ru)')
        .eq('company_id', companyId)

      if (error) {
        console.error('Error fetching company cities:', error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cities = data?.map((item: any) => item.cities)
          .filter(Boolean)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((city: any) => ({
            id: city.id,
            name_ka: city.name_ka,
            name_en: city.name_en,
            name_ru: city.name_ru
          })) || []
        setSelectedCities(cities)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSelectedCityIds(cities.map((c: any) => c.id))
      }
    } catch (error) {
      console.error('Fetch cities error:', error)
    }
  }

  const fetchCompanySpecializations = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_specializations')
        .select('specialization_id')
        .eq('company_id', companyId)

      if (error) {
        console.error('Error fetching company specializations:', error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const specializationIds = data?.map((item: any) => item.specialization_id) || []
        setSelectedSpecializationIds(specializationIds)
      }
    } catch (error) {
      console.error('Fetch specializations error:', error)
    }
  }

  const handleSaveCities = async (cityIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('company_cities').delete().eq('company_id', user.id)

      if (cityIds.length > 0) {
        const insertData = cityIds.map(cityId => ({ company_id: user.id, city_id: cityId }))
        const { error } = await supabase.from('company_cities').insert(insertData)
        if (error) {
          alert('ქალაქების შენახვისას მოხდა შეცდომა')
          return
        }
      }

      await fetchCompanyCities(user.id)
      alert('ქალაქები წარმატებით შეინახა!')
    } catch (error) {
      console.error('Save cities error:', error)
      alert('ქალაქების შენახვისას მოხდა შეცდომა')
    }
  }

  const handleSaveSpecializations = async (specializationIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('company_specializations').delete().eq('company_id', user.id)

      if (specializationIds.length > 0) {
        const insertData = specializationIds.map(specializationId => ({ company_id: user.id, specialization_id: specializationId }))
        const { error } = await supabase.from('company_specializations').insert(insertData)
        if (error) {
          alert('სპეციალიზაციების შენახვისას მოხდა შეცდომა')
          return
        }
      }

      await fetchCompanySpecializations(user.id)
      alert('სპეციალიზაციები წარმატებით შეინახა!')
    } catch (error) {
      console.error('Save specializations error:', error)
      alert('სპეციალიზაციების შენახვისას მოხდა შეცდომა')
    }
  }

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleEdit = () => setEditing(true)
  
  const handleEditSection = (section: string) => {
    setEditingSection(section)
    setTempSectionData({})
    setExpandedSections(prev => ({ ...prev, [section]: true }))
  }
  
  const handleCancelSection = () => {
    setEditingSection(null)
    setTempSectionData({})
  }
  
  const handleSaveSection = async (section: string, fields: string[]) => {
    if (!profile) return
    setSaving(true)
    try {
      const updateData: Record<string, string | number | boolean | null> = { updated_at: new Date().toISOString() }
      fields.forEach(field => {
        updateData[field] = tempSectionData[field] !== undefined ? tempSectionData[field] : editForm[field as keyof typeof editForm]
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
    } catch (error) {
      console.error('Save section error:', error)
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '', email: profile.email || '', phone_number: profile.phone_number || '',
        company_overview: profile.company_overview || '', summary: profile.summary || '',
        mission_statement: profile.mission_statement || '', vision_values: profile.vision_values || '',
        history: profile.history || '', how_we_work: profile.how_we_work || '',
        website: profile.website || '', address: profile.address || '', map_link: profile.map_link || '',
        facebook_link: profile.facebook_link || '', instagram_link: profile.instagram_link || '',
        linkedin_link: profile.linkedin_link || '', twitter_link: profile.twitter_link || '',
        logo_url: profile.logo_url || ''
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: editForm.full_name, email: editForm.email, phone_number: editForm.phone_number,
        company_overview: editForm.company_overview, summary: editForm.summary,
        mission_statement: editForm.mission_statement, vision_values: editForm.vision_values,
        history: editForm.history, how_we_work: editForm.how_we_work,
        website: editForm.website, address: editForm.address, map_link: editForm.map_link,
        facebook_link: editForm.facebook_link, instagram_link: editForm.instagram_link,
        linkedin_link: editForm.linkedin_link, twitter_link: editForm.twitter_link,
        logo_url: editForm.logo_url, updated_at: new Date().toISOString()
      }).eq('id', profile.id)

      if (error) {
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchProfile()
        setEditing(false)
        alert('პროფილი წარმატებით განახლდა!')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  // Section Header Component
  const SectionHeader = ({ 
    title, 
    section, 
    canEdit = true,
    icon: Icon
  }: { 
    title: string
    section: string
    canEdit?: boolean
    icon?: React.ElementType
  }) => (
    <div
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between py-2 px-1 transition-colors rounded cursor-pointer ${
        isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-3.5 w-3.5 ${isDark ? 'text-white/50' : 'text-black/50'}`} />}
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {title}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {canEdit && !editing && editingSection !== section && (
          <button
            onClick={(e) => { e.stopPropagation(); handleEditSection(section) }}
            className={`p-1 rounded transition-all hover:scale-110 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
          >
            <Edit className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          </button>
        )}
        {expandedSections[section] ? (
          <ChevronUp className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        )}
      </div>
    </div>
  )

  // Section Save/Cancel Buttons
  const SectionActions = ({ section, fields }: { section: string; fields: string[] }) => (
    editingSection === section && (
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleSaveSection(section, fields)}
          disabled={saving}
          className="rounded px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50"
        >
          {saving ? 'შენახვა...' : 'შენახვა'}
        </button>
        <button
          onClick={handleCancelSection}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
            isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          გაუქმება
        </button>
      </div>
    )
  )

  // Input styles
  const inputClass = `w-full rounded border px-3 py-2 text-sm transition-colors ${
    isDark 
      ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30' 
      : 'border-black/10 bg-black/5 text-black focus:border-black/20 placeholder:text-black/30'
  }`

  const textareaClass = `w-full rounded border px-3 py-2 text-sm transition-colors resize-none overflow-hidden ${
    isDark 
      ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30' 
      : 'border-black/10 bg-black/5 text-black focus:border-black/20 placeholder:text-black/30'
  }`

  const labelClass = `mb-1.5 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`

  const valueClass = `text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`mx-4 sm:mx-6 lg:mx-8 rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>პროფილი ვერ მოიძებნა</p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიის პროფილი
          </h1>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            მართეთ თქვენი კომპანიის საჯარო ინფორმაცია
          </p>
        </div>
        {!editing && (
          <button 
            onClick={handleEdit} 
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
              isDark 
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            <Edit className="h-3 w-3" />
            სრული რედაქტირება
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className={`rounded-lg border divide-y ${
        isDark ? 'border-white/10 bg-black/50 divide-white/10' : 'border-black/10 bg-white divide-black/10'
      }`}>
        
        {/* Logo Section */}
        <div className="p-4">
          <SectionHeader title="ლოგო" section="logo" canEdit={false} icon={Building2} />
          {expandedSections.logo && (
            <div className="mt-3 flex items-center gap-4">
              <div 
                onClick={() => (editForm.logo_url || profile.logo_url) && setShowLogoPreview(true)}
                className={`flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full flex-shrink-0 ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                } ${(editForm.logo_url || profile.logo_url) ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500/50 transition-all' : ''}`}
              >
                {(editForm.logo_url || profile.logo_url) ? (
                  <img 
                    src={editForm.logo_url || profile.logo_url || ''} 
                    alt={profile.full_name || 'Company'} 
                    className="h-full w-full rounded-full object-cover" 
                  />
                ) : (
                  <Building2 className={`h-6 w-6 lg:h-8 lg:w-8 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor="logo-upload" 
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                  } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                >
                  {uploadingLogo ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /><span>ატვირთვა...</span></>
                  ) : (
                    <><Upload className="h-3 w-3" /><span>{profile.logo_url ? 'შეცვლა' : 'ატვირთვა'}</span></>
                  )}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <p className={`mt-1 text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                  JPEG, PNG, WebP, SVG (მაქს. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Basic Info Section */}
        <div className="p-4">
          <SectionHeader title="ძირითადი ინფორმაცია" section="basic" icon={Building2} />
          {expandedSections.basic && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}><Building2 className="h-3 w-3" />კომპანიის სახელი</label>
                  {(editing || editingSection === 'basic') ? (
                    <input
                      type="text"
                      value={editingSection === 'basic' ? (tempSectionData.full_name ?? editForm.full_name) : editForm.full_name}
                      onChange={(e) => editingSection === 'basic' 
                        ? setTempSectionData({ ...tempSectionData, full_name: e.target.value }) 
                        : setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Georgian Group"
                      className={inputClass}
                    />
                  ) : (
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      {profile.full_name || '—'}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>კომპანიის მიმოხილვა</label>
                {(editing || editingSection === 'basic') ? (
                  <textarea
                    value={editingSection === 'basic' ? (tempSectionData.company_overview ?? editForm.company_overview) : editForm.company_overview}
                    onChange={(e) => {
                      if (editingSection === 'basic') {
                        setTempSectionData({ ...tempSectionData, company_overview: e.target.value })
                      } else {
                        handleTextareaChange('company_overview', e.target.value, e)
                      }
                    }}
                    placeholder="კომპანიის სრული აღწერა..."
                    rows={3}
                    className={textareaClass}
                  />
                ) : (
                  <p className={valueClass}>{profile.company_overview || '—'}</p>
                )}
              </div>
              <SectionActions section="basic" fields={['full_name', 'company_overview']} />
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="p-4">
          <SectionHeader title="მოკლე აღწერა" section="summary" />
          {expandedSections.summary && (
            <div className="mt-3">
              <label className={labelClass}>საჯარო პროფილზე გამოჩნდება</label>
              {(editing || editingSection === 'summary') ? (
                <textarea
                  value={editingSection === 'summary' ? (tempSectionData.summary ?? editForm.summary) : editForm.summary}
                  onChange={(e) => {
                    if (editingSection === 'summary') {
                      setTempSectionData({ ...tempSectionData, summary: e.target.value })
                    } else {
                      handleTextareaChange('summary', e.target.value, e)
                    }
                  }}
                  placeholder="მოკლე შესავალი..."
                  rows={2}
                  className={textareaClass}
                />
              ) : (
                <p className={valueClass}>{profile.summary || '—'}</p>
              )}
              <SectionActions section="summary" fields={['summary']} />
            </div>
          )}
        </div>

        {/* Mission Section */}
        <div className="p-4">
          <SectionHeader title="მისია" section="mission" />
          {expandedSections.mission && (
            <div className="mt-3">
              <label className={labelClass}>რატომ არსებობს თქვენი კომპანია</label>
              {(editing || editingSection === 'mission') ? (
                <textarea
                  value={editingSection === 'mission' ? (tempSectionData.mission_statement ?? editForm.mission_statement) : editForm.mission_statement}
                  onChange={(e) => {
                    if (editingSection === 'mission') {
                      setTempSectionData({ ...tempSectionData, mission_statement: e.target.value })
                    } else {
                      handleTextareaChange('mission_statement', e.target.value, e)
                    }
                  }}
                  placeholder="კომპანიის მისია..."
                  rows={2}
                  className={textareaClass}
                />
              ) : (
                <p className={valueClass}>{profile.mission_statement || '—'}</p>
              )}
              <SectionActions section="mission" fields={['mission_statement']} />
            </div>
          )}
        </div>

        {/* Vision Section */}
        <div className="p-4">
          <SectionHeader title="ხედვა / ღირებულებები" section="vision" />
          {expandedSections.vision && (
            <div className="mt-3">
              <label className={labelClass}>რა მომავალს ქმნით</label>
              {(editing || editingSection === 'vision') ? (
                <textarea
                  value={editingSection === 'vision' ? (tempSectionData.vision_values ?? editForm.vision_values) : editForm.vision_values}
                  onChange={(e) => {
                    if (editingSection === 'vision') {
                      setTempSectionData({ ...tempSectionData, vision_values: e.target.value })
                    } else {
                      handleTextareaChange('vision_values', e.target.value, e)
                    }
                  }}
                  placeholder="კომპანიის ხედვა..."
                  rows={2}
                  className={textareaClass}
                />
              ) : (
                <p className={valueClass}>{profile.vision_values || '—'}</p>
              )}
              <SectionActions section="vision" fields={['vision_values']} />
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="p-4">
          <SectionHeader title="ისტორია" section="history" />
          {expandedSections.history && (
            <div className="mt-3">
              <label className={labelClass}>დაფუძნების ისტორია</label>
              {(editing || editingSection === 'history') ? (
                <textarea
                  value={editingSection === 'history' ? (tempSectionData.history ?? editForm.history) : editForm.history}
                  onChange={(e) => {
                    if (editingSection === 'history') {
                      setTempSectionData({ ...tempSectionData, history: e.target.value })
                    } else {
                      handleTextareaChange('history', e.target.value, e)
                    }
                  }}
                  placeholder="კომპანიის ისტორია..."
                  rows={2}
                  className={textareaClass}
                />
              ) : (
                <p className={valueClass}>{profile.history || '—'}</p>
              )}
              <SectionActions section="history" fields={['history']} />
            </div>
          )}
        </div>

        {/* How We Work Section */}
        <div className="p-4">
          <SectionHeader title="როგორ ვმუშაობთ" section="work" />
          {expandedSections.work && (
            <div className="mt-3">
              <label className={labelClass}>სამუშაო პროცესი</label>
              {(editing || editingSection === 'work') ? (
                <textarea
                  value={editingSection === 'work' ? (tempSectionData.how_we_work ?? editForm.how_we_work) : editForm.how_we_work}
                  onChange={(e) => {
                    if (editingSection === 'work') {
                      setTempSectionData({ ...tempSectionData, how_we_work: e.target.value })
                    } else {
                      handleTextareaChange('how_we_work', e.target.value, e)
                    }
                  }}
                  placeholder="როგორ მუშაობს კომპანია..."
                  rows={2}
                  className={textareaClass}
                />
              ) : (
                <p className={valueClass}>{profile.how_we_work || '—'}</p>
              )}
              <SectionActions section="work" fields={['how_we_work']} />
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="p-4">
          <SectionHeader title="საკონტაქტო ინფორმაცია" section="contact" icon={Phone} />
          {expandedSections.contact && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}><Globe className="h-3 w-3" />ვებსაიტი</label>
                  {(editing || editingSection === 'contact') ? (
                    <input 
                      type="url" 
                      value={editingSection === 'contact' ? (tempSectionData.website ?? editForm.website) : editForm.website}
                      onChange={(e) => editingSection === 'contact' 
                        ? setTempSectionData({ ...tempSectionData, website: e.target.value }) 
                        : setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://example.com" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.website || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><Mail className="h-3 w-3" />ელ.ფოსტა</label>
                  {(editing || editingSection === 'contact') ? (
                    <input 
                      type="email" 
                      value={editingSection === 'contact' ? (tempSectionData.email ?? editForm.email) : editForm.email}
                      onChange={(e) => editingSection === 'contact' 
                        ? setTempSectionData({ ...tempSectionData, email: e.target.value }) 
                        : setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="contact@company.com" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.email || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><Phone className="h-3 w-3" />ტელეფონი</label>
                  {(editing || editingSection === 'contact') ? (
                    <input 
                      type="tel" 
                      value={editingSection === 'contact' ? (tempSectionData.phone_number ?? editForm.phone_number) : editForm.phone_number}
                      onChange={(e) => editingSection === 'contact' 
                        ? setTempSectionData({ ...tempSectionData, phone_number: e.target.value }) 
                        : setEditForm({ ...editForm, phone_number: e.target.value })}
                      placeholder="+995 551 911 951" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>
                      {profile.phone_number ? (
                        <a href={`tel:${profile.phone_number}`} className="text-blue-500 hover:underline">
                          {profile.phone_number}
                        </a>
                      ) : '—'}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><MapPin className="h-3 w-3" />მისამართი</label>
                  {(editing || editingSection === 'contact') ? (
                    <input 
                      type="text" 
                      value={editingSection === 'contact' ? (tempSectionData.address ?? editForm.address) : editForm.address}
                      onChange={(e) => editingSection === 'contact' 
                        ? setTempSectionData({ ...tempSectionData, address: e.target.value }) 
                        : setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="თბილისი, აღმაშენებლის ქ." 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.address || '—'}</p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}><MapPin className="h-3 w-3" />რუკაზე მდებარეობა</label>
                {(editing || editingSection === 'contact') ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
                        isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      რუკაზე მონიშვნა
                    </button>
                    {editForm.map_link && <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>✓ შენახულია</span>}
                  </div>
                ) : (
                  profile.map_link ? (
                    <a href={profile.map_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                      <MapPin className="h-3 w-3" />ნახვა რუკაზე
                    </a>
                  ) : <p className={valueClass}>—</p>
                )}
              </div>
              {editingSection === 'contact' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleSaveSection('contact', ['website', 'email', 'phone_number', 'address', 'map_link'])}
                    disabled={saving}
                    className="rounded px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    {saving ? 'შენახვა...' : 'შენახვა'}
                  </button>
                  <button
                    onClick={handleCancelSection}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                      isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                    }`}
                  >
                    გაუქმება
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cities Section */}
        <div className="p-4">
          <SectionHeader title="ქალაქები" section="cities" canEdit={false} icon={MapPin} />
          {expandedSections.cities && (
            <div className="mt-3">
              <label className={labelClass}>სადაც კომპანია მუშაობს</label>
              <button
                onClick={() => setShowCityPicker(true)}
                className={`mb-2 flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                <MapPin className="h-3 w-3" />
                {selectedCities.length > 0 ? 'რედაქტირება' : 'აირჩიეთ'}
              </button>
              {selectedCities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCities.map((city) => (
                    <span
                      key={city.id}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${
                        isDark
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      {city.name_ka}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>არ არის არჩეული</p>
              )}
            </div>
          )}
        </div>

        {/* Specializations Section */}
        <div className="p-4">
          <SectionHeader title="სპეციალიზაციები" section="specializations" canEdit={false} icon={Building2} />
          {expandedSections.specializations && (
            <div className="mt-3">
              <label className={labelClass}>სამართლის დარგები</label>
              <SpecializationPicker
                selectedSpecializationIds={selectedSpecializationIds}
                onSave={handleSaveSpecializations}
              />
            </div>
          )}
        </div>

        {/* Social Links Section */}
        <div className="p-4">
          <SectionHeader title="სოციალური ბმულები" section="social" icon={Globe} />
          {expandedSections.social && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}><Facebook className="h-3 w-3" />Facebook</label>
                  {(editing || editingSection === 'social') ? (
                    <input 
                      type="url" 
                      value={editingSection === 'social' ? (tempSectionData.facebook_link ?? editForm.facebook_link) : editForm.facebook_link}
                      onChange={(e) => editingSection === 'social' 
                        ? setTempSectionData({ ...tempSectionData, facebook_link: e.target.value }) 
                        : setEditForm({ ...editForm, facebook_link: e.target.value })}
                      placeholder="https://facebook.com/company" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.facebook_link || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><Instagram className="h-3 w-3" />Instagram</label>
                  {(editing || editingSection === 'social') ? (
                    <input 
                      type="url" 
                      value={editingSection === 'social' ? (tempSectionData.instagram_link ?? editForm.instagram_link) : editForm.instagram_link}
                      onChange={(e) => editingSection === 'social' 
                        ? setTempSectionData({ ...tempSectionData, instagram_link: e.target.value }) 
                        : setEditForm({ ...editForm, instagram_link: e.target.value })}
                      placeholder="https://instagram.com/company" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.instagram_link || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><Linkedin className="h-3 w-3" />LinkedIn</label>
                  {(editing || editingSection === 'social') ? (
                    <input 
                      type="url" 
                      value={editingSection === 'social' ? (tempSectionData.linkedin_link ?? editForm.linkedin_link) : editForm.linkedin_link}
                      onChange={(e) => editingSection === 'social' 
                        ? setTempSectionData({ ...tempSectionData, linkedin_link: e.target.value }) 
                        : setEditForm({ ...editForm, linkedin_link: e.target.value })}
                      placeholder="https://linkedin.com/company" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.linkedin_link || '—'}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}><Twitter className="h-3 w-3" />Twitter</label>
                  {(editing || editingSection === 'social') ? (
                    <input 
                      type="url" 
                      value={editingSection === 'social' ? (tempSectionData.twitter_link ?? editForm.twitter_link) : editForm.twitter_link}
                      onChange={(e) => editingSection === 'social' 
                        ? setTempSectionData({ ...tempSectionData, twitter_link: e.target.value }) 
                        : setEditForm({ ...editForm, twitter_link: e.target.value })}
                      placeholder="https://twitter.com/company" 
                      className={inputClass} 
                    />
                  ) : (
                    <p className={valueClass}>{profile.twitter_link || '—'}</p>
                  )}
                </div>
              </div>
              <SectionActions section="social" fields={['facebook_link', 'instagram_link', 'linkedin_link', 'twitter_link']} />
            </div>
          )}
        </div>

        {/* Full Edit Mode Save/Cancel */}
        {editing && (
          <div className="p-4 flex gap-2">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded px-4 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-50"
            >
              {saving ? <><Loader2 className="h-3 w-3 animate-spin" />შენახვა...</> : <><Save className="h-3 w-3" />შენახვა</>}
            </button>
            <button 
              onClick={handleCancel} 
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded px-4 py-2 text-xs font-medium transition-all ${
                isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              <X className="h-3 w-3" />გაუქმება
            </button>
          </div>
        )}
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-lg p-4 ${isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-black/10'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                რუკაზე მდებარეობის მონიშვნა
              </h3>
              <button onClick={() => setShowMapPicker(false)} className={`rounded p-1 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
                <X className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
              </button>
            </div>
            <div className="h-[300px] sm:h-[400px] w-full rounded overflow-hidden border border-white/10">
              <MapPicker onLocationSelect={handleLocationSelect} initialPosition={markerPosition || undefined} isDark={isDark} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveMapLocation}
                className="flex-1 rounded px-3 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5"
              >
                <Save className="h-3 w-3" />შენახვა
              </button>
              <button
                onClick={() => setShowMapPicker(false)}
                className={`flex-1 rounded px-3 py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                <X className="h-3 w-3" />გაუქმება
              </button>
            </div>
            <p className={`mt-2 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              დააჭირეთ რუკაზე მდებარეობის მონიშვნისთვის
            </p>
          </div>
        </div>
      )}

      {/* City Picker Modal */}
      {showCityPicker && (
        <CityPicker onClose={() => setShowCityPicker(false)} onSave={handleSaveCities} selectedCityIds={selectedCityIds} />
      )}

      {/* Logo Preview Modal */}
      {showLogoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowLogoPreview(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLogoPreview(false)}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-black/50 p-1.5 text-white transition-all hover:bg-black/70 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={editForm.logo_url || profile.logo_url || ''}
              alt={profile.full_name || 'Company Logo'}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
