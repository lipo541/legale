'use client'

import { useState, useEffect, useCallback, memo } from 'react'
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
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Loader2
} from 'lucide-react'
import { getAllMessages, deleteGlobalMessage, toggleMessageStatus } from '@/lib/actions/messages'
import { GlobalMessage } from '@/lib/types'
import CreateMessageModal from './CreateMessageModal'
import ReadStatsModal from './ReadStatsModal'
import { useToast } from '@/contexts/ToastContext'

// ============================================================================
// Types
// ============================================================================

type MessageWithRoles = GlobalMessage & { target_roles: string[] }
type PriorityFilter = 'all' | 'urgent' | 'high' | 'normal' | 'low'
type StatusFilter = 'all' | 'active' | 'inactive'

// ============================================================================
// Memoized Components
// ============================================================================

const StatsCard = memo(function StatsCard({ 
  label, 
  value, 
  icon: Icon,
  color,
  isDark 
}: { 
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  isDark: boolean 
}) {
  return (
    <div className={`rounded-lg border p-3 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${color}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {value}
          </div>
          <div className={`text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
})

const PriorityBadge = memo(function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    urgent: { bg: 'bg-red-500/20', text: 'text-red-500', label: 'სასწრაფო' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-500', label: 'მაღალი' },
    normal: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'ჩვეულ.' },
    low: { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'დაბალი' }
  }
  const { bg, text, label } = config[priority] || config.normal

  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${bg} ${text}`}>
      {label}
    </span>
  )
})

const MessageCard = memo(function MessageCard({
  message,
  isDark,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  onShowStats
}: {
  message: MessageWithRoles
  isDark: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onShowStats: () => void
}) {
  return (
    <div className={`rounded-lg border transition-all ${
      isDark
        ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
        : 'border-black/10 bg-black/[0.02] hover:bg-black/[0.04]'
    }`}>
      {/* Main Row */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Left - Info */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <PriorityBadge priority={message.priority} />
              {!message.is_active && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-500/20 text-gray-500">
                  გამორთული
                </span>
              )}
              <h3 className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {message.title_ka}
              </h3>
            </div>

            {/* Content Preview */}
            <div 
              className={`text-[10px] line-clamp-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}
              dangerouslySetInnerHTML={{ 
                __html: message.content_ka.replace(/<[^>]*>/g, ' ').substring(0, 100) 
              }}
            />

            {/* Meta Row */}
            <div className={`flex flex-wrap items-center gap-2 mt-1.5 text-[9px] ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}>
              <span className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                {message.target_roles.length} როლი
              </span>
              <span className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(message.created_at).toLocaleDateString('ka-GE')}
              </span>
              {message.expires_at && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(message.expires_at).toLocaleDateString('ka-GE')}
                </span>
              )}
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Stats Button */}
            <button
              onClick={onShowStats}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-500/20 text-blue-600'
              }`}
              title="სტატისტიკა"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'
              }`}
              title="რედაქტირება"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>

            {/* Toggle Status */}
            <button
              onClick={onToggleStatus}
              className={`p-1.5 rounded-md transition-colors ${
                message.is_active
                  ? isDark ? 'hover:bg-orange-500/20 text-orange-400' : 'hover:bg-orange-500/20 text-orange-600'
                  : isDark ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-500/20 text-green-600'
              }`}
              title={message.is_active ? 'გამორთვა' : 'ჩართვა'}
            >
              {message.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-500/20 text-red-600'
              }`}
              title="წაშლა"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* Expand */}
            <button
              onClick={onToggleExpand}
              className={`p-1.5 rounded-md transition-colors ${
                isDark ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/10 text-black/40'
              }`}
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`px-3 pb-3 pt-0 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <div className="pt-3 space-y-2">
            {/* Target Roles */}
            <div>
              <span className={`text-[9px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                როლები:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {message.target_roles.map(role => (
                  <span 
                    key={role}
                    className={`px-1.5 py-0.5 rounded text-[9px] ${
                      isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Translations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className={`text-[9px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  🇬🇧 EN:
                </span>
                <p className={`text-[10px] truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {message.title_en || '-'}
                </p>
              </div>
              <div>
                <span className={`text-[9px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  🇷🇺 RU:
                </span>
                <p className={`text-[10px] truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  {message.title_ru || '-'}
                </p>
              </div>
            </div>

            {/* Full Content */}
            <div>
              <span className={`text-[9px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                კონტენტი:
              </span>
              <div 
                className={`text-[10px] mt-1 line-clamp-3 prose prose-sm max-w-none ${
                  isDark ? 'prose-invert text-white/60' : 'text-black/60'
                }`}
                dangerouslySetInnerHTML={{ __html: message.content_ka }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ============================================================================
// Confirm Modal
// ============================================================================

const ConfirmModal = memo(function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger,
  onConfirm,
  onCancel,
  isDark
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  isDanger?: boolean
  onConfirm: () => void
  onCancel: () => void
  isDark: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-xl shadow-2xl p-4 ${
        isDark ? 'bg-zinc-900' : 'bg-white'
      }`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-white ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export default function MessagesPage() {
  const { theme } = useTheme()
  const { showToast } = useToast()
  const isDark = theme === 'dark'

  // State
  const [messages, setMessages] = useState<MessageWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<MessageWithRoles | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [statsMessageId, setStatsMessageId] = useState<string>('')
  const [statsMessageTitle, setStatsMessageTitle] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadMessages = useCallback(async () => {
    setLoading(true)
    const result = await getAllMessages()
    if (result.success && result.messages) {
      setMessages(result.messages)
    } else {
      showToast(result.message || 'Failed to load messages', 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleDelete = useCallback((messageId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'შეტყობინების წაშლა',
      message: 'დარწმუნებული ხართ? ეს მოქმედება შეუქცევადია.',
      onConfirm: async () => {
        const result = await deleteGlobalMessage(messageId)
        if (result.success) {
          showToast('შეტყობინება წაიშალა', 'success')
          loadMessages()
        } else {
          showToast(result.message || 'შეცდომა', 'error')
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }, [showToast, loadMessages])

  const handleToggleStatus = useCallback(async (messageId: string) => {
    const result = await toggleMessageStatus(messageId)
    if (result.success) {
      showToast(result.message || 'სტატუსი შეიცვალა', 'success')
      loadMessages()
    } else {
      showToast(result.message || 'შეცდომა', 'error')
    }
  }, [showToast, loadMessages])

  const handleEdit = useCallback((message: MessageWithRoles) => {
    setSelectedMessage(message)
    setIsModalOpen(true)
  }, [])

  const handleCreateNew = useCallback(() => {
    setSelectedMessage(null)
    setIsModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedMessage(null)
    loadMessages()
  }, [loadMessages])

  const handleShowStats = useCallback((messageId: string, messageTitle: string) => {
    setStatsMessageId(messageId)
    setStatsMessageTitle(messageTitle)
    setIsStatsModalOpen(true)
  }, [])

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredMessages = messages.filter(msg => {
    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!msg.title_ka.toLowerCase().includes(search) && 
          !msg.title_en?.toLowerCase().includes(search) &&
          !msg.content_ka.toLowerCase().includes(search)) {
        return false
      }
    }
    // Priority
    if (priorityFilter !== 'all' && msg.priority !== priorityFilter) return false
    // Status
    if (statusFilter === 'active' && !msg.is_active) return false
    if (statusFilter === 'inactive' && msg.is_active) return false

    return true
  })

  // Stats
  const stats = {
    total: messages.length,
    active: messages.filter(m => m.is_active).length,
    urgent: messages.filter(m => m.priority === 'urgent').length,
    filtered: filteredMessages.length
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`min-h-full px-4 sm:px-6 lg:px-8 py-4 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title with Icon */}
          <div className="flex items-center gap-3">
            <div className={`relative p-2.5 rounded-xl ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-500/20 to-blue-500/20' 
                : 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10'
            }`}>
              <MessageSquare className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              {/* Notification dot */}
              {stats.urgent > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[7px] text-white font-bold items-center justify-center">
                    {stats.urgent}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                შეტყობინებები
              </h1>
              <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${stats.active > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {stats.active} აქტიური
                </span>
                <span className="text-white/20">•</span>
                <span>გლობალური მართვა</span>
              </p>
            </div>
          </div>
          
          {/* Add Button */}
          <button
            onClick={handleCreateNew}
            className="group flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
            <span className="hidden sm:inline">ახალი</span>
            <span className="sm:hidden">დამატება</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatsCard label="სულ" value={stats.total} icon={MessageSquare} color="bg-blue-500" isDark={isDark} />
        <StatsCard label="აქტიური" value={stats.active} icon={Power} color="bg-green-500" isDark={isDark} />
        <StatsCard label="სასწრაფო" value={stats.urgent} icon={AlertCircle} color="bg-red-500" isDark={isDark} />
        <StatsCard label="ნაპოვნი" value={stats.filtered} icon={Filter} color="bg-purple-500" isDark={isDark} />
      </div>

      {/* Search & Filters */}
      <div className={`mb-4 rounded-lg border p-2 ${
        isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'
      }`}>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`} />
            <input
              type="text"
              placeholder="ძებნა..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-md border py-1.5 pl-7 pr-3 text-[10px] transition-colors ${
                isDark 
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                  : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
              }`}
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`sm:hidden flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-[10px] ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}
          >
            <Filter className="h-3 w-3" />
            ფილტრები
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {/* Desktop Filters */}
          <div className="hidden sm:flex gap-2">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className={`appearance-none cursor-pointer rounded-lg border px-3 py-1.5 pr-7 text-[10px] font-medium transition-colors focus:outline-none focus:ring-1 ${
                  isDark 
                    ? 'border-white/10 bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-emerald-500/50' 
                    : 'border-black/10 bg-white text-black hover:bg-gray-50 focus:ring-emerald-500/50'
                }`}
              >
                <option value="all">ყველა პრიორიტეტი</option>
                <option value="urgent">🔴 სასწრაფო</option>
                <option value="high">🟠 მაღალი</option>
                <option value="normal">🔵 ჩვეულებრივი</option>
                <option value="low">⚪ დაბალი</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={`appearance-none cursor-pointer rounded-lg border px-3 py-1.5 pr-7 text-[10px] font-medium transition-colors focus:outline-none focus:ring-1 ${
                  isDark 
                    ? 'border-white/10 bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-emerald-500/50' 
                    : 'border-black/10 bg-white text-black hover:bg-gray-50 focus:ring-emerald-500/50'
                }`}
              >
                <option value="all">ყველა სტატუსი</option>
                <option value="active">✅ აქტიური</option>
                <option value="inactive">⏸️ გამორთული</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className={`sm:hidden flex gap-2 mt-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <div className="relative flex-1">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className={`w-full appearance-none cursor-pointer rounded-lg border px-3 py-2 pr-7 text-[10px] font-medium transition-colors focus:outline-none ${
                  isDark 
                    ? 'border-white/10 bg-zinc-800 text-white' 
                    : 'border-black/10 bg-white text-black'
                }`}
              >
                <option value="all">პრიორიტეტი</option>
                <option value="urgent">🔴 სასწრაფო</option>
                <option value="high">🟠 მაღალი</option>
                <option value="normal">🔵 ჩვეული</option>
                <option value="low">⚪ დაბალი</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>

            <div className="relative flex-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={`w-full appearance-none cursor-pointer rounded-lg border px-3 py-2 pr-7 text-[10px] font-medium transition-colors focus:outline-none ${
                  isDark 
                    ? 'border-white/10 bg-zinc-800 text-white' 
                    : 'border-black/10 bg-white text-black'
                }`}
              >
                <option value="all">სტატუსი</option>
                <option value="active">✅ აქტიური</option>
                <option value="inactive">⏸️ გამორთული</option>
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      {loading ? (
        <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <span className="text-xs">იტვირთება...</span>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
          <p className="text-xs">შეტყობინებები არ მოიძებნა</p>
          {(searchTerm || priorityFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setPriorityFilter('all')
                setStatusFilter('all')
              }}
              className="mt-2 text-[10px] text-blue-500 hover:underline"
            >
              ფილტრების გასუფთავება
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              isDark={isDark}
              isExpanded={expandedId === message.id}
              onToggleExpand={() => setExpandedId(expandedId === message.id ? null : message.id)}
              onEdit={() => handleEdit(message)}
              onDelete={() => handleDelete(message.id)}
              onToggleStatus={() => handleToggleStatus(message.id)}
              onShowStats={() => handleShowStats(message.id, message.title_ka)}
            />
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        isDanger={true}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDark={isDark}
      />
    </div>
  )
}
