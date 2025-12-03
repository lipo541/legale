import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function RootRedirect() {
  // Get locale from cookie or default to 'ka'
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ka'
  
  // Server-side redirect to locale page (better for SEO)
  redirect(`/${locale}`)
}
