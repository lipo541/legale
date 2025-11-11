'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Power, 
  PowerOff,
  AlertCircle,
  Clock,
  Users,
  Calendar,
  Eye
} from 'lucide-react'
import { getAllMessages, deleteGlobalMessage, toggleMessageStatus } from '@/lib/actions/messages'
import { GlobalMessage } from '@/lib/types'
import CreateMessageModal from './CreateMessageModal'
import ReadStatsModal from './ReadStatsModal'
import { useToast } from '@/contexts/ToastContext'

type MessageWithRoles = GlobalMessage & { target_roles: string[] }

export default function MessagesPage() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const isDark = theme === 'dark'
  const [messages, setMessages] = useState<MessageWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<MessageWithRoles | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [statsMessageId, setStatsMessageId] = useState<string>('')
  const [statsMessageTitle, setStatsMessageTitle] = useState<string>('')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    const result = await getAllMessages()
    if (result.success && result.messages) {
      setMessages(result.messages)
    } else {
      showToast(result.message || 'Failed to load messages', 'error')
    }
    setLoading(false)
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ შეტყობინების წაშლა?')) {
      return
    }

    const result = await deleteGlobalMessage(messageId)
    if (result.success) {
      showToast('შეტყობინება წარმატებით წაიშალა', 'success')
      loadMessages()
    } else {
      showToast(result.message || 'Failed to delete message', 'error')
    }
  }

  const handleToggleStatus = async (messageId: string) => {
    const result = await toggleMessageStatus(messageId)
    if (result.success) {
      showToast(result.message || 'Status updated', 'success')
      loadMessages()
    } else {
      showToast(result.message || 'Failed to update status', 'error')
    }
  }

  const handleEdit = (message: MessageWithRoles) => {
    setSelectedMessage(message)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedMessage(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedMessage(null)
    loadMessages()
  }

  const handleShowStats = (messageId: string, messageTitle: string) => {
    setStatsMessageId(messageId)
    setStatsMessageTitle(messageTitle)
    setIsStatsModalOpen(true)
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
    switch (priority) {
      case 'urgent':
        return 'სასწრაფო'
      case 'high':
        return 'მაღალი'
      case 'normal':
        return 'ჩვეულებრივი'
      case 'low':
        return 'დაბალი'
      default:
        return priority
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Global Messages
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            მართეთ გლობალური შეტყობინებები მომხმარებლებისთვის
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
          ახალი შეტყობინება
        </button>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className={`text-center py-12 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          იტვირთება...
        </div>
      ) : messages.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>შეტყობინებები არ მოიძებნა</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-6 rounded-lg border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 hover:bg-black/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Message Info */}
                <div className="flex-1 space-y-3">
                  {/* Title and Priority */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(message.priority)}`}>
                      {getPriorityLabel(message.priority)}
                    </span>
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      {message.title_ka}
                    </h3>
                    {!message.is_active && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-500 text-white">
                        გამორთული
                      </span>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div 
                    className={`text-sm line-clamp-2 prose prose-sm max-w-none ${
                      isDark ? 'prose-invert text-white/70' : 'text-black/70'
                    }`}
                    dangerouslySetInnerHTML={{ __html: message.content_ka }}
                  />

                  {/* Meta Info */}
                  <div className={`flex flex-wrap items-center gap-4 text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>როლები: {message.target_roles.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(message.created_at).toLocaleDateString('ka-GE')}</span>
                    </div>
                    {message.expires_at && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Clock className="w-4 h-4" />
                        <span>ვადა: {new Date(message.expires_at).toLocaleDateString('ka-GE')}</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleShowStats(message.id, message.title_ka)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                        isDark
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                          : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-600'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">სტატისტიკა</span>
                    </button>
                  </div>

                  {/* Translations */}
                  <details className="mt-2">
                    <summary className={`cursor-pointer text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
                      თარგმანები
                    </summary>
                    <div className={`mt-2 space-y-2 pl-4 border-l-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                      <div>
                        <strong className="text-xs opacity-60">EN:</strong>
                        <p className="text-sm">{message.title_en}</p>
                      </div>
                      <div>
                        <strong className="text-xs opacity-60">RU:</strong>
                        <p className="text-sm">{message.title_ru}</p>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(message)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-blue-500/20 text-blue-400'
                        : 'hover:bg-blue-500/20 text-blue-600'
                    }`}
                    title="რედაქტირება"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(message.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      message.is_active
                        ? isDark
                          ? 'hover:bg-orange-500/20 text-orange-400'
                          : 'hover:bg-orange-500/20 text-orange-600'
                        : isDark
                        ? 'hover:bg-green-500/20 text-green-400'
                        : 'hover:bg-green-500/20 text-green-600'
                    }`}
                    title={message.is_active ? 'გამორთვა' : 'ჩართვა'}
                  >
                    {message.is_active ? (
                      <PowerOff className="w-5 h-5" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(message.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-red-500/20 text-red-400'
                        : 'hover:bg-red-500/20 text-red-600'
                    }`}
                    title="წაშლა"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <CreateMessageModal
          message={selectedMessage}
          onClose={handleModalClose}
        />
      )}

      {/* Read Stats Modal */}
      {isStatsModalOpen && (
        <ReadStatsModal
          messageId={statsMessageId}
          messageTitle={statsMessageTitle}
          onClose={() => setIsStatsModalOpen(false)}
        />
      )}
    </div>
  )
}
