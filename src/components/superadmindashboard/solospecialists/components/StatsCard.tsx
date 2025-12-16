'use client'

import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Stats Card - Memoized Component
// ============================================================================

interface StatsCardProps {
  label: string
  value: number
  isDark: boolean
  icon?: LucideIcon
  color?: 'default' | 'emerald' | 'yellow' | 'red' | 'blue' | 'purple'
}

const StatsCard = memo(function StatsCard({ 
  label, 
  value, 
  isDark,
  icon: Icon,
  color = 'default'
}: StatsCardProps) {
  const colorClasses = {
    default: '',
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
    yellow: isDark ? 'text-yellow-400' : 'text-yellow-600',
    red: isDark ? 'text-red-400' : 'text-red-600',
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    purple: isDark ? 'text-purple-400' : 'text-purple-600'
  }

  return (
    <div className={`rounded-lg border p-2 sm:p-3 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}>
      <div className="flex items-center justify-between gap-1">
        <div className={`text-base sm:text-xl font-bold ${colorClasses[color] || (isDark ? 'text-white' : 'text-black')}`}>
          {value}
        </div>
        {Icon && (
          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        )}
      </div>
      <div className={`text-[8px] sm:text-[10px] truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {label}
      </div>
    </div>
  )
})

export default StatsCard
