'use client'

import { useParams } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import CookiesContent from '@/components/cookies/CookiesContent'

export default function CookiesPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ka'

  return <CookiesContent locale={locale} />
}
