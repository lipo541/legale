'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CompanyProfileData {
  id: string
  email: string | null
  full_name: string | null
  company_slug: string | null
  phone_number: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function CompanyProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<CompanyProfileData | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    company_slug: ''
  })

  const supabase = createClient()

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
        setEditForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          company_slug: data.company_slug || ''
        })
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        company_slug: profile.company_slug || ''
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone_number: editForm.phone_number,
          company_slug: editForm.company_slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchProfile()
        setEditing(false)
        alert('პროფილი წარმატებით განახლდა!')
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
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
        <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          პროფილი ვერ მოიძებნა
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Company Profile
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            კომპანიის პროფილის მართვა
          </p>
        </div>
        {!editing && (
          <button
            onClick={handleEdit}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            <Edit className="h-4 w-4" />
            რედაქტირება
          </button>
        )}
      </div>

      <div className={`rounded-xl border p-8 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Company Logo */}
          <div className="md:col-span-2">
            <label className={`mb-3 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              კომპანიის ლოგო
            </label>
            <div className="flex items-center gap-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'Company'} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <Building2 className={`h-12 w-12 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                )}
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {profile.avatar_url || 'ლოგო არ არის ატვირთული'}
                </p>
                {editing && (
                  <button className={`mt-2 text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ლოგოს ატვირთვა
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Building2 className="h-4 w-4" />
              კომპანიის სახელი
            </label>
            {editing ? (
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            ) : (
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {profile.full_name || 'N/A'}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Mail className="h-4 w-4" />
              ელფოსტა
            </label>
            {editing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            ) : (
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {profile.email || 'N/A'}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Phone className="h-4 w-4" />
              ტელეფონი
            </label>
            {editing ? (
              <input
                type="tel"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                    : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                }`}
              />
            ) : (
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                {profile.phone_number || 'N/A'}
              </p>
            )}
          </div>

          {/* Company Slug */}
          <div>
            <label className={`mb-3 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Globe className="h-4 w-4" />
              URL Slug
            </label>
            {editing ? (
              <div>
                <input
                  type="text"
                  value={editForm.company_slug}
                  onChange={(e) => setEditForm({ ...editForm, company_slug: e.target.value })}
                  placeholder="my-company"
                  className={`w-full rounded-lg border px-4 py-3 transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                  }`}
                />
                <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  URL: /practices/{editForm.company_slug || 'slug'}
                </p>
              </div>
            ) : (
              <div>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  {profile.company_slug || 'N/A'}
                </p>
                {profile.company_slug && (
                  <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    URL: /practices/{profile.company_slug}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="mt-8 flex gap-4 border-t pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  შენახვა...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  შენახვა
                </span>
              )}
            </button>
            <button
              onClick={handleCancel}
              className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <X className="h-4 w-4" />
                გაუქმება
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
