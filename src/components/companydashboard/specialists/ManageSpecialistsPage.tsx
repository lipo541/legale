'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  User,
  Loader2,
  Ban,
  Lock,
  Unlock,
  X,
  Save,
  Upload,
  Mail,
  Building2,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Specialist, AVAILABLE_LANGUAGES } from './types'
import ServicesField from '@/components/common/ServicesField'

export default function ManageSpecialistsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)
  const [editingServicesId, setEditingServicesId] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role_title: '',
    phone_number: '',
    bio: '',
    philosophy: '',
    languages: [] as string[],
    focus_areas_text: '',
    representative_matters_text: '',
    teaching_writing_speaking: '',
    credentials_memberships_text: '',
    values_how_we_work: {} as Record<string, string>
  })

  const supabase = createClient()

  const fetchSpecialists = useCallback(async () => {
    setLoading(true)
    try {
      // Get current user's company ID
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 Current User:', user?.id)
      
      if (!user) {
        console.log('❌ No user found')
        return
      }

      // Fetch specialists with all fields
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, email, full_name, role, role_title, phone_number, avatar_url,
          bio, philosophy, languages, focus_areas, representative_matters,
          teaching_writing_speaking, credentials_memberships, values_how_we_work,
          verification_status, company_id, company_slug, is_blocked, blocked_by,
          blocked_at, block_reason, created_at, updated_at,
          company:company_id(full_name)
        `)
        .eq('company_id', user.id)
        .eq('role', 'SPECIALIST')
        .order('created_at', { ascending: false })

      console.log('📊 Query Results:', { 
        data, 
        error, 
        count: data?.length || 0,
        specialists: data?.map(s => ({
          id: s.id,
          name: s.full_name,
          email: s.email,
          company_id: s.company_id,
          role: s.role
        }))
      })

      if (error) {
        console.error('❌ Error fetching specialists:', error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const specialistsWithCompany = (data || []).map((specialist: any) => ({
          ...specialist,
          company_name: specialist.company?.full_name || null
        }))
        console.log('✅ Setting specialists:', specialistsWithCompany.length, 'specialists')
        setSpecialists(specialistsWithCompany)
      }
    } catch (error) {
      console.error('❌ Unexpected Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSpecialists()
  }, [fetchSpecialists])

  const handleViewDetails = (specialist: Specialist) => {
    if (expandedId === specialist.id) {
      setExpandedId(null)
    } else {
      setExpandedId(specialist.id)
      setEditingSpecialist(null)
    }
  }

  const handleEdit = (specialist: Specialist) => {
    setEditingSpecialist(specialist)
    setEditForm({
      full_name: specialist.full_name || '',
      email: specialist.email || '',
      role_title: specialist.role_title || '',
      phone_number: specialist.phone_number || '',
      bio: specialist.bio || '',
      philosophy: specialist.philosophy || '',
      languages: specialist.languages || [],
      focus_areas_text: specialist.focus_areas?.join('\n') || '',
      representative_matters_text: specialist.representative_matters?.join('\n') || '',
      teaching_writing_speaking: specialist.teaching_writing_speaking || '',
      credentials_memberships_text: specialist.credentials_memberships?.join('\n') || '',
      values_how_we_work: specialist.values_how_we_work || {}
    })
  }

  const handleSaveEdit = async () => {
    if (!editingSpecialist) return

    setUpdatingId(editingSpecialist.id)
    try {
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        role_title: editForm.role_title,
        phone_number: editForm.phone_number,
        bio: editForm.bio,
        philosophy: editForm.philosophy,
        languages: editForm.languages,
        focus_areas: editForm.focus_areas_text ? editForm.focus_areas_text.split('\n').filter(item => item.trim()) : [],
        representative_matters: editForm.representative_matters_text ? editForm.representative_matters_text.split('\n').filter(item => item.trim()) : [],
        teaching_writing_speaking: editForm.teaching_writing_speaking,
        credentials_memberships: editForm.credentials_memberships_text ? editForm.credentials_memberships_text.split('\n').filter(item => item.trim()) : [],
        values_how_we_work: editForm.values_how_we_work,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingSpecialist.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchSpecialists()
        setEditingSpecialist(null)
        setExpandedId(null)
        alert('სპეციალისტი წარმატებით განახლდა! ✅')
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('შეცდომა შენახვისას')
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePhotoUpload = async (specialistId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const specialist = specialists.find(s => s.id === specialistId)
    if (!specialist) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('გთხოვთ ატვირთოთ მხოლოდ JPEG, PNG ან WebP ფორმატის სურათი')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    setUploadingPhotoId(specialistId)
    try {
      console.log('📸 Starting photo upload for specialist:', specialistId)
      console.log('📁 File:', file.name, 'Type:', file.type, 'Size:', file.size)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${specialistId}/photo-${Date.now()}.${fileExt}`
      
      console.log('📂 Upload path:', fileName)

      // Delete old photo if exists
      if (specialist.avatar_url) {
        const oldPath = specialist.avatar_url.split('/').slice(-2).join('/')
        console.log('🗑️ Deleting old photo:', oldPath)
        await supabase.storage.from('specialist-photos').remove([oldPath])
      }

      // Upload new photo
      console.log('⬆️ Uploading to specialist-photos bucket...')
      const { error: uploadError } = await supabase.storage
        .from('specialist-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        alert('ატვირთვისას მოხდა შეცდომა: ' + uploadError.message)
        return
      }

      // Get public URL
      console.log('🔗 Getting public URL...')
      const { data: { publicUrl } } = supabase.storage
        .from('specialist-photos')
        .getPublicUrl(fileName)

      console.log('✅ Public URL:', publicUrl)

      // Update database
      console.log('💾 Updating database...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', specialistId)

      if (updateError) {
        console.error('❌ Database update error:', updateError)
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      console.log('✅ Photo uploaded successfully!')
      await fetchSpecialists()
      alert('ფოტო წარმატებით აიტვირთა! ✅')
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('ფოტოს ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploadingPhotoId(null)
      event.target.value = ''
    }
  }

  const toggleLanguage = (language: string) => {
    const currentLanguages = editForm.languages
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(lang => lang !== language)
      : [...currentLanguages, language]
    
    setEditForm({ ...editForm, languages: newLanguages })
  }

  const addValueField = () => {
    const newKey = `New Field ${Object.keys(editForm.values_how_we_work).length + 1}`
    setEditForm({
      ...editForm,
      values_how_we_work: { ...editForm.values_how_we_work, [newKey]: '' }
    })
  }

  const removeValueField = (key: string) => {
    const updated = { ...editForm.values_how_we_work }
    delete updated[key]
    setEditForm({ ...editForm, values_how_we_work: updated })
  }

  const updateValueFieldKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    Object.entries(editForm.values_how_we_work).forEach(([k, v]) => {
      updated[k === oldKey ? newKey : k] = v
    })
    setEditForm({ ...editForm, values_how_we_work: updated })
  }

  const updateValueFieldValue = (key: string, value: string) => {
    setEditForm({
      ...editForm,
      values_how_we_work: { ...editForm.values_how_we_work, [key]: value }
    })
  }

  const handleToggleBlock = async (specialist: Specialist) => {
    // Check if specialist was blocked by SUPER_ADMIN
    if (specialist.is_blocked && specialist.blocked_by) {
      const { data: blockerData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', specialist.blocked_by)
        .single()

      if (blockerData?.role === 'SUPER_ADMIN') {
        alert('⛔️ ამ სპეციალისტის განბლოკვა შეუძლებელია!\n\nმიზეზი: სპეციალისტი დაბლოკილია სუპერადმინის მიერ.\nმხოლოდ სუპერადმინს შეუძლია განბლოკვა.')
        return
      }
    }

    const action = specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ${action}?`)) {
      return
    }

    setBlockingId(specialist.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updateData = specialist.is_blocked
        ? {
            is_blocked: false,
            blocked_by: null,
            blocked_at: null,
            block_reason: null,
            updated_at: new Date().toISOString()
          }
        : {
            is_blocked: true,
            blocked_by: user.id,
            blocked_at: new Date().toISOString(),
            block_reason: 'დაბლოკილია კომპანიის მიერ',
            updated_at: new Date().toISOString()
          }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', specialist.id)

      if (error) {
        console.error('Block/Unblock error:', error)
        alert(`შეცდომა ${action}ისას`)
      } else {
        await fetchSpecialists()
        alert(`სპეციალისტი წარმატებით ${specialist.is_blocked ? 'განბლოკილია' : 'დაბლოკილია'}!`)
      }
    } catch (err) {
      console.error('Block/Unblock error:', err)
      alert(`შეცდომა ${action}ისას`)
    } finally {
      setBlockingId(null)
    }
  }

  const handleDelete = async (specialist: Specialist) => {
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} წაშლა? ეს მოქმედება შეუქცევადია!`)) {
      return
    }

    setDeletingId(specialist.id)
    try {
      // First try direct delete (company has RLS policy for their specialists)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', specialist.id)

      if (error) {
        // If RLS fails, try via API route (for SUPER_ADMIN)
        const response = await fetch('/api/admin/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: specialist.id })
        })
        
        if (!response.ok) {
          const result = await response.json()
          console.error('Delete error:', result)
          alert('შეცდომა წაშლისას: ' + (result.error || result.message))
          return
        }
      }
      
      await fetchSpecialists()
      alert('სპეციალისტი წარმატებით წაშლილია!')
    } catch (err) {
      console.error('Delete error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredSpecialists = specialists.filter((specialist) => {
    const matchesSearch = 
      specialist.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.role_title?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] px-4 sm:px-6 lg:px-8">
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
            <User className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              სპეციალისტები
            </h1>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {specialists.length} სპეციალისტი
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className={`relative rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
      </div>

      {/* Specialists List */}
      {filteredSpecialists.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredSpecialists.map((specialist) => (
              <div 
                key={specialist.id}
                className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                      isDark ? 'bg-white/10' : 'bg-black/10'
                    }`}>
                      {specialist.avatar_url ? (
                        <img 
                          src={specialist.avatar_url} 
                          alt={specialist.full_name || 'Specialist'} 
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                          {specialist.full_name || 'N/A'}
                        </div>
                        {specialist.is_blocked && (
                          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                          }`}>
                            <Ban className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                        {specialist.role_title || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetails(specialist)}
                      className={`rounded p-1.5 transition-colors ${
                        expandedId === specialist.id
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-emerald-500/10 text-emerald-600'
                          : isDark 
                          ? 'hover:bg-white/10' 
                          : 'hover:bg-black/5'
                      }`}
                    >
                      <Eye className={`h-4 w-4 ${expandedId === specialist.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                    </button>
                    <button
                      onClick={() => handleToggleBlock(specialist)}
                      disabled={blockingId === specialist.id}
                      className={`rounded p-1.5 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    >
                      {blockingId === specialist.id ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      ) : specialist.is_blocked ? (
                        <Unlock className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      ) : (
                        <Lock className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(specialist)}
                      disabled={deletingId === specialist.id}
                      className={`rounded p-1.5 transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}
                    >
                      {deletingId === specialist.id ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                      ) : (
                        <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                      )}
                    </button>
                  </div>
                </div>
                <div className={`mt-2 pt-2 border-t text-xs ${isDark ? 'border-white/10 text-white/50' : 'border-black/10 text-black/50'}`}>
                  {specialist.email || '—'}
                </div>
                
                {/* Mobile Expanded Details */}
                {expandedId === specialist.id && (
                  <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                      {editingSpecialist?.id === specialist.id ? (
                        // EDIT MODE - Mobile
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                              რედაქტირება
                            </h3>
                            <button
                              onClick={() => setEditingSpecialist(null)}
                              className={`rounded p-1 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                            >
                              <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                            </button>
                          </div>
                          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                            სრული რედაქტირებისთვის გამოიყენეთ დესკტოპ ვერსია
                          </p>
                        </div>
                      ) : (
                        // VIEW MODE - Mobile
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                              დეტალები
                            </h3>
                            <button
                              onClick={() => handleEdit(specialist)}
                              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                                isDark
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              }`}
                            >
                              <Edit className="h-3 w-3" />
                              რედაქტირება
                            </button>
                          </div>
                          
                          <div className="grid gap-2">
                            <div>
                              <label className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>ტელეფონი</label>
                              <p className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>{specialist.phone_number || '—'}</p>
                            </div>
                            <div>
                              <label className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>რეგისტრაცია</label>
                              <p className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>{new Date(specialist.created_at).toLocaleDateString('ka-GE')}</p>
                            </div>
                            {specialist.bio && (
                              <div>
                                <label className={`text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>ბიოგრაფია</label>
                                <p className={`text-xs line-clamp-3 ${isDark ? 'text-white/80' : 'text-black/80'}`}>{specialist.bio}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className={`hidden sm:block overflow-hidden rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  სპეციალისტი
                </th>
                <th className={`px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  პოზიცია
                </th>
                <th className={`px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide hidden md:table-cell ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  ელფოსტა
                </th>
                <th className={`px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide hidden lg:table-cell ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  რეგისტრაცია
                </th>
                <th className={`px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-black' : 'bg-white'}>
              {filteredSpecialists.map((specialist) => (
                <Fragment key={specialist.id}>
                  <tr 
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/5'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                          isDark ? 'bg-white/10' : 'bg-black/10'
                        }`}>
                          {specialist.avatar_url ? (
                            <img 
                              src={specialist.avatar_url} 
                              alt={specialist.full_name || 'Specialist'} 
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                              {specialist.full_name || 'N/A'}
                            </div>
                            {specialist.is_blocked && (
                              <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                              }`}>
                                <Ban className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {specialist.role_title || '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs hidden md:table-cell ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {specialist.email || '—'}
                    </td>
                    <td className={`px-3 py-2.5 text-xs hidden lg:table-cell ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(specialist.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(specialist)}
                          className={`rounded p-1.5 transition-colors ${
                            expandedId === specialist.id
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალები"
                        >
                          <Eye className={`h-3.5 w-3.5 ${expandedId === specialist.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(specialist)}
                          disabled={blockingId === specialist.id}
                          className={`rounded p-1.5 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                          title={specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
                        >
                          {blockingId === specialist.id ? (
                            <Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                          ) : specialist.is_blocked ? (
                            <Unlock className={`h-3.5 w-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                          ) : (
                            <Lock className={`h-3.5 w-3.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(specialist)}
                          disabled={deletingId === specialist.id}
                          className={`rounded p-1.5 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === specialist.id ? (
                            <Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-3.5 w-3.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedId === specialist.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={5} className="px-3 py-4">
                        <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          {editingSpecialist?.id === specialist.id ? (
                            // EDIT MODE
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                  რედაქტირება
                                </h3>
                                <button
                                  onClick={() => setEditingSpecialist(null)}
                                  className={`rounded p-1 transition-colors ${
                                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                                  }`}
                                >
                                  <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                </button>
                              </div>

                              {/* Photo Upload */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  ფოტო
                                </label>
                                <div className="flex items-center gap-3">
                                  {specialist.avatar_url && (
                                    <div className={`relative h-12 w-12 overflow-hidden rounded-full border ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                                      <img 
                                        src={specialist.avatar_url} 
                                        alt={specialist.full_name || 'Profile'} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <label 
                                    htmlFor={`photo-upload-${specialist.id}`}
                                    className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                                      uploadingPhotoId === specialist.id ? 'opacity-50 cursor-not-allowed' : ''
                                    } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                                  >
                                    {uploadingPhotoId === specialist.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        ატვირთვა...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-3 w-3" />
                                        {specialist.avatar_url ? 'შეცვლა' : 'ატვირთვა'}
                                      </>
                                    )}
                                  </label>
                                  <input 
                                    id={`photo-upload-${specialist.id}`}
                                    type="file" 
                                    accept="image/jpeg,image/png,image/webp" 
                                    onChange={(e) => handlePhotoUpload(specialist.id, e)}
                                    disabled={uploadingPhotoId === specialist.id}
                                    className="hidden" 
                                  />
                                </div>
                              </div>

                              {/* Basic Info */}
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    სახელი *
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className={`w-full rounded border px-3 py-2 text-sm transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ელფოსტა *
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className={`w-full rounded border px-3 py-2 text-sm transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    პოზიცია
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.role_title}
                                    onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                                    className={`w-full rounded border px-3 py-2 text-sm transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ტელეფონი
                                  </label>
                                  <input
                                    type="tel"
                                    value={editForm.phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                    className={`w-full rounded border px-3 py-2 text-sm transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Languages */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  ენები
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {AVAILABLE_LANGUAGES.map((lang) => {
                                    const isSelected = editForm.languages.includes(lang)
                                    return (
                                      <button
                                        key={lang}
                                        type="button"
                                        onClick={() => toggleLanguage(lang)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
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
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  ბიოგრაფია
                                </label>
                                <textarea
                                  value={editForm.bio}
                                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                  rows={3}
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                  }`}
                                />
                              </div>

                              {/* Philosophy */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  ფილოსოფია
                                </label>
                                <textarea
                                  value={editForm.philosophy}
                                  onChange={(e) => setEditForm({ ...editForm, philosophy: e.target.value })}
                                  rows={2}
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                  }`}
                                />
                              </div>

                              {/* Focus Areas */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  სფეროები (თითო ხაზზე)
                                </label>
                                <textarea
                                  value={editForm.focus_areas_text}
                                  onChange={(e) => setEditForm({ ...editForm, focus_areas_text: e.target.value })}
                                  rows={2}
                                  placeholder="კორპორაციული სამართალი"
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20 placeholder:text-white/30'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20 placeholder:text-black/30'
                                  }`}
                                />
                              </div>

                              {/* Representative Matters */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  საქმეები (თითო ხაზზე)
                                </label>
                                <textarea
                                  value={editForm.representative_matters_text}
                                  onChange={(e) => setEditForm({ ...editForm, representative_matters_text: e.target.value })}
                                  rows={2}
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                  }`}
                                />
                              </div>

                              {/* Teaching, Writing & Speaking */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  სწავლება, წერა, გამოსვლები
                                </label>
                                <textarea
                                  value={editForm.teaching_writing_speaking}
                                  onChange={(e) => setEditForm({ ...editForm, teaching_writing_speaking: e.target.value })}
                                  rows={2}
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                  }`}
                                />
                              </div>

                              {/* Credentials & Memberships */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  სერტიფიკატები (თითო ხაზზე)
                                </label>
                                <textarea
                                  value={editForm.credentials_memberships_text}
                                  onChange={(e) => setEditForm({ ...editForm, credentials_memberships_text: e.target.value })}
                                  rows={2}
                                  className={`w-full rounded border px-3 py-2 text-sm transition-colors resize-none ${
                                    isDark
                                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                      : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                  }`}
                                />
                              </div>

                              {/* Values & How We Work */}
                              <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  ღირებულებები და მუშაობის სტილი
                                </label>
                                <div className="space-y-2">
                                  {Object.entries(editForm.values_how_we_work).map(([key, val], index) => (
                                    <div key={index} className={`flex gap-2 items-start p-2 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                      <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          value={key}
                                          onChange={(e) => updateValueFieldKey(key, e.target.value)}
                                          placeholder="ველი"
                                          className={`rounded border px-2 py-1.5 text-xs transition-colors font-medium ${
                                            isDark
                                              ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20'
                                              : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                                          }`}
                                        />
                                        <input
                                          type="text"
                                          value={val}
                                          onChange={(e) => updateValueFieldValue(key, e.target.value)}
                                          placeholder="მნიშვნელობა"
                                          className={`rounded border px-2 py-1.5 text-xs transition-colors ${
                                            isDark
                                              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                              : 'border-black/10 bg-white text-black focus:border-black/20'
                                          }`}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeValueField(key)}
                                        className={`p-1.5 rounded transition-all hover:scale-110 ${
                                          isDark
                                            ? 'text-red-400 hover:bg-red-500/20'
                                            : 'text-red-600 hover:bg-red-500/10'
                                        }`}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={addValueField}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-all hover:scale-[1.02] ${
                                      isDark
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-black/10 text-black hover:bg-black/20'
                                    }`}
                                  >
                                    <span className="text-sm">+</span>
                                    ველის დამატება
                                  </button>
                                </div>
                              </div>

                              {/* Services/Specializations */}
                              <div className={`border-t pt-4 mt-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                      სერვისები და სპეციალიზაციები
                                    </h3>
                                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      აირჩიეთ სერვისები
                                    </p>
                                  </div>
                                  {editingServicesId !== specialist.id && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingServicesId(specialist.id)}
                                      className={`text-xs font-medium px-2 py-1.5 rounded transition-all hover:scale-[1.02] ${
                                        isDark
                                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                                          : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
                                      }`}
                                    >
                                      რედაქტირება
                                    </button>
                                  )}
                                </div>
                                
                                <ServicesField
                                  profileId={specialist.id}
                                  isDark={isDark}
                                  isEditing={editingServicesId === specialist.id}
                                  onSave={() => setEditingServicesId(null)}
                                  onCancel={() => setEditingServicesId(null)}
                                  showActions={true}
                                />
                              </div>

                              {/* Save/Cancel Buttons */}
                              <div className="flex gap-2 pt-3">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={updatingId === specialist.id}
                                  className={`flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isDark
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  }`}
                                >
                                  {updatingId === specialist.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      შენახვა...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-3.5 w-3.5" />
                                      შენახვა
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingSpecialist(null)}
                                  disabled={updatingId === specialist.id}
                                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 ${
                                    isDark
                                      ? 'bg-white/10 text-white hover:bg-white/20'
                                      : 'bg-black/10 text-black hover:bg-black/20'
                                  }`}
                                >
                                  გაუქმება
                                </button>
                              </div>
                            </div>
                          ) : (
                            // VIEW MODE
                            <div className="space-y-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                  სპეციალისტის დეტალები
                                </h3>
                                <button
                                  onClick={() => handleEdit(specialist)}
                                  className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-colors ${
                                    isDark
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                      : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  რედაქტირება
                                </button>
                              </div>

                              {/* Basic Info Grid */}
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    <Mail className="h-3.5 w-3.5" />
                                    ელფოსტა
                                  </label>
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.email || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-1 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ტელეფონი
                                  </label>
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.phone_number || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    <Shield className="h-3.5 w-3.5" />
                                    როლი
                                  </label>
                                  <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                                    isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                  }`}>
                                    <User className="h-3 w-3" />
                                    კომპანიის სპეციალისტი
                                  </span>
                                </div>

                                <div>
                                  <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    <Building2 className="h-3.5 w-3.5" />
                                    კომპანია
                                  </label>
                                  <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {specialist.company_name || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                {/* Verification Status */}
                                <div>
                                  <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    ვერიფიკაციის სტატუსი
                                  </label>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {specialist.verification_status === 'verified' ? (
                                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        დადასტურებული
                                      </span>
                                    ) : specialist.verification_status === 'pending' ? (
                                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                        <Clock className="h-3.5 w-3.5" />
                                        განხილვაში
                                      </span>
                                    ) : specialist.verification_status === 'rejected' ? (
                                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
                                        <XCircle className="h-3.5 w-3.5" />
                                        უარყოფილი
                                      </span>
                                    ) : (
                                      <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'}`}>
                                        არ არის მოთხოვნილი
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Verification Notes */}
                                  {specialist.verification_notes && (
                                    <div className={`mt-2 p-2 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                      <p className={`text-[10px] font-medium mb-0.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                        ადმინის შენიშვნები:
                                      </p>
                                      <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {specialist.verification_notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Verification Reviewed At */}
                                  {specialist.verification_reviewed_at && (
                                    <p className={`mt-1.5 text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      განხილულია: {new Date(specialist.verification_reviewed_at).toLocaleString('ka-GE')}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    <Calendar className="h-3.5 w-3.5" />
                                    რეგისტრაცია
                                  </label>
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(specialist.created_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-1 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ბოლო განახლება
                                  </label>
                                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(specialist.updated_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>
                              </div>

                              {/* Languages */}
                              {specialist.languages && specialist.languages.length > 0 && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ენები
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {specialist.languages.map((lang) => (
                                      <span 
                                        key={lang} 
                                        className={`px-2 py-1 rounded text-xs font-medium ${
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
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ბიოგრაფია
                                  </label>
                                  <p className={`whitespace-pre-wrap text-xs leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.bio}
                                  </p>
                                </div>
                              )}

                              {/* Philosophy */}
                              {specialist.philosophy && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ფილოსოფია
                                  </label>
                                  <p className={`whitespace-pre-wrap text-xs leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.philosophy}
                                  </p>
                                </div>
                              )}

                              {/* Focus Areas */}
                              {specialist.focus_areas && specialist.focus_areas.length > 0 && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    სპეციალიზაციის სფეროები
                                  </label>
                                  <ul className={`list-disc list-inside space-y-0.5 text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.focus_areas.map((area, idx) => (
                                      <li key={idx}>{area}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Representative Matters */}
                              {specialist.representative_matters && specialist.representative_matters.length > 0 && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    წარმომადგენლობითი საქმეები
                                  </label>
                                  <ul className={`list-disc list-inside space-y-0.5 text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.representative_matters.map((matter, idx) => (
                                      <li key={idx}>{matter}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Teaching, Writing & Speaking */}
                              {specialist.teaching_writing_speaking && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    სწავლება, წერა და გამოსვლები
                                  </label>
                                  <p className={`whitespace-pre-wrap text-xs leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.teaching_writing_speaking}
                                  </p>
                                </div>
                              )}

                              {/* Credentials & Memberships */}
                              {specialist.credentials_memberships && specialist.credentials_memberships.length > 0 && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    სერტიფიკატები და წევრობა
                                  </label>
                                  <ul className={`list-disc list-inside space-y-0.5 text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.credentials_memberships.map((cred, idx) => (
                                      <li key={idx}>{cred}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Values & How We Work */}
                              {specialist.values_how_we_work && Object.keys(specialist.values_how_we_work).length > 0 && (
                                <div>
                                  <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                    ღირებულებები და მუშაობის სტილი
                                  </label>
                                  <div className="space-y-2">
                                    {Object.entries(specialist.values_how_we_work).map(([key, val]) => (
                                      <div key={key} className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <p className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                          {key}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                          {val}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Services/Specializations - VIEW MODE */}
                              <div className={`border-t pt-4 mt-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                <label className={`mb-2 block text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                  სერვისები და სპეციალიზაციები
                                </label>
                                <ServicesField
                                  profileId={specialist.id}
                                  isDark={isDark}
                                  showActions={true}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          </div>
        </>
      ) : (
        <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <User className={`mx-auto h-12 w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`mt-3 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'სპეციალისტები ვერ მოიძებნა' : 'ჯერ არ გაქვთ დამატებული სპეციალისტები'}
          </p>
        </div>
      )}
    </div>
  )
}
