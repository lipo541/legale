'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useSpecialistTranslations } from '@/contexts/SpecialistTranslationsContext'
import { createClient } from '@/lib/supabase/client'
import { X, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ContentTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeLanguage, data, updateContentField, specialistId } = useSpecialistTranslations()
  const supabase = createClient()
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [currentSlug, setCurrentSlug] = useState<string>('')
  const [isSlugEditable, setIsSlugEditable] = useState(false)

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

  // Fetch avatar URL and current slug from profiles
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!specialistId) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, slug')
        .eq('id', specialistId)
        .single()
      
      if (profile) {
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
        if (profile.slug) setCurrentSlug(profile.slug)
      }
    }
    
    fetchProfileData()
  }, [specialistId, supabase])

  const handleNameChange = (value: string) => {
    updateContentField('full_name', value)
    // Auto-generate slug from name if not in editable mode
    if (!isSlugEditable && value) {
      const generatedSlug = generateSlug(value)
      setCurrentSlug(generatedSlug)
    }
  }

  const handleSlugChange = async (value: string) => {
    const sanitizedSlug = generateSlug(value)
    setCurrentSlug(sanitizedSlug)
  }

  const handleSlugSave = async () => {
    if (!specialistId || !currentSlug) return

    const { error } = await supabase
      .from('profiles')
      .update({ slug: currentSlug })
      .eq('id', specialistId)

    if (error) {
      console.error('Error updating slug:', error)
      alert('შეცდომა slug-ის განახლებისას')
    } else {
      alert(`Slug წარმატებით განახლდა: ${currentSlug}`)
    }
  }

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
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          სახელი და გვარი
        </label>
        <input
          type="text"
          value={currentData.full_name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={getPlaceholder('full_name')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Slug Input - როგორც posts-ში */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            URL Slug (სამივე ენისთვის)
          </label>
          <button
            type="button"
            onClick={() => setIsSlugEditable(!isSlugEditable)}
            className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
              isDark
                ? 'text-emerald-400 hover:bg-emerald-500/10'
                : 'text-emerald-600 hover:bg-emerald-500/10'
            }`}
          >
            {isSlugEditable ? '🔓 ხელით' : '🔒 ავტო'}
          </button>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md border ${
          isDark
            ? 'bg-white/5 border-white/20'
            : 'bg-black/5 border-black/10'
        }`}>
          <span className={`${isDark ? 'text-white/40' : 'text-black/40'}`}>
            /specialists/
          </span>
          {isSlugEditable ? (
            <input
              type="text"
              value={currentSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="slug-avtomaturad-generirebuli"
              className={`flex-1 bg-transparent border-none outline-none ${
                isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
              }`}
            />
          ) : (
            <span className={`flex-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {currentSlug || 'slug-avtomaturad-generirebuli'}
            </span>
          )}
        </div>
        {isSlugEditable && (
          <button
            type="button"
            onClick={handleSlugSave}
            disabled={!currentSlug}
            className={`w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            }`}
          >
            💾 Slug-ის შენახვა
          </button>
        )}
        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          💡 Slug ავტომატურად გენერირდება სახელიდან. გსურთ თუ არა ხელით რედაქტირება, დააჭირეთ 🔓 ხელით.
        </p>
      </div>

      {/* Role Title */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          პოზიცია
        </label>
        <input
          type="text"
          value={currentData.role_title}
          onChange={(e) => updateContentField('role_title', e.target.value)}
          placeholder={getPlaceholder('role_title')}
          className={`w-full rounded-lg border px-4 py-2 transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Avatar Alt Text - With Image Preview */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar Preview */}
          <div className={`flex-shrink-0 w-20 h-20 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={currentData.avatar_alt_text || 'Profile photo'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className={`w-10 h-10 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              📸 პროფილის სურათის Alt ტექსტი
            </h4>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              აღწერეთ რას ასახავს პროფილის სურათი (Accessibility & SEO)
            </p>
          </div>
        </div>

        <div>
          <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            Alt ტექსტი ({activeLanguage === 'georgian' ? '🇬🇪 ქართული' : activeLanguage === 'english' ? '🇬🇧 English' : '🇷🇺 Русский'})
          </label>
          <input
            type="text"
            value={currentData.avatar_alt_text}
            onChange={(e) => updateContentField('avatar_alt_text', e.target.value)}
            placeholder={getPlaceholder('avatar_alt_text')}
            className={`w-full rounded-lg border px-4 py-2 transition-colors ${
              isDark
                ? 'border-white/10 bg-white/5 text-white focus:border-blue-400'
                : 'border-black/10 bg-black/5 text-black focus:border-blue-600'
            }`}
          />
          <div className="mt-2 flex items-start gap-2">
            <span className="text-xs">💡</span>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              მაგალითი: &ldquo;ადვოკატ გიორგი გელაშვილი ოფისში&rdquo;, &ldquo;Attorney Giorgi Gelashvili in office&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ბიოგრაფია
        </label>
        <textarea
          rows={5}
          value={currentData.bio}
          onChange={(e) => updateContentField('bio', e.target.value)}
          placeholder={getPlaceholder('bio')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Philosophy */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ფილოსოფია
        </label>
        <textarea
          rows={5}
          value={currentData.philosophy}
          onChange={(e) => updateContentField('philosophy', e.target.value)}
          placeholder={getPlaceholder('philosophy')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Focus Areas */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          სპეციალიზაციები (ერთი თითო ხაზზე)
        </label>
        <textarea
          rows={4}
          value={currentData.focus_areas.join('\n')}
          onChange={(e) => handleFocusAreasChange(e.target.value)}
          placeholder={getPlaceholder('focus_areas')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Representative Matters */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          წარმომადგენლობითი საქმეები (ერთი თითო ხაზზე)
        </label>
        <textarea
          rows={4}
          value={currentData.representative_matters.join('\n')}
          onChange={(e) => handleRepresentativeMattersChange(e.target.value)}
          placeholder={getPlaceholder('representative_matters')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Teaching, Writing & Speaking */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          სწავლება, წერა და გამოსვლები
        </label>
        <textarea
          rows={5}
          value={currentData.teaching_writing_speaking}
          onChange={(e) => updateContentField('teaching_writing_speaking', e.target.value)}
          placeholder={getPlaceholder('teaching_writing_speaking')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Credentials & Memberships */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          სერტიფიკატები და წევრობები (ერთი თითო ხაზზე)
        </label>
        <textarea
          rows={4}
          value={currentData.credentials_memberships.join('\n')}
          onChange={(e) => handleCredentialsChange(e.target.value)}
          placeholder={getPlaceholder('credentials_memberships')}
          className={`w-full rounded-lg border px-4 py-3 transition-colors resize-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
              : 'border-black/10 bg-black/5 text-black focus:border-black/20'
          }`}
        />
      </div>

      {/* Values & How We Work */}
      <div>
        <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          ღირებულებები და მუშაობის სტილი
        </label>
        <div className="space-y-3">
          {Object.entries(currentData.values_how_we_work).map(([key, val], index) => (
            <div key={index} className={`flex gap-2 items-start p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateValueFieldKey(key, e.target.value)}
                  placeholder="ველის სახელი"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors font-medium ${
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
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                      : 'border-black/10 bg-white text-black focus:border-black/20'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeValueField(key)}
                className={`p-2 rounded-lg transition-all hover:scale-110 ${
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            <span className="text-lg">+</span>
            ახალი ველის დამატება
          </button>
        </div>
      </div>
    </div>
  )
}
