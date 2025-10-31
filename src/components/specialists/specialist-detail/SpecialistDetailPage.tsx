'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
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

  const [specialist, setSpecialist] = useState<Specialist | null>(null)
  const [cities, setCities] = useState<Array<{ id: string; name_ka: string; name_en: string; name_ru: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSpecialist = async () => {
      setLoading(true)
      try {
        console.log('Fetching specialist with slug:', slug)
        
        // First, try to fetch the basic profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('slug', slug)
          .in('role', ['SOLO_SPECIALIST', 'SPECIALIST'])
          .single()

        console.log('Profile data:', profileData)
        console.log('Profile error:', profileError)

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError)
          setSpecialist(null)
          setLoading(false)
          return
        }

        // Fetch translations separately
        const { data: translationsData, error: translationsError } = await supabase
          .from('specialist_translations')
          .select('*')
          .eq('specialist_id', profileData.id)

        console.log('Translations data:', translationsData)

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

        console.log('Services data:', servicesData)

        // Combine all data
        const specialist = {
          ...profileData,
          specialist_translations: translationsData || [],
          company: companyData,
          services: servicesData || []
        }

        console.log('Final specialist data:', specialist)
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

        console.log('Cities data:', cityData)

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
        console.error('Error:', error)
        setSpecialist(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialist()
  }, [slug, supabase])

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
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">სპეციალისტი ვერ მოიძებნა</h1>
          <button
            onClick={() => router.push(`/${locale}/specialists`)}
            className={`flex items-center gap-2 mx-auto px-6 py-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            უკან დაბრუნება
          </button>
        </div>
      </div>
    )
  }

  // Get translation for current locale
  const translation = specialist.specialist_translations?.find(t => t.language === locale) || 
                      specialist.specialist_translations?.[0]

  if (!translation) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <p>თარგმანი ვერ მოიძებნა</p>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      {/* Header Section */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => router.push(`/${locale}/specialists`)}
            className={`flex items-center gap-2 mb-4 sm:mb-6 text-sm transition-colors ${
              isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            სპეციალისტებზე დაბრუნება
          </button>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Side - Avatar */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              {specialist.avatar_url ? (
                <img
                  src={specialist.avatar_url}
                  alt={translation.full_name}
                  className="w-48 sm:w-56 lg:w-64 h-auto rounded-2xl object-cover"
                />
              ) : (
                <div className={`w-48 sm:w-56 lg:w-64 h-64 sm:h-72 lg:h-80 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 opacity-40" />
                </div>
              )}
            </div>

            {/* Right Side - Info */}
            <div className="flex-1">
              {/* Name */}
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 text-center lg:text-left">
                {translation.full_name}
              </h1>
              
              {/* Role Title */}
              {translation.role_title && (
                <p className={`text-lg sm:text-xl mb-3 sm:mb-4 flex flex-col sm:flex-row items-center gap-2 justify-center lg:justify-start ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  <span>{translation.role_title}</span>
                  {specialist.company_id && specialist.company && (
                    <>
                      <span className={`hidden sm:inline ${isDark ? 'text-white/40' : 'text-black/40'}`}>•</span>
                      <button
                        onClick={() => router.push(`/${locale}/companies/${specialist.company?.company_slug}`)}
                        className={`flex items-center gap-2 transition-colors hover:underline ${
                          isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                        }`}
                      >
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        {specialist.company.full_name}
                      </button>
                    </>
                  )}
                </p>
              )}

              {/* Contact */}
              <div className="mb-4 sm:mb-6 space-y-2">
                {specialist.email && (
                  <a
                    href={`mailto:${specialist.email}`}
                    className={`flex items-center gap-3 text-sm sm:text-base transition-colors justify-center lg:justify-start ${
                      isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="break-all">{specialist.email}</span>
                  </a>
                )}
                {specialist.phone_number && (
                  <a
                    href={`tel:${specialist.phone_number}`}
                    className={`flex items-center gap-3 text-sm sm:text-base transition-colors justify-center lg:justify-start ${
                      isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    {specialist.phone_number}
                  </a>
                )}
                {cities.length > 0 && (
                  <div className={`flex items-start gap-3 text-sm sm:text-base justify-center lg:justify-start ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-1 flex-shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {cities.map(city => (
                        <span
                          key={city.id}
                          className={`px-2 py-1 rounded-md text-xs sm:text-sm ${
                            isDark 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}
                        >
                          {locale === 'ka' ? city.name_ka : locale === 'en' ? city.name_en : city.name_ru}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Company Link Button */}
              {specialist.company_id && specialist.company && (
                <div className="flex justify-center lg:justify-start mb-4 sm:mb-6">
                  <button
                    onClick={() => router.push(`/${locale}/companies/${specialist.company?.company_slug}`)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20 border border-white/20' 
                        : 'bg-black/10 hover:bg-black/20 border border-black/20'
                    }`}
                  >
                    ბოლო სიახლეები
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Social Links */}
              <div className="mb-4 sm:mb-6">
                <p className={`text-xs sm:text-sm mb-3 text-center lg:text-left ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  გაზიარება:
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                  <a
                    href="#"
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                        : 'bg-black/5 hover:bg-black/10 border border-black/10'
                    }`}
                  >
                    <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Facebook
                  </a>
                  <a
                    href="#"
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                        : 'bg-black/5 hover:bg-black/10 border border-black/10'
                    }`}
                  >
                    <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    LinkedIn
                  </a>
                  <a
                    href="#"
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                        : 'bg-black/5 hover:bg-black/10 border border-black/10'
                    }`}
                  >
                    <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Bio */}
            {translation.bio && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">ბიოგრაფია</h2>
                <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.bio}
                </div>
              </section>
            )}

            {/* Philosophy */}
            {translation.philosophy && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                  ფილოსოფია
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.philosophy}
                </p>
              </section>
            )}

            {/* Focus Areas */}
            {translation.focus_areas && translation.focus_areas.length > 0 && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6" />
                  ფოკუსის სფეროები
                </h2>
                <ul className="space-y-2">
                  {translation.focus_areas.map((area, index) => (
                    <li key={index} className={`flex items-start gap-3 text-sm sm:text-base ${
                      isDark ? 'text-white/80' : 'text-black/80'
                    }`}>
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Representative Matters */}
            {translation.representative_matters && translation.representative_matters.length > 0 && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                  წარმომადგენლობითი საქმეები
                </h2>
                <ul className="space-y-2">
                  {translation.representative_matters.map((matter, index) => (
                    <li key={index} className={`flex items-start gap-3 text-sm sm:text-base ${
                      isDark ? 'text-white/80' : 'text-black/80'
                    }`}>
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{matter}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Teaching/Writing/Speaking */}
            {translation.teaching_writing_speaking && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                  სწავლება / წერა / საუბარი
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.teaching_writing_speaking}
                </p>
              </section>
            )}

            {/* Values / How We Work */}
            {translation.values_how_we_work && Object.keys(translation.values_how_we_work).length > 0 && (
              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  ღირებულებები / როგორ ვმუშაობთ
                </h2>
                <div className="space-y-3">
                  {Object.entries(translation.values_how_we_work).map(([key, value], index) => (
                    <div key={index} className={`p-3 sm:p-4 rounded-lg ${
                      isDark ? 'bg-white/5' : 'bg-black/5'
                    }`}>
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">{key}</h3>
                      <p className={`text-xs sm:text-sm ${
                        isDark ? 'text-white/70' : 'text-black/70'
                      }`}>{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Services */}
            {specialist.services && specialist.services.length > 0 && (
              <div className={`rounded-xl border p-4 sm:p-6 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
              }`}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  სერვისები
                </h3>
                <div className="space-y-2">
                  {specialist.services.map((service) => {
                    const serviceTranslation = service.services?.service_translations?.find(t => t.language === locale) ||
                                              service.services?.service_translations?.[0]
                    return serviceTranslation ? (
                      <div
                        key={service.service_id}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm ${
                          isDark 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}
                      >
                        {serviceTranslation.title}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Credentials & Memberships */}
            {translation.credentials_memberships && translation.credentials_memberships.length > 0 && (
              <div className={`rounded-xl border p-4 sm:p-6 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
              }`}>
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  რწმუნებათა სიგელები & წევრობები
                </h3>
                <ul className="space-y-2">
                  {translation.credentials_memberships.map((item, index) => (
                    <li key={index} className={`text-xs sm:text-sm ${
                      isDark ? 'text-white/70' : 'text-black/70'
                    }`}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
