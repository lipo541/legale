import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import PrivacyContent from '@/components/privacy/PrivacyContent'

type Props = {
  params: Promise<{ locale: Locale }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'კონფიდენციალურობის პოლიტიკა - Legal.ge',
      description: 'გაეცანით Legal.ge-ს კონფიდენციალურობის პოლიტიკას. ინფორმაცია თქვენი პერსონალური მონაცემების შეგროვების, გამოყენებისა და დაცვის შესახებ.',
    },
    en: {
      title: 'Privacy Policy - Legal.ge',
      description: 'Review Legal.ge\'s Privacy Policy. Information about how we collect, use, and protect your personal data.',
    },
    ru: {
      title: 'Политика конфиденциальности - Legal.ge',
      description: 'Ознакомьтесь с Политикой конфиденциальности Legal.ge. Информация о том, как мы собираем, используем и защищаем ваши персональные данные.',
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `https://www.legal.ge/${locale}/privacy`

  return {
    title: meta.title,
    description: meta.description,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ka: 'https://www.legal.ge/ka/privacy',
        en: 'https://www.legal.ge/en/privacy',
        ru: 'https://www.legal.ge/ru/privacy',
      },
    },
  }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params

  if (!['ka', 'en', 'ru'].includes(locale)) {
    notFound()
  }

  return <PrivacyContent locale={locale} />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600
