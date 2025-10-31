'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'

interface SkipLinkProps {
  target?: string
  label?: string
}

export default function SkipLink({ target = '#main-content', label }: SkipLinkProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'

  const defaultLabels = {
    ka: 'გადასვლა მთავარ შინაარსზე',
    en: 'Skip to main content',
    ru: 'Перейти к основному содержимому',
  }

  const linkLabel = label || defaultLabels[locale]

  return (
    <a
      href={target}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium focus:text-sm transition-all duration-300 ${
        isDark
          ? 'focus:bg-white focus:text-black focus:ring-2 focus:ring-white/50'
          : 'focus:bg-black focus:text-white focus:ring-2 focus:ring-black/50 focus:shadow-xl'
      }`}
    >
      {linkLabel}
    </a>
  )
}
