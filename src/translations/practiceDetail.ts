// ==================== Practice Detail Translations ====================
// Localized text for PracticeDetail component

import type { Locale } from '@/lib/enums'

export interface PracticeDetailText {
  services: string
  servicesAvailable: (count: number) => string
  searchServices: string
  noServices: string
  noSearchResults: string
  loading: string
  back: string
  share: string
  readingTime: string
  minutes: string
  published: string
  updated: string
  wordCount: string
  openServices: string
  closeServices: string
}

const practiceDetailTranslations: Record<Locale, PracticeDetailText> = {
  ka: {
    services: 'სერვისები',
    servicesAvailable: (count: number) => `${count} სერვისი ხელმისაწვდომია`,
    searchServices: 'სერვისების ძებნა...',
    noServices: 'სერვისები არ მოიძებნა',
    noSearchResults: 'ძებნის შედეგები არ მოიძებნა',
    loading: 'იტვირთება...',
    back: 'უკან',
    share: 'გაზიარება',
    readingTime: 'წაკითხვის დრო',
    minutes: 'წთ',
    published: 'გამოქვეყნდა',
    updated: 'განახლდა',
    wordCount: 'სიტყვების რაოდენობა',
    openServices: 'სერვისების გახსნა',
    closeServices: 'სერვისების დახურვა',
  },
  en: {
    services: 'Services',
    servicesAvailable: (count: number) => `${count} services available`,
    searchServices: 'Search services...',
    noServices: 'No services found',
    noSearchResults: 'No search results found',
    loading: 'Loading...',
    back: 'Back',
    share: 'Share',
    readingTime: 'Reading Time',
    minutes: 'min',
    published: 'Published',
    updated: 'Updated',
    wordCount: 'Word Count',
    openServices: 'Open services',
    closeServices: 'Close services',
  },
  ru: {
    services: 'Услуги',
    servicesAvailable: (count: number) => `${count} услуг доступно`,
    searchServices: 'Поиск услуг...',
    noServices: 'Услуги не найдены',
    noSearchResults: 'Результаты поиска не найдены',
    loading: 'Загрузка...',
    back: 'Назад',
    share: 'Поделиться',
    readingTime: 'Время чтения',
    minutes: 'мин',
    published: 'Опубликовано',
    updated: 'Обновлено',
    wordCount: 'Количество слов',
    openServices: 'Открыть услуги',
    closeServices: 'Закрыть услуги',
  },
}

export function getPracticeDetailText(locale: Locale): PracticeDetailText {
  return practiceDetailTranslations[locale]
}

export default practiceDetailTranslations
