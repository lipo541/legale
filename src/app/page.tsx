import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

// Root page redirects to /ka - tell Google the canonical is /ka
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
  // Get locale from cookie or default to 'ka'
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ka'
  
  // Server-side redirect to locale page (better for SEO)
  redirect(`/${locale}`)
}
