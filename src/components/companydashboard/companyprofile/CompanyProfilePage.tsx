'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2, Mail, Phone, Globe, MapPin, Edit, Save, X, Loader2,
  Upload, Facebook, Instagram, Linkedin, Twitter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

// Dynamically import map component to avoid SSR issues
const MapPicker = dynamic<{
  onLocationSelect: (lat: number, lng: number) => void
  initialPosition?: { lat: number; lng: number }
  isDark?: boolean
}>(() => import('@/components/companydashboard/companyprofile/MapPicker'), { ssr: false })

// Dynamically import city picker component
const CityPicker = dynamic(() => import('@/components/companydashboard/companyprofile/CityPicker'), { ssr: false })

// Dynamically import specialization picker component
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
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone_number: '', company_overview: '',
    summary: '', mission_statement: '', vision_values: '', history: '',
    how_we_work: '', website: '', address: '', map_link: '',
    facebook_link: '', instagram_link: '', linkedin_link: '', twitter_link: '', logo_url: ''
  })
  const [tempSectionData, setTempSectionData] = useState<Record<string, string>>({})

  const supabase = createClient()

  // Handle map location selection
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

  // Auto-resize textarea
  const handleTextareaChange = (field: string, value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [field]: value })
    const textarea = event.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      alert('გთხოვთ ატვირთოთ მხოლოდ სურათი (JPEG, PNG, WebP, SVG)')
      return
    }

    // Validate file size (5MB max)
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

      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

      // Delete old logo if exists
      if (profile.logo_url) {
        const oldPath = profile.logo_url.split('/').slice(-2).join('/')
        await supabase.storage.from('company-logos').remove([oldPath])
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
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
        .from('company-logos')
        .getPublicUrl(fileName)

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) {
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      // Update local state
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
        console.log('Fetched profile data:', data)
        console.log('Phone number from DB:', data.phone_number)
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

      // Fetch company cities
      await fetchCompanyCities(user.id)
      
      // Fetch company specializations
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

      // Delete all existing cities for this company
      await supabase
        .from('company_cities')
        .delete()
        .eq('company_id', user.id)

      // Insert new cities
      if (cityIds.length > 0) {
        const insertData = cityIds.map(cityId => ({
          company_id: user.id,
          city_id: cityId
        }))

        const { error } = await supabase
          .from('company_cities')
          .insert(insertData)

        if (error) {
          console.error('Error saving cities:', error)
          alert('ქალაქების შენახვისას მოხდა შეცდომა')
          return
        }
      }

      // Refresh cities list
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

      // Delete all existing specializations for this company
      await supabase
        .from('company_specializations')
        .delete()
        .eq('company_id', user.id)

      // Insert new specializations
      if (specializationIds.length > 0) {
        const insertData = specializationIds.map(specializationId => ({
          company_id: user.id,
          specialization_id: specializationId
        }))

        const { error } = await supabase
          .from('company_specializations')
          .insert(insertData)

        if (error) {
          console.error('Error saving specializations:', error)
          alert('სპეციალიზაციების შენახვისას მოხდა შეცდომა')
          return
        }
      }

      // Refresh specializations list
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} /></div>
  if (!profile) return <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}><p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>პროფილი ვერ მოიძებნა</p></div>

  return (
    <div className="pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div><h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Company Profile</h1><p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>კომპანიის პროფილის მართვა</p></div>
        {!editing && <button onClick={handleEdit} className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}><Edit className="h-4 w-4" />რედაქტირება</button>}
      </div>

      <div className={`rounded-xl border p-8 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <div className="mb-8 pb-8 border-b border-white/10">
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Company Logo</h2>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => (editForm.logo_url || profile.logo_url) && setShowLogoPreview(true)}
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                isDark ? 'bg-white/10' : 'bg-black/10'
              } ${(editForm.logo_url || profile.logo_url) ? 'cursor-pointer hover:ring-2 hover:ring-white/20 transition-all' : ''}`}
            >
              {(editForm.logo_url || profile.logo_url) ? (
                <img 
                  src={editForm.logo_url || profile.logo_url || ''} 
                  alt={profile.full_name || 'Company'} 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <Building2 className={`h-12 w-12 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              )}
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                <label 
                  htmlFor="logo-upload" 
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDark 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>ატვირთვა...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>{profile.logo_url ? 'ლოგოს შეცვლა' : 'ლოგოს ატვირთვა'}</span>
                    </>
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
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  მხარდაჭერილი ფორმატები: JPEG, PNG, WebP, SVG (მაქს. 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>ძირითადი ინფორმაცია</h2>
            {!editing && editingSection !== 'basic' && (
              <button
                onClick={() => handleEditSection('basic')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Building2 className="h-4 w-4" />კომპანიის სახელი *
              </label>
              {(editing || editingSection === 'basic') ? (
                <input
                  type="text"
                  value={editingSection === 'basic' ? (tempSectionData.full_name !== undefined ? tempSectionData.full_name : editForm.full_name) : editForm.full_name}
                  onChange={(e) => editingSection === 'basic' ? setTempSectionData({ ...tempSectionData, full_name: e.target.value }) : setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Georgian Group"
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
                />
              ) : (
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  {profile.full_name || 'N/A'}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Building2 className="h-4 w-4" />კომპანიის მიმოხილვა (ქართული ენაზე)
              </label>
              {(editing || editingSection === 'basic') ? (
                <textarea
                  value={editingSection === 'basic' ? (tempSectionData.company_overview !== undefined ? tempSectionData.company_overview : editForm.company_overview) : editForm.company_overview}
                  onChange={(e) => {
                    const value = e.target.value
                    if (editingSection === 'basic') {
                      setTempSectionData({ ...tempSectionData, company_overview: value })
                    } else {
                      handleTextareaChange('company_overview', value, e)
                    }
                  }}
                  placeholder="Share the full story of the company..."
                  rows={4}
                  className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.company_overview || 'N/A'}
                </p>
              )}
            </div>
          </div>
          {editingSection === 'basic' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('basic', ['full_name', 'company_overview'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Summary</h2>
            {!editing && editingSection !== 'summary' && (
              <button
                onClick={() => handleEditSection('summary')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div>
            <label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Brief introduction shown on public profile
            </label>
            {(editing || editingSection === 'summary') ? (
              <textarea
                value={editingSection === 'summary' ? (tempSectionData.summary !== undefined ? tempSectionData.summary : editForm.summary) : editForm.summary}
                onChange={(e) => {
                  const value = e.target.value
                  if (editingSection === 'summary') {
                    setTempSectionData({ ...tempSectionData, summary: value })
                  } else {
                    handleTextareaChange('summary', value, e)
                  }
                }}
                placeholder="Brief introduction shown on public profile"
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
              />
            ) : (
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {profile.summary || 'N/A'}
              </p>
            )}
          </div>
          {editingSection === 'summary' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('summary', ['summary'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Mission Statement</h2>
            {!editing && editingSection !== 'mission' && (
              <button
                onClick={() => handleEditSection('mission')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div>
            <label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Why your company exists and the impact you aim to make
            </label>
            {(editing || editingSection === 'mission') ? (
              <textarea
                value={editingSection === 'mission' ? (tempSectionData.mission_statement !== undefined ? tempSectionData.mission_statement : editForm.mission_statement) : editForm.mission_statement}
                onChange={(e) => {
                  const value = e.target.value
                  if (editingSection === 'mission') {
                    setTempSectionData({ ...tempSectionData, mission_statement: value })
                  } else {
                    handleTextareaChange('mission_statement', value, e)
                  }
                }}
                placeholder="Why your company exists and the impact you aim to make"
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
              />
            ) : (
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {profile.mission_statement || 'N/A'}
              </p>
            )}
          </div>
          {editingSection === 'mission' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('mission', ['mission_statement'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Vision / Values</h2>
            {!editing && editingSection !== 'vision' && (
              <button
                onClick={() => handleEditSection('vision')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div>
            <label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              What future you work toward and the values that guide you
            </label>
            {(editing || editingSection === 'vision') ? (
              <textarea
                value={editingSection === 'vision' ? (tempSectionData.vision_values !== undefined ? tempSectionData.vision_values : editForm.vision_values) : editForm.vision_values}
                onChange={(e) => {
                  const value = e.target.value
                  if (editingSection === 'vision') {
                    setTempSectionData({ ...tempSectionData, vision_values: value })
                  } else {
                    handleTextareaChange('vision_values', value, e)
                  }
                }}
                placeholder="What future you work toward and the values that guide you"
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
              />
            ) : (
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {profile.vision_values || 'N/A'}
              </p>
            )}
          </div>
          {editingSection === 'vision' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('vision', ['vision_values'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>History / Founding Story</h2>
            {!editing && editingSection !== 'history' && (
              <button
                onClick={() => handleEditSection('history')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div>
            <label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Share origin details, milestones, or founding story
            </label>
            {(editing || editingSection === 'history') ? (
              <textarea
                value={editingSection === 'history' ? (tempSectionData.history !== undefined ? tempSectionData.history : editForm.history) : editForm.history}
                onChange={(e) => {
                  const value = e.target.value
                  if (editingSection === 'history') {
                    setTempSectionData({ ...tempSectionData, history: value })
                  } else {
                    handleTextareaChange('history', value, e)
                  }
                }}
                placeholder="Share origin details, milestones, or founding story"
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
              />
            ) : (
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {profile.history || 'N/A'}
              </p>
            )}
          </div>
          {editingSection === 'history' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('history', ['history'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>How We Work</h2>
            {!editing && editingSection !== 'work' && (
              <button
                onClick={() => handleEditSection('work')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div>
            <label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Encourage visitors to reach out, ask questions, or request services
            </label>
            {(editing || editingSection === 'work') ? (
              <textarea
                value={editingSection === 'work' ? (tempSectionData.how_we_work !== undefined ? tempSectionData.how_we_work : editForm.how_we_work) : editForm.how_we_work}
                onChange={(e) => {
                  const value = e.target.value
                  if (editingSection === 'work') {
                    setTempSectionData({ ...tempSectionData, how_we_work: value })
                  } else {
                    handleTextareaChange('how_we_work', value, e)
                  }
                }}
                placeholder="Encourage visitors to reach out, ask questions, or request services"
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`}
              />
            ) : (
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {profile.how_we_work || 'N/A'}
              </p>
            )}
          </div>
          {editingSection === 'work' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('work', ['how_we_work'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Contact Information</h2>
            {!editing && editingSection !== 'contact' && (
              <button
                onClick={() => handleEditSection('contact')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Globe className="h-4 w-4" />Website
              </label>
              {(editing || editingSection === 'contact') ? (
                <input 
                  type="url" 
                  value={editingSection === 'contact' ? (tempSectionData.website !== undefined ? tempSectionData.website : editForm.website) : editForm.website}
                  onChange={(e) => editingSection === 'contact' ? setTempSectionData({ ...tempSectionData, website: e.target.value }) : setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://example.com" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.website || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Mail className="h-4 w-4" />Email
              </label>
              {(editing || editingSection === 'contact') ? (
                <input 
                  type="email" 
                  value={editingSection === 'contact' ? (tempSectionData.email !== undefined ? tempSectionData.email : editForm.email) : editForm.email}
                  onChange={(e) => editingSection === 'contact' ? setTempSectionData({ ...tempSectionData, email: e.target.value }) : setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="contact@company.com" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.email || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Phone className="h-4 w-4" />Phone Number
              </label>
              {(editing || editingSection === 'contact') ? (
                <input 
                  type="tel" 
                  value={editingSection === 'contact' ? (tempSectionData.phone_number !== undefined ? tempSectionData.phone_number : editForm.phone_number) : editForm.phone_number}
                  onChange={(e) => editingSection === 'contact' ? setTempSectionData({ ...tempSectionData, phone_number: e.target.value }) : setEditForm({ ...editForm, phone_number: e.target.value })}
                  placeholder="+995 551 911 951" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {(profile.phone_number && profile.phone_number.trim()) ? (
                    <a 
                      href={`tel:${profile.phone_number}`} 
                      className="hover:underline text-blue-500"
                    >
                      {profile.phone_number}
                    </a>
                  ) : 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <MapPin className="h-4 w-4" />Address
              </label>
              {(editing || editingSection === 'contact') ? (
                <input 
                  type="text" 
                  value={editingSection === 'contact' ? (tempSectionData.address !== undefined ? tempSectionData.address : editForm.address) : editForm.address}
                  onChange={(e) => editingSection === 'contact' ? setTempSectionData({ ...tempSectionData, address: e.target.value }) : setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Georgia, Tbilisi, Agmashenebeli str." 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.address || 'N/A'}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <MapPin className="h-4 w-4" />Map Link
              </label>
              {(editing || editingSection === 'contact') ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:scale-[1.02] ${isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-black/10 bg-black/5 text-black hover:bg-black/10'}`}
                  >
                    <MapPin className="h-4 w-4" />
                    მონიშნეთ მისამართი რუკაზე
                  </button>
                  {editForm.map_link && (
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      ✅ მდებარეობა შენახულია
                    </p>
                  )}
                </div>
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.map_link ? (
                    <a 
                      href={profile.map_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-500 flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      ნახეთ რუკაზე
                    </a>
                  ) : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>ქალაქები</h2>
          </div>
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <MapPin className="h-4 w-4" />ქალაქები სადაც თქვენი კომპანია მუშაობს
            </label>
            
            {/* City Selection Button */}
            <button
              onClick={() => setShowCityPicker(true)}
              className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:scale-[1.02] ${
                isDark 
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' 
                  : 'border-black/10 bg-black/5 text-black hover:bg-black/10'
              }`}
            >
              <MapPin className="h-4 w-4" />
              {selectedCities.length > 0 ? 'ქალაქების რედაქტირება' : 'აირჩიეთ ქალაქები'}
            </button>

            {/* Selected Cities Display */}
            {selectedCities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCities.map((city) => (
                  <div
                    key={city.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                      isDark
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm font-medium">{city.name_ka}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                ქალაქები არ არის არჩეული
              </p>
            )}
          </div>
        </div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>სპეციალიზაციები</h2>
          </div>
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Building2 className="h-4 w-4" />აირჩიეთ სამართლის დარგები რომლითაც თქვენი კომპანია მუშაობს
            </label>
            
            {/* Specialization Picker */}
            <SpecializationPicker
              selectedSpecializationIds={selectedSpecializationIds}
              onSave={handleSaveSpecializations}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Social Links</h2>
            {!editing && editingSection !== 'social' && (
              <button
                onClick={() => handleEditSection('social')}
                className={`rounded-lg p-2 transition-all hover:scale-110 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              </button>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Facebook className="h-4 w-4" />Facebook
              </label>
              {(editing || editingSection === 'social') ? (
                <input 
                  type="url" 
                  value={editingSection === 'social' ? (tempSectionData.facebook_link !== undefined ? tempSectionData.facebook_link : editForm.facebook_link) : editForm.facebook_link}
                  onChange={(e) => editingSection === 'social' ? setTempSectionData({ ...tempSectionData, facebook_link: e.target.value }) : setEditForm({ ...editForm, facebook_link: e.target.value })}
                  placeholder="https://facebook.com/your-company" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.facebook_link || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Instagram className="h-4 w-4" />Instagram
              </label>
              {(editing || editingSection === 'social') ? (
                <input 
                  type="url" 
                  value={editingSection === 'social' ? (tempSectionData.instagram_link !== undefined ? tempSectionData.instagram_link : editForm.instagram_link) : editForm.instagram_link}
                  onChange={(e) => editingSection === 'social' ? setTempSectionData({ ...tempSectionData, instagram_link: e.target.value }) : setEditForm({ ...editForm, instagram_link: e.target.value })}
                  placeholder="https://instagram.com/your-company" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.instagram_link || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Linkedin className="h-4 w-4" />LinkedIn
              </label>
              {(editing || editingSection === 'social') ? (
                <input 
                  type="url" 
                  value={editingSection === 'social' ? (tempSectionData.linkedin_link !== undefined ? tempSectionData.linkedin_link : editForm.linkedin_link) : editForm.linkedin_link}
                  onChange={(e) => editingSection === 'social' ? setTempSectionData({ ...tempSectionData, linkedin_link: e.target.value }) : setEditForm({ ...editForm, linkedin_link: e.target.value })}
                  placeholder="https://linkedin.com/company/your-company" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.linkedin_link || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Twitter className="h-4 w-4" />Twitter
              </label>
              {(editing || editingSection === 'social') ? (
                <input 
                  type="url" 
                  value={editingSection === 'social' ? (tempSectionData.twitter_link !== undefined ? tempSectionData.twitter_link : editForm.twitter_link) : editForm.twitter_link}
                  onChange={(e) => editingSection === 'social' ? setTempSectionData({ ...tempSectionData, twitter_link: e.target.value }) : setEditForm({ ...editForm, twitter_link: e.target.value })}
                  placeholder="https://twitter.com/your-company" 
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} 
                />
              ) : (
                <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {profile.twitter_link || 'N/A'}
                </p>
              )}
            </div>
          </div>
          {editingSection === 'social' && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleSaveSection('social', ['facebook_link', 'instagram_link', 'linkedin_link', 'twitter_link'])}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? 'შენახვა...' : 'შენახვა'}
              </button>
              <button
                onClick={handleCancelSection}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
              >
                გაუქმება
              </button>
            </div>
          )}
        </div>

        {editing && <div className="mt-8 flex gap-4 border-t pt-6 border-white/10"><button onClick={handleSave} disabled={saving} className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 ${isDark ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>{saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />შენახვა...</span> : <span className="flex items-center justify-center gap-2"><Save className="h-4 w-4" />Update Company</span>}</button><button onClick={handleCancel} className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}><span className="flex items-center justify-center gap-2"><X className="h-4 w-4" />გაუქმება</span></button></div>}
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-4xl rounded-2xl p-6 ${isDark ? 'bg-black border border-white/10' : 'bg-white border border-black/10'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                მონიშნეთ თქვენი მისამართი რუკაზე
              </h3>
              <button
                onClick={() => setShowMapPicker(false)}
                className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              >
                <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
              </button>
            </div>
            
            <div className="h-[500px] w-full rounded-xl overflow-hidden border border-white/10">
              <MapPicker 
                onLocationSelect={handleLocationSelect}
                initialPosition={markerPosition || undefined}
                isDark={isDark}
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSaveMapLocation}
                className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white transition-all hover:scale-[1.02] ${isDark ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  შენახვა
                </span>
              </button>
              <button
                onClick={() => setShowMapPicker(false)}
                className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-[1.02] ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  გაუქმება
                </span>
              </button>
            </div>

            <p className={`mt-3 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              💡 დააჭირეთ რუკაზე რომ მონიშნოთ მდებარეობა. პინს შეგიძლიათ გადაიტანოთ სასურველ ადგილას.
            </p>
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

      {/* Logo Preview Modal */}
      {showLogoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowLogoPreview(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowLogoPreview(false)}
              className="absolute -top-4 -right-4 z-10 rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 hover:scale-110"
            >
              <X className="h-6 w-6" strokeWidth={2} />
            </button>
            <img
              src={editForm.logo_url || profile.logo_url || ''}
              alt={profile.full_name || 'Company Logo'}
              className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
