'use client'

import { useCompanyTranslations } from '@/contexts/CompanyTranslationsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ContentTab({ companyId }: { companyId: string }) {
  const { translations, activeLanguage, updateContentField } = useCompanyTranslations()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const currentData = translations[activeLanguage].content

  const generateSlug = (text: string) => {
    const translitMap: { [key: string]: string } = {
      // Georgian
      'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'f', 'ქ': 'q', 'ღ': 'gh', 'ყ': 'y', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'w', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
      // Russian
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    }

    let slug = text.toLowerCase().trim()
    
    // Transliterate character by character
    slug = slug.split('').map(char => translitMap[char] || char).join('')

    return slug
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-latin, non-numeric, non-space, non-hyphen characters
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/--+/g, '-')           // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start
      .replace(/-+$/, '')            // Trim - from end
  }

  // Fetch avatar URL from profiles
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!companyId) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', companyId)
        .single()
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }
    }
    
    fetchProfileData()
  }, [companyId, supabase])

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = generateSlug(value)
    updateContentField(activeLanguage, 'slug', sanitizedSlug)
  }

  // Generate slug from company name with language suffix
  const generateSlugFromName = () => {
    // Use company name from current language data
    const companyNameText = currentData.company_name
    
    if (!companyNameText || companyNameText.trim() === '') {
      alert('გთხოვთ ჯერ შეავსოთ კომპანიის სახელი!')
      return
    }
    
    const baseSlug = generateSlug(companyNameText)
    
    // Add language suffix: -ka for Georgian, -en for English, -ru for Russian
    const langSuffix = activeLanguage === 'georgian' ? '-ka' : activeLanguage === 'english' ? '-en' : '-ru'
    const generatedSlug = baseSlug + langSuffix
    updateContentField(activeLanguage, 'slug', generatedSlug)
  }

  const getPlaceholder = (field: string): string => {
    const placeholders: Record<string, Record<string, string>> = {
      company_overview: {
        georgian: 'კომპანიის დეტალური აღწერა ქართულად...',
        english: 'Detailed company overview in English...',
        russian: 'Подробный обзор компании на русском...'
      },
      summary: {
        georgian: 'მოკლე შესავალი კომპანიის შესახებ...',
        english: 'Brief introduction about the company...',
        russian: 'Краткое введение о компании...'
      },
      mission_statement: {
        georgian: 'კომპანიის მისია...',
        english: 'Company mission statement...',
        russian: 'Миссия компании...'
      },
      vision_values: {
        georgian: 'ხედვა და ღირებულებები...',
        english: 'Vision and values...',
        russian: 'Видение и ценности...'
      },
      history: {
        georgian: 'კომპანიის ისტორია...',
        english: 'Company history...',
        russian: 'История компании...'
      },
      how_we_work: {
        georgian: 'როგორ ვმუშაობთ...',
        english: 'How we work...',
        russian: 'Как мы работаем...'
      },
      company_name: {
        georgian: 'კომპანიის სახელი ქართულად',
        english: 'Company name in English',
        russian: 'Название компании на русском'
      },
      avatar_alt_text: {
        georgian: 'კომპანიის ლოგოს აღწერა',
        english: 'Company logo description',
        russian: 'Описание логотипа компании'
      }
    }
    return placeholders[field]?.[activeLanguage] || ''
  }

  return (
    <div className="space-y-4">
      {/* Avatar Alt Text - With Logo Preview */}
      <div className={`rounded-lg border p-3 ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <div className="flex items-start gap-3 mb-3">
          {/* Logo Preview */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={currentData.avatar_alt_text || 'Company logo'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`w-7 h-7 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h4 className={`text-[10px] font-semibold mb-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              🏢 ლოგოს Alt ტექსტი
            </h4>
            <p className={`text-[9px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Accessibility & SEO
            </p>
          </div>
        </div>

        <div>
          <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Alt ({activeLanguage === 'georgian' ? '🇬🇪' : activeLanguage === 'english' ? '🇬🇧' : '🇷🇺'})
          </label>
          <input
            type="text"
            value={currentData.avatar_alt_text}
            onChange={(e) => updateContentField(activeLanguage, 'avatar_alt_text', e.target.value)}
            placeholder={getPlaceholder('avatar_alt_text')}
            className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-blue-400'
                : 'border-black/10 bg-black/5 text-black focus:border-blue-600'
            }`}
          />
        </div>
      </div>

      {/* Company Name - თითოეული ენისთვის */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          🏢 სახელი ({activeLanguage === 'georgian' ? '🇬🇪' : activeLanguage === 'english' ? '🇬🇧' : '🇷🇺'})
        </label>
        <input
          type="text"
          value={currentData.company_name}
          onChange={(e) => updateContentField(activeLanguage, 'company_name', e.target.value)}
          placeholder={getPlaceholder('company_name')}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-blue-400'
              : 'border-black/10 bg-black/5 text-black focus:border-blue-600'
          }`}
        />
        <p className={`mt-1 text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          slug-ის გენერაციისთვის
        </p>
      </div>

      {/* Slug Input - თითოეული ენისთვის ცალ-ცალკე */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className={`text-[10px] font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            URL Slug ({activeLanguage === 'georgian' ? 'ქარ' : activeLanguage === 'english' ? 'ინგ' : 'რუს'})
          </label>
          <button
            onClick={generateSlugFromName}
            className={`px-2 py-0.5 text-[9px] font-medium rounded-md transition-colors ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            🔄 ავტო
          </button>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md border ${
          isDark
            ? 'bg-white/5 border-white/20'
            : 'bg-black/10 border-black/10'
        }`}>
          <span className={`${isDark ? 'text-white/40' : 'text-black/40'}`}>
            /companies/
          </span>
          <input
            type="text"
            value={currentData?.slug || ''}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="slug-avtomaturad-generirebuli"
            className={`flex-1 bg-transparent border-none outline-none ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
      </div>

      {/* Company Overview */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          📋 აღწერა (Overview)
        </label>
        <textarea
          value={currentData.company_overview}
          onChange={(e) => updateContentField(activeLanguage, 'company_overview', e.target.value)}
          placeholder={getPlaceholder('company_overview')}
          rows={4}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Summary */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ✨ შესავალი (Summary)
        </label>
        <textarea
          value={currentData.summary}
          onChange={(e) => updateContentField(activeLanguage, 'summary', e.target.value)}
          placeholder={getPlaceholder('summary')}
          rows={2}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Mission Statement */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          🎯 მისია
        </label>
        <textarea
          value={currentData.mission_statement}
          onChange={(e) => updateContentField(activeLanguage, 'mission_statement', e.target.value)}
          placeholder={getPlaceholder('mission_statement')}
          rows={3}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Vision & Values */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          🌟 ხედვა & ღირებულებები
        </label>
        <textarea
          value={currentData.vision_values}
          onChange={(e) => updateContentField(activeLanguage, 'vision_values', e.target.value)}
          placeholder={getPlaceholder('vision_values')}
          rows={3}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* History */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          📖 ისტორია
        </label>
        <textarea
          value={currentData.history}
          onChange={(e) => updateContentField(activeLanguage, 'history', e.target.value)}
          placeholder={getPlaceholder('history')}
          rows={3}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* How We Work */}
      <div>
        <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ⚙️ როგორ ვმუშაობთ
        </label>
        <textarea
          value={currentData.how_we_work}
          onChange={(e) => updateContentField(activeLanguage, 'how_we_work', e.target.value)}
          placeholder={getPlaceholder('how_we_work')}
          rows={3}
          className={`w-full rounded-lg border px-3 py-1.5 text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>
    </div>
  )
}
