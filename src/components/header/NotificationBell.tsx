'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter, usePathname } from 'next/navigation'
import { getUnreadMessagesCount } from '@/lib/actions/messages'
import { getClientSingleton } from '@/lib/supabase/client'

interface NotificationBellProps {
  locale: string
}

export default function NotificationBell({ locale }: NotificationBellProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const isFetching = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    loadUnreadCount()

    // Realtime subscription temporarily disabled for debugging
    // TODO: Re-enable after fixing connection issues
    /*
    const supabase = getClientSingleton()
    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'global_messages' },
        () => {
          if (mountedRef.current) loadUnreadCount()
        }
      )
      .subscribe()
    */

    return () => {
      mountedRef.current = false
      // supabase.removeChannel(channel)
    }
  }, [])

  const loadUnreadCount = async () => {
    // Prevent concurrent fetches
    if (isFetching.current) return
    isFetching.current = true
    
    try {
      const result = await getUnreadMessagesCount()
      if (mountedRef.current && result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    } finally {
      isFetching.current = false
      if (mountedRef.current) setLoading(false)
    }
  }

  const handleClick = () => {
    router.push(`/${locale}/messages`)
  }

  if (loading) {
    return null // Or a skeleton loader
  }

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-lg transition-colors ${
        isDark
          ? 'hover:bg-white/10 text-white'
          : 'hover:bg-black/10 text-black'
      }`}
      aria-label="შეტყობინებები"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
