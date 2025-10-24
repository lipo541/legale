'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Users } from 'lucide-react'

export default function ManageSpecialistsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Manage Specialists
        </h1>
        <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          კომპანიის სპეციალისტების მართვა
        </p>
      </div>

      <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
        <Users className={`mx-auto h-16 w-16 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
        <p className={`mt-4 text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          Manage Specialists - Coming Soon
        </p>
      </div>
    </div>
  )
}
