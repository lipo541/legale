'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Search, FileText, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  type?: 'no-results' | 'no-data' | 'error'
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const icons = {
    'no-results': Search,
    'no-data': FileText,
    'error': AlertCircle,
  }

  const Icon = icons[type]

  return (
    <div 
      className="flex flex-col items-center justify-center py-16 md:py-20 px-4"
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className={`mb-6 p-6 rounded-full ${
          isDark ? 'bg-white/5' : 'bg-black/5'
        }`}
        aria-hidden="true"
      >
        <Icon
          className={`h-12 w-12 ${isDark ? 'text-white/40' : 'text-black/40'}`}
        />
      </div>

      {/* Title */}
      <h3
        className={`text-xl md:text-2xl font-bold mb-3 text-center ${
          isDark ? 'text-white' : 'text-black'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`text-sm md:text-base text-center max-w-md mb-6 ${
          isDark ? 'text-white/70' : 'text-black/70'
        }`}
      >
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`mt-6 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isDark
              ? 'bg-white text-black hover:bg-white/90 focus-visible:ring-white/50'
              : 'bg-black text-white hover:bg-black/90 focus-visible:ring-black/50'
          }`}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
