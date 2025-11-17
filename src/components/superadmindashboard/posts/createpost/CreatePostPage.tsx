'use client'

import { useEffect, useCallback, memo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { PostTranslationsProvider, usePostTranslations } from '@/contexts/PostTranslationsContext'
import { FileText, Search, Share2, Loader2, ArrowLeft, Save } from 'lucide-react'
import ContentTab from './ContentTab'
import SeoTab from './SeoTab'
import SocialTab from './SocialTab'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface PostData {
  post?: {
    id?: string
    category_id?: string | null
  }
  post_translations?: Array<{
    id?: string
    language: string
    title?: string
    excerpt?: string
    content?: string
    category?: string
    category_id?: string | null
    slug?: string
  }>
}

interface CreatePostPageProps {
  onCancel?: () => void
  editMode?: boolean
  postData?: PostData
}

// ============================================================================
// Tab Configuration
// ============================================================================

const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'social', label: 'Social Media', icon: Share2 },
] as const

const LANGUAGES = [
  { id: 'georgian', label: 'ქართული', flag: '🇬🇪' },
  { id: 'english', label: 'English', flag: '🇬🇧' },
  { id: 'russian', label: 'Русский', flag: '🇷🇺' },
] as const

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const

// ============================================================================
// Memoized Components
// ============================================================================

const TabButton = memo(({ 
  tab, 
  isActive, 
  onClick, 
  disabled, 
  isDark 
}: { 
  tab: typeof TABS[number]
  isActive: boolean
  onClick: () => void
  disabled: boolean
  isDark: boolean
}) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-3 py-2 text-xs font-medium 
        transition-all relative disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive
          ? isDark ? 'text-emerald-400' : 'text-emerald-600'
          : isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
        }
      `}
      aria-label={`Switch to ${tab.label} tab`}
      aria-selected={isActive}
      role="tab"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {tab.label}
      {isActive && (
        <div 
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
})
TabButton.displayName = 'TabButton'

const LanguageButton = memo(({ 
  language, 
  isActive, 
  onClick, 
  disabled, 
  isDark 
}: { 
  language: typeof LANGUAGES[number]
  isActive: boolean
  onClick: () => void
  disabled: boolean
  isDark: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-3 py-1.5 rounded-lg text-xs font-medium 
      transition-all disabled:opacity-50 disabled:cursor-not-allowed
      ${isActive
        ? isDark
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
        : isDark
          ? 'bg-white/10 text-white/60 hover:bg-white/20'
          : 'bg-black/10 text-black/60 hover:bg-black/20'
      }
    `}
    aria-label={`Switch to ${language.label} language`}
    aria-pressed={isActive}
  >
    <span className="mr-1" aria-hidden="true">{language.flag}</span>
    {language.label}
  </button>
))
LanguageButton.displayName = 'LanguageButton'

// ============================================================================
// Main Content Component
// ============================================================================

