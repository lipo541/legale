export const locales = ['ka', 'en', 'ru'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ka'

export const localeNames: Record<Locale, string> = {
  ka: 'ქართული',
  en: 'English',
  ru: 'Русский'
}

export const localeLabels: Record<Locale, string> = {
  ka: 'KA',
  en: 'EN',
  ru: 'RU'
}
