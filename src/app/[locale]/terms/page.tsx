'use client'

import { useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { FileText } from 'lucide-react'

const termsContent = {
  ka: {
    title: 'წესები და პირობები',
    lastUpdated: 'ბოლო განახლება',
    intro: 'ეს დოკუმენტი განსაზღვრავს წესებსა და პირობებს LegalGE პლატფორმის გამოყენებისთვის. გთხოვთ, ყურადღებით წაიკითხოთ ეს ინფორმაცია.',
    sections: [
      {
        id: 'acceptance',
        title: '1. მომსახურების პირობების მიღება',
        content: 'LegalGE პლატფორმის გამოყენებით, თქვენ ეთანხმებით ამ წესებსა და პირობებს. თუ არ ეთანხმებით, გთხოვთ არ გამოიყენოთ პლატფორმა. ეს პირობები წარმოადგენს იურიდიულ შეთანხმებას თქვენსა და LegalGE-ს შორის.'
      },
      {
        id: 'services',
        title: '2. სერვისების აღწერა',
        content: 'LegalGE არის ონლაინ პლატფორმა, რომელიც აკავშირებს იურიდიულ სპეციალისტებს და კომპანიებს კლიენტებთან. ჩვენ ვთავაზობთ ინფორმაციას პრაქტიკების, სპეციალისტებისა და სერვისების შესახებ. პლატფორმა არ არის იურიდიული სერვისის მიმწოდებელი და არ იღებს პასუხისმგებლობას კონსულტაციების შინაარსზე.'
      },
      {
        id: 'responsibilities',
        title: '3. მომხმარებლის პასუხისმგებლობები',
        content: 'მომხმარებლები ვალდებულნი არიან: უზრუნველყონ ზუსტი და განახლებული ინფორმაცია, დაიცვან სხვა მომხმარებლების უფლებები და კონფიდენციალურობა, არ გამოიყენონ პლატფორმა უკანონო ან არაეთიკური მიზნებისთვის, არ გაავრცელონ სპამი ან მავნე კონტენტი, და დაიცვან საავტორო უფლებები.'
      },
      {
        id: 'ip',
        title: '4. ინტელექტუალური საკუთრება',
        content: 'ყველა კონტენტი, ლოგო, დიზაინი და მასალები LegalGE პლატფორმაზე დაცულია საავტორო უფლებებით და არ შეიძლება გამოყენებულ იქნას ნებართვის გარეშე. მომხმარებლები ინარჩუნებენ უფლებებს თავიანთ კონტენტზე, მაგრამ აძლევენ LegalGE-ს ლიცენზიას მათ გამოსაყენებლად პლატფორმის მიზნებისთვის.'
      },
      {
        id: 'liability',
        title: '5. პასუხისმგებლობის შეზღუდვა',
        content: 'LegalGE არ არის პასუხისმგებელი: მესამე მხარის სერვისების ხარისხზე, ტრანზაქციებზე რომლებიც ხორციელდება პლატფორმის მეშვეობით, მომხმარებლების მიერ განთავსებული ინფორმაციის სიზუსტეზე, პირდაპირ, არაპირდაპირ ან შემთხვევით ზიანზე, და ტექნიკურ შეფერხებებზე ან სერვისის შეწყვეტაზე.'
      },
      {
        id: 'termination',
        title: '6. ანგარიშის შეწყვეტა',
        content: 'LegalGE იტოვებს უფლებას შეაჩეროს ან შეწყვიტოს ნებისმიერი მომხმარებლის ანგარიში წესების დარღვევის შემთხვევაში. მომხმარებლებს აქვთ უფლება ნებისმიერ დროს წაშალონ თავიანთი ანგარიში.'
      },
      {
        id: 'changes',
        title: '7. ცვლილებები',
        content: 'ჩვენ ვიტოვებთ უფლებას შევცვალოთ ეს წესები და პირობები ნებისმიერ დროს. ცვლილებები ძალაში შედის გამოქვეყნებისთანავე. გირჩევთ რეგულარულად შეამოწმოთ ეს გვერდი განახლებებისთვის.'
      },
      {
        id: 'law',
        title: '8. მოქმედი კანონმდებლობა',
        content: 'ეს წესები და პირობები რეგულირდება საქართველოს კანონმდებლობით. ნებისმიერი დავა უნდა გადაწყდეს საქართველოს სასამართლოებში.'
      }
    ]
  },
  en: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last Updated',
    intro: 'This document sets forth the terms and conditions for using the LegalGE platform. Please read this information carefully.',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        content: 'By using the LegalGE platform, you agree to these terms and conditions. If you do not agree, please do not use the platform. These terms constitute a legal agreement between you and LegalGE.'
      },
      {
        id: 'services',
        title: '2. Service Description',
        content: 'LegalGE is an online platform that connects legal specialists and companies with clients. We provide information about practices, specialists, and services. The platform is not a legal service provider and assumes no responsibility for the content of consultations.'
      },
      {
        id: 'responsibilities',
        title: '3. User Responsibilities',
        content: 'Users are required to: provide accurate and updated information, respect other users\' rights and confidentiality, not use the platform for illegal or unethical purposes, not distribute spam or harmful content, and respect copyright.'
      },
      {
        id: 'ip',
        title: '4. Intellectual Property',
        content: 'All content, logos, designs, and materials on the LegalGE platform are protected by copyright and may not be used without permission. Users retain rights to their content but grant LegalGE a license to use it for platform purposes.'
      },
      {
        id: 'liability',
        title: '5. Limitation of Liability',
        content: 'LegalGE is not responsible for: the quality of third-party services, transactions conducted through the platform, accuracy of user-posted information, direct, indirect, or incidental damages, and technical interruptions or service cessation.'
      },
      {
        id: 'termination',
        title: '6. Account Termination',
        content: 'LegalGE reserves the right to suspend or terminate any user account in case of violation of rules. Users have the right to delete their account at any time.'
      },
      {
        id: 'changes',
        title: '7. Changes',
        content: 'We reserve the right to modify these terms and conditions at any time. Changes take effect upon publication. We recommend checking this page regularly for updates.'
      },
      {
        id: 'law',
        title: '8. Governing Law',
        content: 'These terms and conditions are governed by the laws of Georgia. Any disputes shall be resolved in the courts of Georgia.'
      }
    ]
  },
  ru: {
    title: 'Условия использования',
    lastUpdated: 'Последнее обновление',
    intro: 'Этот документ устанавливает условия использования платформы LegalGE. Пожалуйста, внимательно прочитайте эту информацию.',
    sections: [
      {
        id: 'acceptance',
        title: '1. Принятие условий',
        content: 'Используя платформу LegalGE, вы соглашаетесь с этими условиями. Если вы не согласны, пожалуйста, не используйте платформу. Эти условия представляют собой юридическое соглашение между вами и LegalGE.'
      },
      {
        id: 'services',
        title: '2. Описание сервиса',
        content: 'LegalGE - это онлайн-платформа, которая соединяет юридических специалистов и компании с клиентами. Мы предоставляем информацию о практиках, специалистах и услугах. Платформа не является поставщиком юридических услуг и не несет ответственности за содержание консультаций.'
      },
      {
        id: 'responsibilities',
        title: '3. Обязанности пользователя',
        content: 'Пользователи обязаны: предоставлять точную и обновленную информацию, уважать права и конфиденциальность других пользователей, не использовать платформу в незаконных или неэтичных целях, не распространять спам или вредоносный контент, и соблюдать авторские права.'
      },
      {
        id: 'ip',
        title: '4. Интеллектуальная собственность',
        content: 'Весь контент, логотипы, дизайн и материалы на платформе LegalGE защищены авторским правом и не могут быть использованы без разрешения. Пользователи сохраняют права на свой контент, но предоставляют LegalGE лицензию на его использование для целей платформы.'
      },
      {
        id: 'liability',
        title: '5. Ограничение ответственности',
        content: 'LegalGE не несет ответственности за: качество услуг третьих лиц, транзакции, проводимые через платформу, точность информации, размещенной пользователями, прямой, косвенный или случайный ущерб, и технические перебои или прекращение обслуживания.'
      },
      {
        id: 'termination',
        title: '6. Прекращение учетной записи',
        content: 'LegalGE оставляет за собой право приостановить или прекратить любую учетную запись пользователя в случае нарушения правил. Пользователи имеют право удалить свою учетную запись в любое время.'
      },
      {
        id: 'changes',
        title: '7. Изменения',
        content: 'Мы оставляем за собой право изменять эти условия в любое время. Изменения вступают в силу после публикации. Мы рекомендуем регулярно проверять эту страницу на наличие обновлений.'
      },
      {
        id: 'law',
        title: '8. Применимое законодательство',
        content: 'Эти условия регулируются законодательством Грузии. Любые споры должны разрешаться в судах Грузии.'
      }
    ]
  }
}

export default function TermsPage() {
  const params = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = (params.locale as Locale) || 'ka'
  const content = termsContent[locale]

  return (
    <div className={`min-h-screen transition-colors duration-150 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      {/* Header Section */}
      <div className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 lg:px-8 py-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
          }`}>
            <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
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
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6 lg:px-8 py-8">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            © {new Date().getFullYear()} LegalGE. {locale === 'ka' ? 'ყველა უფლება დაცულია' : locale === 'ru' ? 'Все права защищены' : 'All rights reserved'}.
          </p>
        </div>
      </div>
    </div>
  )
}
