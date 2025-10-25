'use client'

import { useState, useEffect, Fragment } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Building2,
  Calendar,
  Loader2,
  Shield,
  X,
  Phone,
  Globe,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  FileText,
  Target,
  Lightbulb,
  History,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CompanyProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'COMPANY'
  avatar_url: string | null
  company_slug: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
  // Company Overview
  company_overview: string | null
  summary: string | null
  mission_statement: string | null
  vision_values: string | null
  history: string | null
  how_we_work: string | null
  // Contact
  website: string | null
  address: string | null
  map_link: string | null
  // Social Links
  facebook_link: string | null
  instagram_link: string | null
  linkedin_link: string | null
  twitter_link: string | null
  // Logo
  logo_url: string | null
}

export default function CompaniesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    company_slug: '',
    company_overview: '',
    summary: '',
    mission_statement: '',
    vision_values: '',
    history: '',
    how_we_work: '',
    website: '',
    address: '',
    map_link: '',
    facebook_link: '',
    instagram_link: '',
    linkedin_link: '',
    twitter_link: ''
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchCompanies = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'COMPANY')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching companies:', error)
      } else {
        setCompanies(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleViewDetails = (company: CompanyProfile) => {
    if (expandedId === company.id) {
      setExpandedId(null)
    } else {
      setExpandedId(company.id)
      setEditingCompany(null)
    }
  }

  const handleEdit = (company: CompanyProfile) => {
    setEditingCompany(company)
    setEditForm({
      full_name: company.full_name || '',
      email: company.email || '',
      phone_number: company.phone_number || '',
      company_slug: company.company_slug || '',
      company_overview: company.company_overview || '',
      summary: company.summary || '',
      mission_statement: company.mission_statement || '',
      vision_values: company.vision_values || '',
      history: company.history || '',
      how_we_work: company.how_we_work || '',
      website: company.website || '',
      address: company.address || '',
      map_link: company.map_link || '',
      facebook_link: company.facebook_link || '',
      instagram_link: company.instagram_link || '',
      linkedin_link: company.linkedin_link || '',
      twitter_link: company.twitter_link || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingCompany) return

    setUpdatingId(editingCompany.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone_number: editForm.phone_number,
          company_slug: editForm.company_slug,
          company_overview: editForm.company_overview,
          summary: editForm.summary,
          mission_statement: editForm.mission_statement,
          vision_values: editForm.vision_values,
          history: editForm.history,
          how_we_work: editForm.how_we_work,
          website: editForm.website,
          address: editForm.address,
          map_link: editForm.map_link,
          facebook_link: editForm.facebook_link,
          instagram_link: editForm.instagram_link,
          linkedin_link: editForm.linkedin_link,
          twitter_link: editForm.twitter_link,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCompany.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchCompanies()
        setEditingCompany(null)
        setExpandedId(null)
        alert('წარმატებით განახლდა! ✅')
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა განახლებისას')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ კომპანიის წაშლა?')) {
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
        await fetchCompanies()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = 
      company.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Companies
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            კომპანიების მართვა
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

      {!loading && filteredCompanies.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  კომპანია
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
              {filteredCompanies.map((company) => (
                <Fragment key={company.id}>
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
                          {company.avatar_url ? (
                            <img src={company.avatar_url} alt={company.full_name || 'Company'} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <Building2 className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {company.full_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {company.email || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(company.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(company)}
                          className={`rounded-lg p-2 transition-colors ${
                            expandedId === company.id
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალების ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${expandedId === company.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          disabled={deletingId === company.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === company.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === company.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={4} className="px-6 py-6">
                        <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          {editingCompany?.id === company.id ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  კომპანიის რედაქტირება
                                </h3>
                                <button
                                  onClick={() => setEditingCompany(null)}
                                  className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                  <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                {/* Basic Info */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    კომპანიის სახელი
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

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ტელეფონი
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                    placeholder="+995 XXX XXX XXX"
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Slug (URL სახელი)
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.company_slug}
                                    onChange={(e) => setEditForm({ ...editForm, company_slug: e.target.value })}
                                    placeholder="my-company-name"
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                  <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                    URL: /practices/{editForm.company_slug || 'slug'}
                                  </p>
                                </div>

                                {/* Company Overview */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    კომპანიის შესახებ
                                  </h4>
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    მოკლე აღწერა
                                  </label>
                                  <textarea
                                    value={editForm.summary}
                                    onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                    rows={2}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    დეტალური აღწერა
                                  </label>
                                  <textarea
                                    value={editForm.company_overview}
                                    onChange={(e) => setEditForm({ ...editForm, company_overview: e.target.value })}
                                    rows={4}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    მისია
                                  </label>
                                  <textarea
                                    value={editForm.mission_statement}
                                    onChange={(e) => setEditForm({ ...editForm, mission_statement: e.target.value })}
                                    rows={3}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ხედვა და ღირებულებები
                                  </label>
                                  <textarea
                                    value={editForm.vision_values}
                                    onChange={(e) => setEditForm({ ...editForm, vision_values: e.target.value })}
                                    rows={3}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ისტორია
                                  </label>
                                  <textarea
                                    value={editForm.history}
                                    onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                                    rows={3}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    როგორ ვმუშაობთ
                                  </label>
                                  <textarea
                                    value={editForm.how_we_work}
                                    onChange={(e) => setEditForm({ ...editForm, how_we_work: e.target.value })}
                                    rows={3}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                {/* Contact Information */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    საკონტაქტო ინფორმაცია
                                  </h4>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ვებსაიტი
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.website}
                                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    placeholder="https://example.com"
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    მისამართი
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    placeholder="თბილისი, საქართველო"
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    რუკის ლინკი
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.map_link}
                                    onChange={(e) => setEditForm({ ...editForm, map_link: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                {/* Social Links */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-3 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    სოციალური ქსელები
                                  </h4>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Facebook
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.facebook_link}
                                    onChange={(e) => setEditForm({ ...editForm, facebook_link: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Instagram
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.instagram_link}
                                    onChange={(e) => setEditForm({ ...editForm, instagram_link: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    LinkedIn
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.linkedin_link}
                                    onChange={(e) => setEditForm({ ...editForm, linkedin_link: e.target.value })}
                                    placeholder="https://linkedin.com/company/..."
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Twitter
                                  </label>
                                  <input
                                    type="url"
                                    value={editForm.twitter_link}
                                    onChange={(e) => setEditForm({ ...editForm, twitter_link: e.target.value })}
                                    placeholder="https://twitter.com/..."
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                {/* Company ID */}
                                <div className="sm:col-span-2 mt-4">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Company ID
                                  </label>
                                  <input
                                    type="text"
                                    value={company.id}
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
                                  disabled={updatingId === company.id}
                                  className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                                    isDark
                                      ? 'bg-emerald-500 hover:bg-emerald-600'
                                      : 'bg-emerald-500 hover:bg-emerald-600'
                                  }`}
                                >
                                  {updatingId === company.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      შენახვა...
                                    </span>
                                  ) : (
                                    'შენახვა'
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingCompany(null)}
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
                                  კომპანიის დეტალები
                                </h3>
                                <button
                                  onClick={() => handleEdit(company)}
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

                              <div className="grid gap-6 sm:grid-cols-2">
                                {/* Logo */}
                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ლოგო
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                      {company.logo_url ? (
                                        <img src={company.logo_url} alt={company.full_name || 'Company'} className="h-full w-full rounded-full object-cover" />
                                      ) : (
                                        <Building2 className={`h-8 w-8 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                      )}
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      {company.logo_url ? 'ლოგო ატვირთულია' : 'ლოგო არ არის'}
                                    </p>
                                  </div>
                                </div>

                                {/* Basic Info */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    კომპანიის სახელი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {company.full_name || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Mail className="h-4 w-4" />
                                    ელფოსტა
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {company.email || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Phone className="h-4 w-4" />
                                    ტელეფონი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {company.phone_number || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Slug (URL სახელი)
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {company.company_slug || 'N/A'}
                                  </p>
                                  {company.company_slug && (
                                    <p className={`mt-1 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                      URL: /practices/{company.company_slug}
                                    </p>
                                  )}
                                </div>

                                {/* Company Overview Section */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    კომპანიის შესახებ
                                  </h4>
                                  <div className="grid gap-4">
                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <FileText className="h-4 w-4" />
                                        მოკლე აღწერა
                                      </label>
                                      <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.summary || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Building2 className="h-4 w-4" />
                                        დეტალური აღწერა
                                      </label>
                                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.company_overview || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Target className="h-4 w-4" />
                                        მისია
                                      </label>
                                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.mission_statement || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Lightbulb className="h-4 w-4" />
                                        ხედვა და ღირებულებები
                                      </label>
                                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.vision_values || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <History className="h-4 w-4" />
                                        ისტორია
                                      </label>
                                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.history || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Users className="h-4 w-4" />
                                        როგორ ვმუშაობთ
                                      </label>
                                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {company.how_we_work || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    საკონტაქტო ინფორმაცია
                                  </h4>
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Globe className="h-4 w-4" />
                                        ვებსაიტი
                                      </label>
                                      <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                        {company.website ? (
                                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            {company.website}
                                          </a>
                                        ) : 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <MapPin className="h-4 w-4" />
                                        მისამართი
                                      </label>
                                      <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                        {company.address || 'N/A'}
                                      </p>
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <MapPin className="h-4 w-4" />
                                        რუკაზე
                                      </label>
                                      <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                        {company.map_link ? (
                                          <a href={company.map_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            ნახეთ რუკაზე →
                                          </a>
                                        ) : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Social Links */}
                                <div className="sm:col-span-2 mt-4">
                                  <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    სოციალური ქსელები
                                  </h4>
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Facebook className="h-4 w-4" />
                                        Facebook
                                      </label>
                                      {company.facebook_link ? (
                                        <a href={company.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                                          {company.facebook_link}
                                        </a>
                                      ) : (
                                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Instagram className="h-4 w-4" />
                                        Instagram
                                      </label>
                                      {company.instagram_link ? (
                                        <a href={company.instagram_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                                          {company.instagram_link}
                                        </a>
                                      ) : (
                                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Linkedin className="h-4 w-4" />
                                        LinkedIn
                                      </label>
                                      {company.linkedin_link ? (
                                        <a href={company.linkedin_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                                          {company.linkedin_link}
                                        </a>
                                      ) : (
                                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Twitter className="h-4 w-4" />
                                        Twitter
                                      </label>
                                      {company.twitter_link ? (
                                        <a href={company.twitter_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                                          {company.twitter_link}
                                        </a>
                                      ) : (
                                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>N/A</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* System Info */}
                                <div className="sm:col-span-2 mt-4 pt-4 border-t border-white/10">
                                  <h4 className={`mb-4 text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    სისტემური ინფორმაცია
                                  </h4>
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Shield className="h-4 w-4" />
                                        როლი
                                      </label>
                                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'}`}>
                                        კომპანია
                                      </span>
                                    </div>

                                    <div>
                                      <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        <Calendar className="h-4 w-4" />
                                        რეგისტრაცია
                                      </label>
                                      <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                        {new Date(company.created_at).toLocaleString('ka-GE')}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        ბოლო განახლება
                                      </label>
                                      <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                        {new Date(company.updated_at).toLocaleString('ka-GE')}
                                      </p>
                                    </div>

                                    <div>
                                      <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        Company ID
                                      </label>
                                      <p className={`font-mono text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                        {company.id}
                                      </p>
                                    </div>
                                  </div>
                                </div>
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
      )}

      {!loading && filteredCompanies.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'კომპანიები ვერ მოიძებნა' : 'კომპანიები ჯერ არ არის'}
          </p>
        </div>
      )}
    </div>
  )
}
