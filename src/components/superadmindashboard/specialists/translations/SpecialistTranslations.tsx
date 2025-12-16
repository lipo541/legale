'use client'

import { useEffect, useCallback, memo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { SpecialistTranslationsProvider, useSpecialistTranslations } from '@/contexts/SpecialistTranslationsContext'
import { FileText, Search, Share2, X, Loader2 } from 'lucide-react'
import ContentTab from './ContentTab'
import SeoTab from './SeoTab'
import SocialTab from './SocialTab'

interface SpecialistTranslationsProps {
  specialistId: string
  specialistName: string
  onClose?: () => void
}

function SpecialistTranslationsContent({ specialistId, specialistName, onClose }: SpecialistTranslationsProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const { 
    activeTab, 
    setActiveTab, 
    activeLanguage, 
    setActiveLanguage,
    loading,
    saving,
    fetchTranslations,
    saveTranslations
  } = useSpecialistTranslations()

  // Initialize and fetch translations
  useEffect(() => {
    fetchTranslations(specialistId)
  }, [specialistId, fetchTranslations])

  const handleSave = useCallback(async () => {
    await saveTranslations()
    // onClose is called after successful save - saveTranslations shows alert on error
    if (onClose) onClose()
  }, [saveTranslations, onClose])

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
      {/* Main Tabs: Content, SEO, Social Media */}
      <div className={`flex flex-wrap gap-1.5 mb-3 sm:mb-4 border-b pb-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <button
          onClick={() => setActiveTab('content')}
          disabled={loading || saving}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'content'
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : isDark
              ? 'text-white/60 hover:bg-white/10 border border-transparent'
              : 'text-black/60 hover:bg-black/5 border border-transparent'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span className="hidden xs:inline">Content</span>
          <span className="xs:hidden">კონტ</span>
        </button>
        
        <button
          onClick={() => setActiveTab('seo')}
          disabled={loading || saving}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'seo'
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : isDark
              ? 'text-white/60 hover:bg-white/10 border border-transparent'
              : 'text-black/60 hover:bg-black/5 border border-transparent'
          }`}
        >
          <Search className="h-3 w-3" />
          SEO
        </button>
        
        <button
          onClick={() => setActiveTab('social')}
          disabled={loading || saving}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'social'
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : isDark
              ? 'text-white/60 hover:bg-white/10 border border-transparent'
              : 'text-black/60 hover:bg-black/5 border border-transparent'
          }`}
        >
          <Share2 className="h-3 w-3" />
          <span className="hidden xs:inline">Social</span>
          <span className="xs:hidden">სოც</span>
        </button>

        {/* Close button if onClose provided */}
        {onClose && (
          <button
            onClick={onClose}
            disabled={saving}
            className={`ml-auto p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/5 text-black/40'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Language Tabs */}
      <div className="mb-3 sm:mb-4">
        <div className={`text-[10px] font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          🌐 ენა
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveLanguage('georgian')}
            disabled={loading || saving}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'georgian'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : isDark
                ? 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                : 'bg-black/5 text-black/60 hover:bg-black/10 border border-transparent'
            }`}
          >
            🇬🇪 ქართ
          </button>
          <button
            onClick={() => setActiveLanguage('english')}
            disabled={loading || saving}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'english'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : isDark
                ? 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                : 'bg-black/5 text-black/60 hover:bg-black/10 border border-transparent'
            }`}
          >
            🇬🇧 ENG
          </button>
          <button
            onClick={() => setActiveLanguage('russian')}
            disabled={loading || saving}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'russian'
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                : isDark
                ? 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                : 'bg-black/5 text-black/60 hover:bg-black/10 border border-transparent'
            }`}
          >
            🇷🇺 РУС
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-[150px] sm:h-[200px]">
            <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
        ) : (
          <>
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'seo' && <SeoTab />}
            {activeTab === 'social' && <SocialTab />}
          </>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className={`flex-1 rounded-lg px-3 py-2 text-[11px] sm:text-xs font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            შენახვა
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={saving}
              className={`rounded-lg px-3 py-2 text-[11px] sm:text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              გაუქმება
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Memoized wrapper component
const MemoizedContent = memo(SpecialistTranslationsContent)

export default function SpecialistTranslations(props: SpecialistTranslationsProps) {
  return (
    <SpecialistTranslationsProvider>
      <MemoizedContent {...props} />
    </SpecialistTranslationsProvider>
  )
}
