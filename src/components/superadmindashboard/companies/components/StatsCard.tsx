// ============================================================================
// StatsCard Component
// ============================================================================

import { memo } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
  isDark: boolean
  onClick?: () => void
  isActive?: boolean
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  isDark, 
  onClick,
  isActive 
}: StatsCardProps) {
  const colorClasses: Record<string, string> = {
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    amber: isDark ? 'text-yellow-400' : 'text-yellow-600',
    red: isDark ? 'text-red-400' : 'text-red-600',
    gray: isDark ? 'text-white/60' : 'text-black/60'
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-2 sm:p-3 transition-all ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
      } ${onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'} ${
        isActive ? 'ring-2 ring-emerald-500/50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className={`text-base sm:text-xl font-bold ${colorClasses[color] || (isDark ? 'text-white' : 'text-black')}`}>
          {value}
        </div>
        <Icon className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
      </div>
      <div className={`text-[8px] sm:text-[10px] truncate text-left ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {label}
      </div>
    </button>
  )
}

export default memo(StatsCard)
