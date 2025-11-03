'use client'

import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { contactTranslations } from '@/translations/contact'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

interface ContactInfoProps {
  locale: Locale
}

export default function ContactInfo({ locale }: ContactInfoProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = contactTranslations[locale]

  const contactInfo = [
    {
      icon: Phone,
      title: t.info.phone,
      content: t.info.phoneNumber,
      href: 'tel:+995XXXXXXXXX',
    },
    {
      icon: Mail,
      title: t.info.email,
      content: t.info.emailAddress,
      href: 'mailto:info@legalge.ge',
    },
    {
      icon: MapPin,
      title: t.info.address,
      content: `${t.info.addressLine1}, ${t.info.addressLine2}`,
      href: 'https://goo.gl/maps/your-location',
    },
    {
      icon: Clock,
      title: t.info.workingHours,
      content: `${t.info.workingDays}\n${t.info.weekend}`,
      href: null,
    },
  ]

  return (
    <div className={`min-h-screen py-20 transition-colors duration-150 ${
      isDark ? 'bg-black' : 'bg-white'
    }`}>
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {t.title}
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {t.subtitle}
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            const content = info.href ? (
              <a
                href={info.href}
                className={`transition-colors duration-300 hover:underline ${
                  isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
                }`}
              >
                {info.content}
              </a>
            ) : (
              <span className={isDark ? 'text-white/70' : 'text-black/70'}>
                {info.content.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </span>
            )

            return (
              <div
                key={index}
                className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-black/5 border-black/10 hover:bg-black/10'
                }`}
              >
                <div className={`inline-flex p-3 rounded-lg mb-4 ${
                  isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  <Icon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <h3 className={`text-sm font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-black'
                }`}>
                  {info.title}
                </h3>
                <div className="text-sm">
                  {content}
                </div>
              </div>
            )
          })}
        </div>

        {/* Map Section - Full Width */}
        <div className="mt-12">
          <h2 className={`text-2xl font-bold mb-6 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            {t.location.title}
          </h2>

          <div className={`rounded-2xl overflow-hidden border ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1068.6113442117846!2d44.767480613641645!3d41.80566085451169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zNDHCsDQ4JzIxLjEiTiA0NMKwNDYnMDQuMCJF!5e0!3m2!1sen!2sge!4v1762118334580!5m2!1sen!2sge"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className={isDark ? 'grayscale invert' : ''}
              title="LegalGE Location"
            />
          </div>

          <a
            href="https://www.google.com/maps/place/41%C2%B048'21.1%22N+44%C2%B046'04.0%22E/@41.8056609,44.7674806,19z"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 mt-4 text-sm font-medium transition-all duration-300 hover:translate-x-1 ${
              isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {t.location.viewLarger}
          </a>
        </div>
      </div>
    </div>
  )
}
