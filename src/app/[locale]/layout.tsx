import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import DashboardSidebar from '@/components/sidebar/DashboardSidebar'
import { Providers } from '@/components/providers/Providers'
import { siteConfig, getLanguageAlternates } from '@/lib/config'
import { locales } from '@/lib/i18n/config'
import SnowfallEffect from '@/components/effects/Snowfall'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

// Generate static params for valid locales only
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale as typeof locales[number])) {
    return {}
  }
  
  const titles: Record<string, string> = {
    ka: 'LegalGE - იურიდიული სერვისების პლატფორმა',
    en: 'LegalGE - Legal Services Platform',
    ru: 'LegalGE - Платформа юридических услуг',
  }
  
  const descriptions: Record<string, string> = {
    ka: 'იპოვეთ საუკეთესო იურიდიული სპეციალისტები და კომპანიები საქართველოში',
    en: 'Find the Best Legal Specialists and Law Firms in Georgia',
    ru: 'Найдите лучших юристов и юридические компании в Грузии',
  }

  const baseUrl = siteConfig.baseUrl

  return {
    title: titles[locale] || titles.ka,
    description: descriptions[locale] || descriptions.ka,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: getLanguageAlternates(''),
    },
    other: {
      'lang': locale,
    },
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  
  // If locale is not valid, show 404
  if (!locales.includes(locale as typeof locales[number])) {
    notFound()
  }
  
  const baseUrl = siteConfig.baseUrl

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: baseUrl,
    logo: `${baseUrl}${siteConfig.logo}`,
    description:
      locale === 'en'
        ? 'Legal Services Platform in Georgia - Find the Best Lawyers and Law Firms'
        : locale === 'ru'
        ? 'Платформа юридических услуг в Грузии - Найдите лучших юристов и юридические компании'
        : 'იურიდიული სერვისების პლატფორმა საქართველოში - იპოვეთ საუკეთესო იურისტები და იურიდიული კომპანიები',
    sameAs: Object.values(siteConfig.social),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Georgian', 'English', 'Russian'],
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: baseUrl,
    description:
      locale === 'en'
        ? 'Legal Services Platform - Find Lawyers, Law Firms and Legal Services'
        : locale === 'ru'
        ? 'Платформа юридических услуг - Найдите юристов, компании и юридические услуги'
        : 'იურიდიული სერვისების პლატფორმა - იპოვეთ იურისტები, კომპანიები და იურიდიული მომსახურება',
    inLanguage: siteConfig.locales,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/specialists?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <SnowfallEffect />
      <Providers>
        <Header />
        <DashboardSidebar />
        <main className="flex-1">{children}</main>
        <Footer />
      </Providers>
    </>
  )
}
