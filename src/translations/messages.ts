export const messagesTranslations = {
  ka: {
    title: 'შეტყობინებები',
    unreadMessages: 'წაუკითხავი შეტყობინებები',
    allMessages: 'ყველა შეტყობინება',
    markAllAsRead: 'ყველას წაკითხული',
    back: 'უკან დაბრუნება',
    noMessages: 'შეტყობინებები არ მოიძებნა',
    noUnreadMessages: 'წაუკითხავი შეტყობინებები არ არის',
    loading: 'იტვირთება...',
    new: 'ახალი',
    readAt: 'წაკითხული',
    createdAt: 'შექმნილი',
    priority: {
      urgent: 'სასწრაფო',
      high: 'მაღალი',
      normal: 'ჩვეულებრივი',
      low: 'დაბალი'
    },
    unreadCount: (count: number) => `თქვენ გაქვთ ${count} წაუკითხავი შეტყობინება`,
    allRead: 'ყველა შეტყობინება წაკითხულია'
  },
  en: {
    title: 'Messages',
    unreadMessages: 'Unread Messages',
    allMessages: 'All Messages',
    markAllAsRead: 'Mark All as Read',
    back: 'Go Back',
    noMessages: 'No messages found',
    noUnreadMessages: 'No unread messages',
    loading: 'Loading...',
    new: 'New',
    readAt: 'Read at',
    createdAt: 'Created',
    priority: {
      urgent: 'Urgent',
      high: 'High',
      normal: 'Normal',
      low: 'Low'
    },
    unreadCount: (count: number) => `You have ${count} unread ${count === 1 ? 'message' : 'messages'}`,
    allRead: 'All messages read'
  },
  ru: {
    title: 'Сообщения',
    unreadMessages: 'Непрочитанные сообщения',
    allMessages: 'Все сообщения',
    markAllAsRead: 'Отметить все как прочитанные',
    back: 'Назад',
    noMessages: 'Сообщения не найдены',
    noUnreadMessages: 'Нет непрочитанных сообщений',
    loading: 'Загрузка...',
    new: 'Новое',
    readAt: 'Прочитано',
    createdAt: 'Создано',
    priority: {
      urgent: 'Срочное',
      high: 'Высокий',
      normal: 'Обычный',
      low: 'Низкий'
    },
    unreadCount: (count: number) => `У вас ${count} ${count === 1 ? 'непрочитанное сообщение' : 'непрочитанных сообщений'}`,
    allRead: 'Все сообщения прочитаны'
  }
}
