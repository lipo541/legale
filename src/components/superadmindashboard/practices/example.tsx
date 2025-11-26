'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Plus, Search, Edit, Trash2, Eye, Loader2, Lock, Unlock } from 'lucide-react'
import PracticeAdd from './PracticeAdd'
import { createClient } from '@/lib/supabase/client'

type Language = 'ka' | 'en' | 'ru'

interface Practice {
  id: string
  hero_image_url: string
  page_hero_image_url: string
  status: string
  created_at: string
  updated_at: string
}

interface PracticeTranslation {
  id: string
  practice_id: string
  language: Language
  title: string
  slug: string
  description: string
  hero_image_alt: string
  page_hero_image_alt: string
  word_count: number
  reading_time: number
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  social_hashtags: string | null
}

interface PracticeWithTranslations extends Practice {
  practice_translations: PracticeTranslation[]
}

export default function PracticesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPractice, setEditingPractice] = useState<PracticeWithTranslations | null>(null)
  const [practices, setPractices] = useState<PracticeWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch practices from database
  const fetchPractices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('practices')
      .select(`
        id,
        hero_image_url,
        page_hero_image_url,
        status,
        created_at,
        updated_at,
        practice_translations (
          practice_id,
          language,
          title,
          slug,
          description,
          hero_image_alt,
          page_hero_image_alt,
          word_count,
          reading_time,
          meta_title,
          meta_description,
          focus_keyword,
          og_title,
          og_description,
          og_image_url,
          social_hashtags
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPractices(data as PracticeWithTranslations[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPractices()
  }, [fetchPractices])

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ პრაქტიკის წაშლა?')) {
      return
    }

    setDeletingId(id)
    const { error } = await supabase
      .from('practices')
      .delete()
      .eq('id', id)

    if (!error) {
      await fetchPractices()
    } else {
      alert('შეცდომა წაშლისას: ' + error.message)
    }
    setDeletingId(null)
  }

  // Handle toggle status (publish/unpublish)
  const handleToggleStatus = async (practice: PracticeWithTranslations) => {
    const newStatus = practice.status === 'published' ? 'draft' : 'published'
    const confirmMessage = newStatus === 'published' 
      ? 'დარწმუნებული ხართ რომ გსურთ ამ პრაქტიკის გამოქვეყნება?'
      : 'დარწმუნებული ხართ რომ გსურთ ამ პრაქტიკის დაბლოკვა?'
    
    if (!confirm(confirmMessage)) {
      return
    }

    setTogglingStatusId(practice.id)
    
    try {
      const { error } = await supabase
        .from('practices')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', practice.id)

      if (error) {
        console.error('Status update error:', error)
        alert('შეცდომა სტატუსის შეცვლისას: ' + error.message)
      } else {
        console.log('Status updated successfully to:', newStatus)
        await fetchPractices()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა სტატუსის შეცვლისას')
    } finally {
      setTogglingStatusId(null)
    }
  }

  // Handle edit
  const handleEdit = (practice: PracticeWithTranslations) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ პრაქტიკის რედაქტირება?')) {
      return
    }
    setEditingPractice(practice)
    setShowAddForm(true)
  }

  // Filter practices based on search
  const filteredPractices = practices.filter((practice) => {
    const kaTranslation = practice.practice_translations.find(t => t.language === 'ka')
    if (!kaTranslation) return false
    return kaTranslation.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Show Add/Edit Form
  if (showAddForm) {
    return (
      <PracticeAdd 
        onBack={() => {
          setShowAddForm(false)
          setEditingPractice(null)
          fetchPractices()
        }}
        editData={editingPractice}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Practices
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            იურიდიული პრაქტიკების მართვა
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${
            isDark
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <Plus className="h-5 w-5" />
          ახალი პრაქტიკა
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className={`relative rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა პრაქტიკებში..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {/* Practices Table */}
      {!loading && filteredPractices.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სახელი (ქართული)
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  Slug
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სტატუსი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  თარიღი
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-black' : 'bg-white'}>
              {filteredPractices.map((practice) => {
                const kaTranslation = practice.practice_translations.find(t => t.language === 'ka')
                
                return (
                  <tr
                    key={practice.id}
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/5'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                      {kaTranslation?.title || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {kaTranslation?.slug || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(practice)}
                        disabled={togglingStatusId === practice.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          practice.status === 'published'
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : isDark
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        } ${togglingStatusId === practice.id ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        title={practice.status === 'published' ? 'დაბლოკვა' : 'გამოქვეყნება'}
                      >
                        {togglingStatusId === practice.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {practice.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}
                          </>
                        ) : (
                          <>
                            {practice.status === 'published' ? (
                              <>
                                <Unlock className="h-3 w-3" />
                                გამოქვეყნებული
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                დრაფტი
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(practice.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/ka/practices/${kaTranslation?.slug}`, '_blank')}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                          title="ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(practice)}
                          className={`rounded-lg p-2 transition-colors ${
                            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                          title="რედაქტირება"
                        >
                          <Edit className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(practice.id)}
                          disabled={deletingId === practice.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === practice.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPractices.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'პრაქტიკები ვერ მოიძებნა' : 'პრაქტიკები ჯერ არ არის დამატებული'}
          </p>
        </div>
      )}
    </div>
  )
}
