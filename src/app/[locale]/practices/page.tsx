import PracticePage from '@/components/practice/PracticePage'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: 'ka' | 'en' | 'ru' }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'პრაქტიკის სფეროები | Legale',
      description: 'გაეცანით ჩვენს იურიდიულ პრაქტიკებს და სერვისებს. პროფესიონალური იურიდიული მომსახურება ყველა სფეროში - კორპორატიული სამართალი, უძრავი ქონება, საგადასახადო კონსულტაციები და სხვა.',
    },
    en: {
      title: 'Practice Areas | Legale',
      description: 'Explore our legal practice areas and services. Professional legal assistance in all areas - Corporate Law, Real Estate, Tax Consulting, and more.',
    },
    ru: {
      title: 'Области практики | Legale',
      description: 'Ознакомьтесь с нашими юридическими практиками и услугами. Профессиональная юридическая помощь во всех сферах - Корпоративное право, Недвижимость, Налоговое консультирование и др.',
    },
  }

  const currentMetadata = metadata[locale] || metadata.ka
  const canonicalUrl = `https://legale.ge/${locale}/practices`
  const ogImage = 'https://legale.ge/asset/images/og-image.jpg'

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ka': 'https://legale.ge/ka/practices',
        'en': 'https://legale.ge/en/practices',
        'ru': 'https://legale.ge/ru/practices',
      },
    },
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      url: canonicalUrl,
      siteName: 'Legale.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: currentMetadata.title,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: currentMetadata.title,
      description: currentMetadata.description,
      images: [ogImage],
    },
  }
}

export default function PracticesPage() {
  return <PracticePage />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

