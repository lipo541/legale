import TeamPage from '@/components/teampage/TeamPage'
import { createStaticClient } from '@/lib/supabase/static'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600

interface TeamPageProps {
  params: Promise<{
    slug: string
    locale: string
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const supabase = createStaticClient()

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
  const canonicalUrl = encodeURI(`${siteConfig.baseUrl}/${locale}/teams/${slug}`)

  return {
    title: teamTranslation.meta_title || teamTranslation.name,
    description: teamTranslation.meta_description || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(`/teams/${slug}`),
    },
    openGraph: {
      title: teamTranslation.og_title || teamTranslation.meta_title || teamTranslation.name,
      description: teamTranslation.og_description || teamTranslation.meta_description || undefined,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: ogImageUrl ? [ogImageUrl] : [],
      type: 'website',
      locale: locale === 'ka' ? 'ka_GE' : locale === 'ru' ? 'ru_RU' : 'en_US',
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
  const supabase = createStaticClient()

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
