'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RootRedirect() {
  const router = useRouter()

  useEffect(() => {
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='))
    const locale = localeCookie?.split('=')[1] || 'ka'
    router.replace(`/${locale}`)
  }, [router])

  return null
}
