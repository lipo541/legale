import CompaniesPage from '@/components/companies/CompaniesPage';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    ka: 'კომპანიები - LegalGE',
    en: 'Companies - LegalGE',
    ru: 'Компании - LegalGE',
  };

  const descriptions: Record<string, string> = {
    ka: 'დარეგისტრირებული იურიდიული კომპანიები LegalGE პლატფორმაზე. იპოვეთ საუკეთესო იურიდიული სერვისები საქართველოში.',
    en: 'Registered legal companies on LegalGE platform. Find the best legal services in Georgia.',
    ru: 'Зарегистрированные юридические компании на платформе LegalGE. Найдите лучшие юридические услуги в Грузии.',
  };

  return {
    title: titles[locale] || titles.ka,
    description: descriptions[locale] || descriptions.ka,
  };
}

export default function Companies() {
  return <CompaniesPage />;
}
