'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter, usePathname } from 'next/navigation'
import { getUnreadMessagesCount } from '@/lib/actions/messages'
import { createClient } from '@/lib/supabase/client'

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

  useEffect(() => {
    loadUnreadCount()

    // Set up real-time subscription for message updates
    const supabase = createClient()
    const channel = supabase
      .channel('messages-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'global_messages' },
        () => {
          loadUnreadCount()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'message_target_roles' },
        () => {
          loadUnreadCount()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_read_messages' },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadMessagesCount()
      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      }
    } catch (error) {
      console.error('Error loading unread count:', error)
    } finally {
      setLoading(false)
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
