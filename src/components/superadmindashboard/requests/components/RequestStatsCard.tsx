'use client'

import { memo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { LucideIcon } from 'lucide-react'

interface RequestStatsCardProps {
  label: string
  value: number
  icon: LucideIcon
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple' | 'gray'
}

function RequestStatsCard({ label, value, icon: Icon, color }: RequestStatsCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const colorClasses = {
    blue: isDark ? 'text-blue-400' : 'text-blue-600',
    yellow: isDark ? 'text-yellow-400' : 'text-yellow-600',
    green: isDark ? 'text-green-400' : 'text-green-600',
    red: isDark ? 'text-red-400' : 'text-red-600',
    purple: isDark ? 'text-purple-400' : 'text-purple-600',
    gray: isDark ? 'text-white/60' : 'text-black/60'
  }

  const bgClasses = {
    blue: isDark ? 'bg-blue-500/10' : 'bg-blue-500/10',
    yellow: isDark ? 'bg-yellow-500/10' : 'bg-yellow-500/10',
    green: isDark ? 'bg-green-500/10' : 'bg-green-500/10',
    red: isDark ? 'bg-red-500/10' : 'bg-red-500/10',
    purple: isDark ? 'bg-purple-500/10' : 'bg-purple-500/10',
    gray: isDark ? 'bg-white/5' : 'bg-black/5'
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgClasses[color]}`}>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[9px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          {label}
        </p>
        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default memo(RequestStatsCard)
