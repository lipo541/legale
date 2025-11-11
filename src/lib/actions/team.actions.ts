'use server'

import { createClient } from '@/lib/supabase/server'

export interface TeamMember {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  phone_number: string | null
}

export interface TeamSection {
  id: string
  order: number
  title: string
  members: TeamMember[]
}

export interface TeamData {
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

export async function getTeamBySlug(slug: string, language: string = 'ka'): Promise<TeamData | null> {
  try {
    const supabase = await createClient()

    // Get team with translation by slug
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
      return null
    }

    const team = teamTranslation.team

    // Get leader profile
    const { data: leaderProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email, phone_number')
      .eq('id', team.leader_id)
      .single()

    // Get sections with translations
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

    // Get members for each section
    const sectionsWithMembers: TeamSection[] = []
    
    if (sections) {
      for (const section of sections) {
        const { data: members } = await supabase
          .from('team_members')
          .select(`
            order,
            profile:profiles(
              id,
              full_name,
              avatar_url,
              email,
              phone_number
            )
          `)
          .eq('section_id', section.id)
          .order('order', { ascending: true })

        sectionsWithMembers.push({
          id: section.id,
          order: section.order,
          title: section.team_section_translations[0]?.title || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members: members?.map((m: any) => ({
            id: m.profile.id,
            full_name: m.profile.full_name,
            avatar_url: m.profile.avatar_url,
            email: m.profile.email,
            phone_number: m.profile.phone_number
          })) || []
        })
      }
    }

    return {
      id: team.id,
      leaderId: team.leader_id,
      leader: leaderProfile ? {
        id: leaderProfile.id,
        full_name: leaderProfile.full_name,
        avatar_url: leaderProfile.avatar_url,
        email: leaderProfile.email,
        phone_number: leaderProfile.phone_number
      } : null,
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
      sections: sectionsWithMembers
    }
  } catch (error) {
    console.error('Error fetching team:', error)
    return null
  }
}

export async function getAllTeamSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('team_translations')
      .select('slug')
      .eq('language', 'ka')
    
    if (error) {
      console.error('Error fetching team slugs:', error)
      return []
    }
    
    return data?.map(t => t.slug) || []
  } catch (error) {
    console.error('Error fetching team slugs:', error)
    return []
  }
}
