'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Users, ChevronDown, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  phone_number: string | null
  slug: string | null
}

interface TeamSection {
  id: string
  order: number
  title: string
  members: TeamMember[]
}

interface TeamData {
  id: string
  leaderId: string
  leader: TeamMember | null
  isActive: boolean
  ogImageUrl: string | null
  name: string
  title: string
  description: string | null
  slug: string
  metaTitle: string | null
  metaDescription: string | null
  ogTitle: string | null
  ogDescription: string | null
  bannerImageUrl: string | null
  bannerAlt: string | null
  sections: TeamSection[]
}

interface TeamPageProps {
  slug: string
  language?: string
}

// Skeleton Loader Component
const SkeletonLoader = ({ isDark }: { isDark: boolean }) => (
  <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12 md:py-16">
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="text-center max-w-3xl mx-auto animate-pulse">
        <div className={`h-8 md:h-10 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-lg w-2/3 mx-auto mb-3`}></div>
        <div className={`h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-lg w-full mb-2`}></div>
        <div className={`h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-lg w-1/2 mx-auto`}></div>
      </div>
      
      {/* Sections Skeleton */}
      <div className="space-y-6 mx-auto">
        {[...Array(2)].map((_, i) => (
          <div key={i} className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'} pb-4 animate-pulse`}>
            <div className={`h-6 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-lg w-1/4 mb-4`}></div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="flex flex-col items-center space-y-2">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
                  <div className={`h-3 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded w-16`}></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Collapsible Section Component
const CollapsibleSection = ({ 
  section, 
  language, 
  isDark 
}: { 
  section: TeamSection
  language: string
  isDark: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(true)

  const memberVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    }),
  }

  return (
    <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'} last:border-b-0 py-6`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left group"
      >
        <h2 className={`text-lg md:text-xl font-medium ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          {section.title}
        </h2>
        <ChevronDown
          className={`transform transition-all duration-300 ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-white/40 group-hover:text-white/60' : 'text-black/40 group-hover:text-black/60'
          }`}
          size={20}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto', marginTop: '1.5rem' },
              collapsed: { opacity: 0, height: 0, marginTop: 0 },
            }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            {section.members.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
                {section.members.map((member, i) => (
                  <motion.div
                    key={member.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={memberVariants}
                  >
                    <Link
                      href={member.slug ? `/${language}/specialists/${member.slug}` : '#'}
                      className={`group flex flex-col items-center text-center space-y-2 ${
                        member.slug ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-16 h-16 md:w-20 md:h-20">
                        <div className={`absolute inset-0 rounded-full ${
                          isDark ? 'bg-white/5' : 'bg-black/5'
                        } group-hover:scale-105 transition-transform duration-300`}></div>
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name || 'Team Member'}
                            fill
                            className="object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Users className={`w-6 h-6 md:w-8 md:h-8 ${
                              isDark ? 'text-white/30' : 'text-black/30'
                            }`} />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className={`text-xs md:text-sm font-normal ${
                        isDark 
                          ? 'text-white/60 group-hover:text-white/80' 
                          : 'text-black/60 group-hover:text-black/80'
                      } transition-colors duration-300`}>
                        {member.full_name || 'უცნობი'}
                      </h3>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className={`text-center text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                ამ სექციაში წევრები არ მოიძებნა.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TeamPage({ slug, language = 'ka' }: TeamPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchTeamData() {
      try {
        const supabase = createClient()

        const { data: teamTranslation, error: translationError } = await supabase
          .from('team_translations')
          .select(`
            *,
            team:teams(*)
          `)
          .eq('slug', slug)
          .eq('language', language)
          .single()

        if (translationError || !teamTranslation) {
          console.error('Team not found:', translationError)
          setLoading(false)
          return
        }

        const team = teamTranslation.team

        // Get leader profile
        const { data: leaderProfile } = await supabase
          .from('profiles')
          .select('id, avatar_url, email, phone_number')
          .eq('id', team.leader_id)
          .single()

        // Get leader's translated name and slug
        const { data: leaderTranslation } = await supabase
          .from('specialist_translations')
          .select('slug, full_name')
          .eq('specialist_id', team.leader_id)
          .eq('language', language)
          .single()

        const { data: sections } = await supabase
          .from('team_sections')
          .select(`
            id,
            order,
            team_section_translations!inner(
              title
            )
          `)
          .eq('team_id', team.id)
          .eq('team_section_translations.language', language)
          .order('order', { ascending: true })

        const sectionsWithMembers: TeamSection[] = []

        if (sections) {
          for (const section of sections) {
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                order,
                profile:profiles(
                  id,
                  avatar_url,
                  email,
                  phone_number
                )
              `)
              .eq('section_id', section.id)
              .order('order', { ascending: true })

            // Get member IDs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const memberIds = members?.map((m: any) => m.profile.id).filter(Boolean) || []
            
            // Get slugs and translated names for all members
            const { data: translations } = await supabase
              .from('specialist_translations')
              .select('specialist_id, slug, full_name')
              .in('specialist_id', memberIds)
              .eq('language', language)

            const translationMap = new Map(
              translations?.map(t => [t.specialist_id, { slug: t.slug, full_name: t.full_name }]) || []
            )

            sectionsWithMembers.push({
              id: section.id,
              order: section.order,
              title: section.team_section_translations[0]?.title || '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              members: members?.map((m: any) => {
                const translation = translationMap.get(m.profile.id)
                return {
                  id: m.profile.id,
                  full_name: translation?.full_name || m.profile.full_name || 'უცნობი',
                  avatar_url: m.profile.avatar_url,
                  email: m.profile.email,
                  phone_number: m.profile.phone_number,
                  slug: translation?.slug || null,
                }
              }) || [],
            })
          }
        }

        setTeamData({
          id: team.id,
          leaderId: team.leader_id,
          leader: leaderProfile
            ? {
                id: leaderProfile.id,
                full_name: leaderTranslation?.full_name || 'უცნობი',
                avatar_url: leaderProfile.avatar_url,
                email: leaderProfile.email,
                phone_number: leaderProfile.phone_number,
                slug: leaderTranslation?.slug || null,
              }
            : null,
          isActive: team.is_active,
          ogImageUrl: team.og_image_url,
          name: teamTranslation.name,
          title: teamTranslation.title,
          description: teamTranslation.description,
          slug: teamTranslation.slug,
          metaTitle: teamTranslation.meta_title,
          metaDescription: teamTranslation.meta_description,
          ogTitle: teamTranslation.og_title,
          ogDescription: teamTranslation.og_description,
          bannerImageUrl: teamTranslation.banner_image_url,
          bannerAlt: teamTranslation.banner_alt,
          sections: sectionsWithMembers,
        })
      } catch (error) {
        console.error('Error fetching team:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [slug, language])

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
        <SkeletonLoader isDark={isDark} />
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="text-center">
          <p className={`text-xl ${isDark ? 'text-white' : 'text-black'}`}>გუნდი ვერ მოიძებნა</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'} transition-colors duration-300`}>
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-6 md:py-8">
        
        {/* Header Section with Back Button */}
        <motion.header
          className="mx-auto mb-8 md:mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Title Section with Back Button on Same Line */}
          <div className="relative mb-3">
            {/* Back Button - Absolute Left */}
            <button
              onClick={() => router.back()}
              className={`absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-2 group ${
                isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
              } transition-colors duration-200`}
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm md:text-base">უკან</span>
            </button>
            
            {/* Title - Centered */}
            <h1 className={`text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-center ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              {teamData.name}
            </h1>
          </div>

          {/* Description - Centered */}
          <div className="text-center max-w-3xl mx-auto">
            <p className={`text-sm md:text-base leading-relaxed ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              {teamData.description || teamData.title}
            </p>
          </div>
        </motion.header>

        {/* Sections - Collapsible */}
        <main className="mx-auto">
          {teamData.sections.length > 0 ? (
            <div className="space-y-0">
              {teamData.sections.map((section) => (
                <CollapsibleSection
                  key={section.id}
                  section={section}
                  language={language}
                  isDark={isDark}
                />
              ))}
            </div>
          ) : (
            <p className={`text-center text-sm ${isDark ? 'text-white/30' : 'text-black/30'}`}>
              ამ გუნდს სექციები არ გააჩნია.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
