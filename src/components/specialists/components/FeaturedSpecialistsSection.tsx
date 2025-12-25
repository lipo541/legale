'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import { getClientSingleton } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import FeaturedSpecialistCard from './FeaturedSpecialistCard'
import { specialistsTranslations } from '@/translations/specialists'

interface Specialist {
  id: string
  full_name: string
  avatar_url?: string | null
  role_title?: string | null
  slug?: string | null
  role: 'SPECIALIST' | 'SOLO_SPECIALIST'
  company_id?: string | null
  verification_status?: string
  is_homepage_featured: boolean
  homepage_featured_order: number | null
  company?: {
    full_name: string
  } | null
}

interface FeaturedSpecialistsSectionProps {
  initialSpecialists?: Specialist[]
}

export default function FeaturedSpecialistsSection({ initialSpecialists }: FeaturedSpecialistsSectionProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations]
  const supabase = getClientSingleton()

  const [specialists, setSpecialists] = useState<Specialist[]>(initialSpecialists || [])
  const [loading, setLoading] = useState(!initialSpecialists)
  const [refetchKey, setRefetchKey] = useState(0)

  // Daily seed for pseudo-random ordering (changes daily)
  const dailySeed = useMemo(() => {
    const today = new Date()
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  }, [])

  useEffect(() => {
    if (initialSpecialists) return

    const fetchSpecialists = async () => {
      try {
        // Try to get featured specialists first
        let featuredSpecialists: Specialist[] = []
        
        const { data: featuredData, error: featuredError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            avatar_url,
            role_title,
            slug,
            role,
            company_id,
            verification_status,
            is_homepage_featured,
            homepage_featured_order
          `)
          .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
          .eq('verification_status', 'verified')
          .eq('is_homepage_featured', true)
          .order('homepage_featured_order', { ascending: true })
          .limit(8)

        if (!featuredError) {
          featuredSpecialists = (featuredData || []) as unknown as Specialist[]
        } else {
          console.error('Featured specialists error:', featuredError)
        }

        const featuredCount = featuredSpecialists.length
        const minSpecialists = 5
        const neededRandomSpecialists = Math.max(0, minSpecialists - featuredCount)

        let randomSpecialists: Specialist[] = []

        // 2. If we need more specialists, get random ones from diverse practice areas
        if (neededRandomSpecialists > 0) {
          const featuredIds = featuredSpecialists.map(s => s.id)
          
          // Get all verified specialists not featured (simpler query without nested joins)
          const { data: allSpecialists, error: allError } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              avatar_url,
              role_title,
              slug,
              role,
              company_id,
              verification_status,
              is_homepage_featured,
              homepage_featured_order
            `)
            .in('role', ['SPECIALIST', 'SOLO_SPECIALIST'])
            .eq('verification_status', 'verified')
            .eq('is_homepage_featured', false)

          if (allError) {
            console.error('All specialists error:', allError)
          }

          if (allSpecialists && allSpecialists.length > 0) {
            // Filter out featured and apply daily pseudo-random with diverse practice areas
            const availableSpecialists = (allSpecialists as unknown as Specialist[])
              .filter(s => !featuredIds.includes(s.id))
            
            // Sort by daily seed + id for pseudo-random ordering
            const seededRandom = availableSpecialists.sort((a, b) => {
              const hashA = hashCode(dailySeed + a.id)
              const hashB = hashCode(dailySeed + b.id)
              return hashA - hashB
            })

            // Take needed amount
            randomSpecialists = seededRandom.slice(0, neededRandomSpecialists)
          }
        }

        // 3. Fetch company names for company specialists
        const allSpecialistsList = [...featuredSpecialists, ...randomSpecialists]
        const companyIds = allSpecialistsList
          .filter(s => s.role === 'SPECIALIST' && s.company_id)
          .map(s => s.company_id!)
          .filter((id, i, arr) => arr.indexOf(id) === i) // unique

        if (companyIds.length > 0) {
          const { data: companies } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', companyIds)

          if (companies) {
            const companyMap = new Map(companies.map(c => [c.id, c.full_name]))
            allSpecialistsList.forEach(s => {
              if (s.company_id && companyMap.has(s.company_id)) {
                s.company = { full_name: companyMap.get(s.company_id)! }
              }
            })
          }
        }

        setSpecialists(allSpecialistsList)
      } catch (err) {
        console.error('Error fetching homepage specialists:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSpecialists()
  }, [initialSpecialists, supabase, dailySeed, refetchKey])

  // Simple hash function for daily seed
  function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  // Loading skeleton
  if (loading) {
    return (
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <div className={`h-6 w-48 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
          <div className={`h-4 w-32 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`
                flex-shrink-0 w-[calc(20%-13px)] min-w-[180px] max-w-[220px]
                rounded-xl overflow-hidden
                ${isDark ? 'bg-white/5' : 'bg-black/5'}
              `}
            >
              <div className="pt-8 pb-3 px-4 flex justify-center">
                <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
              </div>
              <div className="px-3 pb-3 space-y-2">
                <div className={`h-4 w-24 mx-auto rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                <div className={`h-3 w-16 mx-auto rounded ${isDark ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Don't render if no specialists
  if (specialists.length === 0) {
    return null
  }

  return (
    <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {t.featuredSpecialists}
        </h2>
        <Link
          href={`/${locale}/specialists`}
          className={`
            group flex items-center gap-1.5 text-sm font-medium
            transition-colors duration-200
            ${isDark 
              ? 'text-white/60 hover:text-white' 
              : 'text-black/60 hover:text-black'
            }
          `}
        >
          <span>{t.seeAllSpecialists}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Cards Container */}
      {/* Desktop: Grid, Mobile: Horizontal scroll */}
      <div 
        className={`
          flex gap-4 
          overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin
          md:overflow-visible md:pb-0
          md:grid md:grid-cols-5
          ${isDark 
            ? 'scrollbar-thumb-white/20 scrollbar-track-transparent' 
            : 'scrollbar-thumb-black/20 scrollbar-track-transparent'
          }
        `}
      >
        {specialists.map((specialist) => (
          <FeaturedSpecialistCard
            key={specialist.id}
            id={specialist.id}
            full_name={specialist.full_name}
            avatar_url={specialist.avatar_url}
            role_title={specialist.role_title}
            slug={specialist.slug}
            role={specialist.role}
            company_name={specialist.company?.full_name}
            verification_status={specialist.verification_status}
            is_homepage_featured={specialist.is_homepage_featured}
            homepage_featured_order={specialist.homepage_featured_order}
            locale={locale}
            translations={{
              solo: t.solo,
              company: t.company,
              verified: t.verified,
              viewMore: t.viewMore
            }}
          />
        ))}
      </div>
    </section>
  )
}
