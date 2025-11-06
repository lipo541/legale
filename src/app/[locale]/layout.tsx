import { ReactNode } from 'react'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import { Providers } from '@/components/providers/Providers'

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
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

  return {
    title: titles[locale] || titles.ka,
    description: descriptions[locale] || descriptions.ka,
    other: {
      'lang': locale,
    },
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LegalGE',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description:
      locale === 'en'
        ? 'Legal Services Platform in Georgia - Find the Best Lawyers and Law Firms'
        : locale === 'ru'
        ? 'Платформа юридических услуг в Грузии - Найдите лучших юристов и юридические компании'
        : 'იურიდიული სერვისების პლატფორმა საქართველოში - იპოვეთ საუკეთესო იურისტები და იურიდიული კომპანიები',
    sameAs: [
      'https://www.facebook.com/legal.ge',
      'https://www.linkedin.com/company/legal-ge',
      'https://twitter.com/legal_ge',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Georgian', 'English', 'Russian'],
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LegalGE',
    url: baseUrl,
    description:
      locale === 'en'
        ? 'Legal Services Platform - Find Lawyers, Law Firms and Legal Services'
        : locale === 'ru'
        ? 'Платформа юридических услуг - Найдите юристов, компании и юридические услуги'
        : 'იურიდიული სერვისების პლატფორმა - იპოვეთ იურისტები, კომპანიები და იურიდიული მომსახურება',
    inLanguage: ['ka', 'en', 'ru'],
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
      <Providers>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </Providers>
    </>
  )
}
