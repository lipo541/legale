import Hero from '@/components/hero/Hero'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legale.ge'

  const metadata: Record<
    string,
    { title: string; description: string; ogImage: string }
  > = {
    ka: {
      title: 'იურიდიული მომსახურება და კონსულტაცია | Legale',
      description:
        'იპოვეთ საუკეთესო იურიდიული სპეციალისტები და კომპანიები საქართველოში. პროფესიონალური იურისტები, იურიდიული კონსულტაცია და მომსახურება ყველა სფეროში.',
      ogImage: `${baseUrl}/images/og-home-ka.jpg`,
    },
    en: {
      title: 'Legal Services and Consultation | Legale',
      description:
        'Find the best legal specialists and law firms in Georgia. Professional lawyers, legal consultation and services in all practice areas.',
      ogImage: `${baseUrl}/images/og-home-en.jpg`,
    },
    ru: {
      title: 'Юридические услуги и консультации | Legale',
      description:
        'Найдите лучших юристов и юридические компании в Грузии. Профессиональные адвокаты, юридические консультации и услуги во всех областях.',
      ogImage: `${baseUrl}/images/og-home-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = locale === 'ka' ? baseUrl : `${baseUrl}/${locale}`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'LegalGE',
      images: [
        {
          url: meta.ogImage,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [meta.ogImage],
    },
  }
}

export default function LocaleHome() {
  return <Hero />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

