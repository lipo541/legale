'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { footerTranslations } from '@/translations/footer'
import { Facebook, Linkedin, Twitter, Instagram, Heart } from 'lucide-react'

export default function Footer() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const isDark = theme === 'dark'

  // Extract current locale from pathname
  const pathLocale = pathname.split('/')[1] as Locale
  const currentLocale = ['ka', 'en', 'ru'].includes(pathLocale) ? pathLocale : 'ka'
  const t = footerTranslations[currentLocale]

  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: `/${currentLocale}/practices`, label: t.practices },
    { href: `/${currentLocale}/specialists`, label: t.specialists },
    { href: `/${currentLocale}/companies`, label: t.companies },
    { href: `/${currentLocale}/news`, label: t.blog },
    { href: `/${currentLocale}/contact`, label: t.contact },
  ]

  const legalLinks = [
    { href: `/${currentLocale}/privacy`, label: t.privacy },
    { href: `/${currentLocale}/terms`, label: t.terms },
    { href: `/${currentLocale}/cookies`, label: t.cookies },
  ]

  const socialLinks = [
    { href: 'https://facebook.com', icon: Facebook, label: 'Facebook', ariaLabel: 'Visit our Facebook page' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn', ariaLabel: 'Visit our LinkedIn page' },
    { href: 'https://twitter.com', icon: Twitter, label: 'Twitter', ariaLabel: 'Visit our Twitter page' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram', ariaLabel: 'Visit our Instagram page' },
  ]

  return (
    <footer
      className={`mt-auto border-t transition-colors duration-150 ${
        isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href={`/${currentLocale}`} className="inline-block">
              <Image
                src={isDark ? "/asset/Legal.ge.png" : "/asset/legal.ge.black.png"}
                alt="LegalGE"
                width={140}
                height={40}
                className="object-contain h-8"
              />
              <span className="sr-only">LegalGE</span>
            </Link>
            <p
              className={`text-sm leading-relaxed ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              {t.tagline}
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ href, icon: Icon, label, ariaLabel }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                      : 'bg-black/5 hover:bg-black/10 text-black/70 hover:text-black'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              {t.quickLinks}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm transition-all duration-300 inline-block ${
                      isDark
                        ? 'text-white/60 hover:text-white hover:translate-x-1'
                        : 'text-black/60 hover:text-black hover:translate-x-1'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              {t.legal}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm transition-all duration-300 inline-block ${
                      isDark
                        ? 'text-white/60 hover:text-white hover:translate-x-1'
                        : 'text-black/60 hover:text-black hover:translate-x-1'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter/Contact Section */}
          <div className="space-y-4">
            <h3
              className={`text-sm font-semibold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-black'
              }`}
            >
              {t.contact}
            </h3>
            <div className="space-y-2 text-sm">
              <p className={isDark ? 'text-white/60' : 'text-black/60'}>
                contact@legal.ge
              </p>
              <p className={isDark ? 'text-white/60' : 'text-black/60'}>
                +995 551 911 961
              </p>
              <p className={isDark ? 'text-white/60' : 'text-black/60'}>
                თბილისი, საქართველო
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`py-6 border-t ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p
              className={`text-sm text-center md:text-left ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              © {currentYear} LegalGE. {t.allRightsReserved}.
            </p>

            {/* Made with Love */}
            <p
              className={`text-sm flex items-center gap-1.5 ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}
            >
              {t.madeWith}{' '}
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isDark ? 'text-red-400' : 'text-red-500'
                }`}
                fill="currentColor"
              />{' '}
              {t.in} {t.georgia}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
