'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useSpecialistTranslations } from '@/contexts/SpecialistTranslationsContext'
import { createClient } from '@/lib/supabase/client'
import { X, User } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'

export default function ContentTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, data, updateContentField, specialistId } = useSpecialistTranslations()
  
  // Memoize supabase client
  const supabase = useMemo(() => createClient(), [])
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const currentData = data.content[activeLanguage]

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
      if (!specialistId) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', specialistId)
        .single()
      
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
    }
    
    fetchProfileData()
  }, [specialistId, supabase])

  const handleNameChange = (value: string) => {
    updateContentField('full_name', value)
    // Auto-generate slug from name if slug is empty
    if (!currentData?.slug && value) {
      const baseSlug = generateSlug(value)
      // Add language suffix to make slugs unique
      const langSuffix = activeLanguage === 'georgian' ? '-ka' : activeLanguage === 'english' ? '-en' : '-ru'
      const generatedSlug = baseSlug + langSuffix
      updateContentField('slug', generatedSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = generateSlug(value)
    updateContentField('slug', sanitizedSlug)
  }

  // Generate slug from current name with language suffix
  const generateSlugFromName = useCallback(() => {
    if (!currentData?.full_name) {
      // Slug won't be generated without name
      return
    }
    const baseSlug = generateSlug(currentData.full_name)
    const langSuffix = activeLanguage === 'georgian' ? '-ka' : activeLanguage === 'english' ? '-en' : '-ru'
    const generatedSlug = baseSlug + langSuffix
    updateContentField('slug', generatedSlug)
  }, [currentData?.full_name, activeLanguage, updateContentField])

  // Helper to get placeholder text based on active language
  const getPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, Record<typeof activeLanguage, string>> = {
      full_name: {
        georgian: 'სახელი და გვარი ქართულად',
        english: 'Full Name in English',
        russian: 'Полное имя на русском'
      },
      role_title: {
        georgian: 'პოზიცია ქართულად',
        english: 'Position in English',
        russian: 'Должность на русском'
      },
      avatar_alt_text: {
        georgian: 'პროფილის სურათის აღწერა ქართულად',
        english: 'Profile photo description in English',
        russian: 'Описание фото профиля на русском'
      },
      bio: {
        georgian: 'ბიოგრაფია ქართულად',
        english: 'Biography in English',
        russian: 'Биография на русском'
      },
      philosophy: {
        georgian: 'ფილოსოფია ქართულად',
        english: 'Philosophy in English',
        russian: 'Философия на русском'
      },
      focus_areas: {
        georgian: 'კორპორატიული სამართალი\nხელშეკრულებების მოლაპარაკება',
        english: 'Corporate Law\nContract Negotiations',
        russian: 'Корпоративное право\nПереговоры по контрактам'
      },
      representative_matters: {
        georgian: 'წარმოადგინა მთავარი კორპორაცია...\nმოლაპარაკება საერთაშორისო კონტრაქტზე...',
        english: 'Represented major corporation...\nNegotiated international contract...',
        russian: 'Представлял крупную корпорацию...\nВел переговоры по международному контракту...'
      },
      teaching_writing_speaking: {
        georgian: 'სწავლება, წერა და გამოსვლები ქართულად',
        english: 'Teaching, Writing & Speaking in English',
        russian: 'Преподавание, написание и выступления на русском'
      },
      credentials_memberships: {
        georgian: 'ლიცენზირებული ადვოკატი, ადვოკატთა ასოციაცია\nსაერთაშორისო იურიდიული ასოციაციის წევრი',
        english: 'Licensed Attorney, State Bar\nMember of International Legal Association',
        russian: 'Лицензированный адвокат, Коллегия адвокатов\nЧлен Международной юридической ассоциации'
      }
    }
    return placeholders[fieldKey]?.[activeLanguage] || ''
  }

  // Handle focus areas (array from textarea)
  const handleFocusAreasChange = (value: string) => {
    const areas = value.split('\n').filter(line => line.trim())
    updateContentField('focus_areas', areas)
  }

  // Handle representative matters (array from textarea)
  const handleRepresentativeMattersChange = (value: string) => {
    const matters = value.split('\n').filter(line => line.trim())
    updateContentField('representative_matters', matters)
  }

  // Handle credentials (array from textarea)
  const handleCredentialsChange = (value: string) => {
    const credentials = value.split('\n').filter(line => line.trim())
    updateContentField('credentials_memberships', credentials)
  }

  // Add new value field
  const addValueField = () => {
    const newKey = `New Field ${Object.keys(currentData.values_how_we_work).length + 1}`
    updateContentField('values_how_we_work', {
      ...currentData.values_how_we_work,
      [newKey]: ''
    })
  }

  // Remove value field
  const removeValueField = (key: string) => {
    const updated = { ...currentData.values_how_we_work }
    delete updated[key]
    updateContentField('values_how_we_work', updated)
  }

  // Update value field key
  const updateValueFieldKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return
    const updated: Record<string, string> = {}
    Object.entries(currentData.values_how_we_work).forEach(([k, v]) => {
      updated[k === oldKey ? newKey : k] = v
    })
    updateContentField('values_how_we_work', updated)
  }

  // Update value field value
  const updateValueFieldValue = (key: string, value: string) => {
    updateContentField('values_how_we_work', {
      ...currentData.values_how_we_work,
      [key]: value
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Full Name */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          სახელი და გვარი
        </label>
        <input
          type="text"
          value={currentData.full_name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={getPlaceholder('full_name')}
          className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Slug Input - თითოეული ენისთვის ცალ-ცალკე */}
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          <label className={`text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            URL Slug ({activeLanguage === 'georgian' ? 'ქართული' : activeLanguage === 'english' ? 'ინგლისური' : 'რუსული'})
          </label>
          <button
            onClick={generateSlugFromName}
            className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                : 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            🔄 ავტო-გენერაცია
          </button>
        </div>
        <div className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 text-[11px] sm:text-xs rounded-md border ${
          isDark
            ? 'bg-white/5 border-white/20'
            : 'bg-black/10 border-black/10'
        }`}>
          <span className={`hidden sm:inline ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            /specialists/
          </span>
          <span className={`sm:hidden ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            /
          </span>
          <input
            type="text"
            value={currentData?.slug || ''}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="slug-avtomaturad-generirebuli"
            className={`flex-1 min-w-0 bg-transparent border-none outline-none ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
        <p className={`text-[10px] sm:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          💡 დააჭირეთ &ldquo;🔄 ავტო-გენერაცია&rdquo; ღილაკს → slug დაგენერირდება სახელიდან + -{activeLanguage === 'georgian' ? 'ka' : activeLanguage === 'english' ? 'en' : 'ru'} სუფიქსით
        </p>
      </div>

      {/* Role Title */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          პოზიცია
        </label>
        <input
          type="text"
          value={currentData.role_title}
          onChange={(e) => updateContentField('role_title', e.target.value)}
          placeholder={getPlaceholder('role_title')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Avatar Alt Text - With Image Preview */}
      <div className={`rounded-lg border p-2 sm:p-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          {/* Avatar Preview */}
          <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={currentData.avatar_alt_text || 'Profile photo'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`w-5 h-5 sm:w-7 sm:h-7 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[11px] sm:text-xs font-medium mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}>
              📸 პროფილის სურათის Alt
            </h4>
            <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              აღწერეთ რას ასახავს სურათი
            </p>
          </div>
        </div>

        <div>
          <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Alt ტექსტი ({activeLanguage === 'georgian' ? '🇬🇪' : activeLanguage === 'english' ? '🇬🇧' : '🇷🇺'})
          </label>
          <input
            type="text"
            value={currentData.avatar_alt_text}
            onChange={(e) => updateContentField('avatar_alt_text', e.target.value)}
            placeholder={getPlaceholder('avatar_alt_text')}
            className={`w-full rounded-lg border px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black focus:border-black/20'
            }`}
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          ბიოგრაფია
        </label>
        <textarea
          rows={3}
          value={currentData.bio}
          onChange={(e) => updateContentField('bio', e.target.value)}
          placeholder={getPlaceholder('bio')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Philosophy */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          ფილოსოფია
        </label>
        <textarea
          rows={3}
          value={currentData.philosophy}
          onChange={(e) => updateContentField('philosophy', e.target.value)}
          placeholder={getPlaceholder('philosophy')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Focus Areas */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          სპეციალიზაციები (ერთი თითო ხაზზე)
        </label>
        <textarea
          rows={3}
          value={currentData.focus_areas.join('\n')}
          onChange={(e) => handleFocusAreasChange(e.target.value)}
          placeholder={getPlaceholder('focus_areas')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Representative Matters */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          წარმომადგენლობითი საქმეები
        </label>
        <textarea
          rows={3}
          value={currentData.representative_matters.join('\n')}
          onChange={(e) => handleRepresentativeMattersChange(e.target.value)}
          placeholder={getPlaceholder('representative_matters')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Teaching, Writing & Speaking */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          სწავლება, წერა და გამოსვლები
        </label>
        <textarea
          rows={3}
          value={currentData.teaching_writing_speaking}
          onChange={(e) => updateContentField('teaching_writing_speaking', e.target.value)}
          placeholder={getPlaceholder('teaching_writing_speaking')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Credentials & Memberships */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          სერტიფიკატები და წევრობები
        </label>
        <textarea
          rows={3}
          value={currentData.credentials_memberships.join('\n')}
          onChange={(e) => handleCredentialsChange(e.target.value)}
          placeholder={getPlaceholder('credentials_memberships')}
          className={`w-full rounded-lg border px-2.5 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Values & How We Work */}
      <div>
        <label className={`mb-1 sm:mb-1.5 block text-[11px] sm:text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
          ღირებულებები და მუშაობის სტილი
        </label>
        <div className="space-y-2">
          {Object.entries(currentData.values_how_we_work).map(([key, val], index) => (
            <div key={index} className={`flex flex-col sm:flex-row gap-2 sm:items-start p-2 sm:p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateValueFieldKey(key, e.target.value)}
                  placeholder="ველის სახელი"
                  className={`rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm transition-colors font-medium ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-emerald-400 focus:border-white/20'
                      : 'border-black/10 bg-white text-emerald-600 focus:border-black/20'
                  }`}
                />
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateValueFieldValue(key, e.target.value)}
                  placeholder="მნიშვნელობა"
                  className={`rounded-lg border px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                      : 'border-black/10 bg-white text-black focus:border-black/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeValueField(key)}
                className={`self-end sm:self-auto p-1.5 sm:p-2 rounded-lg transition-all hover:scale-110 ${
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
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-all hover:scale-[1.02] ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            <span className="text-lg">+</span>
            ახალი ველი
          </button>
        </div>
      </div>
    </div>
  )
}
