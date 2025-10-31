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
  full_name: string
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

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true)
      try {
        // Fetch company profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('company_slug', slug)
          .eq('role', 'COMPANY')
          .single()

        if (profileError || !profileData) {
          console.error('Error fetching company:', profileError)
          setCompany(null)
          setLoading(false)
          return
        }

        // Fetch company translations
        const { data: translationsData } = await supabase
          .from('company_translations')
          .select('*')
          .eq('company_id', profileData.id)

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
          company_translations: translationsData || [],
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
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Header with Back Button */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push(`/${locale}/companies`)}
            className={`flex items-center gap-2 text-sm transition-colors ${
              isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {t.backButton}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Company Info */}
          <div className="lg:col-span-1">
            <div className={`sticky top-8 rounded-xl border p-6 sm:p-8 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
            }`}>
              {/* Company Logo */}
              {company.logo_url && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={company.logo_url}
                    alt={translation?.full_name || company.company_slug}
                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Company Name */}
              <h1 className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {translation?.full_name || company.company_slug}
              </h1>

              {/* Summary */}
              {translation?.summary && (
                <p className={`text-center text-sm sm:text-base mb-6 ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}>
                  {translation.summary}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className={`flex items-center gap-3 text-sm sm:text-base transition-colors justify-center lg:justify-start ${
                      isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="break-all">{company.email}</span>
                  </a>
                )}
                {company.phone_number && (
                  <a
                    href={`tel:${company.phone_number}`}
                    className={`flex items-center gap-3 text-sm sm:text-base transition-colors justify-center lg:justify-start ${
                      isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    {company.phone_number}
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 text-sm sm:text-base transition-colors justify-center lg:justify-start ${
                      isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="break-all">{company.website}</span>
                  </a>
                )}
                {company.address && (
                  <div className={`flex items-center gap-3 text-sm sm:text-base justify-center lg:justify-start ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{company.address}</span>
                  </div>
                )}
                {cities.length > 0 && (
                  <div className="flex flex-col gap-2 justify-center lg:justify-start">
                    <div className={`flex items-center gap-2 text-sm sm:text-base ${
                      isDark ? 'text-white/70' : 'text-black/70'
                    }`}>
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-medium">
                        {locale === 'ka' ? 'მუშაობს ქალაქებში:' : locale === 'en' ? 'Works in cities:' : 'Работает в городах:'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-7 lg:pl-7">
                      {cities.map(city => (
                        <span
                          key={city.id}
                          className={`px-3 py-1.5 rounded-lg text-sm sm:text-base font-medium ${
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

              {/* Social Links */}
              {(company.facebook_link || company.instagram_link || company.linkedin_link || company.twitter_link) && (
                <div className="mb-4 sm:mb-6">
                  <p className={`text-xs sm:text-sm mb-3 text-center lg:text-left ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    გაზიარება:
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                    {company.facebook_link && (
                      <a
                        href={company.facebook_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                            : 'bg-black/5 hover:bg-black/10 border border-black/10'
                        }`}
                      >
                        <Facebook className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Facebook
                      </a>
                    )}
                    {company.instagram_link && (
                      <a
                        href={company.instagram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                            : 'bg-black/5 hover:bg-black/10 border border-black/10'
                        }`}
                      >
                        <Instagram className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Instagram
                      </a>
                    )}
                    {company.linkedin_link && (
                      <a
                        href={company.linkedin_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                            : 'bg-black/5 hover:bg-black/10 border border-black/10'
                        }`}
                      >
                        <Linkedin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        LinkedIn
                      </a>
                    )}
                    {company.twitter_link && (
                      <a
                        href={company.twitter_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10' 
                            : 'bg-black/5 hover:bg-black/10 border border-black/10'
                        }`}
                      >
                        <Twitter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Company Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Overview */}
            {translation?.company_overview && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'კომპანიის შესახებ' : locale === 'en' ? 'About Company' : 'О компании'}
                  </h2>
                </div>
                <p className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.company_overview}
                </p>
              </section>
            )}

            {/* Mission Statement */}
            {translation?.mission_statement && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Target className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'მისია' : locale === 'en' ? 'Mission' : 'Миссия'}
                  </h2>
                </div>
                <p className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.mission_statement}
                </p>
              </section>
            )}

            {/* Vision & Values */}
            {translation?.vision_values && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'ხედვა და ღირებულებები' : locale === 'en' ? 'Vision & Values' : 'Видение и ценности'}
                  </h2>
                </div>
                <p className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.vision_values}
                </p>
              </section>
            )}

            {/* History */}
            {translation?.history && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <History className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'ისტორია' : locale === 'en' ? 'History' : 'История'}
                  </h2>
                </div>
                <p className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.history}
                </p>
              </section>
            )}

            {/* How We Work */}
            {translation?.how_we_work && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'როგორ ვმუშაობთ' : locale === 'en' ? 'How We Work' : 'Как мы работаем'}
                  </h2>
                </div>
                <p className={`whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-white/80' : 'text-black/80'
                }`}>
                  {translation.how_we_work}
                </p>
              </section>
            )}

            {/* Company Specialists */}
            {company.specialists && company.specialists.length > 0 && (
              <section className={`rounded-xl border p-6 sm:p-8 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white shadow-lg'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <Users className={`h-6 w-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {locale === 'ka' ? 'ჩვენი სპეციალისტები' : locale === 'en' ? 'Our Specialists' : 'Наши специалисты'}
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {company.specialists.map((specialist) => (
                    <button
                      key={specialist.id}
                      onClick={() => router.push(`/${locale}/specialists/${specialist.slug}`)}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all text-left ${
                        isDark 
                          ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                          : 'border-black/10 bg-white hover:bg-gray-50 shadow'
                      }`}
                    >
                      {specialist.avatar_url && (
                        <img
                          src={specialist.avatar_url}
                          alt={specialist.full_name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${
                          isDark ? 'text-white' : 'text-black'
                        }`}>
                          {specialist.full_name}
                        </h3>
                        {specialist.role_title && (
                          <p className={`text-sm truncate ${
                            isDark ? 'text-white/60' : 'text-black/60'
                          }`}>
                            {specialist.role_title}
                          </p>
                        )}
                      </div>
                      <Briefcase className={`h-5 w-5 flex-shrink-0 ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`} />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

