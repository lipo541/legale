'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types
export type LanguageType = 'georgian' | 'english' | 'russian'
export type TabType = 'content' | 'seo' | 'social'

export interface ContentTranslation {
  full_name: string
  role_title: string
  bio: string
  philosophy: string
  teaching_writing_speaking: string
  focus_areas: string[]
  representative_matters: string[]
  credentials_memberships: string[]
  values_how_we_work: Record<string, string>
  avatar_alt_text: string
}

export interface SeoTranslation {
  seo_title: string
  seo_description: string
  seo_keywords: string
}

export interface SocialTranslation {
  social_title: string
  social_description: string
  social_hashtags: string
  social_image_url: string
}

export interface TranslationsData {
  content: {
    georgian: ContentTranslation
    english: ContentTranslation
    russian: ContentTranslation
  }
  seo: {
    georgian: SeoTranslation
    english: SeoTranslation
    russian: SeoTranslation
  }
  social: {
    georgian: SocialTranslation
    english: SocialTranslation
    russian: SocialTranslation
  }
}

interface SpecialistTranslationsContextValue {
  // State
  specialistId: string | null
  specialistName: string
  activeLanguage: LanguageType
  activeTab: TabType
  data: TranslationsData
  loading: boolean
  saving: boolean
  error: string | null

  // Actions
  setActiveLanguage: (lang: LanguageType) => void
  setActiveTab: (tab: TabType) => void
  updateContentField: (field: keyof ContentTranslation, value: string | string[] | Record<string, string>) => void
  updateSeoField: (field: keyof SeoTranslation, value: string) => void
  updateSocialField: (field: keyof SocialTranslation, value: string) => void
  fetchTranslations: (specialistId: string) => Promise<void>
  saveTranslations: () => Promise<void>
  reset: () => void
}

const SpecialistTranslationsContext = createContext<SpecialistTranslationsContextValue | undefined>(undefined)

// Default empty data
const createEmptyContentTranslation = (): ContentTranslation => ({
  full_name: '',
  role_title: '',
  bio: '',
  philosophy: '',
  teaching_writing_speaking: '',
  focus_areas: [],
  representative_matters: [],
  credentials_memberships: [],
  values_how_we_work: {},
  avatar_alt_text: ''
})

const createEmptySeoTranslation = (): SeoTranslation => ({
  seo_title: '',
  seo_description: '',
  seo_keywords: ''
})

const createEmptySocialTranslation = (): SocialTranslation => ({
  social_title: '',
  social_description: '',
  social_hashtags: '',
  social_image_url: ''
})

const createEmptyTranslationsData = (): TranslationsData => ({
  content: {
    georgian: createEmptyContentTranslation(),
    english: createEmptyContentTranslation(),
    russian: createEmptyContentTranslation()
  },
  seo: {
    georgian: createEmptySeoTranslation(),
    english: createEmptySeoTranslation(),
    russian: createEmptySeoTranslation()
  },
  social: {
    georgian: createEmptySocialTranslation(),
    english: createEmptySocialTranslation(),
    russian: createEmptySocialTranslation()
  }
})

