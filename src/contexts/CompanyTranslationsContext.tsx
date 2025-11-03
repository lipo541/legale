'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Content Translation Interface
export interface CompanyContentTranslation {
  company_name: string
  company_overview: string
  summary: string
  mission_statement: string
  vision_values: string
  history: string
  how_we_work: string
  avatar_alt_text: string
  slug: string
}

// SEO Translation Interface
export interface CompanySeoTranslation {
  meta_title: string
  meta_description: string
  meta_keywords: string
}

// Social Translation Interface
export interface CompanySocialTranslation {
  social_title: string
  social_description: string
  social_hashtags: string
  social_image_url: string | null
}

// Combined Translation Interface
export interface CompanyTranslation {
  content: CompanyContentTranslation
  seo: CompanySeoTranslation
  social: CompanySocialTranslation
}

interface CompanyTranslationsContextType {
  translations: {
    georgian: CompanyTranslation
    english: CompanyTranslation
    russian: CompanyTranslation
  }
  loading: boolean
  saving: boolean
  activeLanguage: 'georgian' | 'english' | 'russian'
  setActiveLanguage: (lang: 'georgian' | 'english' | 'russian') => void
  fetchTranslations: (companyId: string) => Promise<void>
  saveTranslations: (companyId: string) => Promise<boolean>
  updateContentField: (language: 'georgian' | 'english' | 'russian', field: keyof CompanyContentTranslation, value: string) => void
  updateSeoField: (language: 'georgian' | 'english' | 'russian', field: keyof CompanySeoTranslation, value: string) => void
  updateSocialField: (language: 'georgian' | 'english' | 'russian', field: keyof CompanySocialTranslation, value: string | null) => void
}

const CompanyTranslationsContext = createContext<CompanyTranslationsContextType | undefined>(undefined)

const createEmptyContentTranslation = (): CompanyContentTranslation => ({
  company_name: '',
  company_overview: '',
  summary: '',
  mission_statement: '',
  vision_values: '',
  history: '',
  how_we_work: '',
  avatar_alt_text: '',
  slug: ''
})

const createEmptySeoTranslation = (): CompanySeoTranslation => ({
  meta_title: '',
  meta_description: '',
  meta_keywords: ''
})

const createEmptySocialTranslation = (): CompanySocialTranslation => ({
  social_title: '',
  social_description: '',
  social_hashtags: '',
  social_image_url: null
})

const createEmptyTranslation = (): CompanyTranslation => ({
  content: createEmptyContentTranslation(),
  seo: createEmptySeoTranslation(),
  social: createEmptySocialTranslation()
})

