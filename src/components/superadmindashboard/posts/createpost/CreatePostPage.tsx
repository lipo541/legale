'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { PostTranslationsProvider, usePostTranslations } from '@/contexts/PostTranslationsContext'
import { FileText, Search, Share2, Loader2, FolderTree, ArrowLeft } from 'lucide-react'
import ContentTab from './ContentTab'
import SeoTab from './SeoTab'
import SocialTab from './SocialTab'
import CategoryAdd from './CategoryAdd'

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

function CreatePostContent({ onCancel, editMode, postData }: CreatePostPageProps) {
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

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      {/* Header with Back Button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              უკან
            </button>
          )}
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {editMode ? 'პოსტის რედაქტირება' : 'ახალი პოსტი'}
          </h1>
        </div>
      </div>

      {/* Main Tabs: Content, SEO, Social Media, Category */}
      <div className="flex gap-4 mb-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('content')}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'content'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Content
          {activeTab === 'content' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('category')}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'category'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <FolderTree className="h-3.5 w-3.5" />
          Category
          {activeTab === 'category' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('seo')}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'seo'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          SEO
          {activeTab === 'seo' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('social')}
          disabled={saving}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === 'social'
              ? isDark
                ? 'text-emerald-400'
                : 'text-emerald-600'
              : isDark
              ? 'text-white/60 hover:text-white/80'
              : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          Social Media
          {activeTab === 'social' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
      </div>

      {/* Language Tabs */}
      {activeTab !== 'category' && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              🌐 ენის არჩევა
            </div>
            
            {/* Publication Date Picker */}
            <div className="flex items-center gap-2">
              <label className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                📅 გამოქვეყნების თარიღი:
              </label>
              <input
                type="datetime-local"
                value={publishedAt ? new Date(publishedAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
                disabled={saving}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/20'
                    : 'bg-black/10 text-black border border-black/10 hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-black/20'
                }`}
              />
              {publishedAt && (
                <button
                  onClick={() => setPublishedAt(null)}
                  disabled={saving}
                  className={`px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'text-white/60 hover:text-white/80 hover:bg-white/10'
                      : 'text-black/60 hover:text-black/80 hover:bg-black/10'
                  }`}
                  title="Clear date"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveLanguage('georgian')}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={saving}
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
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'category' && <CategoryAdd editMode={editMode} postData={postData} />}
        {activeTab === 'seo' && <SeoTab />}
        {activeTab === 'social' && <SocialTab />}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          {/* Status Selector */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'pending' | 'published' | 'archived')}
            disabled={saving}
            className={`appearance-none rounded-lg px-3 py-2 pr-8 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              isDark
                ? 'bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20'
                : 'bg-black/5 text-black/90 border border-black/10 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20'
            }`}
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
          >
            <option value="draft" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Draft</option>
            <option value="pending" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Pending Review</option>
            <option value="published" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Published</option>
            <option value="archived" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Archived</option>
          </select>

          <button
            onClick={savePost}
            disabled={saving}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            შენახვა
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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

export default function CreatePostPage({ onCancel, editMode, postData }: CreatePostPageProps) {
  return (
    <PostTranslationsProvider initialData={postData} editMode={editMode}>
      <CreatePostContent onCancel={onCancel} editMode={editMode} postData={postData} />
    </PostTranslationsProvider>
  )
}
