import SpecialistDetailPage from '@/components/specialists/specialist-detail/SpecialistDetailPage'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export default async function SpecialistPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const locale = resolvedParams.locale || 'ka'
  
  console.log('Page rendered with slug:', slug, 'locale:', locale)
  
  return <SpecialistDetailPage slug={slug} locale={locale} />
}

export const dynamic = 'force-dynamic'
