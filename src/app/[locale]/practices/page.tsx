import { Suspense } from 'react'
import PracticePage from '@/components/practice/PracticePage'
import { Metadata } from 'next'
import { siteConfig, getLanguageAlternates, getAssetUrl } from '@/lib/config'

type Props = {
  params: Promise<{ locale: 'ka' | 'en' | 'ru' }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata = {
    ka: {
      title: 'პრაქტიკის სფეროები | Legal',
      description: 'გაეცანით ჩვენს იურიდიულ პრაქტიკებს და სერვისებს. პროფესიონალური იურიდიული მომსახურება ყველა სფეროში - კორპორატიული სამართალი, უძრავი ქონება, საგადასახადო კონსულტაციები და სხვა.',
    },
    en: {
      title: 'Practice Areas | Legal',
      description: 'Explore our legal practice areas and services. Professional legal assistance in all areas - Corporate Law, Real Estate, Tax Consulting, and more.',
    },
    ru: {
      title: 'Области практики | Legal',
      description: 'Ознакомьтесь с нашими юридическими практиками и услугами. Профессиональная юридическая помощь во всех сферах - Корпоративное право, Недвижимость, Налоговое консультирование и др.',
    },
  }

  const currentMetadata = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/practices`
  const ogImage = getAssetUrl(siteConfig.defaultOgImage)

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/practices'),
    },
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
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
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <PracticePage />
    </Suspense>
  )
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

