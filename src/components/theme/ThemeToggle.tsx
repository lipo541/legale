'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
  ]

  const isDark = theme === 'dark'

  return (
    <div className={`flex items-center gap-1 rounded-lg border p-1 transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      {themeOptions.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value

        return (
          <button
            key={value}
            onClick={toggleTheme}
            className={`flex items-center justify-center rounded-md p-2 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] ${
              isActive
                ? isDark
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-black text-white shadow-sm'
                : isDark
                  ? 'text-white/50 hover:bg-white/10 hover:text-white'
                  : 'text-black/50 hover:bg-black/10 hover:text-black'
            }`}
            aria-label={`Switch to ${label} theme`}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
