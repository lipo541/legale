import ArchivePage from '@/components/news/ArchivePage'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function NewsArchivePage({ params }: PageProps) {
  const { locale } = await params

  return <ArchivePage locale={locale} />
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'არქივი - იურიდიული სიახლეები | Legal.ge',
      description: 'სამართლებრივი სიახლეების სრული არქივი - ყველა სტატია, კანონმდებლობის ცვლილებები და იურიდიული ანალიტიკა ერთ ადგილას.',
      keywords: 'იურიდიული არქივი, სამართლებრივი სიახლეები, კანონმდებლობის ცვლილებები, Legal.ge არქივი, იურიდიული სტატიები',
    },
    en: {
      title: 'Archive - Legal News | Legal.ge',
      description: 'Complete archive of legal news - all articles, legislative changes and legal analytics in one place.',
      keywords: 'legal archive, legal news, legislative changes, Legal.ge archive, legal articles',
    },
    ru: {
      title: 'Архив - Юридические новости | Legal.ge',
      description: 'Полный архив юридических новостей - все статьи, изменения законодательства и правовая аналитика в одном месте.',
      keywords: 'юридический архив, юридические новости, изменения законодательства, архив Legal.ge, юридические статьи',
    },
  }

  const currentLocale = (locale as keyof typeof metadata) || 'ka'
  const meta = metadata[currentLocale] || metadata.ka

  const baseUrl = 'https://legal.ge'
  const canonicalUrl = `${baseUrl}/${locale}/news/archive`

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    
    // Open Graph
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      locale: locale,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-archive.jpg`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${baseUrl}/og-archive.jpg`],
      creator: '@LegalGe',
      site: '@LegalGe',
    },
    
    // Additional Meta Tags
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ka': `${baseUrl}/ka/news/archive`,
        'en': `${baseUrl}/en/news/archive`,
        'ru': `${baseUrl}/ru/news/archive`,
      },
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Other Meta
    category: 'Legal News',
    classification: 'Legal Archive',
  }
}
