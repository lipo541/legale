import SpecialistsPage from '@/components/specialists/SpecialistsPage'
import { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://legal.ge'

  const metadata: Record<
    string,
    { title: string; description: string; ogImage: string }
  > = {
    ka: {
      title: 'სპეციალისტების სია | იპოვეთ იურისტი საქართველოში - Legal',
      description:
        'მოძებნეთ და დაუკავშირდით პროფესიონალ იურისტებსა და სპეციალისტებს საქართველოს მასშტაბით. Legal-ზე ნახავთ დამოწმებულ სპეციალისტებს სხვადასხვა პრაქტიკის სფეროში.',
      ogImage: `${baseUrl}/images/og-specialists-ka.jpg`,
    },
    en: {
      title: 'List of Specialists | Find a Lawyer in Georgia - Legal',
      description:
        'Search and connect with professional lawyers and specialists across Georgia. Find verified specialists in various practice areas on Legal.',
      ogImage: `${baseUrl}/images/og-specialists-en.jpg`,
    },
    ru: {
      title: 'Список специалистов | Найти юриста в Грузии - Legal',
      description:
        'Ищите и связывайтесь с профессиональными юристами и специалистами по всей Грузии. На Legal вы найдёте проверенных специалистов в различных областях практики.',
      ogImage: `${baseUrl}/images/og-specialists-ru.jpg`,
    },
  }

  const meta = metadata[locale] || metadata.ka
  const canonicalUrl =
    locale === 'ka' ? `${baseUrl}/specialists` : `${baseUrl}/${locale}/specialists`

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
  }
}

export default function Page() {
  return <SpecialistsPage />
}

// Enable ISR (Incremental Static Regeneration)
// Revalidate every 3600 seconds (1 hour)
export const revalidate = 3600

