/**
 * Practice Page Translations
 * All languages in one place for easy editing
 */

export const practiceTranslations = {
  ka: {
    breadcrumb: 'პრაქტიკა',
    title: 'იურიდიული პრაქტიკა',
    subtitle: 'პროფესიონალური იურიდიული მომსახურება ყველა სფეროში',
    searchPlaceholder: 'პრაქტიკების და სერვისების ძიება...',
    practices: 'პრაქტიკა',
    services: 'სერვისი',
    filterAll: 'ყველა კატეგორია',
    sortNewest: 'ახალი → ძველი',
    sortOldest: 'ძველი → ახალი',
    sortAZ: 'A → Z',
    sortZA: 'Z → A',
    noResults: 'შედეგი არ მოიძებნა',
    noResultsDesc: 'სცადეთ სხვა საძიებო სიტყვები ან გაასუფთავეთ ფილტრები',
    noPractices: 'პრაქტიკები ჯერ არ არის',
    noPracticesDesc: 'მალე დაემატება ახალი იურიდიული პრაქტიკები',
    error: 'დაფიქსირდა შეცდომა',
    errorDesc: 'ვერ მოხერხდა პრაქტიკების ჩატვირთვა. გთხოვთ სცადოთ თავიდან.',
    retry: 'თავიდან ცდა',
    loadMore: 'მეტის ნახვა',
  },
  en: {
    breadcrumb: 'Practice',
    title: 'Legal Practice',
    subtitle: 'Professional legal services in all areas',
    searchPlaceholder: 'Search practices and services...',
    practices: 'Practices',
    services: 'Services',
    filterAll: 'All Categories',
    sortNewest: 'Newest → Oldest',
    sortOldest: 'Oldest → Newest',
    sortAZ: 'A → Z',
    sortZA: 'Z → A',
    noResults: 'No results found',
    noResultsDesc: 'Try different keywords or clear filters',
    noPractices: 'No practices yet',
    noPracticesDesc: 'New legal practices will be added soon',
    error: 'Error occurred',
    errorDesc: 'Failed to load practices. Please try again.',
    retry: 'Retry',
    loadMore: 'Load More',
  },
  ru: {
    breadcrumb: 'Практика',
    title: 'Юридическая практика',
    subtitle: 'Профессиональные юридические услуги во всех сферах',
    searchPlaceholder: 'Поиск практик и услуг...',
    practices: 'Практики',
    services: 'Услуги',
    filterAll: 'Все категории',
    sortNewest: 'Новые → Старые',
    sortOldest: 'Старые → Новые',
    sortAZ: 'A → Z',
    sortZA: 'Z → A',
    noResults: 'Результаты не найдены',
    noResultsDesc: 'Попробуйте другие ключевые слова или очистите фильтры',
    noPractices: 'Практик пока нет',
    noPracticesDesc: 'Новые юридические практики будут добавлены в ближайшее время',
    error: 'Произошла ошибка',
    errorDesc: 'Не удалось загрузить практики. Пожалуйста, попробуйте снова.',
    retry: 'Повторить',
    loadMore: 'Загрузить еще',
  },
} as const

// Type for autocomplete and type safety
export type PracticeTranslations = typeof practiceTranslations
export type PracticeTranslationKey = keyof typeof practiceTranslations.ka
export type Locale = keyof typeof practiceTranslations
