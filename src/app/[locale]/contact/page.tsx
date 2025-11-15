import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import ContactInfo from '@/components/contact/ContactInfo'

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'კონტაქტი | LegalGE - დაგვიკავშირდით',
      description: 'დაგვიკავშირდით LegalGE-ს გუნდს. ჩვენი ოფისის მისამართი, ტელეფონის ნომერი, ელ. ფოსტა და სამუშაო საათები. ვართ თბილისში და მზად ვართ დაგეხმაროთ.',
    },
    en: {
      title: 'Contact Us | LegalGE - Get in Touch',
      description: 'Contact the LegalGE team. Our office address, phone number, email, and working hours. We are located in Tbilisi and ready to help you.',
    },
    ru: {
      title: 'Контакты | LegalGE - Свяжитесь с нами',
      description: 'Свяжитесь с командой LegalGE. Адрес нашего офиса, номер телефона, электронная почта и часы работы. Мы находимся в Тбилиси и готовы помочь вам.',
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `https://www.legal.ge/${locale}/contact`
  const ogImage = 'https://www.legal.ge/asset/images/og-image.jpg'

  // Organization Schema Markup with Contact Information
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Legal.ge',
    url: 'https://www.legal.ge',
    logo: 'https://www.legal.ge/asset/images/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+995-XXX-XXX-XXX',
      contactType: 'customer service',
      areaServed: 'GE',
      availableLanguage: ['ka', 'en', 'ru'],
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tbilisi',
      addressCountry: 'GE',
    },
  }

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ka: 'https://www.legal.ge/ka/contact',
        en: 'https://www.legal.ge/en/contact',
        ru: 'https://www.legal.ge/ru/contact',
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
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
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify(organizationSchema),
    },
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params

  if (!['ka', 'en', 'ru'].includes(locale)) {
    notFound()
  }

  return <ContactInfo locale={locale} />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600
