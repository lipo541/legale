import CompaniesPage from '@/components/companies/CompaniesPage';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legale.ge'

  const metadata: Record<string, { title: string; description: string; ogImage: string }> = {
    ka: {
      title: 'იურიდიული კომპანიები საქართველოში | Legale',
      description: 'აღმოაჩინეთ და შეადარეთ იურიდიული კომპანიები საქართველოში. Legale-ზე თავმოყრილია საუკეთესო იურიდიული ფირმები, რომლებიც გთავაზობენ მრავალფეროვან სერვისებს.',
      ogImage: `${baseUrl}/images/og-companies-ka.jpg`,
    },
    en: {
      title: 'Law Firms in Georgia | Legale',
      description: 'Discover and compare law firms in Georgia. Legale features top legal companies offering a wide range of services.',
      ogImage: `${baseUrl}/images/og-companies-en.jpg`,
    },
    ru: {
      title: 'Юридические компании в Грузии | Legale',
      description: 'Откройте для себя и сравните юридические компании в Грузии. На Legale представлены лучшие юридические фирмы, предлагающие широкий спектр услуг.',
      ogImage: `${baseUrl}/images/og-companies-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl =
    locale === 'ka' ? `${baseUrl}/companies` : `${baseUrl}/${locale}/companies`

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
  };
}

export default function Companies() {
  return <CompaniesPage />;
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600
