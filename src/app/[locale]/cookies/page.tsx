'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { Cookie } from 'lucide-react'

const cookiesContent = {
  ka: {
    title: 'ქუქი-ფაილების პოლიტიკა',
    lastUpdated: 'ბოლო განახლება',
    intro: 'ეს დოკუმენტი აღწერს როგორ იყენებს LegalGE ქუქი-ფაილებს თქვენი გამოცდილების გასაუმჯობესებლად.',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. რა არის ქუქი-ფაილები?',
        content: 'ქუქი-ფაილები არის მცირე ტექსტური ფაილები, რომლებიც ინახება თქვენს მოწყობილობაში, როდესაც იყენებთ ვებსაიტებს. ისინი ფართოდ გამოიყენება ვებსაიტების ეფექტურად მუშაობისთვის და მომხმარებლებისთვის უკეთესი გამოცდილების უზრუნველსაყოფად.'
      },
      {
        id: 'cookie-types',
        title: '2. რა სახის ქუქი-ფაილებს ვიყენებთ?',
        content: 'ჩვენ ვიყენებთ სამ ძირითად ტიპის ქუქი-ფაილებს: აუცილებელი ქუქი-ფაილები (საიტის ფუნქციონირებისთვის), ანალიტიკური ქუქი-ფაილები (მომხმარებელთა ქცევის შესასწავლად) და ფუნქციონალური ქუქი-ფაილები (თქვენი პრეფერენციების დასამახსოვრებლად).'
      },
      {
        id: 'essential-cookies',
        title: '3. აუცილებელი ქუქი-ფაილები',
        content: 'ეს ქუქი-ფაილები აუცილებელია ვებსაიტის საბაზისო ფუნქციების მუშაობისთვის. ისინი მოიცავს ავტორიზაციის, უსაფრთხოების და ნავიგაციის ქუქი-ფაილებს. ამ ქუქი-ფაილების გარეშე ზოგიერთი სერვისი შეიძლება არ იმუშაოს სწორად.'
      },
      {
        id: 'analytics-cookies',
        title: '4. ანალიტიკური ქუქი-ფაილები',
        content: 'ანალიტიკური ქუქი-ფაილები გვეხმარება გავიგოთ როგორ იყენებენ მომხმარებლები ჩვენს ვებსაიტს. ეს ინფორმაცია დაგვეხმარება საიტის გაუმჯობესებაში და უკეთესი გამოცდილების შექმნაში.'
      },
      {
        id: 'functional-cookies',
        title: '5. ფუნქციონალური ქუქი-ფაილები',
        content: 'ფუნქციონალური ქუქი-ფაილები ინახავს თქვენს პრეფერენციებს, როგორიცაა ენის არჩევანი, თემის რეჟიმი (ღამის/დღის) და სხვა პერსონალიზებული პარამეტრები.'
      },
      {
        id: 'third-party',
        title: '6. მესამე მხარის ქუქი-ფაილები',
        content: 'ჩვენ შეიძლება გამოვიყენოთ მესამე მხარის სერვისები, როგორიცაა Google Analytics, რომლებიც ასევე აყენებენ საკუთარ ქუქი-ფაილებს. ეს ქუქი-ფაილები ექვემდებარება მათი შესაბამისი პოლიტიკების.'
      },
      {
        id: 'cookie-management',
        title: '7. ქუქი-ფაილების მართვა',
        content: 'თქვენ შეგიძლიათ მართოთ ან გამორთოთ ქუქი-ფაილები თქვენი ბრაუზერის პარამეტრებიდან. გთხოვთ გაითვალისწინოთ, რომ ქუქი-ფაილების გამორთვამ შეიძლება შეზღუდოს ზოგიერთი ფუნქციის ხელმისაწვდომობა.'
      },
      {
        id: 'cookie-duration',
        title: '8. ქუქი-ფაილების ხანგრძლივობა',
        content: 'ზოგიერთი ქუქი-ფაილი წაიშლება თქვენი სესიის დასრულებისთანავე (სესიის ქუქი-ფაილები), სხვები კი რჩება თქვენს მოწყობილობაზე გარკვეული დროის განმავლობაში (მუდმივი ქუქი-ფაილები).'
      },
      {
        id: 'updates',
        title: '9. პოლიტიკის განახლებები',
        content: 'ჩვენ შეიძლება პერიოდულად განვაახლოთ ეს პოლიტიკა. ყველა ცვლილების შესახებ თქვენ შეიტყობთ ამ გვერდის განახლების თარიღის მეშვეობით.'
      }
    ]
  },
  en: {
    title: 'Cookie Policy',
    lastUpdated: 'Last Updated',
    intro: 'This document describes how LegalGE uses cookies to improve your experience.',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. What are Cookies?',
        content: 'Cookies are small text files stored on your device when you use websites. They are widely used to make websites work more efficiently and provide a better user experience.'
      },
      {
        id: 'cookie-types',
        title: '2. What Types of Cookies Do We Use?',
        content: 'We use three main types of cookies: essential cookies (for site functionality), analytics cookies (to understand user behavior), and functional cookies (to remember your preferences).'
      },
      {
        id: 'essential-cookies',
        title: '3. Essential Cookies',
        content: 'These cookies are necessary for the basic functions of the website. They include authentication, security, and navigation cookies. Without these cookies, some services may not work properly.'
      },
      {
        id: 'analytics-cookies',
        title: '4. Analytics Cookies',
        content: 'Analytics cookies help us understand how users interact with our website. This information helps us improve the site and create a better experience.'
      },
      {
        id: 'functional-cookies',
        title: '5. Functional Cookies',
        content: 'Functional cookies store your preferences, such as language selection, theme mode (dark/light), and other personalized settings.'
      },
      {
        id: 'third-party',
        title: '6. Third-Party Cookies',
        content: 'We may use third-party services such as Google Analytics, which also set their own cookies. These cookies are subject to their respective policies.'
      },
      {
        id: 'cookie-management',
        title: '7. Cookie Management',
        content: 'You can manage or disable cookies from your browser settings. Please note that disabling cookies may limit the availability of some features.'
      },
      {
        id: 'cookie-duration',
        title: '8. Cookie Duration',
        content: 'Some cookies are deleted when you end your session (session cookies), while others remain on your device for a certain period (persistent cookies).'
      },
      {
        id: 'updates',
        title: '9. Policy Updates',
        content: 'We may periodically update this policy. You will be notified of any changes through the update date on this page.'
      }
    ]
  },
  ru: {
    title: 'Политика использования файлов cookie',
    lastUpdated: 'Последнее обновление',
    intro: 'Этот документ описывает, как LegalGE использует файлы cookie для улучшения вашего опыта.',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. Что такое файлы cookie?',
        content: 'Файлы cookie - это небольшие текстовые файлы, которые сохраняются на вашем устройстве при использовании веб-сайтов. Они широко используются для более эффективной работы сайтов и предоставления лучшего пользовательского опыта.'
      },
      {
        id: 'cookie-types',
        title: '2. Какие типы файлов cookie мы используем?',
        content: 'Мы используем три основных типа файлов cookie: необходимые cookie (для функционирования сайта), аналитические cookie (для понимания поведения пользователей) и функциональные cookie (для запоминания ваших предпочтений).'
      },
      {
        id: 'essential-cookies',
        title: '3. Необходимые файлы cookie',
        content: 'Эти файлы cookie необходимы для базовых функций веб-сайта. Они включают cookie авторизации, безопасности и навигации. Без этих файлов некоторые сервисы могут работать некорректно.'
      },
      {
        id: 'analytics-cookies',
        title: '4. Аналитические файлы cookie',
        content: 'Аналитические файлы cookie помогают нам понять, как пользователи взаимодействуют с нашим сайтом. Эта информация помогает нам улучшить сайт и создать лучший опыт.'
      },
      {
        id: 'functional-cookies',
        title: '5. Функциональные файлы cookie',
        content: 'Функциональные файлы cookie сохраняют ваши предпочтения, такие как выбор языка, режим темы (темная/светлая) и другие персонализированные настройки.'
      },
      {
        id: 'third-party',
        title: '6. Файлы cookie третьих сторон',
        content: 'Мы можем использовать сервисы третьих сторон, такие как Google Analytics, которые также устанавливают свои собственные файлы cookie. Эти файлы подчиняются их соответствующим политикам.'
      },
      {
        id: 'cookie-management',
        title: '7. Управление файлами cookie',
        content: 'Вы можете управлять или отключить файлы cookie в настройках вашего браузера. Обратите внимание, что отключение файлов cookie может ограничить доступность некоторых функций.'
      },
      {
        id: 'cookie-duration',
        title: '8. Продолжительность хранения файлов cookie',
        content: 'Некоторые файлы cookie удаляются после завершения вашей сессии (сеансовые cookie), в то время как другие остаются на вашем устройстве в течение определенного времени (постоянные cookie).'
      },
      {
        id: 'updates',
        title: '9. Обновления политики',
        content: 'Мы можем периодически обновлять эту политику. Вы будете уведомлены о любых изменениях через дату обновления на этой странице.'
      }
    ]
  }
}

export default function CookiesPage() {
  const params = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = (params.locale as Locale) || 'ka'
  const content = cookiesContent[locale]

  return (
    <div className={`min-h-screen transition-colors duration-150 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
            <Cookie className={`w-3.5 h-3.5 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {content.lastUpdated}: 03.11.2025
            </span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
            {content.title}
          </h1>
          <p className={`text-sm leading-relaxed max-w-[700px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {content.intro}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12">
        <div className="space-y-12">
          {content.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                {section.title}
              </h2>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t mt-16 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            © 2025 LegalGE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
