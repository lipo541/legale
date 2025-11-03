'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { companyDetailTranslations } from '@/translations/company-detail'
import { 
  Building2,
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ChevronLeft,
  Loader2,
  Users,
  Briefcase,
  FileText,
  Target,
  Lightbulb,
  History
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CompanyTranslation {
  language: string
  company_name: string
  company_overview: string
  summary: string
  mission_statement: string
  vision_values: string
  history: string
  how_we_work: string
}

interface Company {
  id: string
  email: string
  phone_number: string
  logo_url: string
  company_slug: string
  website: string
  address: string
  map_link: string
  facebook_link: string
  instagram_link: string
  linkedin_link: string
  twitter_link: string
  verification_status: string
  company_translations: CompanyTranslation[]
  specialists: Array<{
    id: string
    full_name: string
    role_title: string
    avatar_url: string
    slug: string
  }>
}

interface CompanyDetailPageProps {
  slug: string
  locale: string
}

export default function CompanyDetailPage({ slug, locale }: CompanyDetailPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const router = useRouter()
  const t = companyDetailTranslations[locale as keyof typeof companyDetailTranslations] || companyDetailTranslations.ka

  const [company, setCompany] = useState<Company | null>(null)
  const [cities, setCities] = useState<Array<{ id: string; name_ka: string; name_en: string; name_ru: string }>>([])
  const [loading, setLoading] = useState(true)
  const [slugsByLocale, setSlugsByLocale] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true)
      try {
        // First, try to find company by slug in translations table (en/ru)
        const { data: translationData } = await supabase
          .from('company_translations')
          .select('company_id')
          .eq('slug', slug)
          .eq('language', locale)
          .single()
        
        let profileData, profileError
        
        if (translationData?.company_id) {
          // Found via translation slug - perfect match
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', translationData.company_id)
            .eq('role', 'COMPANY')
            .single()
          
          profileData = result.data
          profileError = result.error
        } else {
          // Fallback: try ANY language in translations, then redirect if needed
          const { data: anyLangSlug } = await supabase
            .from('company_translations')
            .select('company_id, language, slug')
            .eq('slug', slug)
            .limit(1)
            .single()

          if (anyLangSlug) {
            // Get the correct slug for current locale
            const { data: correctSlugData } = await supabase
              .from('company_translations')
              .select('slug')
              .eq('company_id', anyLangSlug.company_id)
              .eq('language', locale)
              .single()

            if (correctSlugData?.slug && correctSlugData.slug !== slug) {
              router.replace(`/${locale}/companies/${correctSlugData.slug}`)
              return
            }

            // Fetch the profile
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('id', anyLangSlug.company_id)
              .eq('role', 'COMPANY')
              .single()
            
            profileData = result.data
            profileError = result.error
          } else {
            // Last resort: try company_slug in profiles table (for Georgian/ka)
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('company_slug', slug)
              .eq('role', 'COMPANY')
              .single()
            
            profileData = result.data
            profileError = result.error
          }
        }

        if (profileError || !profileData) {
          setCompany(null)
          setLoading(false)
          return
        }

        // Fetch company translations for all languages
        const { data: translationsData } = await supabase
          .from('company_translations')
          .select('*')
          .eq('company_id', profileData.id)
          .in('language', ['en', 'ru'])

        // Build Georgian translation from profiles table
        const georgianTranslation: CompanyTranslation = {
          language: 'ka',
          company_name: profileData.full_name || '',
          company_overview: profileData.company_overview || '',
          summary: profileData.summary || '',
          mission_statement: profileData.mission_statement || '',
          vision_values: profileData.vision_values || '',
          history: profileData.history || '',
          how_we_work: profileData.how_we_work || ''
        }

        // Combine Georgian with en/ru translations
        const allTranslations = [georgianTranslation, ...(translationsData || [])]

        // Build slugs map for language switching
        const slugsMap: Record<string, string> = {
          ka: profileData.company_slug || slug, // Georgian always from profiles
          en: profileData.company_slug || slug,
          ru: profileData.company_slug || slug
        }

        if (translationsData && translationsData.length > 0) {
          translationsData.forEach((trans: { slug?: string; language: string }) => {
            if (trans.slug) {
              slugsMap[trans.language] = trans.slug
            }
          })
        }

        setSlugsByLocale(slugsMap)

        // Fetch company specialists
        const { data: specialistsData } = await supabase
          .from('profiles')
          .select('id, full_name, role_title, avatar_url, slug')
          .eq('company_id', profileData.id)
          .eq('role', 'SPECIALIST')
          .eq('verification_status', 'verified')

        // Combine all data
        const company = {
          ...profileData,
          company_translations: allTranslations,
          specialists: specialistsData || []
        }

        setCompany(company as unknown as Company)

        // Fetch company cities
        const { data: cityData } = await supabase
          .from('company_cities')
          .select(`
            city_id,
            cities (
              id,
              name_ka,
              name_en,
              name_ru
            )
          `)
          .eq('company_id', profileData.id)

        if (cityData) {
          const cityList = cityData.map((item: { cities: { id: number; name_ka: string; name_en: string; name_ru: string }[] | null }) => Array.isArray(item.cities) ? item.cities[0] : item.cities).filter((city): city is { id: number; name_ka: string; name_en: string; name_ru: string } => city !== null && city !== undefined).map(city => ({ ...city, id: String(city.id) }))
          setCities(cityList)
        }
      } catch (error) {
        console.error('Error fetching company:', error)
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [slug, supabase])

  // Redirect to correct slug when locale changes
  useEffect(() => {
    if (slugsByLocale[locale] && slugsByLocale[locale] !== slug) {
      router.replace(`/${locale}/companies/${slugsByLocale[locale]}`)
    }
  }, [locale, slug, slugsByLocale, router])

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{t.notFound}</h1>
          <button
            onClick={() => router.push(`/${locale}/companies`)}
            className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            {t.backButton}
          </button>
        </div>
      </div>
    )
  }

  // Get translation for current locale
  const translation = company.company_translations?.find(t => t.language === locale) || company.company_translations?.[0]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header Section - Clean & Minimal */}
      <div className={`border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/${locale}/companies`)}
            className={`group flex items-center gap-2 mb-8 text-sm font-light transition-colors ${
              isDark ? 'text-white/50 hover:text-white/80' : 'text-black/50 hover:text-black/80'
            }`}
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t.backButton}
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Company Logo - Large, Centered */}
            <div className="mb-6">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={translation?.company_name || company.company_slug}
                  className={`w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover ring-1 ${
                    isDark ? 'ring-white/10' : 'ring-black/10'
                  }`}
                />
              ) : (
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex items-center justify-center ring-1 ${
                  isDark ? 'bg-white/5 ring-white/10' : 'bg-black/5 ring-black/10'
                }`}>
                  <Building2 className="h-16 w-16 sm:h-20 sm:w-20 opacity-20" />
                </div>
              )}
            </div>

            {/* Company Name - Large, Light Font */}
            <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight mb-3">
              {translation?.company_name || company.company_slug}
            </h1>
            
            {/* Summary */}
            {translation?.summary && (
              <p className={`text-lg sm:text-xl font-light max-w-2xl mb-8 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                {translation.summary}
              </p>
            )}

            {/* Contact Info - Horizontal Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                      : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                  }`}
                >
                  <Mail className="h-4 w-4 opacity-50" />
                  <span className="max-w-[200px] truncate">{company.email}</span>
                </a>
              )}
              {company.phone_number && (
                <a
                  href={`tel:${company.phone_number}`}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                      : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                  }`}
                >
                  <Phone className="h-4 w-4 opacity-50" />
                  {company.phone_number}
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                      : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                  }`}
                >
                  <Globe className="h-4 w-4 opacity-50" />
                  <span className="max-w-[200px] truncate">{company.website}</span>
                </a>
              )}
            </div>

            {/* Address & Cities */}
            {(company.address || cities.length > 0) && (
              <div className="flex flex-col gap-3 mb-6">
                {company.address && (
                  <div className={`flex items-center justify-center gap-2 text-sm font-light ${
                    isDark ? 'text-white/50' : 'text-black/50'
                  }`}>
                    <MapPin className="h-4 w-4" />
                    <span>{company.address}</span>
                  </div>
                )}
                {cities.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {cities.map(city => (
                      <span
                        key={city.id}
                        className={`px-3 py-1 rounded-full text-xs font-light ${
                          isDark 
                            ? 'bg-white/5 ring-1 ring-white/10' 
                            : 'bg-black/5 ring-1 ring-black/10'
                        }`}
                      >
                        {locale === 'ka' ? city.name_ka : locale === 'en' ? city.name_en : city.name_ru}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Social Links - Minimal Icons */}
            {(company.facebook_link || company.instagram_link || company.linkedin_link || company.twitter_link) && (
              <div className="flex gap-3">
                {company.facebook_link && (
                  <a
                    href={company.facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                        : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                    }`}
                  >
                    <Facebook className="h-4 w-4 opacity-50" />
                  </a>
                )}
                {company.instagram_link && (
                  <a
                    href={company.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                        : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                    }`}
                  >
                    <Instagram className="h-4 w-4 opacity-50" />
                  </a>
                )}
                {company.linkedin_link && (
                  <a
                    href={company.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                        : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                    }`}
                  >
                    <Linkedin className="h-4 w-4 opacity-50" />
                  </a>
                )}
                {company.twitter_link && (
                  <a
                    href={company.twitter_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-all ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 ring-1 ring-white/10' 
                        : 'bg-black/5 hover:bg-black/10 ring-1 ring-black/10'
                    }`}
                  >
                    <Twitter className="h-4 w-4 opacity-50" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12 sm:py-16 space-y-12">
        {/* Company Overview */}
        {translation?.company_overview && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <Building2 className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'კომპანიის შესახებ' : locale === 'en' ? 'About Company' : 'О компании'}
              </h2>
            </div>
            <p className={`text-[15px] leading-relaxed font-light whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {translation.company_overview}
            </p>
          </section>
        )}

        {/* Mission Statement */}
        {translation?.mission_statement && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <Target className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'მისია' : locale === 'en' ? 'Mission' : 'Миссия'}
              </h2>
            </div>
            <p className={`text-[15px] leading-relaxed font-light whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {translation.mission_statement}
            </p>
          </section>
        )}

        {/* Vision & Values */}
        {translation?.vision_values && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <Lightbulb className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'ხედვა და ღირებულებები' : locale === 'en' ? 'Vision & Values' : 'Видение и ценности'}
              </h2>
            </div>
            <p className={`text-[15px] leading-relaxed font-light whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {translation.vision_values}
            </p>
          </section>
        )}

        {/* History */}
        {translation?.history && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <History className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'ისტორია' : locale === 'en' ? 'History' : 'История'}
              </h2>
            </div>
            <p className={`text-[15px] leading-relaxed font-light whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {translation.history}
            </p>
          </section>
        )}

        {/* How We Work */}
        {translation?.how_we_work && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <FileText className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'როგორ ვმუშაობთ' : locale === 'en' ? 'How We Work' : 'Как мы работаем'}
              </h2>
            </div>
            <p className={`text-[15px] leading-relaxed font-light whitespace-pre-wrap ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {translation.how_we_work}
            </p>
          </section>
        )}

        {/* Company Specialists */}
        {company.specialists && company.specialists.length > 0 && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <Users className="h-5 w-5 opacity-50" />
              </div>
              <h2 className="text-2xl font-extralight tracking-tight">
                {locale === 'ka' ? 'ჩვენი სპეციალისტები' : locale === 'en' ? 'Our Specialists' : 'Наши специалисты'}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {company.specialists.map((specialist) => (
                <button
                  key={specialist.id}
                  onClick={() => router.push(`/${locale}/specialists/${specialist.slug}`)}
                  className={`group flex items-center gap-4 p-4 rounded-xl transition-all text-left ring-1 ${
                    isDark 
                      ? 'bg-white/[0.02] hover:bg-white/[0.05] ring-white/[0.08]' 
                      : 'bg-black/[0.02] hover:bg-black/[0.05] ring-black/[0.08]'
                  }`}
                >
                  {specialist.avatar_url ? (
                    <img
                      src={specialist.avatar_url}
                      alt={specialist.full_name}
                      className="h-14 w-14 rounded-full object-cover ring-1 ring-black/5"
                    />
                  ) : (
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      <Users className="h-6 w-6 opacity-20" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-light text-base truncate mb-0.5">
                      {specialist.full_name}
                    </h3>
                    {specialist.role_title && (
                      <p className={`text-sm font-light truncate ${
                        isDark ? 'text-white/50' : 'text-black/50'
                      }`}>
                        {specialist.role_title}
                      </p>
                    )}
                  </div>
                  <Briefcase className={`h-4 w-4 flex-shrink-0 opacity-30 group-hover:opacity-50 transition-opacity`} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

