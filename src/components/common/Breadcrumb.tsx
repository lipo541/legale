'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 flex-wrap">
        {/* Home Icon */}
        <li>
          <Link
            href="/"
            className={`flex items-center gap-1 text-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded ${
              isDark
                ? 'text-white/60 hover:text-white focus-visible:ring-white/30'
                : 'text-black/60 hover:text-black focus-visible:ring-black/30'
            }`}
            aria-label="Home"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight
                className={`h-4 w-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}
                aria-hidden="true"
              />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`text-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded px-1 ${
                    isDark
                      ? 'text-white/60 hover:text-white focus-visible:ring-white/30'
                      : 'text-black/60 hover:text-black focus-visible:ring-black/30'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`text-sm font-medium ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
