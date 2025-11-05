'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

export default function NotFound() {
  const pathname = usePathname()
  
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-white dark:bg-black transition-colors duration-300">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold mb-4 text-black dark:text-white transition-colors duration-300">
          404
        </div>

        <h1 className="text-3xl font-bold mb-4 text-black dark:text-white transition-colors duration-300">
          გვერდი ვერ მოიძებნა
        </h1>

        <p className="text-lg mb-8 text-black/60 dark:text-white/60 transition-colors duration-300">
          სამწუხაროდ, თქვენს მიერ მოთხოვნილი გვერდი არ არსებობს.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
            უკან დაბრუნება
          </button>

          <Link
            href={`/${currentLocale}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black shadow-sm border border-black/20 dark:border-white/20"
          >
            <Home className="w-5 h-5" />
            მთავარ გვერდზე
          </Link>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-black/5 dark:bg-white/5 transition-colors duration-300">
          <p className="text-sm text-black/40 dark:text-white/40 transition-colors duration-300">
            მოთხოვნილი გვერდი: <code className="font-mono">{pathname}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