export function SpecialistTranslationsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  
  const [specialistId, setSpecialistId] = useState<string | null>(null)
  const [specialistName, setSpecialistName] = useState<string>('')
  const [activeLanguage, setActiveLanguage] = useState<LanguageType>('georgian')
  const [activeTab, setActiveTab] = useState<TabType>('content')
  const [data, setData] = useState<TranslationsData>(createEmptyTranslationsData())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Map language type to database code
  const langToCode = (lang: LanguageType): string => {
    const map = { georgian: 'ka', english: 'en', russian: 'ru' }
    return map[lang]
  }

  const codeToLang = (code: string): LanguageType => {
    const map: Record<string, LanguageType> = { ka: 'georgian', en: 'english', ru: 'russian' }
    return map[code] || 'georgian'
  }

  // Fetch translations from database
  const fetchTranslations = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setSpecialistId(id)

    try {
      // Fetch specialist profile data (for fallback to original Georgian data)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setSpecialistName(profile?.full_name || 'N/A')

      // Fetch all translations for this specialist
      const { data: translations, error: translationsError } = await supabase
        .from('specialist_translations')
        .select('*')
        .eq('specialist_id', id)

      if (translationsError) throw translationsError

      // Create fallback data from profile (original Georgian data)
      const fallbackContent: ContentTranslation = {
        full_name: profile?.full_name || '',
        role_title: profile?.role_title || '',
        bio: profile?.bio || '',
        philosophy: profile?.philosophy || '',
        teaching_writing_speaking: profile?.teaching_writing_speaking || '',
        focus_areas: profile?.focus_areas || [],
        representative_matters: profile?.representative_matters || [],
        credentials_memberships: profile?.credentials_memberships || [],
        values_how_we_work: profile?.values_how_we_work || {},
        avatar_alt_text: profile?.avatar_alt_text || ''
      }

      const fallbackSeo: SeoTranslation = {
        seo_title: profile?.seo_title || '',
        seo_description: profile?.seo_description || '',
        seo_keywords: profile?.seo_keywords || ''
      }

      const fallbackSocial: SocialTranslation = {
        social_title: profile?.social_title || '',
        social_description: profile?.social_description || '',
        social_hashtags: profile?.social_hashtags || '',
        social_image_url: profile?.social_image_url || ''
      }

      // Start with empty data structure
      const newData = createEmptyTranslationsData()
      
      // Set Georgian data from profile as fallback
      newData.content.georgian = fallbackContent
      newData.seo.georgian = fallbackSeo
      newData.social.georgian = fallbackSocial

      // Override with existing translations from database
      translations?.forEach((translation) => {
        const lang = codeToLang(translation.language)

        // Content fields
        newData.content[lang] = {
          full_name: translation.full_name || '',
          role_title: translation.role_title || '',
          bio: translation.bio || '',
          philosophy: translation.philosophy || '',
          teaching_writing_speaking: translation.teaching_writing_speaking || '',
          focus_areas: translation.focus_areas || [],
          representative_matters: translation.representative_matters || [],
          credentials_memberships: translation.credentials_memberships || [],
          values_how_we_work: translation.values_how_we_work || {},
          avatar_alt_text: translation.avatar_alt_text || ''
        }

        // SEO fields
        newData.seo[lang] = {
          seo_title: translation.seo_title || '',
          seo_description: translation.seo_description || '',
          seo_keywords: translation.seo_keywords || ''
        }

        // Social fields
        newData.social[lang] = {
          social_title: translation.social_title || '',
          social_description: translation.social_description || '',
          social_hashtags: translation.social_hashtags || '',
          social_image_url: translation.social_image_url || ''
        }
      })

      setData(newData)
    } catch (err) {
      console.error('Error fetching translations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Update content field
  const updateContentField = useCallback((field: keyof ContentTranslation, value: string | string[] | Record<string, string>) => {
    setData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [activeLanguage]: {
          ...prev.content[activeLanguage],
          [field]: value
        }
      }
    }))
  }, [activeLanguage])

  // Update SEO field
  const updateSeoField = useCallback((field: keyof SeoTranslation, value: string) => {
    setData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [activeLanguage]: {
          ...prev.seo[activeLanguage],
          [field]: value
        }
      }
    }))
  }, [activeLanguage])

  // Update Social field
  const updateSocialField = useCallback((field: keyof SocialTranslation, value: string) => {
    setData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [activeLanguage]: {
          ...prev.social[activeLanguage],
          [field]: value
        }
      }
    }))
  }, [activeLanguage])

  // Save translations to database
  const saveTranslations = useCallback(async () => {
    if (!specialistId) {
      setError('No specialist selected')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // 1. Save GEORGIAN data to profiles table (main table)
      const georgianData = {
        // Content fields
        full_name: data.content.georgian.full_name,
        role_title: data.content.georgian.role_title,
        bio: data.content.georgian.bio,
        philosophy: data.content.georgian.philosophy,
        teaching_writing_speaking: data.content.georgian.teaching_writing_speaking,
        focus_areas: data.content.georgian.focus_areas,
        representative_matters: data.content.georgian.representative_matters,
        credentials_memberships: data.content.georgian.credentials_memberships,
        values_how_we_work: data.content.georgian.values_how_we_work,
        avatar_alt_text: data.content.georgian.avatar_alt_text,
        
        // SEO fields
        seo_title: data.seo.georgian.seo_title,
        seo_description: data.seo.georgian.seo_description,
        seo_keywords: data.seo.georgian.seo_keywords,
        
        // Social fields
        social_title: data.social.georgian.social_title,
        social_description: data.social.georgian.social_description,
        social_hashtags: data.social.georgian.social_hashtags,
        social_image_url: data.social.georgian.social_image_url
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(georgianData)
        .eq('id', specialistId)

      if (profileError) throw profileError

      // 2. Save ENGLISH and RUSSIAN to specialist_translations table
      const otherLanguages: LanguageType[] = ['english', 'russian']
      
      for (const lang of otherLanguages) {
        const translationData = {
          specialist_id: specialistId,
          language: langToCode(lang),
          
          // Content
          full_name: data.content[lang].full_name,
          role_title: data.content[lang].role_title,
          bio: data.content[lang].bio,
          philosophy: data.content[lang].philosophy,
          teaching_writing_speaking: data.content[lang].teaching_writing_speaking,
          focus_areas: data.content[lang].focus_areas,
          representative_matters: data.content[lang].representative_matters,
          credentials_memberships: data.content[lang].credentials_memberships,
          values_how_we_work: data.content[lang].values_how_we_work,
          avatar_alt_text: data.content[lang].avatar_alt_text,
          
          // SEO
          seo_title: data.seo[lang].seo_title,
          seo_description: data.seo[lang].seo_description,
          seo_keywords: data.seo[lang].seo_keywords,
          
          // Social
          social_title: data.social[lang].social_title,
          social_description: data.social[lang].social_description,
          social_hashtags: data.social[lang].social_hashtags,
          social_image_url: data.social[lang].social_image_url
        }

        // Upsert (insert or update)
        const { error: upsertError } = await supabase
          .from('specialist_translations')
          .upsert(translationData, {
            onConflict: 'specialist_id,language'
          })

        if (upsertError) throw upsertError
      }

      // Success notification
      alert('✅ ქართული → profiles table-ში შეინახა\n✅ English/Russian → specialist_translations-ში შეინახა')
    } catch (err) {
      console.error('Error saving translations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      alert('შეცდომა შენახვისას: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }, [specialistId, data, supabase])

  // Reset state
  const reset = useCallback(() => {
    setSpecialistId(null)
    setSpecialistName('')
    setActiveLanguage('georgian')
    setActiveTab('content')
    setData(createEmptyTranslationsData())
    setLoading(false)
    setSaving(false)
    setError(null)
  }, [])

  const value: SpecialistTranslationsContextValue = {
    specialistId,
    specialistName,
    activeLanguage,
    activeTab,
    data,
    loading,
    saving,
    error,
    setActiveLanguage,
    setActiveTab,
    updateContentField,
    updateSeoField,
    updateSocialField,
    fetchTranslations,
    saveTranslations,
    reset
  }

  return (
    <SpecialistTranslationsContext.Provider value={value}>
      {children}
    </SpecialistTranslationsContext.Provider>
  )
}

// Custom hook to use the context
export function useSpecialistTranslations() {
  const context = useContext(SpecialistTranslationsContext)
  if (context === undefined) {
    throw new Error('useSpecialistTranslations must be used within SpecialistTranslationsProvider')
  }
  return context
}
