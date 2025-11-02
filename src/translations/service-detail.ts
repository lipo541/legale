export const serviceDetailTranslations = {
  ka: {
    // Navigation
    backToPractice: 'უკან პრაქტიკაზე',
    
    // Services Sidebar
    services: 'სერვისები',
    servicesAvailable: (count: number) => `${count} სერვისი ხელმისაწვდომია`,
    searchServices: 'სერვისების ძებნა...',
    noServices: 'სერვისები არ მოიძებნა',
    noSearchResults: 'ძებნის შედეგები არ მოიძებნა',
    loading: 'იტვირთება...',
    openServices: 'სერვისების გახსნა',
    closeServices: 'სერვისების დახურვა',
    
    // Meta Information
    readingTime: 'წაკითხვის დრო',
    minutes: 'წთ',
    published: 'გამოქვეყნდა',
    updated: 'განახლდა',
    wordCount: 'სიტყვების რაოდენობა',
    
    // Social Share
    share: 'გაზიარება',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    
    // Specialists Section
    specialistsTitle: 'სერვისის სპეციალისტები',
    companySpecialist: 'კომპანიის სპეციალისტი',
    soloSpecialist: 'დამოუკიდებელი',
    
    // Error Messages
    errorLoadingServices: 'სერვისების ჩატვირთვა ვერ მოხერხდა',
    errorLoadingTranslations: 'თარგმანების ჩატვირთვა ვერ მოხერხდა',
    errorLoadingSpecialists: 'სპეციალისტების ჩატვირთვა ვერ მოხერხდა',
    errorGeneral: 'დაფიქსირდა შეცდომა',
  },
  
  en: {
    // Navigation
    backToPractice: 'Back to Practice',
    
    // Services Sidebar
    services: 'Services',
    servicesAvailable: (count: number) => `${count} services available`,
    searchServices: 'Search services...',
    noServices: 'No services found',
    noSearchResults: 'No results found',
    loading: 'Loading...',
    openServices: 'Open services',
    closeServices: 'Close services',
    
    // Meta Information
    readingTime: 'Reading Time',
    minutes: 'min',
    published: 'Published',
    updated: 'Updated',
    wordCount: 'Word Count',
    
    // Social Share
    share: 'Share',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    
    // Specialists Section
    specialistsTitle: 'Specialists for this service',
    companySpecialist: 'Company Specialist',
    soloSpecialist: 'Independent',
    
    // Error Messages
    errorLoadingServices: 'Failed to load services',
    errorLoadingTranslations: 'Failed to load translations',
    errorLoadingSpecialists: 'Failed to load specialists',
    errorGeneral: 'An error occurred',
  },
  
  ru: {
    // Navigation
    backToPractice: 'Назад к практике',
    
    // Services Sidebar
    services: 'Услуги',
    servicesAvailable: (count: number) => `${count} услуг доступно`,
    searchServices: 'Поиск услуг...',
    noServices: 'Услуги не найдены',
    noSearchResults: 'Результаты не найдены',
    loading: 'Загрузка...',
    openServices: 'Открыть услуги',
    closeServices: 'Закрыть услуги',
    
    // Meta Information
    readingTime: 'Время чтения',
    minutes: 'мин',
    published: 'Опубликовано',
    updated: 'Обновлено',
    wordCount: 'Количество слов',
    
    // Social Share
    share: 'Поделиться',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    
    // Specialists Section
    specialistsTitle: 'Специалисты этой услуги',
    companySpecialist: 'Специалист компании',
    soloSpecialist: 'Независимый',
    
    // Error Messages
    errorLoadingServices: 'Не удалось загрузить услуги',
    errorLoadingTranslations: 'Не удалось загрузить переводы',
    errorLoadingSpecialists: 'Не удалось загрузить специалистов',
    errorGeneral: 'Произошла ошибка',
  },
}

// Helper function to get translations for specific locale
export function getServiceDetailTranslations(locale: 'ka' | 'en' | 'ru') {
  return serviceDetailTranslations[locale]
}
