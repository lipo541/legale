import TeamPage from '@/components/teampage/TeamPage'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface TeamPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = await createClient()

  const { data: teamTranslation } = await supabase
    .from('team_translations')
    .select('name, meta_title, meta_description, og_title, og_description, team:teams(og_image_url)')
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!teamTranslation) {
    return {
      title: 'გუნდი ვერ მოიძებნა',
      description: 'მოთხოვნილი გუნდი ვერ მოიძებნა'
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = teamTranslation.team as any
  const ogImageUrl = team?.og_image_url

  return {
    title: teamTranslation.meta_title || teamTranslation.name,
    description: teamTranslation.meta_description || undefined,
    openGraph: {
      title: teamTranslation.og_title || teamTranslation.meta_title || teamTranslation.name,
      description: teamTranslation.og_description || teamTranslation.meta_description || undefined,
      images: ogImageUrl ? [ogImageUrl] : [],
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: teamTranslation.og_title || teamTranslation.meta_title || teamTranslation.name,
      description: teamTranslation.og_description || teamTranslation.meta_description || undefined,
      images: ogImageUrl ? [ogImageUrl] : []
    }
  }
}

// Generate static params for all teams (optional - for static generation)
export async function generateStaticParams() {
  // Return empty array to use dynamic rendering
  // Teams will be fetched on-demand
  return []
}

export default async function TeamSlugPage({ params }: TeamPageProps) {
  const { slug, locale } = await params
  const supabase = await createClient()

  // Check if team exists
  const { data: teamExists } = await supabase
    .from('team_translations')
    .select('slug')
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!teamExists) {
    notFound()
  }

  return <TeamPage slug={slug} language={locale} />
}
