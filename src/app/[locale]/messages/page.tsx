'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  ChevronLeft,
  CheckCheck,
  Loader2
} from 'lucide-react'
import { getMessagesForUser, markMessageAsRead, markAllMessagesAsRead } from '@/lib/actions/messages'
import { MessageWithStatus } from '@/lib/types'
import { useToast } from '@/contexts/ToastContext'
import { useParams, useRouter } from 'next/navigation'
import { messagesTranslations } from '@/translations/messages'

export default function MessagesPage() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const isDark = theme === 'dark'
  const params = useParams()
  const router = useRouter()
  const locale = (params?.locale as string) || 'ka'
  const t = messagesTranslations[locale as keyof typeof messagesTranslations] || messagesTranslations.ka

  const [messages, setMessages] = useState<MessageWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadMessages()
  }, [locale, filter])

  const loadMessages = async () => {
    setLoading(true)
    
    // Load filtered messages
    const result = await getMessagesForUser(locale, filter === 'all')
    if (result.success && result.messages) {
      setMessages(result.messages)
    } else {
      showToast(result.message || 'Failed to load messages', 'error')
    }
    
    // Load total count (always fetch all messages count)
    if (filter === 'unread') {
      const allResult = await getMessagesForUser(locale, true)
      if (allResult.success && allResult.messages) {
        setTotalCount(allResult.messages.length)
      }
    } else {
      setTotalCount(result.messages?.length || 0)
    }
    
    setLoading(false)
  }

  const handleMarkAsRead = async (messageId: string) => {
    if (markingAsRead) return // Prevent double clicks
    
    setMarkingAsRead(messageId)
    const result = await markMessageAsRead(messageId)
    if (result.success) {
      // Update local state immediately for better UX
      setMessages(prev => prev.map(msg => 
        msg.message_id === messageId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ))
    } else {
      showToast(result.message || 'Failed to mark as read', 'error')
    }
    setMarkingAsRead(null)
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllMessagesAsRead()
    if (result.success) {
      showToast(t.allRead, 'success')
      loadMessages()
    } else {
      showToast(result.message || 'Failed to mark all as read', 'error')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'normal':
        return 'bg-blue-500'
      case 'low':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityLabel = (priority: string) => {
    return t.priority[priority as keyof typeof t.priority] || priority
  }

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-1.5 mb-6 text-[15px] font-normal transition-colors ${
              isDark ? 'text-white/50 hover:text-white/70' : 'text-black/50 hover:text-black/70'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t.back}
          </button>
          
          <div className="flex flex-col gap-6">
            <div>
              <h1 className={`text-[28px] sm:text-[34px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {t.title}
              </h1>
              <p className={`mt-1.5 text-[15px] font-normal ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {unreadCount > 0 ? t.unreadCount(unreadCount) : t.allRead}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-medium transition-all active:scale-[0.98] ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <CheckCheck className="w-[18px] h-[18px]" />
                {t.markAllAsRead}
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-2 mb-6 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
              filter === 'all'
                ? isDark
                  ? 'bg-white/10 text-white'
                  : 'bg-white text-black shadow-sm'
                : isDark
                ? 'text-white/50 hover:text-white/70'
                : 'text-black/50 hover:text-black/70'
            }`}
          >
            {t.allMessages}
            {totalCount > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[13px] font-semibold ${
                filter === 'all'
                  ? isDark
                    ? 'bg-white/20 text-white'
                    : 'bg-black/10 text-black'
                  : isDark
                  ? 'bg-white/10 text-white/50'
                  : 'bg-black/10 text-black/40'
              }`}>
                {totalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 rounded-lg text-[15px] font-medium transition-all ${
              filter === 'unread'
                ? isDark
                  ? 'bg-white/10 text-white'
                  : 'bg-white text-black shadow-sm'
                : isDark
                ? 'text-white/50 hover:text-white/70'
                : 'text-black/50 hover:text-black/70'
            }`}
          >
            {t.unreadMessages}
            {unreadCount > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-[13px] font-semibold bg-red-500 text-white`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className={`text-center py-20 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p className="text-[15px] font-normal">{t.loading}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-20 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-[17px] font-medium">
              {filter === 'unread' ? t.noUnreadMessages : t.noMessages}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.message_id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  !message.is_read
                    ? isDark
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                    : isDark
                    ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                    : 'bg-black/[0.02] border-black/5 hover:bg-black/[0.04]'
                } ${!message.is_read ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                onClick={() => !message.is_read && handleMarkAsRead(message.message_id)}
              >
                <div className="flex items-start gap-3">
                  {/* Left - Message Content */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header with Priority and Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[13px] font-medium text-white ${getPriorityColor(message.priority)}`}
                      >
                        {getPriorityLabel(message.priority)}
                      </span>
                      
                      {!message.is_read && (
                        <span className="px-2.5 py-1 rounded-full text-[13px] font-medium bg-green-500 text-white">
                          {t.new}
                        </span>
                      )}

                      <div className={`flex items-center gap-1 text-[13px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(message.created_at).toLocaleDateString(locale, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-[17px] font-semibold leading-snug ${isDark ? 'text-white' : 'text-black'}`}>
                      {message.title}
                    </h3>

                    {/* Content */}
                    <div 
                      className={`text-[15px] font-normal leading-relaxed prose prose-sm max-w-none ${
                        isDark ? 'prose-invert text-white/70' : 'text-black/70'
                      }`}
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />

                    {/* Read Status */}
                    {message.is_read && message.read_at && (
                      <div className={`flex items-center gap-1.5 text-[13px] pt-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>
                          {t.readAt} {new Date(message.read_at).toLocaleString(locale, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right - Read Status Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    {markingAsRead === message.message_id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : message.is_read ? (
                      <CheckCircle className={`w-5 h-5 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Styles for HTML content */}
      <style jsx global>{`
        .prose p {
          margin: 0.5rem 0;
        }
        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        .prose h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .prose ul li,
        .prose ol li {
          display: list-item;
          margin: 0.25rem 0;
        }
        .prose blockquote {
          border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .prose a {
          color: ${isDark ? '#60a5fa' : '#3b82f6'};
          text-decoration: underline;
        }
        .prose strong {
          font-weight: 600;
        }
        .prose em {
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
