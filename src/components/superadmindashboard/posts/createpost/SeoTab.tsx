'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { usePostTranslations } from '@/contexts/PostTranslationsContext'
import { useCallback, useMemo } from 'react'
import { Search, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface CharacterCountStatus {
  count: number
  status: 'optimal' | 'acceptable' | 'poor'
  color: string
  message: string
}

// ============================================================================
// Helper Functions
// ============================================================================

const getMetaTitleStatus = (length: number): CharacterCountStatus => {
  if (length >= 50 && length <= 60) {
    return {
      count: length,
      status: 'optimal',
      color: 'text-emerald-500',
      message: '✓ ოპტიმალური სიგრძე'
    }
  } else if ((length >= 40 && length < 50) || (length > 60 && length <= 70)) {
    return {
      count: length,
      status: 'acceptable',
      color: 'text-yellow-500',
      message: '⚠ მისაღები, მაგრამ არაოპტიმალური'
    }
  } else {
    return {
      count: length,
      status: 'poor',
      color: 'text-red-500',
      message: length === 0 ? '✕ სავალდებულოა' : length < 40 ? '✕ ძალიან მოკლეა' : '✕ ძალიან გრძელია'
    }
  }
}

const getMetaDescriptionStatus = (length: number): CharacterCountStatus => {
  if (length >= 150 && length <= 160) {
    return {
      count: length,
      status: 'optimal',
      color: 'text-emerald-500',
      message: '✓ ოპტიმალური სიგრძე'
    }
  } else if ((length >= 120 && length < 150) || (length > 160 && length <= 200)) {
    return {
      count: length,
      status: 'acceptable',
      color: 'text-yellow-500',
      message: '⚠ მისაღები, მაგრამ არაოპტიმალური'
    }
  } else {
    return {
      count: length,
      status: 'poor',
      color: 'text-red-500',
      message: length === 0 ? '✕ სავალდებულოა' : length < 120 ? '✕ ძალიან მოკლეა' : '✕ ძალიან გრძელია'
    }
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function SeoTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { translations, activeLanguage, updateField } = usePostTranslations()
  const currentData = translations[activeLanguage]

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const metaTitleStatus = useMemo(
    () => getMetaTitleStatus(currentData.meta_title?.length || 0),
    [currentData.meta_title]
  )

  const metaDescriptionStatus = useMemo(
    () => getMetaDescriptionStatus(currentData.meta_description?.length || 0),
    [currentData.meta_description]
  )

  const keywordCount = useMemo(() => {
    if (!currentData.keywords) return 0
    return currentData.keywords.split(',').filter(k => k.trim()).length
  }, [currentData.keywords])

  const seoScore = useMemo(() => {
    let score = 0
    const maxScore = 100
    
    // Meta title (30 points)
    if (metaTitleStatus.status === 'optimal') score += 30
    else if (metaTitleStatus.status === 'acceptable') score += 20
    else if (currentData.meta_title?.length > 0) score += 10
    
    // Meta description (30 points)
    if (metaDescriptionStatus.status === 'optimal') score += 30
    else if (metaDescriptionStatus.status === 'acceptable') score += 20
    else if (currentData.meta_description?.length > 0) score += 10
    
    // Keywords (20 points)
    if (keywordCount >= 5 && keywordCount <= 10) score += 20
    else if (keywordCount > 0) score += 10
    
    // Slug (20 points)
    if (currentData.slug?.length > 0) {
      if (currentData.slug.length <= 60) score += 20
      else score += 10
    }
    
    return Math.min(score, maxScore)
  }, [metaTitleStatus, metaDescriptionStatus, keywordCount, currentData.slug, currentData.meta_title, currentData.meta_description])

  const seoScoreColor = useMemo(() => {
    if (seoScore >= 80) return 'text-emerald-500'
    if (seoScore >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }, [seoScore])

  const seoScoreIcon = useMemo(() => {
    if (seoScore >= 80) return CheckCircle
    if (seoScore >= 60) return AlertTriangle
    return AlertCircle
  }, [seoScore])

  // ============================================================================
  // Event Handlers (useCallback for performance)
  // ============================================================================

  const handleMetaTitleChange = useCallback((value: string) => {
    updateField('meta_title', value)
  }, [updateField])

  const handleMetaDescriptionChange = useCallback((value: string) => {
    updateField('meta_description', value)
  }, [updateField])

  const handleKeywordsChange = useCallback((value: string) => {
    updateField('keywords', value)
  }, [updateField])

  const handleAutoFillFromContent = useCallback(() => {
    // Auto-fill meta title from post title if empty
    if (!currentData.meta_title && currentData.title) {
      const truncated = currentData.title.slice(0, 60)
      updateField('meta_title', truncated)
    }
    
    // Auto-fill meta description from excerpt if empty
    if (!currentData.meta_description && currentData.excerpt) {
      const truncated = currentData.excerpt.slice(0, 160)
      updateField('meta_description', truncated)
    }
  }, [currentData.meta_title, currentData.meta_description, currentData.title, currentData.excerpt, updateField])

  // ============================================================================
  // Render
  // ============================================================================

  const SeoScoreIcon = seoScoreIcon

  return (
    <div className="space-y-3">
      {/* SEO Score Card */}
      <div className={`p-3 rounded-lg border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeoScoreIcon className={`h-4 w-4 ${seoScoreColor}`} aria-hidden="true" />
            <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
              SEO ქულა
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold ${seoScoreColor}`} aria-live="polite">
              {seoScore}
            </span>
            <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              /100
            </span>
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${seoScore}%` }}
            role="progressbar"
            aria-valuenow={seoScore}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Auto-fill Helper */}
      {(!currentData.meta_title || !currentData.meta_description) && (currentData.title || currentData.excerpt) && (
        <button
          onClick={handleAutoFillFromContent}
          className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
            isDark
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20'
          }`}
          aria-label="Auto-fill SEO fields from content"
        >
          ✨ ავტომატური შევსება კონტენტიდან
        </button>
      )}

      {/* Meta Title */}
      <div className="space-y-1.5">
        <label htmlFor="meta-title" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Meta სათაური <span className="text-red-500">*</span>
        </label>
        <input
          id="meta-title"
          type="text"
          value={currentData.meta_title || ''}
          onChange={(e) => handleMetaTitleChange(e.target.value)}
          placeholder="SEO სათაური (რეკომენდებული: 50-60 სიმბოლო)"
          maxLength={100}
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors focus:outline-none ${
            metaTitleStatus.status === 'optimal'
              ? 'focus:border-emerald-500 border-emerald-500/30'
              : metaTitleStatus.status === 'acceptable'
              ? 'focus:border-yellow-500 border-yellow-500/30'
              : 'focus:border-red-500 border-red-500/30'
          } ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Meta title for SEO"
          aria-describedby="meta-title-help"
        />
        <div className="flex items-center justify-between">
          <p id="meta-title-help" className={`text-xs ${metaTitleStatus.color}`}>
            {metaTitleStatus.message}
          </p>
          <span className={`text-xs ${metaTitleStatus.color}`} aria-live="polite">
            {metaTitleStatus.count} / 60
          </span>
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <label htmlFor="meta-description" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          Meta აღწერა <span className="text-red-500">*</span>
        </label>
        <textarea
          id="meta-description"
          value={currentData.meta_description || ''}
          onChange={(e) => handleMetaDescriptionChange(e.target.value)}
          placeholder="SEO აღწერა (რეკომენდებული: 150-160 სიმბოლო)"
          rows={3}
          maxLength={200}
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors resize-none focus:outline-none ${
            metaDescriptionStatus.status === 'optimal'
              ? 'focus:border-emerald-500 border-emerald-500/30'
              : metaDescriptionStatus.status === 'acceptable'
              ? 'focus:border-yellow-500 border-yellow-500/30'
              : 'focus:border-red-500 border-red-500/30'
          } ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="Meta description for SEO"
          aria-describedby="meta-description-help"
        />
        <div className="flex items-center justify-between">
          <p id="meta-description-help" className={`text-xs ${metaDescriptionStatus.color}`}>
            {metaDescriptionStatus.message}
          </p>
          <span className={`text-xs ${metaDescriptionStatus.color}`} aria-live="polite">
            {metaDescriptionStatus.count} / 160
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-1.5">
        <label htmlFor="keywords" className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          საკვანძო სიტყვები
        </label>
        <input
          id="keywords"
          type="text"
          value={currentData.keywords || ''}
          onChange={(e) => handleKeywordsChange(e.target.value)}
          placeholder="საკვანძო სიტყვა 1, საკვანძო სიტყვა 2, საკვანძო სიტყვა 3"
          className={`w-full px-2 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:border-emerald-500 ${
            isDark
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
              : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'
          }`}
          aria-label="SEO keywords"
          aria-describedby="keywords-help"
        />
        <div className="flex items-center justify-between">
          <p id="keywords-help" className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            გამოყავით მძიმეებით
          </p>
          <span className={`text-xs ${
            keywordCount >= 5 && keywordCount <= 10
              ? 'text-emerald-500'
              : keywordCount > 0
              ? 'text-yellow-500'
              : isDark ? 'text-white/50' : 'text-black/50'
          }`} aria-live="polite">
            {keywordCount} სიტყვა (რეკ: 5-10)
          </span>
        </div>
      </div>

      {/* Google SERP Preview */}
      <div className={`rounded-lg p-3 border ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Search className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} aria-hidden="true" />
          <h3 className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            Google Search Preview
          </h3>
        </div>
        <div className="space-y-1">
          <div className={`text-sm font-medium line-clamp-1 ${isDark ? 'text-white' : 'text-black'}`}>
            {currentData.meta_title || currentData.title || 'პოსტის სათაური'}
          </div>
          <div className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            https://yoursite.com/blog/{currentData.slug || 'post-slug'}
          </div>
          <div className={`text-xs line-clamp-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {currentData.meta_description || currentData.excerpt || 'პოსტის აღწერა გამოჩნდება აქ...'}
          </div>
        </div>
      </div>

      {/* SEO Tips */}
      <div className={`rounded-lg p-3 border ${
        isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
      }`}>
        <div className="flex gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <CheckCircle className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className={`text-xs font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              SEO რჩევები
            </h3>
            <ul className={`text-xs space-y-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Meta სათაური: 50-60 სიმბოლო (ოპტიმალური)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Meta აღწერა: 150-160 სიმბოლო (ოპტიმალური)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>5-10 საკვანძო სიტყვა საუკეთესოა</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>გამოიყენეთ საკვანძო სიტყვები ბუნებრივად</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>URL slug უნდა იყოს მოკლე და აღწერითი</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
