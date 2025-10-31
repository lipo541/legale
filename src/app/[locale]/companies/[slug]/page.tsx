import CompanyDetailPage from '@/components/companies/company-detail/CompanyDetailPage'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

export default async function CompanyPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug
  const locale = resolvedParams.locale || 'ka'
  
  console.log('Company page rendered with slug:', slug, 'locale:', locale)
  
  return <CompanyDetailPage slug={slug} locale={locale} />
}

export const dynamic = 'force-dynamic'
