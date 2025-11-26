'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Shield, FileText, Cookie, Edit, Eye, Loader2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LegalPageEditor from './LegalPageEditor'

type PageType = 'privacy' | 'terms' | 'cookies'

interface LegalPage {
  id: string
  page_type: PageType
  icon: string
  status: string
  updated_at: string
  created_at: string
}

interface LegalPageTranslation {
  id: string
  legal_page_id: string
  language: 'ka' | 'en' | 'ru'
  title: string
  intro: string
  content: Section[]
  updated_at: string
}

interface Section {
  id: string
  title: string
  content: string
}

interface LegalPageWithTranslations extends LegalPage {
  legal_page_translations: LegalPageTranslation[]
}

const pageConfig: Record<PageType, { label: string; icon: typeof Shield; color: string }> = {
  privacy: { label: 'Privacy Policy', icon: Shield, color: 'emerald' },
  terms: { label: 'Terms & Conditions', icon: FileText, color: 'blue' },
  cookies: { label: 'Cookie Policy', icon: Cookie, color: 'amber' }
}

export default function LegalPagesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<PageType>('privacy')
  const [pages, setPages] = useState<LegalPageWithTranslations[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<LegalPageWithTranslations | null>(null)

  // Fetch legal pages
  const fetchPages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('legal_pages')
      .select(`
        id,
        page_type,
        icon,
        status,
        updated_at,
        created_at,
        legal_page_translations (
          id,
          legal_page_id,
          language,
          title,
          intro,
          content,
          updated_at
        )
      `)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setPages(data as LegalPageWithTranslations[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  // Get current page data
  const currentPage = pages.find(p => p.page_type === activeTab)

  // Handle edit
  const handleEdit = (page: LegalPageWithTranslations) => {
    setEditingPage(page)
  }

  // Handle view
  const handleView = (pageType: PageType) => {
    window.open(`/ka/${pageType}`, '_blank')
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show editor
  if (editingPage) {
    return (
      <LegalPageEditor
        page={editingPage}
        onBack={() => {
          setEditingPage(null)
          fetchPages()
        }}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Legal Pages
          </h1>
          <p className={`mt-1 text-xs md:text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            იურიდიული გვერდების მართვა (Privacy, Terms, Cookies)
          </p>
        </div>
        <button
          onClick={() => fetchPages()}
          disabled={loading}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            isDark
              ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
          } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          განახლება
        </button>
      </div>

      {/* Tabs */}
      <div className={`mb-4 md:mb-6 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {(['privacy', 'terms', 'cookies'] as PageType[]).map((pageType) => {
            const config = pageConfig[pageType]
            const Icon = config.icon
            const isActive = activeTab === pageType
            
            return (
              <button
                key={pageType}
                onClick={() => setActiveTab(pageType)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? isDark
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-emerald-500 text-emerald-600'
                    : isDark
                    ? 'border-transparent text-white/60 hover:text-white'
                    : 'border-transparent text-black/60 hover:text-black'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="sm:hidden">
                  {pageType === 'privacy' ? 'Privacy' : pageType === 'terms' ? 'Terms' : 'Cookies'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {/* Content */}
      {!loading && currentPage && (
        <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          {/* Page Info */}
          <div className={`p-4 md:p-5 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = pageConfig[activeTab].icon
                  return (
                    <div className={`p-2 rounded-lg ${
                      isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                    }`}>
                      <Icon className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                  )
                })()}
                <div>
                  <h2 className={`text-sm md:text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                    {pageConfig[activeTab].label}
                  </h2>
                  <p className={`text-[10px] md:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    ბოლო განახლება: {formatDate(currentPage.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  currentPage.status === 'published'
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500/10 text-emerald-600'
                    : isDark
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {currentPage.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}
                </span>
              </div>
            </div>
          </div>

          {/* Translations Table */}
          <div className="p-4 md:p-5">
            <h3 className={`text-xs font-medium mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              თარგმანები
            </h3>
            <div className="space-y-2">
              {['ka', 'en', 'ru'].map((lang) => {
                const translation = currentPage.legal_page_translations.find(t => t.language === lang)
                const langLabels: Record<string, string> = {
                  ka: '🇬🇪 ქართული',
                  en: '🇬🇧 English',
                  ru: '🇷🇺 Русский'
                }
                
                return (
                  <div
                    key={lang}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg ${
                      isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                          {langLabels[lang]}
                        </span>
                        {translation && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            ✓
                          </span>
                        )}
                      </div>
                      {translation && (
                        <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                          {translation.title}
                        </p>
                      )}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                      {translation 
                        ? `${(translation.content as Section[])?.length || 0} სექცია`
                        : 'არ არის შევსებული'
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className={`p-4 md:p-5 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleView(activeTab)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-white/5 text-white/80 hover:bg-white/10'
                    : 'bg-black/5 text-black/80 hover:bg-black/10'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                ნახვა
              </button>
              <button
                onClick={() => handleEdit(currentPage)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                რედაქტირება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !currentPage && (
        <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            მონაცემები ვერ მოიძებნა
          </p>
        </div>
      )}
    </div>
  )
}
