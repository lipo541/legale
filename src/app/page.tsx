import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'

// Root page redirects to locale - allow indexing so Google can follow
export const metadata: Metadata = {
  title: 'Legal.ge - იურიდიული პლატფორმა',
  description: 'საქართველოს წამყვანი იურიდიული პლატფორმა - იპოვეთ იურისტები, კომპანიები და სამართლებრივი სიახლეები',
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootRedirect() {
  // Get locale from cookie or default to 'ka'
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ka'
  
  // Server-side redirect to locale page (better for SEO)
  redirect(`/${locale}`)
}
