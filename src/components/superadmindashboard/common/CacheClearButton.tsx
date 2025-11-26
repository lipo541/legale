'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function CacheClearButton() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isClearing, setIsClearing] = useState(false)

  const handleClearCache = async () => {
    if (!confirm('ნამდვილად გსურთ მთელი საიტის კეშის გასუფთავება?')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET_TOKEN,
          path: '/',
        }),
      })

      const data = await response.json()

      if (data.revalidated) {
        alert('✅ კეში გასუფთავდა!')
      } else {
        throw new Error(data.message || 'Unknown error')
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      alert('❌ შეცდომა: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <button
      onClick={handleClearCache}
      disabled={isClearing}
      className={`
        w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2
        text-[11px] font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isDark 
          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
          : 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20'
        }
      `}
    >
      {isClearing ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>იწმინდება...</span>
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          <span>გასუფთავება</span>
        </>
      )}
    </button>
  )
}
