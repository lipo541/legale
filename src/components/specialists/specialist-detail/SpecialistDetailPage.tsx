'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import { specialistDetailTranslations } from '@/translations/specialist-detail'
import { 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Facebook,
  Globe,
  Award,
  GraduationCap,
  Target,
  Users,
  Building2,
  ChevronLeft,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SpecialistTranslation {
  language: string
  full_name: string
  role_title: string
  bio: string
  philosophy: string
  teaching_writing_speaking: string
  focus_areas: string[]
  representative_matters: string[]
  credentials_memberships: string[]
  values_how_we_work: Record<string, string>
}

interface Specialist {
  id: string
  email: string
  phone_number: string
  avatar_url: string
  slug: string
  city: string
  role: string
  company_id: string | null
  verification_status: string
  specialist_translations: SpecialistTranslation[]
  company?: {
    full_name: string
    company_slug: string
  }
  services: Array<{
    service_id: string
    services: {
      service_translations: Array<{
        title: string
        language: string
      }>
    }
  }>
}

interface SpecialistDetailPageProps {
  slug: string
  locale: string
}

export default function SpecialistDetailPage({ slug, locale }: SpecialistDetailPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const router = useRouter()
  const t = specialistDetailTranslations[locale as keyof typeof specialistDetailTranslations] || specialistDetailTranslations.ka

  const [specialist, setSpecialist] = useState<Specialist | null>(null)
  const [cities, setCities] = useState<Array<{ id: string; name_ka: string; name_en: string; name_ru: string }>>([])
  const [loading, setLoading] = useState(true)
  const [slugsByLocale, setSlugsByLocale] = useState<Record<string, string>>({}) // Store slugs for each locale

  useEffect(() => {
    const fetchSpecialist = async () => {
      setLoading(true)
      try {
        // First, try to find the specialist by slug in translations table
        const { data: translationData, error: translationError } = await supabase
          .from('specialist_translations')
          .select('specialist_id')
          .eq('slug', slug)
          .eq('language', locale)
          .single()
        
        // If not found by translation slug, try ANY language (for backward compatibility)
        let profileData, profileError
        
        if (translationData?.specialist_id) {
          // Found via translation slug - perfect match
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', translationData.specialist_id)
            .in('role', ['SOLO_SPECIALIST', 'SPECIALIST'])
            .single()
          
          profileData = result.data
          profileError = result.error
        } else {
          // Fallback: try finding slug in ANY language, then check if specialist exists
          const { data: anyLangSlug } = await supabase
            .from('specialist_translations')
            .select('specialist_id, language, slug')
            .eq('slug', slug)
            .limit(1)
            .single()

          if (anyLangSlug) {
            // Get the correct slug for current locale
            const { data: correctSlugData } = await supabase
              .from('specialist_translations')
              .select('slug')
              .eq('specialist_id', anyLangSlug.specialist_id)
              .eq('language', locale)
              .single()

            if (correctSlugData?.slug && correctSlugData.slug !== slug) {
              router.replace(`/${locale}/specialists/${correctSlugData.slug}`)
              return
            }

            // Fetch the profile
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('id', anyLangSlug.specialist_id)
              .in('role', ['SOLO_SPECIALIST', 'SPECIALIST'])
              .single()
            
            profileData = result.data
            profileError = result.error
          } else {
            // Last resort: try old slug field in profiles table (for old specialists)
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('slug', slug)
              .in('role', ['SOLO_SPECIALIST', 'SPECIALIST'])
              .single()
            
            profileData = result.data
            profileError = result.error
          }
        }

        // If no profile found by slug, show error
        if (profileError) {
          setSpecialist(null)
          setLoading(false)
          return
        }
        
        if (!profileData) {
          console.error('❌ No profile data returned for slug:', slug)
          setSpecialist(null)
          setLoading(false)
          return
        }

        // Fetch translations for all languages (ka, en, ru)
        const { data: translationsData, error: translationsError } = await supabase
          .from('specialist_translations')
          .select('*')
          .eq('specialist_id', profileData.id)
          .in('language', ['ka', 'en', 'ru'])

        // Build slugs map for language switching
        const slugsMap: Record<string, string> = {
          ka: profileData.slug || slug,
          en: profileData.slug || slug,
          ru: profileData.slug || slug
        }

        if (translationsData && translationsData.length > 0) {
          translationsData.forEach((trans: { slug?: string; language: string }) => {
            if (trans.slug) {
              slugsMap[trans.language] = trans.slug
            }
          })
        }

        setSlugsByLocale(slugsMap)

        // Fetch company if exists
        let companyData = null
        if (profileData.company_id) {
          const { data: company } = await supabase
            .from('profiles')
            .select('full_name, company_slug')
            .eq('id', profileData.company_id)
            .single()
          companyData = company
        }

        // Fetch services
        const { data: servicesData } = await supabase
          .from('specialist_services')
          .select(`
            service_id,
            services (
              service_translations (
                title,
                language
              )
            )
          `)
          .eq('profile_id', profileData.id)

        // Combine all data
        const specialist = {
          ...profileData,
          specialist_translations: translationsData || [],
          company: companyData,
          services: servicesData || []
        }
        
        setSpecialist(specialist as unknown as Specialist)

        // Fetch specialist cities
        const { data: cityData } = await supabase
          .from('specialist_cities')
          .select(`
            city_id,
            cities (
              id,
              name_ka,
              name_en,
              name_ru
            )
          `)
          .eq('specialist_id', profileData.id)

        if (cityData) {
          const cityList = cityData
            .map((item: { cities: { id: number; name_ka: string; name_en: string; name_ru: string }[] | null }) => 
              Array.isArray(item.cities) ? item.cities[0] : item.cities
            )
            .filter((city): city is { id: number; name_ka: string; name_en: string; name_ru: string } => city !== null)
            .map(city => ({ ...city, id: String(city.id) }))
          setCities(cityList)
        }
      } catch (error) {
        setSpecialist(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialist()
  }, [slug, supabase])

  // Redirect to correct slug when locale changes
  useEffect(() => {
    if (slugsByLocale[locale] && slugsByLocale[locale] !== slug) {
      router.replace(`/${locale}/specialists/${slugsByLocale[locale]}`)
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

  if (!specialist) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className="text-center max-w-md px-4">
          <h1 className="text-3xl font-bold mb-4">{t.notFound}</h1>
          <p className={`mb-6 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {locale === 'ka' ? `სპეციალისტი slug-ით "${slug}" ვერ მოიძებნა.` : 
             locale === 'en' ? `Specialist with slug "${slug}" was not found.` :
             `Специалист со slug "${slug}" не найден.`}
          </p>
          <button
            onClick={() => router.push(`/${locale}/specialists`)}
            className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.backButton}
          </button>
        </div>
      </div>
    )
  }

  // Get translation for current locale, fallback to Georgian if not found
  const translation = specialist.specialist_translations?.find(t => t.language === locale) || 
                      specialist.specialist_translations?.find(t => t.language === 'ka') ||
                      specialist.specialist_translations?.[0]

  const displayTranslation = translation

  if (!displayTranslation) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className="text-center">
          <p className="text-xl mb-4">{t.translationNotFound}</p>
          <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {locale === 'ka' ? 'მონაცემები არ არის ხელმისაწვდომი' : 
             locale === 'en' ? 'Data not available' :
             'Данные недоступны'}
          </p>
          <button
            onClick={() => router.push(`/${locale}/specialists`)}
            className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.backButton}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header Section - Clean & Minimal */}
      <div className={`border-b ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/${locale}/specialists`)}
            className={`group flex items-center gap-2 mb-8 text-sm font-light transition-colors ${
              isDark ? 'text-white/50 hover:text-white/80' : 'text-black/50 hover:text-black/80'
            }`}
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t.backToSpecialists}
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Avatar - Large, Centered */}
            <div className="mb-6">
              {specialist.avatar_url ? (
                <img
                  src={specialist.avatar_url}
                  alt={displayTranslation.full_name}
                  className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover ring-1 ${
                    isDark ? 'ring-white/10' : 'ring-black/10'
                  }`}
                />
              ) : (
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center ring-1 ${
                  isDark ? 'bg-white/5 ring-white/10' : 'bg-black/5 ring-black/10'
                }`}>
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 opacity-20" />
                </div>
              )}
            </div>

            {/* Name - Large, Light Font */}
            <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight mb-3">
              {displayTranslation.full_name}
            </h1>
            
            {/* Role Title */}
            {displayTranslation.role_title && (
              <p className={`text-lg sm:text-xl font-light mb-6 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                {displayTranslation.role_title}
              </p>
            )}

            {/* Company Badge (if exists) */}
            {specialist.company_id && specialist.company && (
              <button
                onClick={() => router.push(`/${locale}/companies/${specialist.company?.company_slug}`)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-light transition-all border ${
                  isDark 
                    ? 'border-white/10 hover:border-white/20 hover:bg-white/5' 
                    : 'border-black/10 hover:border-black/20 hover:bg-black/5'
                }`}
              >
                <Building2 className="h-4 w-4" />
                {specialist.company.full_name}
              </button>
            )}

            {/* Contact Info - Minimal */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
              {specialist.email && (
                <a
                  href={`mailto:${specialist.email}`}
                  className={`flex items-center gap-2 text-sm font-light transition-colors ${
                    isDark ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">{specialist.email}</span>
                  <span className="sm:hidden">Email</span>
                </a>
              )}
              {(specialist.phone_number || specialist.role === 'SOLO_SPECIALIST') && (
                <a
                  href={`tel:${specialist.role === 'SOLO_SPECIALIST' ? '+995551911961' : specialist.phone_number}`}
                  className={`flex items-center gap-2 text-sm font-light transition-colors ${
                    isDark ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {specialist.role === 'SOLO_SPECIALIST' ? '+995 551 911 961' : specialist.phone_number}
                </a>
              )}
              {cities.length > 0 && (
                <div className={`flex items-center gap-2 text-sm font-light ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}>
                  <MapPin className="h-4 w-4" />
                  {cities.map((city, index) => (
                    <span key={city.id}>
                      {locale === 'ka' ? city.name_ka : locale === 'en' ? city.name_en : city.name_ru}
                      {index < cities.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Apple Style */}
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12 sm:py-16">
        <div className="space-y-6">
          {/* Bio */}
          {displayTranslation.bio && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <h2 className="text-2xl font-extralight tracking-tight mb-4">{t.biography}</h2>
              <p className={`text-[15px] leading-relaxed font-light whitespace-pre-line ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {displayTranslation.bio}
              </p>
            </div>
          )}

          {/* Philosophy */}
          {displayTranslation.philosophy && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-5 w-5 opacity-40" />
                <h2 className="text-2xl font-extralight tracking-tight">{t.philosophy}</h2>
              </div>
              <p className={`text-[15px] leading-relaxed font-light ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {displayTranslation.philosophy}
              </p>
            </div>
          )}

          {/* Focus Areas */}
          {displayTranslation.focus_areas && displayTranslation.focus_areas.length > 0 && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <h2 className="text-2xl font-extralight tracking-tight mb-6">{t.focusAreas}</h2>
              <ul className="space-y-3">
                {displayTranslation.focus_areas.map((area, index) => (
                  <li key={index} className={`flex items-start gap-3 text-[15px] font-light ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    <span className={`mt-1.5 h-1 w-1 rounded-full flex-shrink-0 ${
                      isDark ? 'bg-white/40' : 'bg-black/40'
                    }`} />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Representative Matters */}
          {displayTranslation.representative_matters && displayTranslation.representative_matters.length > 0 && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="h-5 w-5 opacity-40" />
                <h2 className="text-2xl font-extralight tracking-tight">{t.representativeMatters}</h2>
              </div>
              <ul className="space-y-3">
                {displayTranslation.representative_matters.map((matter, index) => (
                  <li key={index} className={`flex items-start gap-3 text-[15px] font-light ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    <span className={`mt-1.5 h-1 w-1 rounded-full flex-shrink-0 ${
                      isDark ? 'bg-white/40' : 'bg-black/40'
                    }`} />
                    <span>{matter}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Teaching/Writing/Speaking */}
          {displayTranslation.teaching_writing_speaking && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="h-5 w-5 opacity-40" />
                <h2 className="text-2xl font-extralight tracking-tight">{t.teachingWritingSpeaking}</h2>
              </div>
              <p className={`text-[15px] leading-relaxed font-light ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {displayTranslation.teaching_writing_speaking}
              </p>
            </div>
          )}

          {/* Values / How We Work */}
          {displayTranslation.values_how_we_work && Object.keys(displayTranslation.values_how_we_work).length > 0 && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <h2 className="text-2xl font-extralight tracking-tight mb-6">{t.valuesHowWeWork}</h2>
              <div className="space-y-6">
                {Object.entries(displayTranslation.values_how_we_work).map(([key, value], index) => (
                  <div key={index}>
                    <h3 className="text-base font-light mb-2">{key}</h3>
                    <p className={`text-[15px] font-light leading-relaxed ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {specialist.services && specialist.services.length > 0 && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="h-5 w-5 opacity-40" />
                <h2 className="text-2xl font-extralight tracking-tight">{t.services}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialist.services.map((service) => {
                  const serviceTranslation = service.services?.service_translations?.find(t => t.language === locale) ||
                                            service.services?.service_translations?.[0]
                  return serviceTranslation ? (
                    <span
                      key={service.service_id}
                      className={`px-4 py-2 rounded-full text-sm font-light border ${
                        isDark 
                          ? 'border-white/10 bg-white/5' 
                          : 'border-black/10 bg-black/5'
                      }`}
                    >
                      {serviceTranslation.title}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Credentials & Memberships */}
          {displayTranslation.credentials_memberships && displayTranslation.credentials_memberships.length > 0 && (
            <div className={`p-8 rounded-2xl border ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <Award className="h-5 w-5 opacity-40" />
                <h2 className="text-2xl font-extralight tracking-tight">{t.credentialsMemberships}</h2>
              </div>
              <ul className="space-y-3">
                {displayTranslation.credentials_memberships.map((item, index) => (
                  <li key={index} className={`flex items-start gap-3 text-[15px] font-light ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    <span className={`mt-1.5 h-1 w-1 rounded-full flex-shrink-0 ${
                      isDark ? 'bg-white/40' : 'bg-black/40'
                    }`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
