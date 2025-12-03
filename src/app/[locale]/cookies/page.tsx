import type { Metadata } from 'next'
import { siteConfig, getLanguageAlternates } from '@/lib/config'
import CookiesContent from '@/components/cookies/CookiesContent'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = siteConfig.baseUrl

  const metadata: Record<string, { title: string; description: string }> = {
    ka: {
      title: 'ქუქი ფაილები | Legal',
      description: 'გაეცანით როგორ ვიყენებთ ქუქი ფაილებს ჩვენს ვებსაიტზე.',
    },
    en: {
      title: 'Cookie Policy | Legal',
      description: 'Learn how we use cookies on our website.',
    },
    ru: {
      title: 'Политика куки | Legal',
      description: 'Узнайте, как мы используем куки на нашем сайте.',
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl = `${baseUrl}/${locale}/cookies`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates('/cookies'),
    },
  }
}

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params

  return <CookiesContent locale={locale as 'ka' | 'en' | 'ru'} />
}
