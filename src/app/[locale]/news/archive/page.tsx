import ArchivePage from '@/components/news/ArchivePage'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function NewsArchivePage({ params }: PageProps) {
  const { locale } = await params

  return <ArchivePage locale={locale} />
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params

  return {
    title: 'არქივი - ბლოგი',
    description: 'ბლოგის არქივი - ყველა სტატია ქრონოლოგიური თანმიმდევრობით',
  }
}
