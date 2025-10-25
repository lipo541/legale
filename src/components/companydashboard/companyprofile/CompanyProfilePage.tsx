'use client'

import { useState, useEffect } from 'react'
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [profile, setProfile] = useState<CompanyProfileData | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone_number: '', company_overview: '',
    summary: '', mission_statement: '', vision_values: '', history: '',
    how_we_work: '', website: '', address: '', map_link: '',
    facebook_link: '', instagram_link: '', linkedin_link: '', twitter_link: '', logo_url: ''
  })

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
      const { data, error: uploadError } = await supabase.storage
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

  const fetchProfile = async () => {
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
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleEdit = () => setEditing(true)
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
    } catch (err) {
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
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              {(editForm.logo_url || profile.logo_url) ? <img src={editForm.logo_url || profile.logo_url || ''} alt={profile.full_name || 'Company'} className="h-full w-full rounded-full object-cover" /> : <Building2 className={`h-12 w-12 ${isDark ? 'text-white/60' : 'text-black/60'}`} />}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <label htmlFor="logo-upload" className={`flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-3 font-semibold transition-all duration-300 cursor-pointer hover:scale-[1.02] ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'border-white/20 bg-white/5 text-white hover:bg-white/10' : 'border-black/20 bg-black/5 text-black hover:bg-black/10'}`}>
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>ატვირთვა...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
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
              ) : (
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {profile.logo_url || 'ლოგო არ არის ატვირთული'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>ძირითადი ინფორმაცია</h2><div className="grid gap-6 md:grid-cols-2"><div><label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}><Building2 className="h-4 w-4" />კომპანიის სახელი *</label>{editing ? <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Georgian Group" className={`w-full rounded-lg border px-4 py-3 transition-colors ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{profile.full_name || 'N/A'}</p>}</div><div className="md:col-span-2"><label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}><Building2 className="h-4 w-4" />კომპანიის მიმოხილვა (ქართული ენაზე)</label>{editing ? <textarea value={editForm.company_overview} onChange={(e) => handleTextareaChange('company_overview', e.target.value, e)} placeholder="Share the full story of the company..." rows={4} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.company_overview || 'N/A'}</p>}</div></div></div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Summary</h2><div><label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Brief introduction shown on public profile</label>{editing ? <textarea value={editForm.summary} onChange={(e) => handleTextareaChange('summary', e.target.value, e)} placeholder="Brief introduction shown on public profile" rows={3} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.summary || 'N/A'}</p>}</div></div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Mission Statement</h2><div><label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Why your company exists and the impact you aim to make</label>{editing ? <textarea value={editForm.mission_statement} onChange={(e) => handleTextareaChange('mission_statement', e.target.value, e)} placeholder="Why your company exists and the impact you aim to make" rows={3} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.mission_statement || 'N/A'}</p>}</div></div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Vision / Values</h2><div><label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>What future you work toward and the values that guide you</label>{editing ? <textarea value={editForm.vision_values} onChange={(e) => handleTextareaChange('vision_values', e.target.value, e)} placeholder="What future you work toward and the values that guide you" rows={3} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.vision_values || 'N/A'}</p>}</div></div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>History / Founding Story</h2><div><label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Share origin details, milestones, or founding story</label>{editing ? <textarea value={editForm.history} onChange={(e) => handleTextareaChange('history', e.target.value, e)} placeholder="Share origin details, milestones, or founding story" rows={3} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.history || 'N/A'}</p>}</div></div>

        <div className="mb-8 pb-8 border-b border-white/10"><h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>How We Work</h2><div><label className={`mb-3 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Encourage visitors to reach out, ask questions, or request services</label>{editing ? <textarea value={editForm.how_we_work} onChange={(e) => handleTextareaChange('how_we_work', e.target.value, e)} placeholder="Encourage visitors to reach out, ask questions, or request services" rows={3} className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none overflow-hidden ${isDark ? 'border-white/10 bg-white/5 text-white focus:border-white/20' : 'border-black/10 bg-black/5 text-black focus:border-black/20'}`} /> : <p className={`text-base ${isDark ? 'text-white/80' : 'text-black/80'}`}>{profile.how_we_work || 'N/A'}</p>}</div></div>

        <div className="mb-8 pb-8 border-b border-white/10">
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Contact Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Globe className="h-4 w-4" />Website
              </label>
              {editing ? (
                <input 
                  type="url" 
                  value={editForm.website} 
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} 
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
              {editing ? (
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
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
              {editing ? (
                <input 
                  type="tel" 
                  value={editForm.phone_number} 
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} 
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
              {editing ? (
                <input 
                  type="text" 
                  value={editForm.address} 
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} 
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
              {editing ? (
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

        <div>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Social Links</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                <Facebook className="h-4 w-4" />Facebook
              </label>
              {editing ? (
                <input 
                  type="url" 
                  value={editForm.facebook_link} 
                  onChange={(e) => setEditForm({ ...editForm, facebook_link: e.target.value })} 
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
              {editing ? (
                <input 
                  type="url" 
                  value={editForm.instagram_link} 
                  onChange={(e) => setEditForm({ ...editForm, instagram_link: e.target.value })} 
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
              {editing ? (
                <input 
                  type="url" 
                  value={editForm.linkedin_link} 
                  onChange={(e) => setEditForm({ ...editForm, linkedin_link: e.target.value })} 
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
              {editing ? (
                <input 
                  type="url" 
                  value={editForm.twitter_link} 
                  onChange={(e) => setEditForm({ ...editForm, twitter_link: e.target.value })} 
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
    </div>
  )
}
