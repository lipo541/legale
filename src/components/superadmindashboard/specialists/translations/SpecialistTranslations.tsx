'use client'

import { useEffect } from 'react'
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
  }, [specialistId])

  const handleSave = async () => {
    await saveTranslations()
    if (onClose) onClose()
  }

  return (
    <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Main Tabs: Content, SEO, Social Media */}
      <div className="flex gap-6 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('content')}
          disabled={loading || saving}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'content'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <FileText className="h-4 w-4" />
          Content
          {activeTab === 'content' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('seo')}
          disabled={loading || saving}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'seo'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Search className="h-4 w-4" />
          SEO
          {activeTab === 'seo' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('social')}
          disabled={loading || saving}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'social'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Share2 className="h-4 w-4" />
          Social Media
          {activeTab === 'social' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>

        {/* Close button if onClose provided */}
        {onClose && (
          <button
            onClick={onClose}
            disabled={saving}
            className={`ml-auto p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        )}
      </div>

      {/* Language Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            🌐 ენის არჩევა
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveLanguage('georgian')}
            disabled={loading || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'georgian'
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : isDark
                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                : 'bg-black/10 text-black/60 hover:bg-black/20'
            }`}
          >
            ქართული
          </button>
          <button
            onClick={() => setActiveLanguage('english')}
            disabled={loading || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'english'
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : isDark
                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                : 'bg-black/10 text-black/60 hover:bg-black/20'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setActiveLanguage('russian')}
            disabled={loading || saving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeLanguage === 'russian'
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : isDark
                ? 'bg-white/10 text-white/60 hover:bg-white/20'
                : 'bg-black/10 text-black/60 hover:bg-black/20'
            }`}
          >
            Русский
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
        ) : (
          <>
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'seo' && <SeoTab />}
            {activeTab === 'social' && <SocialTab />}
          </>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            შენახვა
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={saving}
              className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
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

      <p className={`text-xs text-center mt-6 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
        Specialist: {specialistName} (ID: {specialistId})
      </p>
    </div>
  )
}

export default function SpecialistTranslations(props: SpecialistTranslationsProps) {
  return (
    <SpecialistTranslationsProvider>
      <SpecialistTranslationsContent {...props} />
    </SpecialistTranslationsProvider>
  )
}
