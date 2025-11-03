'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { Shield } from 'lucide-react'

const privacyContent = {
  ka: {
    title: 'კონფიდენციალურობის პოლიტიკა',
    lastUpdated: 'ბოლო განახლება',
    intro: 'LegalGE ყურადღებით ეკიდება თქვენი პირადი ინფორმაციის დაცვას და კონფიდენციალურობას. ეს პოლიტიკა განმარტავს როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს მონაცემებს.',
    sections: [
      {
        id: 'intro',
        title: '1. შესავალი',
        content: 'ეს კონფიდენციალურობის პოლიტიკა განმარტავს თუ როგორ აგროვებს, იყენებს და იცავს LegalGE თქვენს პერსონალურ ინფორმაციას. ჩვენი პლატფორმის გამოყენებით, თქვენ ეთანხმებით ამ პოლიტიკაში აღწერილ პრაქტიკებს.'
      },
      {
        id: 'collection',
        title: '2. ინფორმაციის შეგროვება',
        content: 'ჩვენ ვაგროვებთ ინფორმაციას, რომელსაც თქვენ გვაწვდით რეგისტრაციისას ან ჩვენი სერვისების გამოყენებისას. ეს მოიცავს: სახელს და გვარს, ელექტრონული ფოსტის მისამართს, ტელეფონის ნომერს, კომპანიის ინფორმაციას (თუ გამოიყენება), და სხვა რელევანტურ პროფესიულ ინფორმაციას.'
      },
      {
        id: 'usage',
        title: '3. ინფორმაციის გამოყენება',
        content: 'თქვენი პერსონალური ინფორმაცია გამოიყენება შემდეგი მიზნებისთვის: სერვისების უზრუნველსაყოფად და გასაუმჯობესებლად, მომხმარებლებთან კომუნიკაციისთვის, პლატფორმის უსაფრთხოების უზრუნველსაყოფად, იურიდიული მოთხოვნების დასაკმაყოფილებლად, და პერსონალიზებული გამოცდილების შესაქმნელად.'
      },
      {
        id: 'protection',
        title: '4. მონაცემთა დაცვა',
        content: 'ჩვენ ვიყენებთ ინდუსტრიის სტანდარტულ უსაფრთხოების ზომებს თქვენი პერსონალური ინფორმაციის დასაცავად, მათ შორის: დაშიფვრას (SSL/TLS), უსაფრთხო სერვერებს, წვდომის კონტროლს, რეგულარულ უსაფრთხოების აუდიტს, და პერსონალის ტრენინგს მონაცემთა დაცვის საკითხებში.'
      },
      {
        id: 'cookies',
        title: '5. ქუქი-ფაილები',
        content: 'ჩვენი ვებსაიტი იყენებს ქუქი-ფაილებს მომხმარებლის გამოცდილების გასაუმჯობესებლად. ქუქი-ფაილები გამოიყენება სესიის მართვისთვის, თქვენი პარამეტრების დასამახსოვრებლად, ანალიტიკის მიზნებისთვის, და საიტის ფუნქციონალობის უზრუნველსაყოფად.'
      },
      {
        id: 'sharing',
        title: '6. ინფორმაციის გაზიარება',
        content: 'ჩვენ არ ვყიდით, არ ვაქირავებთ და არ ვაცვლით თქვენს პირად ინფორმაციას მესამე მხარეებთან. ინფორმაცია შეიძლება გაიზიაროს მხოლოდ: თქვენი თანხმობით, სერვის პროვაიდერებთან (რომლებიც ვალდებულნი არიან დაიცვან კონფიდენციალურობა), იურიდიული მოთხოვნების შესაბამისად, ან პლატფორმის უსაფრთხოების დასაცავად.'
      },
      {
        id: 'rights',
        title: '7. თქვენი უფლებები',
        content: 'თქვენ გაქვთ უფლება: წვდომა იქონიოთ თქვენს პერსონალურ ინფორმაციაზე, გამოასწოროთ არასწორი ინფორმაცია, მოითხოვოთ თქვენი მონაცემების წაშლა, შეაჩეროთ ინფორმაციის დამუშავება, გადმოიტანოთ თქვენი მონაცემები, და გააუქმოთ თანხმობა ნებისმიერ დროს.'
      },
      {
        id: 'contact',
        title: '8. კონტაქტი',
        content: 'თუ გაქვთ კითხვები ამ პოლიტიკასთან დაკავშირებით ან გსურთ განახორციელოთ თქვენი უფლებები, გთხოვთ დაგვიკავშირდეთ: ელ. ფოსტა info@legalge.ge, ტელეფონი +995 XXX XXX XXX, მისამართი თბილისი, საქართველო.'
      }
    ]
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated',
    intro: 'LegalGE is committed to protecting your personal information and privacy. This policy explains how we collect, use, and safeguard your data.',
    sections: [
      {
        id: 'intro',
        title: '1. Introduction',
        content: 'This Privacy Policy explains how LegalGE collects, uses, and protects your personal information. By using our platform, you agree to the practices described in this policy.'
      },
      {
        id: 'collection',
        title: '2. Information Collection',
        content: 'We collect information you provide during registration or when using our services. This includes: full name, email address, phone number, company information (if applicable), and other relevant professional information.'
      },
      {
        id: 'usage',
        title: '3. Use of Information',
        content: 'Your personal information is used for: providing and improving services, communicating with users, maintaining platform security, complying with legal requirements, and creating personalized experiences.'
      },
      {
        id: 'protection',
        title: '4. Data Protection',
        content: 'We use industry-standard security measures to protect your personal information, including: encryption (SSL/TLS), secure servers, access controls, regular security audits, and staff training on data protection.'
      },
      {
        id: 'cookies',
        title: '5. Cookies',
        content: 'Our website uses cookies to enhance user experience. Cookies are used for session management, remembering your preferences, analytics purposes, and ensuring site functionality.'
      },
      {
        id: 'sharing',
        title: '6. Information Sharing',
        content: 'We do not sell, rent, or trade your personal information with third parties. Information may only be shared: with your consent, with service providers (who are obligated to maintain confidentiality), as required by law, or to protect platform security.'
      },
      {
        id: 'rights',
        title: '7. Your Rights',
        content: 'You have the right to: access your personal information, correct inaccurate information, request deletion of your data, stop information processing, transfer your data, and withdraw consent at any time.'
      },
      {
        id: 'contact',
        title: '8. Contact',
        content: 'If you have questions about this policy or wish to exercise your rights, please contact us: Email info@legalge.ge, Phone +995 XXX XXX XXX, Address Tbilisi, Georgia.'
      }
    ]
  },
  ru: {
    title: 'Политика конфиденциальности',
    lastUpdated: 'Последнее обновление',
    intro: 'LegalGE заботится о защите вашей личной информации и конфиденциальности. Эта политика объясняет, как мы собираем, используем и защищаем ваши данные.',
    sections: [
      {
        id: 'intro',
        title: '1. Введение',
        content: 'Эта Политика конфиденциальности объясняет, как LegalGE собирает, использует и защищает вашу личную информацию. Используя нашу платформу, вы соглашаетесь с практиками, описанными в этой политике.'
      },
      {
        id: 'collection',
        title: '2. Сбор информации',
        content: 'Мы собираем информацию, которую вы предоставляете при регистрации или использовании наших услуг. Это включает: полное имя, адрес электронной почты, номер телефона, информацию о компании (если применимо) и другую релевантную профессиональную информацию.'
      },
      {
        id: 'usage',
        title: '3. Использование информации',
        content: 'Ваша личная информация используется для: предоставления и улучшения услуг, общения с пользователями, обеспечения безопасности платформы, соблюдения юридических требований и создания персонализированного опыта.'
      },
      {
        id: 'protection',
        title: '4. Защита данных',
        content: 'Мы используем стандартные отраслевые меры безопасности для защиты вашей личной информации, включая: шифрование (SSL/TLS), защищенные серверы, контроль доступа, регулярные аудиты безопасности и обучение персонала по вопросам защиты данных.'
      },
      {
        id: 'cookies',
        title: '5. Файлы cookie',
        content: 'Наш веб-сайт использует файлы cookie для улучшения пользовательского опыта. Файлы cookie используются для управления сеансами, запоминания ваших предпочтений, аналитики и обеспечения функциональности сайта.'
      },
      {
        id: 'sharing',
        title: '6. Обмен информацией',
        content: 'Мы не продаем, не сдаем в аренду и не обмениваем вашу личную информацию с третьими лицами. Информация может быть передана только: с вашего согласия, поставщикам услуг (которые обязаны соблюдать конфиденциальность), по требованию закона или для защиты безопасности платформы.'
      },
      {
        id: 'rights',
        title: '7. Ваши права',
        content: 'Вы имеете право: получить доступ к вашей личной информации, исправить неточную информацию, запросить удаление ваших данных, остановить обработку информации, передать ваши данные и отозвать согласие в любое время.'
      },
      {
        id: 'contact',
        title: '8. Контакты',
        content: 'Если у вас есть вопросы об этой политике или вы хотите реализовать свои права, свяжитесь с нами: Email info@legalge.ge, Телефон +995 XXX XXX XXX, Адрес Тбилиси, Грузия.'
      }
    ]
  }
}

export default function PrivacyPage() {
  const params = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = (params.locale as Locale) || 'ka'
  const content = privacyContent[locale]

  return (
    <div className={`min-h-screen transition-colors duration-150 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      {/* Header Section */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}>
            <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
            <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              {content.lastUpdated}: {new Date().toLocaleDateString(locale === 'ka' ? 'ka-GE' : locale === 'ru' ? 'ru-RU' : 'en-US')}
            </span>
          </div>
          
          <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {content.title}
          </h1>
          
          <p className={`text-sm leading-relaxed max-w-[700px] ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {content.intro}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12">
        <div className="space-y-12">
          {content.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className={`text-base font-semibold mb-3 ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {section.title}
              </h2>
              <p className={`text-sm leading-relaxed ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                {section.content}
              </p>
            </section>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className={`border-t mt-16 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            © {new Date().getFullYear()} LegalGE. {locale === 'ka' ? 'ყველა უფლება დაცულია' : locale === 'ru' ? 'Все права защищены' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </div>
  )
}
