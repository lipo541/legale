import { Metadata } from 'next'
import NewsLayout from '@/components/news/NewsLayout'

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

type Props = {
  params: Promise<{
    locale: 'ka' | 'en' | 'ru'
  }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'სიახლეები - Legal.ge | იურიდიული სიახლეები და ანალიტიკა',
      description: 'იყავით საქმის კურსში საქართველოსა და მსოფლიოს უახლესი იურიდიული სიახლეების, კანონმდებლობის ცვლილებებისა და ექსპერტული ანალიზის შესახებ Legal.ge-ზე.',
    },
    en: {
      title: 'News - Legal.ge | Legal News and Analysis',
      description: 'Stay informed about the latest legal news, legislative changes, and expert analysis from Georgia and around the world on Legal.ge.',
    },
    ru: {
      title: 'Новости - Legal.ge | Юридические новости и аналитика',
      description: 'Будьте в курсе последних юридических новостей, изменений в законодательстве и экспертного анализа из Грузии и со всего мира на Legal.ge.',
    },
  }

  const { title, description } = metadata[locale]
  const canonicalUrl = `https://legal.ge/${locale}/news`
  const ogImage = 'https://legal.ge/asset/images/og-image.jpg'

  // WebPage Schema Markup
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: description,
    url: canonicalUrl,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Legal.ge',
      url: 'https://www.legal.ge',
    },
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ka: 'https://legal.ge/ka/news',
        en: 'https://legal.ge/en/news',
        ru: 'https://legal.ge/ru/news',
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(webPageSchema),
    },
  }
}

export default function NewsPage() {
  return <NewsLayout />
}
