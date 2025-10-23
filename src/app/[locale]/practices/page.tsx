import PracticePage from '@/components/practice/PracticePage'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: 'ka' | 'en' | 'ru' }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'პრაქტიკა | იურიდიული სერვისები - LegalGE',
      description: 'გაეცანით ჩვენს იურიდიულ პრაქტიკებს და სერვისებს. პროფესიონალური იურიდიული მომსახურება ყველა სფეროში - კორპორატიული სამართალი, უძრავი ქონება, საგადასახადო კონსულტაციები და სხვა.',
      keywords: 'იურიდიული პრაქტიკა, იურიდიული სერვისები, ადვოკატი, იურისტი, სამართლებრივი დახმარება, საქართველო',
    },
    en: {
      title: 'Practice Areas | Legal Services - LegalGE',
      description: 'Explore our legal practice areas and services. Professional legal assistance in all areas - Corporate Law, Real Estate, Tax Consulting, and more.',
      keywords: 'legal practice, legal services, lawyer, attorney, legal assistance, Georgia',
    },
    ru: {
      title: 'Практика | Юридические услуги - LegalGE',
      description: 'Ознакомьтесь с нашими юридическими практиками и услугами. Профессиональная юридическая помощь во всех сферах - Корпоративное право, Недвижимость, Налоговое консультирование и др.',
      keywords: 'юридическая практика, юридические услуги, адвокат, юрист, правовая помощь, Грузия',
    },
  }

  const currentMetadata = metadata[locale] || metadata.ka

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    keywords: currentMetadata.keywords,
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      type: 'website',
      locale: locale === 'ka' ? 'ka_GE' : locale === 'en' ? 'en_US' : 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: currentMetadata.title,
      description: currentMetadata.description,
    },
    alternates: {
      canonical: `https://legalge.com/${locale}/practices`,
      languages: {
        'ka': '/ka/practices',
        'en': '/en/practices',
        'ru': '/ru/practices',
      },
    },
  }
}

export default function PracticesPage() {
  return <PracticePage />
}

