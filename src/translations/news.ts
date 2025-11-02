/**
 * News Page Translations
 * All static text and UI elements for the News/Posts page
 * Multi-language support: Georgian (ka), English (en), Russian (ru)
 */

export const newsTranslations = {
  ka: {
    // Breadcrumb & Navigation
    breadcrumb: 'სიახლეები',
    
    // Page Title & Description
    pageTitle: 'იურიდიული სიახლეები',
    pageSubtitle: 'სამართლებრივი სიახლეები, კანონმდებლობის ცვლილებები და იურიდიული ანალიტიკა',
    
    // Loading States
    loading: 'იტვირთება...',
    loadingPosts: 'პოსტები იტვირთება...',
    postsLoaded: '{count} პოსტი ჩაიტვირთა',
    
    // Empty States
    noPosts: 'პოსტები ჯერ არ არის',
    noPostsDescription: 'ავტორების მიერ ატვირთული სიახლეები აქ გამოჩნდება',
    noPostsPosition: 'პოსტები არ მოიძებნა',
    noPostsPosition1: 'პოზიცია 1 ზე პოსტები არ მოიძებნა',
    noPostsPosition2: 'პოსტები არ მოიძებნა 2',
    noPostsPosition3: 'პოსტები არ მოიძებნა 3',
    noPostsPosition5: '5 პოსტები არ მოიძებნა',
    noPostsPosition6: 'პოსტები არ მოიძებნა 6',
    noPostsPosition7: 'პოზიცია 7-ზე პოსტი არ არის დაყენებული',
    noTranslation: 'თარგმანი არ მოიძებნა',
    uncategorized: 'უკატეგორიო',
    
    // All Posts Section
    allPostsTitle: 'ყველა სტატია',
    totalPosts: 'სულ {count} გამოქვეყნებული სტატია',
    totalCategories: '{count} კატეგორია',
    allPostsStats: 'სულ {postsCount} გამოქვეყნებული სტატია • {categoriesCount} კატეგორია',
    
    // Category Section
    viewAll: 'ყველას ნახვა',
    viewAllInCategory: 'ყველას ნახვა კატეგორიაში',
    
    // Post Card Elements
    readMore: 'ვრცლად',
    readingTime: '{minutes} წთ',
    readingTimeMinutes: 'წთ',
    publishedAt: 'გამოქვეყნდა',
    author: 'ავტორი',
    category: 'კატეგორია',
    
    // Position 5 - News Ticker
    latestNews: 'ახალი ამბები',
    breakingNews: 'მნიშვნელოვანი ამბები',
    
    // Search & Filter (Future Implementation)
    searchPlaceholder: 'სიახლეების ძიება სათაურით, კატეგორიით...',
    searchAriaLabel: 'მოძებნეთ სიახლეები',
    searchDescription: 'შეიყვანეთ საძიებო ტექსტი სიახლეების მოსაძებნად',
    filterButton: 'ფილტრაცია',
    filterTitle: 'ფილტრები',
    clearFilters: 'გასუფთავება',
    
    // Filter Options
    allCategories: 'ყველა კატეგორია',
    filterByCategory: 'კატეგორიით',
    filterByDate: 'თარიღით',
    filterByAuthor: 'ავტორით',
    
    // Sort Options
    sortNewest: 'ახალი → ძველი',
    sortOldest: 'ძველი → ახალი',
    sortAZ: 'ა → ჰ',
    sortZA: 'ჰ → ა',
    sortMostRead: 'ყველაზე წაკითხული',
    sortByDate: 'თარიღით',
    sortByTitle: 'სათაურით',
    sortBy: 'დალაგება',
    
    // View Modes
    gridView: 'ბადე',
    listView: 'სია',
    compactView: 'კომპაქტური',
    viewMode: 'ნახვის რეჟიმი',
    
    // Search Results
    searchResults: 'საძიებო შედეგები',
    resultsFound: 'მოიძებნა {count} შედეგი',
    noResults: 'შედეგი არ მოიძებნა',
    noResultsDescription: 'შეცვალეთ საძიებო კრიტერიუმები ან გაასუფთავეთ ფილტრები',
    searchFor: 'ძებნა: {query}',
    
    // Pagination
    loadMore: 'მეტის ჩატვირთვა',
    showMore: 'მეტის ნახვა',
    showLess: 'ნაკლების ნახვა',
    page: 'გვერდი',
    of: '-დან',
    previousPage: 'წინა გვერდი',
    nextPage: 'შემდეგი გვერდი',
    remaining: 'დარჩა',
    
    // Post Meta
    views: 'ნახვა',
    likes: 'მოწონება',
    shares: 'გაზიარება',
    comments: 'კომენტარი',
    
    // Error States
    error: 'დაფიქსირდა შეცდომა',
    errorLoadingPosts: 'ვერ მოხერხდა პოსტების ჩატვირთვა',
    errorDescription: 'ვერ მოხერხდა სიახლეების ჩატვირთვა. გთხოვთ სცადოთ თავიდან.',
    retry: 'თავიდან ცდა',
    tryAgain: 'კიდევ სცადეთ',
    
    // Accessibility
    skipToContent: 'გადასვლა მთავარ კონტენტზე',
    newsListAriaLabel: 'სიახლეების სია',
    filterMenuAriaLabel: 'საძიებო ფილტრები',
    sortByAriaLabel: 'დალაგება',
    viewModeAriaLabel: 'ნახვის რეჟიმი',
    closeDialog: 'დახურვა',
    openMenu: 'მენიუს გახსნა',
    
    // Time Formats
    justNow: 'ახლახან',
    minutesAgo: '{minutes} წუთის წინ',
    hoursAgo: '{hours} საათის წინ',
    daysAgo: '{days} დღის წინ',
    weeksAgo: '{weeks} კვირის წინ',
    monthsAgo: '{months} თვის წინ',
    yearsAgo: '{years} წლის წინ',
    
    // Related Content
    relatedPosts: 'დაკავშირებული სტატიები',
    popularPosts: 'პოპულარული სტატიები',
    recentPosts: 'ბოლო სტატიები',
    trendingNow: 'ტრენდული ახლა',
    
    // Share & Actions
    share: 'გაზიარება',
    copyLink: 'ბმულის კოპირება',
    shareOnFacebook: 'Facebook-ზე გაზიარება',
    shareOnTwitter: 'Twitter-ზე გაზიარება',
    shareOnLinkedIn: 'LinkedIn-ზე გაზიარება',
    linkCopied: 'ბმული დაკოპირდა',
    
    // Newsletter (if applicable)
    subscribeNewsletter: 'გამოიწერე სიახლეები',
    enterEmail: 'შეიყვანეთ ელ. ფოსტა',
    subscribe: 'გამოწერა',
    subscribed: 'წარმატებით გამოიწერეთ',
    
    // Archive/Statistics
    total: 'სულ',
    legalArticles: 'სამართლებრივი სტატია',
    viewAllInArchive: 'იხილეთ ყველა არქივში',
    
    // Section Titles
    newsTitle: 'ახალი ამბები',
    translationNotFound: 'თარგმანი არ მოიძებნა',
    
    // Archive Page Specific
    backToBlog: 'უკან ბლოგზე',
    archiveTitle: 'არქივი',
    posts: 'სტატია',
    allPosts: 'ყველა სტატია',
    categories: 'კატეგორიები',
  },

  en: {
    // Breadcrumb & Navigation
    breadcrumb: 'News',
    
    // Page Title & Description
    pageTitle: 'Legal News',
    pageSubtitle: 'Legal news, legislative changes, and legal analytics',
    
    // Loading States
    loading: 'Loading...',
    loadingPosts: 'Loading posts...',
    postsLoaded: '{count} posts loaded',
    
    // Empty States
    noPosts: 'No posts yet',
    noPostsDescription: 'News uploaded by authors will appear here',
    noPostsPosition: 'No posts found',
    noPostsPosition1: 'No posts found in position 1',
    noPostsPosition2: 'No posts found 2',
    noPostsPosition3: 'No posts found 3',
    noPostsPosition5: 'No posts found 5',
    noPostsPosition6: 'No posts found 6',
    noPostsPosition7: 'No post assigned to position 7',
    noTranslation: 'Translation not found',
    uncategorized: 'Uncategorized',
    
    // All Posts Section
    allPostsTitle: 'All Articles',
    totalPosts: 'Total {count} published articles',
    totalCategories: '{count} categories',
    allPostsStats: 'Total {postsCount} published articles • {categoriesCount} categories',
    
    // Category Section
    viewAll: 'View All',
    viewAllInCategory: 'View all in category',
    
    // Post Card Elements
    readMore: 'Read More',
    readingTime: '{minutes} min',
    readingTimeMinutes: 'min',
    publishedAt: 'Published',
    author: 'Author',
    category: 'Category',
    
    // Position 5 - News Ticker
    latestNews: 'Latest News',
    breakingNews: 'Breaking News',
    
    // Search & Filter (Future Implementation)
    searchPlaceholder: 'Search news by title, category...',
    searchAriaLabel: 'Search for news',
    searchDescription: 'Enter search text to find news',
    filterButton: 'Filter',
    filterTitle: 'Filters',
    clearFilters: 'Clear All',
    
    // Filter Options
    allCategories: 'All Categories',
    filterByCategory: 'By Category',
    filterByDate: 'By Date',
    filterByAuthor: 'By Author',
    
    // Sort Options
    sortNewest: 'Newest → Oldest',
    sortOldest: 'Oldest → Newest',
    sortAZ: 'A → Z',
    sortZA: 'Z → A',
    sortMostRead: 'Most Read',
    sortByDate: 'By Date',
    sortByTitle: 'By Title',
    sortBy: 'Sort By',
    
    // View Modes
    gridView: 'Grid',
    listView: 'List',
    compactView: 'Compact',
    viewMode: 'View Mode',
    
    // Search Results
    searchResults: 'Search Results',
    resultsFound: 'Found {count} results',
    noResults: 'No results found',
    noResultsDescription: 'Try different search criteria or clear filters',
    searchFor: 'Search: {query}',
    
    // Pagination
    loadMore: 'Load More',
    showMore: 'Show More',
    showLess: 'Show Less',
    page: 'Page',
    of: 'of',
    previousPage: 'Previous Page',
    nextPage: 'Next Page',
    remaining: 'remaining',
    
    // Post Meta
    views: 'Views',
    likes: 'Likes',
    shares: 'Shares',
    comments: 'Comments',
    
    // Error States
    error: 'Error occurred',
    errorLoadingPosts: 'Failed to load posts',
    errorDescription: 'Failed to load news. Please try again.',
    retry: 'Retry',
    tryAgain: 'Try Again',
    
    // Accessibility
    skipToContent: 'Skip to main content',
    newsListAriaLabel: 'News list',
    filterMenuAriaLabel: 'Search filters',
    sortByAriaLabel: 'Sort by',
    viewModeAriaLabel: 'View mode',
    closeDialog: 'Close',
    openMenu: 'Open menu',
    
    // Time Formats
    justNow: 'Just now',
    minutesAgo: '{minutes} minutes ago',
    hoursAgo: '{hours} hours ago',
    daysAgo: '{days} days ago',
    weeksAgo: '{weeks} weeks ago',
    monthsAgo: '{months} months ago',
    yearsAgo: '{years} years ago',
    
    // Related Content
    relatedPosts: 'Related Articles',
    popularPosts: 'Popular Articles',
    recentPosts: 'Recent Articles',
    trendingNow: 'Trending Now',
    
    // Share & Actions
    share: 'Share',
    copyLink: 'Copy Link',
    shareOnFacebook: 'Share on Facebook',
    shareOnTwitter: 'Share on Twitter',
    shareOnLinkedIn: 'Share on LinkedIn',
    linkCopied: 'Link copied',
    
    // Newsletter (if applicable)
    subscribeNewsletter: 'Subscribe to News',
    enterEmail: 'Enter your email',
    subscribe: 'Subscribe',
    subscribed: 'Successfully subscribed',
    
    // Archive/Statistics
    total: 'Total',
    legalArticles: 'Legal Articles',
    viewAllInArchive: 'View All in Archive',
    
    // Section Titles
    newsTitle: 'Latest News',
    translationNotFound: 'Translation not found',
    
    // Archive Page Specific
    backToBlog: 'Back to Blog',
    archiveTitle: 'Archive',
    posts: 'Posts',
    allPosts: 'All Posts',
    categories: 'Categories',
  },

  ru: {
    // Breadcrumb & Navigation
    breadcrumb: 'Новости',
    
    // Page Title & Description
    pageTitle: 'Юридические новости',
    pageSubtitle: 'Юридические новости, изменения законодательства и правовая аналитика',
    
    // Loading States
    loading: 'Загрузка...',
    loadingPosts: 'Загрузка постов...',
    postsLoaded: 'Загружено {count} постов',
    
    // Empty States
    noPosts: 'Постов пока нет',
    noPostsDescription: 'Новости, загруженные авторами, появятся здесь',
    noPostsPosition: 'Посты не найдены',
    noPostsPosition1: 'Посты не найдены в позиции 1',
    noPostsPosition2: 'Посты не найдены 2',
    noPostsPosition3: 'Посты не найдены 3',
    noPostsPosition5: 'Посты не найдены 5',
    noPostsPosition6: 'Посты не найдены 6',
    noPostsPosition7: 'Пост не назначен на позицию 7',
    noTranslation: 'Перевод не найден',
    uncategorized: 'Без категории',
    
    // All Posts Section
    allPostsTitle: 'Все статьи',
    totalPosts: 'Всего {count} опубликованных статей',
    totalCategories: '{count} категорий',
    allPostsStats: 'Всего {postsCount} опубликованных статей • {categoriesCount} категорий',
    
    // Category Section
    viewAll: 'Посмотреть все',
    viewAllInCategory: 'Все в категории',
    
    // Post Card Elements
    readMore: 'Подробнее',
    readingTime: '{minutes} мин',
    readingTimeMinutes: 'мин',
    publishedAt: 'Опубликовано',
    author: 'Автор',
    category: 'Категория',
    
    // Position 5 - News Ticker
    latestNews: 'Последние новости',
    breakingNews: 'Важные новости',
    
    // Search & Filter (Future Implementation)
    searchPlaceholder: 'Поиск новостей по заголовку, категории...',
    searchAriaLabel: 'Поиск новостей',
    searchDescription: 'Введите текст для поиска новостей',
    filterButton: 'Фильтр',
    filterTitle: 'Фильтры',
    clearFilters: 'Очистить все',
    
    // Filter Options
    allCategories: 'Все категории',
    filterByCategory: 'По категории',
    filterByDate: 'По дате',
    filterByAuthor: 'По автору',
    
    // Sort Options
    sortNewest: 'Новые → Старые',
    sortOldest: 'Старые → Новые',
    sortAZ: 'А → Я',
    sortZA: 'Я → А',
    sortMostRead: 'Самые читаемые',
    sortByDate: 'По дате',
    sortByTitle: 'По заголовку',
    sortBy: 'Сортировать',
    
    // View Modes
    gridView: 'Сетка',
    listView: 'Список',
    compactView: 'Компактный',
    viewMode: 'Режим просмотра',
    
    // Search Results
    searchResults: 'Результаты поиска',
    resultsFound: 'Найдено {count} результатов',
    noResults: 'Результаты не найдены',
    noResultsDescription: 'Попробуйте другие критерии поиска или очистите фильтры',
    searchFor: 'Поиск: {query}',
    
    // Pagination
    loadMore: 'Загрузить еще',
    showMore: 'Показать больше',
    showLess: 'Показать меньше',
    page: 'Страница',
    of: 'из',
    previousPage: 'Предыдущая страница',
    nextPage: 'Следующая страница',
    remaining: 'осталось',
    
    // Post Meta
    views: 'Просмотры',
    likes: 'Лайки',
    shares: 'Поделились',
    comments: 'Комментарии',
    
    // Error States
    error: 'Произошла ошибка',
    errorLoadingPosts: 'Не удалось загрузить посты',
    errorDescription: 'Не удалось загрузить новости. Пожалуйста, попробуйте снова.',
    retry: 'Повторить',
    tryAgain: 'Попробовать снова',
    
    // Accessibility
    skipToContent: 'Перейти к основному содержанию',
    newsListAriaLabel: 'Список новостей',
    filterMenuAriaLabel: 'Фильтры поиска',
    sortByAriaLabel: 'Сортировка',
    viewModeAriaLabel: 'Режим просмотра',
    closeDialog: 'Закрыть',
    openMenu: 'Открыть меню',
    
    // Time Formats
    justNow: 'Только что',
    minutesAgo: '{minutes} минут назад',
    hoursAgo: '{hours} часов назад',
    daysAgo: '{days} дней назад',
    weeksAgo: '{weeks} недель назад',
    monthsAgo: '{months} месяцев назад',
    yearsAgo: '{years} лет назад',
    
    // Related Content
    relatedPosts: 'Связанные статьи',
    popularPosts: 'Популярные статьи',
    recentPosts: 'Последние статьи',
    trendingNow: 'В тренде',
    
    // Share & Actions
    share: 'Поделиться',
    copyLink: 'Скопировать ссылку',
    shareOnFacebook: 'Поделиться в Facebook',
    shareOnTwitter: 'Поделиться в Twitter',
    shareOnLinkedIn: 'Поделиться в LinkedIn',
    linkCopied: 'Ссылка скопирована',
    
    // Newsletter (if applicable)
    subscribeNewsletter: 'Подписаться на новости',
    enterEmail: 'Введите email',
    subscribe: 'Подписаться',
    subscribed: 'Успешно подписаны',
    
    // Archive/Statistics
    total: 'Всего',
    legalArticles: 'Юридические статьи',
    viewAllInArchive: 'Посмотреть все в архиве',
    
    // Section Titles
    newsTitle: 'Последние новости',
    translationNotFound: 'Перевод не найден',
    
    // Archive Page Specific
    backToBlog: 'Назад к блогу',
    archiveTitle: 'Архив',
    posts: 'Статьи',
    allPosts: 'Все статьи',
    categories: 'Категории',
  },
} as const

// Type safety exports
export type NewsTranslations = typeof newsTranslations
export type NewsTranslationKey = keyof typeof newsTranslations.ka
export type Locale = keyof typeof newsTranslations
