'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { revalidateGlobalCache } from '@/lib/actions/revalidate'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  isExpanded?: boolean
}

export default function CacheClearButton({ isExpanded = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(false)

  const handleClearCache = async () => {
    if (!confirm('ნამდვილად გსურთ მთელი საიტის კეშის განახლება?')) return

    setLoading(true)
    try {
      await revalidateGlobalCache()
      alert('✅ საიტი წარმატებით განახლდა!')
    } catch (error) {
      console.error('Cache clear failed:', error)
      alert('❌ შეცდომა განახლებისას.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClearCache}
      disabled={loading}
      className={`
        group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 mb-1
        transition-all duration-300
        ${isDark 
          ? 'text-orange-400 hover:bg-orange-500/10' 
          : 'text-orange-600 hover:bg-orange-50'
        }
      `}
      title="კეშის გასუფთავება"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
      )}
      
      <span className={`
        font-medium text-xs whitespace-nowrap
        transition-all duration-300 delay-100
        ${isExpanded 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 -translate-x-2 w-0 overflow-hidden'
        }
      `}>
        {loading ? 'ახლდება...' : 'კეშის გასუფთავება'}
      </span>
    </button>
  )
}