function CreatePostContent({ onCancel, editMode }: CreatePostPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const {
    activeTab,
    activeLanguage,
    setActiveTab,
    setActiveLanguage,
    saving,
    savePost,
    status,
    setStatus,
    publishedAt,
    setPublishedAt,
  } = usePostTranslations()

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (!saving) {
        savePost()
      }
    }
    
    // Esc = Cancel
    if (e.key === 'Escape' && onCancel && !saving) {
      e.preventDefault()
      onCancel()
    }
  }, [saving, savePost, onCancel])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ============================================================================
  // Unsaved Changes Warning
  // ============================================================================
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // This would be enhanced with actual dirty state tracking
      if (saving) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saving])

  // ============================================================================
  // Date Handler
  // ============================================================================
  
  const handleDateChange = useCallback((value: string) => {
    setPublishedAt(value ? new Date(value).toISOString() : null)
  }, [setPublishedAt])

  const clearDate = useCallback(() => {
    setPublishedAt(null)
  }, [setPublishedAt])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div 
      className={`
        rounded-xl border p-4 transition-colors duration-200
        ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}
      `}
      role="main"
      aria-label={editMode ? 'Edit post form' : 'Create new post form'}
    >
      {/* Header Section */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className={`
                flex items-center gap-1.5 rounded-lg px-3 py-1.5 
                text-xs font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-white/10 text-white hover:bg-white/20 focus:ring-2 focus:ring-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20 focus:ring-2 focus:ring-black/20'
                }
              `}
              aria-label="Go back to posts list"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              უკან
            </button>
          )}
          <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {editMode ? 'პოსტის რედაქტირება' : 'ახალი პოსტი'}
          </h1>
        </div>
        
        {/* Quick Save Button */}
        <button
          onClick={savePost}
          disabled={saving}
          className={`
            flex items-center gap-1.5 rounded-lg px-3 py-1.5 
            text-xs font-semibold transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isDark
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-400'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-2 focus:ring-emerald-400'
            }
          `}
          aria-label="Save post (Ctrl+S)"
          title="Save (Ctrl+S)"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          შენახვა
        </button>
      </header>

      {/* Main Tabs Navigation */}
      <nav 
        className={`
          flex gap-4 mb-4 border-b pb-0
          ${isDark ? 'border-white/10' : 'border-black/10'}
        `}
        role="tablist"
        aria-label="Post editor tabs"
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={saving}
            isDark={isDark}
          />
        ))}
      </nav>

      {/* Language Selector & Publication Date */}
      {activeTab !== 'category' && (
        <div className="mb-4 space-y-2">
          {/* Language Tabs */}
          <div>
            <label 
              className={`block text-[10px] font-medium uppercase tracking-wide mb-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}
              id="language-selector-label"
            >
              🌐 ენის არჩევა
            </label>
            <div 
              className="flex gap-1.5" 
              role="tablist" 
              aria-labelledby="language-selector-label"
            >
              {LANGUAGES.map((lang) => (
                <LanguageButton
                  key={lang.id}
                  language={lang}
                  isActive={activeLanguage === lang.id}
                  onClick={() => setActiveLanguage(lang.id)}
                  disabled={saving}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          {/* Publication Date Picker */}
          <div className="flex items-center gap-2">
            <label 
              htmlFor="publication-date"
              className={`text-[10px] font-medium uppercase tracking-wide ${isDark ? 'text-white/60' : 'text-black/60'}`}
            >
              📅 გამოქვეყნების თარიღი
            </label>
            <input
              id="publication-date"
              type="datetime-local"
              value={publishedAt ? new Date(publishedAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={saving}
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium 
                transition-all border
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2
                ${isDark
                  ? 'bg-white/10 text-white border-white/10 hover:bg-white/20 focus:ring-white/20'
                  : 'bg-black/10 text-black border-black/10 hover:bg-black/20 focus:ring-black/20'
                }
              `}
              aria-label="Select publication date and time"
            />
            {publishedAt && (
              <button
                onClick={clearDate}
                disabled={saving}
                className={`
                  px-2 py-1 rounded text-xs transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2
                  ${isDark
                    ? 'text-white/60 hover:text-white/80 hover:bg-white/10 focus:ring-white/20'
                    : 'text-black/60 hover:text-black/80 hover:bg-black/10 focus:ring-black/20'
                  }
                `}
                aria-label="Clear publication date"
                title="Clear date"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6" role="tabpanel">
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'seo' && <SeoTab />}
        {activeTab === 'social' && <SocialTab />}

        {/* Action Buttons Footer */}
        <footer className="flex gap-2 pt-4 border-t border-white/10">
          {/* Status Selector */}
          <div className="relative">
            <label htmlFor="post-status" className="sr-only">Post status</label>
            <select
              id="post-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              disabled={saving}
              className={`
                appearance-none rounded-lg px-3 py-2 pr-8 text-xs font-medium 
                transition-all border cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2
                ${isDark
                  ? 'bg-white/5 text-white/90 border-white/10 hover:bg-white/10 focus:ring-white/20'
                  : 'bg-black/5 text-black/90 border-black/10 hover:bg-black/10 focus:ring-black/20'
                }
              `}
              style={isDark ? { 
                colorScheme: 'dark',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              } : {
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(0,0,0,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
              aria-label="Select post status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  style={isDark 
                    ? { backgroundColor: '#18181b', color: 'white' } 
                    : { backgroundColor: 'white', color: 'black' }
                  }
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={savePost}
            disabled={saving}
            className={`
              flex-1 rounded-lg px-4 py-2 text-xs font-semibold text-white 
              transition-all flex items-center justify-center gap-1.5
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2
              ${isDark
                ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
                : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
              }
            `}
            aria-label="Save post"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            შენახვა {!saving && <span className="text-[10px] opacity-70">(Ctrl+S)</span>}
          </button>

          {/* Cancel Button */}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className={`
                flex-1 rounded-lg px-4 py-2 text-xs font-semibold 
                transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2
                ${isDark
                  ? 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20 focus:ring-black/20'
                }
              `}
              aria-label="Cancel and go back"
            >
              გაუქმება {!saving && <span className="text-[10px] opacity-70">(Esc)</span>}
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}

// ============================================================================
// Main Export with Provider
// ============================================================================

export default function CreatePostPage({ onCancel, editMode, postData }: CreatePostPageProps) {
  return (
    <PostTranslationsProvider initialData={postData} editMode={editMode}>
      <CreatePostContent onCancel={onCancel} editMode={editMode} postData={postData} />
    </PostTranslationsProvider>
  )
}
