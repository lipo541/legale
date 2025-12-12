import { permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

// Root page redirects to /ka with 308 permanent redirect
// This tells Google that /ka is the canonical home page
export const metadata: Metadata = {
  title: 'Legal.ge - იურიდიული პლატფორმა',
  description: 'საქართველოს წამყვანი იურიდიული პლატფორმა - იპოვეთ იურისტები, კომპანიები და სამართლებრივი სიახლეები',
  robots: {
    index: false,  // Don't index root, only index /ka
    follow: true,
  },
  alternates: {
    canonical: `${siteConfig.baseUrl}/ka`,
    languages: {
      'ka': `${siteConfig.baseUrl}/ka`,
      'en': `${siteConfig.baseUrl}/en`,
      'ru': `${siteConfig.baseUrl}/ru`,
      'x-default': `${siteConfig.baseUrl}/ka`,
    },
  },
}

export default async function RootRedirect() {
  // 308 Permanent redirect to /ka - always redirect to Georgian (default locale)
  // Don't use cookies for SEO - Google should always see /ka as the destination
  permanentRedirect('/ka')
}
