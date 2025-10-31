'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { LayoutGrid, List } from 'lucide-react'
import { useParams } from 'next/navigation'

interface ViewModeToggleProps {
  view: 'grid' | 'list'
  onChange: (view: 'grid' | 'list') => void
}

export default function ViewModeToggle({ view, onChange }: ViewModeToggleProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as 'ka' | 'en' | 'ru') || 'ka'

  const labels = {
    ka: {
      grid: 'ბადის ხედი',
      list: 'სიის ხედი',
      current: 'ამჟამინდელი ხედი',
    },
    en: {
      grid: 'Grid view',
      list: 'List view',
      current: 'Current view',
    },
    ru: {
      grid: 'Вид сетки',
      list: 'Вид списка',
      current: 'Текущий вид',
    },
  }

  const t = labels[locale]

  return (
    <div
      className={`flex items-center gap-0.5 p-1 rounded-lg border ${
        isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-black/10'
      }`}
      role="group"
      aria-label={t.current}
    >
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 sm:p-2 rounded transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          view === 'grid'
            ? isDark
              ? 'bg-white text-black focus-visible:ring-white/50'
              : 'bg-black text-white focus-visible:ring-black/50'
            : isDark
            ? 'text-white/60 hover:text-white hover:bg-white/5 focus-visible:ring-white/30'
            : 'text-black/60 hover:text-black hover:bg-black/5 focus-visible:ring-black/30'
        }`}
        aria-label={t.grid}
        aria-pressed={view === 'grid'}
        title={t.grid}
      >
        <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>

      <button
        onClick={() => onChange('list')}
        className={`p-1.5 sm:p-2 rounded transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          view === 'list'
            ? isDark
              ? 'bg-white text-black focus-visible:ring-white/50'
              : 'bg-black text-white focus-visible:ring-black/50'
            : isDark
            ? 'text-white/60 hover:text-white hover:bg-white/5 focus-visible:ring-white/30'
            : 'text-black/60 hover:text-black hover:bg-black/5 focus-visible:ring-black/30'
        }`}
        aria-label={t.list}
        aria-pressed={view === 'list'}
        title={t.list}
      >
        <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