export function CompanyTranslationsProvider({ children }: { children: React.ReactNode }) {
  const [translations, setTranslations] = useState({
    georgian: createEmptyTranslation(),
    english: createEmptyTranslation(),
    russian: createEmptyTranslation()
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<'georgian' | 'english' | 'russian'>('georgian')

  const supabase = createClient()

  const fetchTranslations = useCallback(async (companyId: string) => {
    setLoading(true)
    try {
      // Fetch Georgian data from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, company_overview, summary, mission_statement, vision_values, history, how_we_work, avatar_alt_text, meta_title, meta_description, meta_keywords, social_title, social_description, social_hashtags, social_image_url, company_slug')
        .eq('id', companyId)
        .single()

      if (profileError) throw profileError

      // Fallback content for Georgian
      const fallbackContent: CompanyContentTranslation = {
        company_name: profile?.full_name || '',
        company_overview: profile?.company_overview || '',
        summary: profile?.summary || '',
        mission_statement: profile?.mission_statement || '',
        vision_values: profile?.vision_values || '',
        history: profile?.history || '',
        how_we_work: profile?.how_we_work || '',
        avatar_alt_text: profile?.avatar_alt_text || '',
        slug: profile?.company_slug || ''
      }

      const fallbackSeo: CompanySeoTranslation = {
        meta_title: profile?.meta_title || '',
        meta_description: profile?.meta_description || '',
        meta_keywords: profile?.meta_keywords || ''
      }

      const fallbackSocial: CompanySocialTranslation = {
        social_title: profile?.social_title || '',
        social_description: profile?.social_description || '',
        social_hashtags: profile?.social_hashtags || '',
        social_image_url: profile?.social_image_url || null
      }

      // Fetch English and Russian translations
      const { data: translationsData, error: translationsError } = await supabase
        .from('company_translations')
        .select('*')
        .eq('company_id', companyId)
        .in('language', ['en', 'ru'])

      if (translationsError) throw translationsError

      const newTranslations = {
        georgian: {
          content: fallbackContent,
          seo: fallbackSeo,
          social: fallbackSocial
        },
        english: createEmptyTranslation(),
        russian: createEmptyTranslation()
      }

      // Map translations to their respective languages
      translationsData?.forEach((trans) => {
        const content: CompanyContentTranslation = {
          company_name: trans.company_name || '',
          company_overview: trans.company_overview || '',
          summary: trans.summary || '',
          mission_statement: trans.mission_statement || '',
          vision_values: trans.vision_values || '',
          history: trans.history || '',
          how_we_work: trans.how_we_work || '',
          avatar_alt_text: trans.avatar_alt_text || '',
          slug: trans.slug || ''
        }

        const seo: CompanySeoTranslation = {
          meta_title: trans.meta_title || '',
          meta_description: trans.meta_description || '',
          meta_keywords: trans.meta_keywords || ''
        }

        const social: CompanySocialTranslation = {
          social_title: trans.social_title || '',
          social_description: trans.social_description || '',
          social_hashtags: trans.social_hashtags || '',
          social_image_url: trans.social_image_url || null
        }

        if (trans.language === 'en') {
          newTranslations.english = { content, seo, social }
        } else if (trans.language === 'ru') {
          newTranslations.russian = { content, seo, social }
        }
      })

      setTranslations(newTranslations)
    } catch (error) {
      console.error('Error fetching company translations:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const saveTranslations = useCallback(async (companyId: string): Promise<boolean> => {
    setSaving(true)
    try {
      // Save Georgian data to profiles table
      const georgianData = {
        full_name: translations.georgian.content.company_name,
        company_overview: translations.georgian.content.company_overview,
        summary: translations.georgian.content.summary,
        mission_statement: translations.georgian.content.mission_statement,
        vision_values: translations.georgian.content.vision_values,
        history: translations.georgian.content.history,
        how_we_work: translations.georgian.content.how_we_work,
        avatar_alt_text: translations.georgian.content.avatar_alt_text,
        company_slug: translations.georgian.content.slug, // Georgian slug
        meta_title: translations.georgian.seo.meta_title,
        meta_description: translations.georgian.seo.meta_description,
        meta_keywords: translations.georgian.seo.meta_keywords,
        social_title: translations.georgian.social.social_title,
        social_description: translations.georgian.social.social_description,
        social_hashtags: translations.georgian.social.social_hashtags,
        social_image_url: translations.georgian.social.social_image_url
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(georgianData)
        .eq('id', companyId)

      if (profileError) throw profileError

      // Save English translations
      const englishData = {
        company_id: companyId,
        language: 'en',
        company_name: translations.english.content.company_name,
        company_overview: translations.english.content.company_overview,
        summary: translations.english.content.summary,
        mission_statement: translations.english.content.mission_statement,
        vision_values: translations.english.content.vision_values,
        history: translations.english.content.history,
        how_we_work: translations.english.content.how_we_work,
        avatar_alt_text: translations.english.content.avatar_alt_text,
        slug: translations.english.content.slug, // English slug
        meta_title: translations.english.seo.meta_title,
        meta_description: translations.english.seo.meta_description,
        meta_keywords: translations.english.seo.meta_keywords,
        social_title: translations.english.social.social_title,
        social_description: translations.english.social.social_description,
        social_hashtags: translations.english.social.social_hashtags,
        social_image_url: translations.english.social.social_image_url
      }

      const { error: englishError } = await supabase
        .from('company_translations')
        .upsert(englishData, { onConflict: 'company_id,language' })

      if (englishError) throw englishError

      // Save Russian translations
      const russianData = {
        company_id: companyId,
        language: 'ru',
        company_name: translations.russian.content.company_name,
        company_overview: translations.russian.content.company_overview,
        summary: translations.russian.content.summary,
        mission_statement: translations.russian.content.mission_statement,
        vision_values: translations.russian.content.vision_values,
        history: translations.russian.content.history,
        how_we_work: translations.russian.content.how_we_work,
        avatar_alt_text: translations.russian.content.avatar_alt_text,
        slug: translations.russian.content.slug, // Russian slug
        meta_title: translations.russian.seo.meta_title,
        meta_description: translations.russian.seo.meta_description,
        meta_keywords: translations.russian.seo.meta_keywords,
        social_title: translations.russian.social.social_title,
        social_description: translations.russian.social.social_description,
        social_hashtags: translations.russian.social.social_hashtags,
        social_image_url: translations.russian.social.social_image_url
      }

      const { error: russianError } = await supabase
        .from('company_translations')
        .upsert(russianData, { onConflict: 'company_id,language' })

      if (russianError) throw russianError

      return true
    } catch (error) {
      console.error('Error saving company translations:', error)
      return false
    } finally {
      setSaving(false)
    }
  }, [translations, supabase])

  const updateContentField = useCallback((
    language: 'georgian' | 'english' | 'russian',
    field: keyof CompanyContentTranslation,
    value: string
  ) => {
    setTranslations(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        content: {
          ...prev[language].content,
          [field]: value
        }
      }
    }))
  }, [])

  const updateSeoField = useCallback((
    language: 'georgian' | 'english' | 'russian',
    field: keyof CompanySeoTranslation,
    value: string
  ) => {
    setTranslations(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        seo: {
          ...prev[language].seo,
          [field]: value
        }
      }
    }))
  }, [])

  const updateSocialField = useCallback((
    language: 'georgian' | 'english' | 'russian',
    field: keyof CompanySocialTranslation,
    value: string | null
  ) => {
    setTranslations(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        social: {
          ...prev[language].social,
          [field]: value
        }
      }
    }))
  }, [])

  return (
    <CompanyTranslationsContext.Provider
      value={{
        translations,
        loading,
        saving,
        activeLanguage,
        setActiveLanguage,
        fetchTranslations,
        saveTranslations,
        updateContentField,
        updateSeoField,
        updateSocialField
      }}
    >
      {children}
    </CompanyTranslationsContext.Provider>
  )
}

export function useCompanyTranslations() {
  const context = useContext(CompanyTranslationsContext)
  if (context === undefined) {
    throw new Error('useCompanyTranslations must be used within a CompanyTranslationsProvider')
  }
  return context
}
