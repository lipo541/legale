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

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
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
