'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import TeamListPage from './TeamListPage'
import { 
  Plus, 
  Trash2, 
  Users, 
  UserPlus, 
  X,
  Save,
  Loader2,
  ChevronDown,
  Search,
  Image as ImageIcon,
  RefreshCw,
  List
} from 'lucide-react'

type Language = 'ka' | 'en' | 'ru'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
  company_slug: string | null
}

interface TeamTranslation {
  name: string
  title: string
  description: string
  slug: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  bannerAlt: string
  bannerImageUrl: string
}

interface SectionTranslation {
  title: string
}

interface TeamSection {
  id: string // Temporary ID for UI (will be UUID in DB)
  translations: Record<Language, SectionTranslation>
  memberIds: string[]
  order: number
}

interface TeamFormData {
  leaderId: string | null
  translations: Record<Language, TeamTranslation>
  sections: TeamSection[]
  ogImageUrl: string
}

const languageLabels: Record<Language, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
}

export default function TeamCreatePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [activeLanguage, setActiveLanguage] = useState<Language>('ka')
  const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'seo'>('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // View state - 'create' or 'list'
  const [view, setView] = useState<'create' | 'list'>('create')
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<TeamFormData>({
    leaderId: null,
    translations: {
      ka: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
      en: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
      ru: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
    },
    sections: [],
    ogImageUrl: ''
  })

  // Specialists data
  const [specialists, setSpecialists] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Image states - separate for each language
  const [bannerImages, setBannerImages] = useState<Record<Language, File | null>>({
    ka: null,
    en: null,
    ru: null
  })
  const [bannerImagePreviews, setBannerImagePreviews] = useState<Record<Language, string>>({
    ka: '',
    en: '',
    ru: ''
  })
  const [uploadingBanner, setUploadingBanner] = useState(false)
  
  // OG Image states
  const [ogImage, setOgImage] = useState<File | null>(null)
  const [ogImagePreview, setOgImagePreview] = useState<string>('')
  const [uploadingOgImage, setUploadingOgImage] = useState(false)
  
  // UI states
  const [showLeaderModal, setShowLeaderModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)

  // Fetch all specialists
  useEffect(() => {
    fetchSpecialists()
  }, [])

  // Load team for editing
  const handleEdit = async (teamId: string) => {
    setLoading(true)
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_translations (*),
          team_sections (
            *,
            team_section_translations (*),
            team_members (*)
          )
        `)
        .eq('id', teamId)
        .single()

      if (error) throw error

      // Populate translations
      const translations: Record<Language, TeamTranslation> = {
        ka: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
        en: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
        ru: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team.team_translations?.forEach((t: any) => {
        translations[t.language as Language] = {
          name: t.name || '',
          title: t.title || '',
          description: t.description || '',
          slug: t.slug || '',
          metaTitle: t.meta_title || '',
          metaDescription: t.meta_description || '',
          ogTitle: t.og_title || '',
          ogDescription: t.og_description || '',
          bannerAlt: t.banner_alt || '',
          bannerImageUrl: t.banner_image_url || ''
        }
        // Set banner preview
        if (t.banner_image_url) {
          setBannerImagePreviews(prev => ({ ...prev, [t.language]: t.banner_image_url }))
        }
      })

      // Populate sections
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sections: TeamSection[] = team.team_sections?.map((section: any) => {
        const sectionTranslations: Record<Language, SectionTranslation> = {
          ka: { title: '' },
          en: { title: '' },
          ru: { title: '' }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        section.team_section_translations?.forEach((t: any) => {
          sectionTranslations[t.language as Language] = { title: t.title || '' }
        })

        return {
          id: section.id,
          translations: sectionTranslations,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          memberIds: section.team_members?.map((m: any) => m.profile_id) || [],
          order: section.order || 0
        }
      }) || []

      setFormData({
        leaderId: team.leader_id,
        translations,
        sections,
        ogImageUrl: team.og_image_url || ''
      })

      setEditingTeamId(teamId)
      setOgImagePreview(team.og_image_url || '')
      setView('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error loading team:', error)
      alert('გუნდის ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  // Fetch specialists from database
  const fetchSpecialists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, company_slug')
        .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
        .order('full_name', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setSpecialists(data || [])
    } catch (error) {
      console.error('Error fetching specialists:', error)
    }
  }

  // Auto-generate slug from name
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

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          name: value
        }
      }
    }))
    
    // Auto-generate slug only if slug is empty
    if (!currentTranslation.slug && value) {
      const baseSlug = generateSlug(value)
      const langSuffix = activeLanguage === 'ka' ? '-ka' : activeLanguage === 'en' ? '-en' : '-ru'
      const generatedSlug = baseSlug + langSuffix
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [activeLanguage]: {
            ...prev.translations[activeLanguage],
            slug: generatedSlug
          }
        }
      }))
    }
  }

  const handleSlugChange = (value: string) => {
    const sanitizedSlug = generateSlug(value)
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          slug: sanitizedSlug
        }
      }
    }))
  }

  const generateSlugFromName = () => {
    if (!currentTranslation.name) {
      alert('გთხოვთ ჯერ შეიყვანოთ გუნდის სახელი')
      return
    }
    const baseSlug = generateSlug(currentTranslation.name)
    const langSuffix = activeLanguage === 'ka' ? '-ka' : activeLanguage === 'en' ? '-en' : '-ru'
    const generatedSlug = baseSlug + langSuffix
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          slug: generatedSlug
        }
      }
    }))
  }

  // Handle banner image upload for current language
  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('გთხოვთ აირჩიოთ სურათი')
      return
    }

    setUploadingBanner(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `banner-${activeLanguage}-${Date.now()}.${fileExt}`
      const filePath = `teams/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('createteam')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        alert('სურათის ატვირთვა ვერ მოხერხდა')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('createteam')
        .getPublicUrl(data.path)

      // Save file info and preview
      setBannerImages(prev => ({ ...prev, [activeLanguage]: file }))
      setBannerImagePreviews(prev => ({ ...prev, [activeLanguage]: publicUrl }))
      
      // Save URL to form data
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [activeLanguage]: {
            ...prev.translations[activeLanguage],
            bannerImageUrl: publicUrl
          }
        }
      }))

      console.log('Banner uploaded successfully:', publicUrl)
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('დაფიქსირდა შეცდომა სურათის ატვირთვისას')
    } finally {
      setUploadingBanner(false)
    }
  }

  // Remove banner image for current language
  const removeBannerImage = async () => {
    const currentUrl = formData.translations[activeLanguage].bannerImageUrl
    
    if (currentUrl) {
      try {
        // Extract file path from URL
        const urlParts = currentUrl.split('/createteam/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          // Delete from storage
          await supabase.storage
            .from('createteam')
            .remove([filePath])
        }
      } catch (error) {
        console.error('Error deleting banner:', error)
      }
    }

    setBannerImages(prev => ({ ...prev, [activeLanguage]: null }))
    setBannerImagePreviews(prev => ({ ...prev, [activeLanguage]: '' }))
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          bannerImageUrl: ''
        }
      }
    }))
  }

  // Handle OG image upload
  const handleOgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('გთხოვთ აირჩიოთ სურათი')
      return
    }

    setUploadingOgImage(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `og-image-${Date.now()}.${fileExt}`
      const filePath = `teams/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('createteam')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        alert('სურათის ატვირთვა ვერ მოხერხდა')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('createteam')
        .getPublicUrl(data.path)

      // Save file info and preview
      setOgImage(file)
      setOgImagePreview(publicUrl)
      
      // Save URL to form data
      setFormData(prev => ({
        ...prev,
        ogImageUrl: publicUrl
      }))

      console.log('OG image uploaded successfully:', publicUrl)
    } catch (error) {
      console.error('Error uploading OG image:', error)
      alert('დაფიქსირდა შეცდომა სურათის ატვირთვისას')
    } finally {
      setUploadingOgImage(false)
    }
  }

  // Remove OG image
  const removeOgImage = async () => {
    const currentUrl = formData.ogImageUrl
    
    if (currentUrl) {
      try {
        // Extract file path from URL
        const urlParts = currentUrl.split('/createteam/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          
          // Delete from storage
          await supabase.storage
            .from('createteam')
            .remove([filePath])
        }
      } catch (error) {
        console.error('Error deleting OG image:', error)
      }
    }

    setOgImage(null)
    setOgImagePreview('')
    setFormData(prev => ({
      ...prev,
      ogImageUrl: ''
    }))
  }

  // Add new section
  const addSection = () => {
    const newSection: TeamSection = {
      id: `temp-${Date.now()}`,
      translations: {
        ka: { title: '' },
        en: { title: '' },
        ru: { title: '' }
      },
      memberIds: [],
      order: formData.sections.length
    }
    
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }))
  }

  // Remove section
  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }))
  }

  // Update section translation
  const updateSectionTranslation = (sectionId: string, language: Language, title: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              translations: {
                ...section.translations,
                [language]: { title }
              }
            }
          : section
      )
    }))
  }

  // Toggle member in section
  const toggleMember = (sectionId: string, memberId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              memberIds: section.memberIds.includes(memberId)
                ? section.memberIds.filter(id => id !== memberId)
                : [...section.memberIds, memberId]
            }
          : section
      )
    }))
  }

  // Save team
  const handleSave = async () => {
    setSaving(true)
    try {
      // Validation
      if (!formData.leaderId) {
        alert('გთხოვთ აირჩიოთ გუნდის ლიდერი')
        setSaving(false)
        return
      }

      if (!formData.translations.ka.bannerImageUrl) {
        alert('გთხოვთ ატვირთოთ ბანერის სურათი ქართულ ენაზე')
        setSaving(false)
        return
      }

      if (!formData.translations.ka.name || !formData.translations.ka.title) {
        alert('გთხოვთ შეავსოთ სავალდებულო ველები ქართულ ენაზე')
        setSaving(false)
        return
      }

      if (editingTeamId) {
        // UPDATE existing team
        await handleUpdate(editingTeamId)
      } else {
        // INSERT new team
        await handleInsert()
      }

      alert('გუნდი წარმატებით შეინახა!')
      
      // Reset form
      setFormData({
        leaderId: null,
        translations: {
          ka: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
          en: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
          ru: { name: '', title: '', description: '', slug: '', metaTitle: '', metaDescription: '', ogTitle: '', ogDescription: '', bannerAlt: '', bannerImageUrl: '' },
        },
        sections: [],
        ogImageUrl: ''
      })
      setBannerImages({ ka: null, en: null, ru: null })
      setBannerImagePreviews({ ka: '', en: '', ru: '' })
      setOgImage(null)
      setOgImagePreview('')
      setEditingTeamId(null)
      
    } catch (error) {
      console.error('Error saving team:', error)
      alert(error instanceof Error ? error.message : 'შეცდომა გუნდის შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  const handleInsert = async () => {
    console.log('Starting team insert...', formData)

    // Step 1: Insert team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        leader_id: formData.leaderId,
        og_image_url: formData.ogImageUrl || null
      })
      .select()
      .single()

    if (teamError) {
      console.error('Team insert error:', JSON.stringify(teamError, null, 2))
      throw new Error('გუნდის შექმნა ვერ მოხერხდა')
    }

    if (!teamData) {
      throw new Error('გუნდის მონაცემები არ დაბრუნდა')
    }

    console.log('Team created:', teamData)

    // Step 2: Insert translations for each language
    const translationsToInsert = Object.entries(formData.translations).map(([lang, translation]) => ({
      team_id: teamData.id,
      language: lang,
      name: translation.name,
      title: translation.title,
      description: translation.description || null,
      slug: translation.slug,
      meta_title: translation.metaTitle || null,
      meta_description: translation.metaDescription || null,
      og_title: translation.ogTitle || null,
      og_description: translation.ogDescription || null,
      banner_image_url: translation.bannerImageUrl || null,
      banner_alt: translation.bannerAlt || null
    }))

    const { error: translationsError } = await supabase
      .from('team_translations')
      .insert(translationsToInsert)

    if (translationsError) {
      console.error('Translations insert error:', translationsError)
      await supabase.from('teams').delete().eq('id', teamData.id)
      throw new Error('თარგმანების შენახვა ვერ მოხერხდა')
    }

    // Step 3: Insert sections and their translations
    for (const section of formData.sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('team_sections')
        .insert({
          team_id: teamData.id,
          order: section.order
        })
        .select()
        .single()

      if (sectionError) {
        console.error('Section insert error:', sectionError)
        await supabase.from('teams').delete().eq('id', teamData.id)
        throw new Error('სექციების შენახვა ვერ მოხერხდა')
      }

      // Insert section translations
      const sectionTranslations = Object.entries(section.translations).map(([lang, trans]) => ({
        section_id: sectionData.id,
        language: lang,
        title: trans.title
      }))

      const { error: sectionTransError } = await supabase
        .from('team_section_translations')
        .insert(sectionTranslations)

      if (sectionTransError) {
        console.error('Section translations error:', sectionTransError)
        await supabase.from('teams').delete().eq('id', teamData.id)
        throw new Error('სექციების თარგმანების შენახვა ვერ მოხერხდა')
      }

      // Insert section members
      if (section.memberIds.length > 0) {
        const memberInserts = section.memberIds.map((memberId, index) => ({
          section_id: sectionData.id,
          profile_id: memberId,
          order: index
        }))

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts)

        if (membersError) {
          console.error('Members insert error:', membersError)
          await supabase.from('teams').delete().eq('id', teamData.id)
          throw new Error('წევრების შენახვა ვერ მოხერხდა')
        }
      }
    }
  }

  const handleUpdate = async (teamId: string) => {
    console.log('Starting team update...', teamId, formData)

    // Step 1: Update team
    const { error: teamError } = await supabase
      .from('teams')
      .update({
        leader_id: formData.leaderId,
        og_image_url: formData.ogImageUrl || null
      })
      .eq('id', teamId)

    if (teamError) {
      console.error('Team update error:', teamError)
      throw new Error('გუნდის განახლება ვერ მოხერხდა')
    }

    // Step 2: Update translations (upsert)
    for (const [lang, translation] of Object.entries(formData.translations)) {
      const { error: transError } = await supabase
        .from('team_translations')
        .upsert({
          team_id: teamId,
          language: lang,
          name: translation.name,
          title: translation.title,
          description: translation.description || null,
          slug: translation.slug,
          meta_title: translation.metaTitle || null,
          meta_description: translation.metaDescription || null,
          og_title: translation.ogTitle || null,
          og_description: translation.ogDescription || null,
          banner_image_url: translation.bannerImageUrl || null,
          banner_alt: translation.bannerAlt || null
        }, {
          onConflict: 'team_id,language'
        })

      if (transError) {
        console.error('Translation update error:', transError)
        throw new Error('თარგმანების განახლება ვერ მოხერხდა')
      }
    }

    // Step 3: Delete old sections and insert new ones
    const { error: deleteSectionsError } = await supabase
      .from('team_sections')
      .delete()
      .eq('team_id', teamId)

    if (deleteSectionsError) {
      console.error('Delete sections error:', deleteSectionsError)
      throw new Error('ძველი სექციების წაშლა ვერ მოხერხდა')
    }

    // Step 4: Insert new sections
    for (const section of formData.sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('team_sections')
        .insert({
          team_id: teamId,
          order: section.order
        })
        .select()
        .single()

      if (sectionError) {
        console.error('Section insert error:', sectionError)
        throw new Error('სექციების შენახვა ვერ მოხერხდა')
      }

      // Insert section translations
      const sectionTranslations = Object.entries(section.translations).map(([lang, trans]) => ({
        section_id: sectionData.id,
        language: lang,
        title: trans.title
      }))

      const { error: sectionTransError } = await supabase
        .from('team_section_translations')
        .insert(sectionTranslations)

      if (sectionTransError) {
        console.error('Section translations error:', sectionTransError)
        throw new Error('სექციების თარგმანების შენახვა ვერ მოხერხდა')
      }

      // Insert section members
      if (section.memberIds.length > 0) {
        const memberInserts = section.memberIds.map((memberId, index) => ({
          section_id: sectionData.id,
          profile_id: memberId,
          order: index
        }))

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(memberInserts)

        if (membersError) {
          console.error('Members insert error:', membersError)
          throw new Error('წევრების შენახვა ვერ მოხერხდა')
        }
      }
    }
  }

  const filteredSpecialists = specialists.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedLeader = specialists.find(s => s.id === formData.leaderId)
  const currentTranslation = formData.translations[activeLanguage]

  // Show list view
  if (view === 'list') {
    return <TeamListPage onEdit={handleEdit} onBack={() => setView('create')} />
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {editingTeamId ? 'გუნდის რედაქტირება' : 'გუნდის შექმნა'}
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {editingTeamId ? 'შეცვალეთ გუნდის ინფორმაცია' : 'შექმენით გუნდი და დაამატეთ სპეციალისტები'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
              isDark
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
            }`}
          >
            <List className="h-5 w-5" />
            არსებული გუნდები
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
              isDark
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                შენახვა...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {editingTeamId ? 'განახლება' : 'შენახვა'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'general'
              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
              : isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Users className="h-4 w-4" />
          ძირითადი ინფორმაცია
          {activeTab === 'general' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'sections'
              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
              : isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          სექციები და წევრები
          {activeTab === 'sections' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'seo'
              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
              : isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
          }`}
        >
          <Search className="h-4 w-4" />
          SEO & OG
          {activeTab === 'seo' && (
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
          )}
        </button>
      </div>

      {/* Language Tabs */}
      <div className="flex gap-2 mb-6">
        {(['ka', 'en', 'ru'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLanguage(lang)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeLanguage === lang
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-600'
                : isDark
                ? 'bg-white/5 text-white/60 hover:bg-white/10'
                : 'bg-black/5 text-black/60 hover:bg-black/10'
            }`}
          >
            {languageLabels[lang]}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Banner Image Upload - per language */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                ბანერის სურათი ({languageLabels[activeLanguage]}) *
              </label>
              <p className={`text-xs mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                ეს ბანერი გამოჩნდება სიახლეების გვერდზე {languageLabels[activeLanguage]} ენაზე. დაჭერისას მომხმარებელი გადავა გუნდის გვერდზე.
              </p>
              
              {bannerImagePreviews[activeLanguage] ? (
                <div className="relative">
                  <img
                    src={bannerImagePreviews[activeLanguage]}
                    alt="Banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeBannerImage}
                    disabled={uploadingBanner}
                    className={`absolute top-2 right-2 p-2 rounded-lg ${
                      isDark ? 'bg-red-500/80 hover:bg-red-500' : 'bg-red-500/80 hover:bg-red-500'
                    } text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    რეკომენდებული ზომა: 1200x400px
                  </div>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-all ${
                    uploadingBanner
                      ? 'cursor-wait opacity-50'
                      : isDark
                      ? 'border-white/20 hover:border-emerald-500/50 bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'border-black/20 hover:border-emerald-500/50 bg-black/5 hover:bg-black/10 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingBanner ? (
                      <>
                        <Loader2 className={`h-12 w-12 mb-3 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ატვირთვა...
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={`h-12 w-12 mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                        <p className={`mb-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                          <span className="font-semibold">დააჭირეთ ატვირთვისთვის</span>
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          PNG, JPG, WEBP (მაქს. 5MB)
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          რეკომენდებული: 1200x400px
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    disabled={uploadingBanner}
                  />
                </label>
              )}
            </div>

            {/* Leader Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                გუნდის ლიდერი *
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowLeaderModal(!showLeaderModal)}
                  type="button"
                  className={`w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      : 'bg-black/5 border-black/10 hover:bg-black/10 text-black'
                  }`}
                >
                  <span className={formData.leaderId ? '' : isDark ? 'text-white/40' : 'text-black/40'}>
                    {formData.leaderId
                      ? specialists.find(s => s.id === formData.leaderId)?.full_name || 'არჩეული ლიდერი'
                      : 'აირჩიეთ გუნდის ლიდერი'}
                  </span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showLeaderModal ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showLeaderModal && (
                  <div className={`absolute z-50 w-full mt-2 rounded-lg border shadow-lg max-h-80 overflow-y-auto ${
                    isDark ? 'bg-gray-800 border-white/10' : 'bg-white border-black/10'
                  }`}>
                    {/* Search */}
                    <div className="p-3 border-b border-white/10">
                      <input
                        type="text"
                        placeholder="ძებნა..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border transition-all ${
                          isDark
                            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-emerald-500'
                            : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    {/* Specialists List */}
                    <div className="p-2">
                      {specialists.length === 0 ? (
                        <div className={`p-4 text-center ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                          სპეციალისტები არ მოიძებნა
                        </div>
                      ) : (
                        filteredSpecialists.map((specialist) => (
                          <label
                            key={specialist.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                            } ${formData.leaderId === specialist.id ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10' : ''}`}
                          >
                            <input
                              type="radio"
                              name="leader"
                              checked={formData.leaderId === specialist.id}
                              onChange={() => {
                                setFormData(prev => ({ ...prev, leaderId: specialist.id }))
                                setShowLeaderModal(false)
                                setSearchTerm('')
                              }}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {specialist.full_name || specialist.email}
                              </div>
                              {specialist.role === 'SPECIALIST' && (
                                <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                  კომპანიის სპეციალისტი
                                </div>
                              )}
                              {specialist.role === 'SOLO_SPECIALIST' && (
                                <div className={`text-sm ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                                  დამოუკიდებელი სპეციალისტი
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                გუნდის სახელი ({languageLabels[activeLanguage]}) *
              </label>
              <input
                type="text"
                value={currentTranslation.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40'
                }`}
                placeholder="მაგ: გიორგი ჩომახაშვილის გუნდი"
              />
            </div>

            {/* H1 Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                H1 სათაური ({languageLabels[activeLanguage]}) *
              </label>
              <input
                type="text"
                value={currentTranslation.title}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        title: e.target.value
                      }
                    }
                  }))
                }}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40'
                }`}
                placeholder="მთავარი სათაური"
              />
            </div>

            {/* Slug with Generate Button */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                URL Slug ({languageLabels[activeLanguage]})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentTranslation.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`flex-1 rounded-lg border px-4 py-3 ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40'
                  }`}
                  placeholder="avtomaturi-generireba-saxelidan"
                />
                <button
                  onClick={generateSlugFromName}
                  type="button"
                  className={`px-4 py-3 rounded-lg border transition-all whitespace-nowrap ${
                    isDark
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                  }`}
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                ავტომატურად გენერირდება სახელიდან. ღილაკზე დაჭერით შეგიძლიათ ხელახლა გენერირება
              </p>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                აღწერა ({languageLabels[activeLanguage]})
              </label>
              <textarea
                value={currentTranslation.description}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        description: e.target.value
                      }
                    }
                  }))
                }}
                rows={4}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                    : 'border-black/10 bg-white text-black placeholder:text-black/40'
                }`}
                placeholder="გუნდის აღწერა..."
              />
            </div>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            {/* Add Section Button */}
            <button
              onClick={addSection}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
              }`}
            >
              <Plus className="h-4 w-4" />
              სექციის დამატება
            </button>

            {/* Sections List */}
            {formData.sections.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>სექციები ჯერ არ არის დამატებული</p>
                <p className="text-sm mt-1">დააჭირეთ &quot;სექციის დამატება&quot; ღილაკს</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.sections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border p-4 ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
                    }`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                        სექცია #{section.order + 1}
                      </h3>
                      <button
                        onClick={() => removeSection(section.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-500/10 text-red-600'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Section Title */}
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        სათაური ({languageLabels[activeLanguage]})
                      </label>
                      <input
                        type="text"
                        value={section.translations[activeLanguage].title}
                        onChange={(e) => updateSectionTranslation(section.id, activeLanguage, e.target.value)}
                        className={`w-full rounded-lg border px-4 py-2 ${
                          isDark
                            ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                            : 'border-black/10 bg-white text-black placeholder:text-black/40'
                        }`}
                        placeholder="მაგ: აღმასრულებელი საბჭო"
                      />
                    </div>

                    {/* Members */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                          წევრები ({section.memberIds.length})
                        </label>
                        <button
                          onClick={() => {
                            setCurrentSectionId(section.id)
                            setShowMemberModal(true)
                          }}
                          className={`text-sm flex items-center gap-1 ${
                            isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          წევრის დამატება
                        </button>
                      </div>
                      
                      {section.memberIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {section.memberIds.map(memberId => {
                            const member = specialists.find(s => s.id === memberId)
                            if (!member) return null
                            return (
                              <span
                                key={memberId}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                                  isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                                }`}
                              >
                                {member.full_name || member.email}
                                <button
                                  onClick={() => toggleMember(section.id, memberId)}
                                  className="hover:opacity-70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            {/* Meta Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                Meta Title ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={currentTranslation.metaTitle}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        metaTitle: e.target.value
                      }
                    }
                  }))
                }}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
                placeholder="SEO სათაური"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                Meta Description ({languageLabels[activeLanguage]})
              </label>
              <textarea
                value={currentTranslation.metaDescription}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        metaDescription: e.target.value
                      }
                    }
                  }))
                }}
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
                placeholder="SEO აღწერა"
              />
            </div>

            {/* OG Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                OG Title ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={currentTranslation.ogTitle}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        ogTitle: e.target.value
                      }
                    }
                  }))
                }}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
                placeholder="Open Graph სათაური"
              />
            </div>

            {/* OG Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                OG Description ({languageLabels[activeLanguage]})
              </label>
              <textarea
                value={currentTranslation.ogDescription}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        ogDescription: e.target.value
                      }
                    }
                  }))
                }}
                rows={3}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
                placeholder="Open Graph აღწერა"
              />
            </div>

            {/* Banner Alt Text */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                ბანერის Alt ტექსტი ({languageLabels[activeLanguage]})
              </label>
              <input
                type="text"
                value={currentTranslation.bannerAlt}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    translations: {
                      ...prev.translations,
                      [activeLanguage]: {
                        ...prev.translations[activeLanguage],
                        bannerAlt: e.target.value
                      }
                    }
                  }))
                }}
                className={`w-full rounded-lg border px-4 py-3 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
                placeholder="სურათის alt ტექსტი"
              />
            </div>

            {/* OG Image Upload */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                OG სურათი
              </label>
              <p className={`text-xs mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                რეკომენდებული ზომა: 1200x630px (Facebook, LinkedIn, Twitter)
              </p>
              
              {ogImagePreview ? (
                <div className="relative">
                  <img
                    src={ogImagePreview}
                    alt="OG Image preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeOgImage}
                    disabled={uploadingOgImage}
                    className={`absolute top-2 right-2 p-2 rounded-lg ${
                      isDark ? 'bg-red-500/80 hover:bg-red-500' : 'bg-red-500/80 hover:bg-red-500'
                    } text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    ეს სურათი გამოჩნდება როცა გვერდს სოციალურ ქსელებში გააზიარებენ
                  </div>
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed transition-all ${
                    uploadingOgImage
                      ? 'cursor-wait opacity-50'
                      : isDark
                      ? 'border-white/20 hover:border-emerald-500/50 bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'border-black/20 hover:border-emerald-500/50 bg-black/5 hover:bg-black/10 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingOgImage ? (
                      <>
                        <Loader2 className={`h-12 w-12 mb-3 animate-spin ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <p className={`mb-2 text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ატვირთვა...
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className={`h-12 w-12 mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                        <p className={`mb-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                          <span className="font-semibold">დააჭირეთ ატვირთვისთვის</span>
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          PNG, JPG, WEBP (მაქს. 5MB)
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          რეკომენდებული: 1200x630px
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleOgImageChange}
                    disabled={uploadingOgImage}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Member Selection Modal */}
      {showMemberModal && currentSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-xl ${isDark ? 'bg-black border border-white/10' : 'bg-white border border-black/10'} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                აირჩიეთ წევრები
              </h2>
              <button
                onClick={() => {
                  setShowMemberModal(false)
                  setCurrentSectionId(null)
                  setSearchTerm('')
                }}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              >
                <X className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ძიება..."
                className={`w-full rounded-lg border px-4 py-2 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-black/10 bg-white text-black'
                }`}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredSpecialists.map(specialist => {
                const section = formData.sections.find(s => s.id === currentSectionId)
                const isSelected = section?.memberIds.includes(specialist.id)
                
                return (
                  <button
                    key={specialist.id}
                    onClick={() => toggleMember(currentSectionId, specialist.id)}
                    className={`w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-500/10 text-emerald-600'
                        : isDark
                        ? 'hover:bg-white/5 text-white'
                        : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{specialist.full_name || specialist.email}</div>
                      <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        {specialist.role === 'solo_specialist' ? 'Solo Specialist' : 'Company Specialist'}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
