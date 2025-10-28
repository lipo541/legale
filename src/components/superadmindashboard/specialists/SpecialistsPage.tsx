'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  User,
  Calendar,
  Loader2,
  Shield,
  X,
  ExternalLink,
  Building2,
  Upload,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  Languages
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ServicesField from '@/components/common/ServicesField'
import SpecialistTranslations from './translations/SpecialistTranslations'

const AVAILABLE_LANGUAGES = ['English', 'Georgian', 'Russian', 'German']

interface SpecialistProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'SPECIALIST'
  role_title: string | null
  phone_number: string | null
  slug: string | null
  avatar_url: string | null
  bio: string | null
  philosophy: string | null
  languages: string[] | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  verification_status: string | null
  verification_notes: string | null
  verification_reviewed_at: string | null
  company_id: string | null
  company_slug: string | null
  company_name?: string | null
  company_is_blocked?: boolean
  is_blocked: boolean | null
  blocked_by: string | null
  blocked_at: string | null
  block_reason: string | null
  created_at: string
  updated_at: string
}

export default function SpecialistsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [specialists, setSpecialists] = useState<SpecialistProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingSpecialist, setEditingSpecialist] = useState<SpecialistProfile | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role_title: '',
    phone_number: '',
    slug: '',
    bio: '',
    philosophy: '',
    languages: [] as string[],
    focus_areas_text: '',
    representative_matters_text: '',
    teaching_writing_speaking: '',
    credentials_memberships_text: '',
    values_how_we_work: {} as Record<string, string>
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [changingVerificationId, setChangingVerificationId] = useState<string | null>(null)
  const [changingCompanyId, setChangingCompanyId] = useState<string | null>(null)
  const [convertingToSoloId, setConvertingToSoloId] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [companies, setCompanies] = useState<Array<{ id: string; full_name: string; company_slug: string }>>([])
  const [showTranslations, setShowTranslations] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSpecialists = useCallback(async () => {
    setLoading(true)
    
    try {
      const { data, error} = await supabase
        .from('profiles')
        .select(`
          id, email, full_name, role, role_title, phone_number, slug, avatar_url, 
          bio, philosophy, languages, focus_areas, representative_matters, 
          teaching_writing_speaking, credentials_memberships, values_how_we_work, 
          verification_status, company_id, company_slug, is_blocked, blocked_by, 
          blocked_at, block_reason, created_at, updated_at,
          company:company_id(full_name, is_blocked)
        `)
        .eq('role', 'SPECIALIST')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching specialists:', error)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const specialistsWithCompany = (data || []).map((specialist: any) => ({
          ...specialist,
          company_name: specialist.company?.full_name || null,
          company_is_blocked: specialist.company?.is_blocked || false
        }))
        setSpecialists(specialistsWithCompany)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_slug')
        .eq('role', 'COMPANY')
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Error fetching companies:', error)
      } else {
        setCompanies(data || [])
      }
    } catch (err) {
      console.error('Fetch companies error:', err)
    }
  }, [supabase])

  useEffect(() => {
    fetchSpecialists()
    fetchCompanies()
  }, [fetchSpecialists, fetchCompanies])

  const handleViewDetails = (specialist: SpecialistProfile) => {
    if (expandedId === specialist.id) {
      setExpandedId(null)
    } else {
      setExpandedId(specialist.id)
      setEditingSpecialist(null)
      setShowTranslations(null)
    }
  }

  const handleEdit = (specialist: SpecialistProfile) => {
    setEditingSpecialist(specialist)
    setEditForm({
      full_name: specialist.full_name || '',
      email: specialist.email || '',
      role_title: specialist.role_title || '',
      phone_number: specialist.phone_number || '',
      slug: specialist.slug || '',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        full_name: editForm.full_name,
        email: editForm.email,
        updated_at: new Date().toISOString()
      }

      // Add specialist profile fields
      if (editingSpecialist.role === 'SPECIALIST') {
        updateData.role_title = editForm.role_title
        updateData.phone_number = editForm.phone_number
        updateData.slug = editForm.slug
        updateData.bio = editForm.bio
        updateData.philosophy = editForm.philosophy
        updateData.languages = editForm.languages
        updateData.focus_areas = editForm.focus_areas_text ? editForm.focus_areas_text.split('\n').filter(item => item.trim()) : []
        updateData.representative_matters = editForm.representative_matters_text ? editForm.representative_matters_text.split('\n').filter(item => item.trim()) : []
        updateData.teaching_writing_speaking = editForm.teaching_writing_speaking
        updateData.credentials_memberships = editForm.credentials_memberships_text ? editForm.credentials_memberships_text.split('\n').filter(item => item.trim()) : []
        updateData.values_how_we_work = editForm.values_how_we_work
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
        alert('სპეციალისტი წარმატებით განახლდა!')
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა განახლებისას')
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePhotoUpload = async (specialistId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      const specialist = specialists.find(s => s.id === specialistId)
      if (!specialist) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${specialistId}/photo-${Date.now()}.${fileExt}`

      // Delete old photo if exists
      if (specialist.avatar_url) {
        const oldPath = specialist.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('specialist-photos').remove([oldPath])
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('specialist-photos')
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
        .from('specialist-photos')
        .getPublicUrl(fileName)

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', specialistId)

      if (updateError) {
        alert('მონაცემთა ბაზის განახლება ვერ მოხერხდა: ' + updateError.message)
        return
      }

      await fetchSpecialists()
      alert('ფოტო წარმატებით აიტვირთა! ✅')
    } catch (error) {
      console.error('Photo upload error:', error)
      alert('ფოტოს ატვირთვისას მოხდა შეცდომა')
    } finally {
      setUploadingPhotoId(null)
      // Reset file input
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

  const handleToggleBlock = async (specialist: SpecialistProfile) => {
    const action = specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'
    
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის ${action}?`)) {
      return
    }

    setBlockingId(specialist.id)

    try {
      // Get current super admin ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('არ ხართ ავტორიზებული')
        return
      }

      const updateData = specialist.is_blocked
        ? {
            // Unblock - SUPER_ADMIN can unblock anyone
            is_blocked: false,
            blocked_by: null,
            blocked_at: null,
            block_reason: null,
            updated_at: new Date().toISOString()
          }
        : {
            // Block by SUPER_ADMIN
            is_blocked: true,
            blocked_by: user.id,
            blocked_at: new Date().toISOString(),
            block_reason: 'დაბლოკილია სუპერადმინის მიერ',
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

  const handleChangeVerificationStatus = async (specialist: SpecialistProfile, newStatus: 'verified' | 'unverified' | 'pending' | 'rejected') => {
    const statusLabels = {
      verified: 'დადასტურებული',
      unverified: 'არადასტურებული',
      pending: 'განხილვაში',
      rejected: 'უარყოფილი'
    }

    // Different confirmation messages based on transition
    let confirmMessage = ''
    if (newStatus === 'verified' && (specialist.verification_status === 'unverified' || specialist.verification_status === 'rejected' || !specialist.verification_status)) {
      confirmMessage = `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ს ვერიფიკაციის მინიჭება?`
    } else if (newStatus === 'verified' && specialist.verification_status === 'pending') {
      confirmMessage = `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის ვერიფიკაციის მოთხოვნის დადასტურება?`
    } else if (newStatus === 'rejected') {
      confirmMessage = `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის ვერიფიკაციის მოთხოვნის უარყოფა?`
    } else if (newStatus === 'unverified') {
      confirmMessage = `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის ვერიფიკაციის გაუქმება?`
    } else {
      confirmMessage = `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის ვერიფიკაციის სტატუსის შეცვლა "${statusLabels[newStatus]}"-ზე?`
    }

    if (!confirm(confirmMessage)) {
      return
    }

    setChangingVerificationId(specialist.id)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        verification_status: newStatus,
        updated_at: new Date().toISOString()
      }

      // თუ verified იქნება, დაამატე reviewed თარიღი
      if (newStatus === 'verified') {
        updateData.verification_reviewed_at = new Date().toISOString()
      }

      // თუ rejected იქნება, დაამატე reviewed თარიღი
      if (newStatus === 'rejected') {
        updateData.verification_reviewed_at = new Date().toISOString()
        const notes = prompt('მიუთითეთ უარყოფის მიზეზი (არასავალდებულო):')
        if (notes !== null) {
          updateData.verification_notes = notes
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', specialist.id)

      if (error) {
        console.error('Verification status change error:', error)
        alert('შეცდომა სტატუსის შეცვლისას')
      } else {
        await fetchSpecialists()
        
        // Different success messages based on action
        let successMessage = ''
        if (newStatus === 'verified' && (specialist.verification_status === 'unverified' || specialist.verification_status === 'rejected' || !specialist.verification_status)) {
          successMessage = 'ვერიფიკაცია წარმატებით მიენიჭა!'
        } else if (newStatus === 'verified' && specialist.verification_status === 'pending') {
          successMessage = 'ვერიფიკაციის მოთხოვნა დადასტურდა!'
        } else if (newStatus === 'rejected') {
          successMessage = 'ვერიფიკაციის მოთხოვნა უარყოფილია!'
        } else if (newStatus === 'unverified') {
          successMessage = 'ვერიფიკაცია გაუქმდა!'
        } else {
          successMessage = `ვერიფიკაციის სტატუსი შეიცვალა: ${statusLabels[newStatus]}!`
        }
        
        alert(successMessage)
      }
    } catch (err) {
      console.error('Verification status change error:', err)
      alert('შეცდომა სტატუსის შეცვლისას')
    } finally {
      setChangingVerificationId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ სპეციალისტის წაშლა?')) {
      return
    }

    setDeletingId(id)

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        alert('შეცდომა წაშლისას: ' + error.message)
      } else {
        await fetchSpecialists()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangeCompany = async (specialistId: string, newCompanyId: string) => {
    if (!newCompanyId) {
      alert('გთხოვთ აირჩიოთ კომპანია')
      return
    }

    const specialist = specialists.find(s => s.id === specialistId)
    const company = companies.find(c => c.id === newCompanyId)
    
    if (!specialist || !company) return

    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ს კომპანიის შეცვლა "${company.full_name}"-ზე?`)) {
      return
    }

    setChangingCompanyId(specialistId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_id: newCompanyId,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialistId)

      if (error) {
        console.error('Change company error:', error)
        alert('შეცდომა კომპანიის შეცვლისას: ' + error.message)
      } else {
        await fetchSpecialists()
        setSelectedCompanyId('')
        alert(`${specialist.full_name}-ის კომპანია წარმატებით შეიცვალა!`)
      }
    } catch (err) {
      console.error('Change company error:', err)
      alert('შეცდომა კომპანიის შეცვლისას')
    } finally {
      setChangingCompanyId(null)
    }
  }

  const handleConvertToSoloSpecialist = async (specialistId: string) => {
    const specialist = specialists.find(s => s.id === specialistId)
    
    if (!specialist) return

    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${specialist.full_name}-ის სოლო სპეციალისტად გადაყვანა? ეს მოხსნის კავშირს კომპანიასთან "${specialist.company_name}".`)) {
      return
    }

    setConvertingToSoloId(specialistId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'SOLO_SPECIALIST',
          company_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialistId)

      if (error) {
        console.error('Convert error:', error)
        alert('შეცდომა გადაყვანისას: ' + error.message)
      } else {
        await fetchSpecialists()
        alert(`${specialist.full_name} წარმატებით გადაიყვანა სოლო სპეციალისტად!`)
      }
    } catch (err) {
      console.error('Convert error:', err)
      alert('შეცდომა გადაყვანისას')
    } finally {
      setConvertingToSoloId(null)
    }
  }

  const filteredSpecialists = specialists.filter((specialist) => {
    const matchesSearch = 
      specialist.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            კომპანიის სპეციალისტები
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            კომპანიების სპეციალისტების მართვა
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className={`relative rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა სახელით, ელფოსტით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {!loading && filteredSpecialists.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სპეციალისტი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  როლი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ელფოსტა
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  რეგისტრაცია
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოქმედებები
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                          {specialist.avatar_url ? (
                            <img src={specialist.avatar_url} alt={specialist.full_name || 'Specialist'} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <User className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                              {specialist.full_name || 'N/A'}
                            </div>
                            {specialist.is_blocked && (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                              }`}>
                                <Ban className="h-3 w-3" />
                                დაბლოკილია
                              </span>
                            )}
                          </div>
                          {specialist.role_title && (
                            <div className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                              {specialist.role_title}
                            </div>
                          )}
                          {specialist.company_name && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                🏢 {specialist.company_name}
                              </span>
                              {specialist.company_is_blocked && (
                                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                  isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                }`}>
                                  <Ban className="h-2.5 w-2.5" />
                                  დაბლოკილი
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        specialist.verification_status === 'verified'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        <User className="h-3 w-3" />
                        სპეციალისტი
                        {specialist.verification_status === 'verified' && (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {specialist.email || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(specialist.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Translations Button */}
                        <button
                          onClick={() => {
                            if (showTranslations === specialist.id) {
                              setShowTranslations(null)
                            } else {
                              setShowTranslations(specialist.id)
                              setExpandedId(null)
                            }
                          }}
                          className={`rounded-lg p-2 transition-colors ${
                            showTranslations === specialist.id
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-blue-500/10 text-blue-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="თარგმანები"
                        >
                          <Languages className={`h-4 w-4 ${showTranslations === specialist.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>

                        {/* Change Company Button */}
                        <div className="relative group">
                          <button
                            onClick={() => {
                              if (changingCompanyId === specialist.id) {
                                setChangingCompanyId(null)
                                setSelectedCompanyId('')
                              } else {
                                setChangingCompanyId(specialist.id)
                                setSelectedCompanyId(specialist.company_id || '')
                              }
                            }}
                            disabled={!companies || companies.length === 0}
                            className={`rounded-lg p-2 transition-colors ${
                              changingCompanyId === specialist.id
                                ? isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                                : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            } ${(!companies || companies.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="კომპანიის შეცვლა"
                          >
                            <Building2 className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          </button>
                          
                          {/* Dropdown for company selection */}
                          {changingCompanyId === specialist.id && (
                            <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg border shadow-lg z-50 ${
                              isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
                            }`}>
                              <div className="p-3 space-y-3">
                                <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                  შეცვალეთ კომპანია:
                                </p>
                                <select
                                  value={selectedCompanyId}
                                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none ${
                                    isDark
                                      ? 'border-white/10 bg-black text-white focus:border-white/20'
                                      : 'border-black/10 bg-white text-black focus:border-black/20'
                                  }`}
                                >
                                  <option value="">აირჩიეთ კომპანია...</option>
                                  {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                      {company.full_name} ({company.company_slug || 'No slug'})
                                    </option>
                                  ))}
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleChangeCompany(specialist.id, selectedCompanyId)}
                                    disabled={!selectedCompanyId || selectedCompanyId === specialist.company_id}
                                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                      selectedCompanyId && selectedCompanyId !== specialist.company_id
                                        ? isDark
                                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                        : isDark
                                        ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                        : 'bg-black/5 text-black/40 cursor-not-allowed'
                                    }`}
                                  >
                                    შეცვლა
                                  </button>
                                  <button
                                    onClick={() => {
                                      setChangingCompanyId(null)
                                      setSelectedCompanyId('')
                                    }}
                                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
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
                          )}
                        </div>

                        {/* Convert to Solo Specialist Button */}
                        <button
                          onClick={() => handleConvertToSoloSpecialist(specialist.id)}
                          disabled={convertingToSoloId === specialist.id}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark
                              ? 'hover:bg-white/10'
                              : 'hover:bg-black/5'
                          }`}
                          title="სოლო სპეციალისტად გადაყვანა"
                        >
                          {convertingToSoloId === specialist.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                          ) : (
                            <User className={`h-4 w-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                          )}
                        </button>

                        <button
                          onClick={() => handleViewDetails(specialist)}
                          className={`rounded-lg p-2 transition-colors ${
                            expandedId === specialist.id
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალების ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${expandedId === specialist.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(specialist)}
                          disabled={blockingId === specialist.id}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark
                              ? 'hover:bg-white/10'
                              : 'hover:bg-black/5'
                          }`}
                          title={specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
                        >
                          {blockingId === specialist.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                          ) : (
                            <Ban className={`h-4 w-4 ${
                              specialist.is_blocked 
                                ? isDark ? 'text-red-400' : 'text-red-600'
                                : isDark ? 'text-orange-400' : 'text-orange-600'
                            }`} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(specialist.id)}
                          disabled={deletingId === specialist.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === specialist.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === specialist.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={5} className="px-6 py-6">
                        <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          {editingSpecialist?.id === specialist.id ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  სპეციალისტის რედაქტირება
                                </h3>
                                <button
                                  onClick={() => setEditingSpecialist(null)}
                                  className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                  <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                </button>
                              </div>

                              <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სახელი და გვარი
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ელფოსტა
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პროფილის ფოტო
                                  </label>
                                  <div className="flex items-center gap-4">
                                    {specialist.avatar_url && (
                                      <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                                        <img 
                                          src={specialist.avatar_url} 
                                          alt={specialist.full_name || 'Profile'} 
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <label 
                                      htmlFor={`photo-upload-${specialist.id}`}
                                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                                        uploadingPhotoId === specialist.id ? 'opacity-50 cursor-not-allowed' : ''
                                      } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                                    >
                                      {uploadingPhotoId === specialist.id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          ატვირთვა...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-4 w-4" />
                                          {specialist.avatar_url ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}
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
                                  <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                    JPEG, PNG ან WebP. მაქსიმუმ 5MB
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პოზიცია
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.role_title}
                                    onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ტელეფონი
                                  </label>
                                  <input
                                    type="tel"
                                    value={editForm.phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Slug
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.slug}
                                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 font-mono text-sm transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        ენები
                                      </label>
                                      <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_LANGUAGES.map((lang) => {
                                          const isSelected = editForm.languages.includes(lang)
                                          return (
                                            <button
                                              key={lang}
                                              type="button"
                                              onClick={() => toggleLanguage(lang)}
                                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        ბიოგრაფია
                                      </label>
                                      <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        rows={4}
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        ფილოსოფია
                                      </label>
                                      <textarea
                                        value={editForm.philosophy}
                                        onChange={(e) => setEditForm({ ...editForm, philosophy: e.target.value })}
                                        rows={4}
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        სერვისები
                                      </label>
                                      <ServicesField 
                                        profileId={specialist.id}
                                        isDark={isDark}
                                        isEditing={true}
                                        showActions={true}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Focus Areas (one per line)
                                      </label>
                                      <textarea
                                        value={editForm.focus_areas_text}
                                        onChange={(e) => setEditForm({ ...editForm, focus_areas_text: e.target.value })}
                                        rows={4}
                                        placeholder="Corporate Law&#10;Contract Negotiations"
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Representative Matters (one per line)
                                      </label>
                                      <textarea
                                        value={editForm.representative_matters_text}
                                        onChange={(e) => setEditForm({ ...editForm, representative_matters_text: e.target.value })}
                                        rows={4}
                                        placeholder="Represented major corporation..."
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Teaching, Writing & Speaking
                                      </label>
                                      <textarea
                                        value={editForm.teaching_writing_speaking}
                                        onChange={(e) => setEditForm({ ...editForm, teaching_writing_speaking: e.target.value })}
                                        rows={5}
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Credentials & Memberships (one per line)
                                      </label>
                                      <textarea
                                        value={editForm.credentials_memberships_text}
                                        onChange={(e) => setEditForm({ ...editForm, credentials_memberships_text: e.target.value })}
                                        rows={4}
                                        placeholder="Licensed Attorney, State Bar&#10;Member of ABA"
                                        className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
                                          isDark
                                            ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                            : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                        }`}
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Values & How We Work
                                      </label>
                                      <div className="space-y-3">
                                        {Object.entries(editForm.values_how_we_work).map(([key, val], index) => (
                                          <div key={index} className={`flex gap-2 items-start p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                              <input
                                                type="text"
                                                value={key}
                                                onChange={(e) => updateValueFieldKey(key, e.target.value)}
                                                placeholder="Field Name"
                                                className={`rounded-lg border px-3 py-2 text-sm transition-colors font-medium ${
                                                  isDark
                                                    ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20'
                                                    : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                                                }`}
                                              />
                                              <input
                                                type="text"
                                                value={val}
                                                onChange={(e) => updateValueFieldValue(key, e.target.value)}
                                                placeholder="Value"
                                                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                  isDark
                                                    ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                                    : 'border-black/10 bg-white text-black focus:border-black/20'
                                                }`}
                                              />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => removeValueField(key)}
                                              className={`p-2 rounded-lg transition-all hover:scale-110 ${
                                                isDark
                                                  ? 'text-red-400 hover:bg-red-500/20'
                                                  : 'text-red-600 hover:bg-red-500/10'
                                              }`}
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={addValueField}
                                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${
                                            isDark
                                              ? 'bg-white/10 text-white hover:bg-white/20'
                                              : 'bg-black/10 text-black hover:bg-black/20'
                                          }`}
                                        >
                                          <span className="text-lg">+</span>
                                          Add Field
                                        </button>
                                      </div>
                                    </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    User ID
                                  </label>
                                  <input
                                    type="text"
                                    value={specialist.id}
                                    readOnly
                                    className={`w-full rounded-lg border px-4 py-2 cursor-not-allowed ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white/40'
                                        : 'border-black/10 bg-black/5 text-black/40'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={updatingId === specialist.id}
                                  className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                                    isDark
                                      ? 'bg-emerald-500 hover:bg-emerald-600'
                                      : 'bg-emerald-500 hover:bg-emerald-600'
                                  }`}
                                >
                                  {updatingId === specialist.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      შენახვა...
                                    </span>
                                  ) : (
                                    'შენახვა'
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingSpecialist(null)}
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
                          ) : (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  სპეციალისტის დეტალები
                                </h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(specialist)}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                    }`}
                                  >
                                    <Edit className="h-4 w-4" />
                                    რედაქტირება
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სახელი და გვარი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.full_name || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Mail className="h-4 w-4" />
                                    ელფოსტა
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.email || 'N/A'}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პროფილის ფოტო
                                  </label>
                                  <div className="flex items-center gap-4">
                                    {specialist.avatar_url && (
                                      <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 ${isDark ? 'border-white/20' : 'border-black/20'}`}>
                                        <img 
                                          src={specialist.avatar_url} 
                                          alt={specialist.full_name || 'Profile'} 
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <label 
                                        htmlFor={`photo-view-upload-${specialist.id}`}
                                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:scale-[1.02] ${
                                          uploadingPhotoId === specialist.id ? 'opacity-50 cursor-not-allowed' : ''
                                        } ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}
                                      >
                                        {uploadingPhotoId === specialist.id ? (
                                          <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            ატვირთვა...
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-4 w-4" />
                                            {specialist.avatar_url ? 'ფოტოს შეცვლა' : 'ფოტოს ატვირთვა'}
                                          </>
                                        )}
                                      </label>
                                      <input 
                                        id={`photo-view-upload-${specialist.id}`}
                                        type="file" 
                                        accept="image/jpeg,image/png,image/webp" 
                                        onChange={(e) => handlePhotoUpload(specialist.id, e)}
                                        disabled={uploadingPhotoId === specialist.id}
                                        className="hidden" 
                                      />
                                      <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        JPEG, PNG ან WebP. მაქსიმუმ 5MB
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პოზიცია
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.role_title || 'არ არის მითითებული'}
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

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Slug
                                  </label>
                                  <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                    {specialist.slug || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ენები
                                  </label>
                                  {specialist.languages && specialist.languages.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {specialist.languages.map((lang) => (
                                        <span key={lang} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'}`}>
                                          {lang}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      არ არის მითითებული
                                    </p>
                                  )}
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ბიოგრაფია
                                  </label>
                                  <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.bio || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ფილოსოფია
                                  </label>
                                  <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.philosophy || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სერვისები
                                  </label>
                                  <ServicesField 
                                    profileId={specialist.id}
                                    isDark={isDark}
                                    showActions={true}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Focus Areas
                                  </label>
                                  {specialist.focus_areas && specialist.focus_areas.length > 0 ? (
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {specialist.focus_areas.map((area, idx) => (
                                        <li key={idx}>{area}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      არ არის მითითებული
                                    </p>
                                  )}
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Representative Matters
                                  </label>
                                  {specialist.representative_matters && specialist.representative_matters.length > 0 ? (
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {specialist.representative_matters.map((matter, idx) => (
                                        <li key={idx}>{matter}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      არ არის მითითებული
                                    </p>
                                  )}
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Teaching, Writing & Speaking
                                  </label>
                                  <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                    {specialist.teaching_writing_speaking || 'არ არის მითითებული'}
                                  </p>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Credentials & Memberships
                                  </label>
                                  {specialist.credentials_memberships && specialist.credentials_memberships.length > 0 ? (
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {specialist.credentials_memberships.map((cred, idx) => (
                                        <li key={idx}>{cred}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      არ არის მითითებული
                                    </p>
                                  )}
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Values & How We Work
                                  </label>
                                  {specialist.values_how_we_work && Object.keys(specialist.values_how_we_work).length > 0 ? (
                                    <div className="space-y-2">
                                      {Object.entries(specialist.values_how_we_work).map(([key, val]) => (
                                        <div key={key} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                          <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {key}
                                          </p>
                                          <p className={`text-sm mt-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                            {val}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      არ არის მითითებული
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Shield className="h-4 w-4" />
                                    როლი
                                  </label>
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
                                    კომპანიის სპეციალისტი
                                  </span>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Building2 className="h-4 w-4" />
                                    კომპანია
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <p className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                      {specialist.company_name || 'არ არის მითითებული'}
                                    </p>
                                    {specialist.company_is_blocked && (
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                                      }`}>
                                        <Ban className="h-3 w-3" />
                                        დაბლოკილია
                                      </span>
                                    )}
                                  </div>
                                  {specialist.company_slug && (
                                    <p className={`text-xs mt-1 font-mono ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      /{specialist.company_slug}
                                    </p>
                                  )}
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <CheckCircle className="h-4 w-4" />
                                    ვერიფიკაციის სტატუსი
                                  </label>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {specialist.verification_status === 'verified' ? (
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                        <CheckCircle className="h-4 w-4" />
                                        დადასტურებული
                                      </span>
                                    ) : specialist.verification_status === 'pending' ? (
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                        <Clock className="h-4 w-4" />
                                        განხილვაში
                                      </span>
                                    ) : specialist.verification_status === 'rejected' ? (
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
                                        <XCircle className="h-4 w-4" />
                                        უარყოფილი
                                      </span>
                                    ) : (
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'}`}>
                                        არ არის მოთხოვნილი
                                      </span>
                                    )}
                                    
                                    {/* Verification Action Buttons */}
                                    <div className="flex gap-2">
                                      {/* Case 1: unverified or rejected - show "მინიჭება" */}
                                      {(specialist.verification_status === 'unverified' || 
                                        specialist.verification_status === 'rejected' || 
                                        !specialist.verification_status) && (
                                        <button
                                          onClick={() => handleChangeVerificationStatus(specialist, 'verified')}
                                          disabled={changingVerificationId === specialist.id}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                                            isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                          }`}
                                          title="ვერიფიკაციის მინიჭება"
                                        >
                                          <CheckCircle className="h-3 w-3" />
                                          ვერიფიკაციის მინიჭება
                                        </button>
                                      )}
                                      
                                      {/* Case 2: pending - show both "დადასტურება" and "უარყოფა" */}
                                      {specialist.verification_status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleChangeVerificationStatus(specialist, 'verified')}
                                            disabled={changingVerificationId === specialist.id}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                                              isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                            }`}
                                            title="დადასტურება"
                                          >
                                            <CheckCircle className="h-3 w-3" />
                                            დადასტურება
                                          </button>
                                          <button
                                            onClick={() => handleChangeVerificationStatus(specialist, 'rejected')}
                                            disabled={changingVerificationId === specialist.id}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                                              isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                            }`}
                                            title="უარყოფა"
                                          >
                                            <XCircle className="h-3 w-3" />
                                            უარყოფა
                                          </button>
                                        </>
                                      )}
                                      
                                      {/* Case 3: verified - show "გაუქმება" */}
                                      {specialist.verification_status === 'verified' && (
                                        <button
                                          onClick={() => handleChangeVerificationStatus(specialist, 'unverified')}
                                          disabled={changingVerificationId === specialist.id}
                                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${
                                            isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                                          }`}
                                          title="ვერიფიკაციის გაუქმება"
                                        >
                                          <X className="h-3 w-3" />
                                          ვერიფიკაციის გაუქმება
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Verification Notes */}
                                  {specialist.verification_notes && (
                                    <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        შენიშვნები:
                                      </p>
                                      <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {specialist.verification_notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Verification Reviewed At */}
                                  {specialist.verification_reviewed_at && (
                                    <p className={`mt-2 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      განხილულია: {new Date(specialist.verification_reviewed_at).toLocaleString('ka-GE')}
                                    </p>
                                  )}
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

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    User ID
                                  </label>
                                  <p className={`font-mono text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    {specialist.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {showTranslations === specialist.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={5} className="px-6 py-6">
                        <SpecialistTranslations 
                          specialistId={specialist.id}
                          specialistName={specialist.full_name || 'N/A'}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredSpecialists.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'სპეციალისტები ვერ მოიძებნა' : 'სპეციალისტები ჯერ არ არის'}
          </p>
        </div>
      )}
    </div>
  )
}
