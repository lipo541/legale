import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import TermsContent from '@/components/terms/TermsContent'

type Props = {
  params: Promise<{ locale: Locale }>
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const metadata = {
    ka: {
      title: 'წესები და პირობები - Legal.ge',
      description: 'გაეცანით Legal.ge-ს გამოყენების წესებსა და პირობებს. ინფორმაცია პლატფორმის გამოყენების, მომხმარებლის უფლებებისა და პასუხისმგებლობების შესახებ.',
    },
    en: {
      title: 'Terms & Conditions - Legal.ge',
      description: 'Review Legal.ge\'s Terms and Conditions. Information about platform usage, user rights, and responsibilities.',
    },
    ru: {
      title: 'Условия использования - Legal.ge',
      description: 'Ознакомьтесь с Условиями использования Legal.ge. Информация об использовании платформы, правах и обязанностях пользователей.',
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `https://legal.ge/${locale}/terms`

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
        ka: 'https://legal.ge/ka/terms',
        en: 'https://legal.ge/en/terms',
        ru: 'https://legal.ge/ru/terms',
      },
    },
  }
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params

  if (!['ka', 'en', 'ru'].includes(locale)) {
    notFound()
  }

  return (
    <TermsContent locale={locale} />
  )
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

