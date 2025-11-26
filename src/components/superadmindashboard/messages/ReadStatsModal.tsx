'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Users, Eye, Clock, Mail, Loader2, TrendingUp } from 'lucide-react'
import { getMessageReadStats } from '@/lib/actions/messages'
import { MessageReadStat } from '@/lib/types'

interface ReadStatsModalProps {
  messageId: string
  messageTitle: string
  onClose: () => void
}

export default function ReadStatsModal({ messageId, messageTitle, onClose }: ReadStatsModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{
    read_count: number
    target_count: number
    read_users: MessageReadStat[]
  } | null>(null)

  useEffect(() => {
    loadStats()
  }, [messageId])

  const loadStats = async () => {
    setLoading(true)
    const result = await getMessageReadStats(messageId)
    if (result.success && result.stats) {
      setStats(result.stats)
    }
    setLoading(false)
  }

  const getReadPercentage = () => {
    if (!stats || stats.target_count === 0) return 0
    return Math.round((stats.read_count / stats.target_count) * 100)
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'USER': 'User',
      'AUTHOR': 'Author',
      'SPECIALIST': 'Specialist',
      'SOLO_SPECIALIST': 'Solo Spec',
      'COMPANY': 'Company',
      'MODERATOR': 'Moderator'
    }
    return roleLabels[role] || role
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg max-h-[95vh] sm:max-h-[85vh] overflow-hidden rounded-xl shadow-2xl flex flex-col ${
        isDark ? 'bg-zinc-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className="min-w-0 flex-1 pr-2">
            <h2 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>
              სტატისტიკა
            </h2>
            <p className={`text-[10px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {messageTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
              isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className={`h-6 w-6 animate-spin mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</span>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {stats.read_count}
                  </div>
                  <div className={`text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    წაკითხული
                  </div>
                </div>

                <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                  <Users className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {stats.target_count}
                  </div>
                  <div className={`text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    სულ
                  </div>
                </div>

                <div className={`p-3 rounded-lg text-center ${isDark ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                  <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                    {getReadPercentage()}%
                  </div>
                  <div className={`text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    პროცენტი
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className={isDark ? 'text-white/60' : 'text-black/60'}>
                    {stats.read_count} / {stats.target_count}
                  </span>
                  <span className={isDark ? 'text-white/60' : 'text-black/60'}>
                    {getReadPercentage()}%
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${getReadPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Users List */}
              <div>
                <h3 className={`text-xs font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  წაკითხული ({stats.read_users.length})
                </h3>
                
                {stats.read_users.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">ჯერ არავის წაუკითხავს</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {stats.read_users.map((user) => (
                      <div
                        key={user.user_id}
                        className={`p-2.5 rounded-lg border ${
                          isDark
                            ? 'bg-white/[0.02] border-white/10'
                            : 'bg-black/[0.02] border-black/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600'
                          }`}>
                            {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                              {user.full_name || 'N/A'}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Mail className={`h-2.5 w-2.5 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                              <span className={`text-[9px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                {user.email}
                              </span>
                            </div>
                          </div>

                          {/* Role & Time */}
                          <div className="text-right flex-shrink-0">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-medium ${
                              isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                            }`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <div className={`flex items-center justify-end gap-0.5 mt-0.5 text-[8px] ${
                              isDark ? 'text-white/40' : 'text-black/40'
                            }`}>
                              <Clock className="h-2 w-2" />
                              {new Date(user.read_at).toLocaleDateString('ka-GE')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              <p className="text-xs">ვერ ჩაიტვირთა</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end px-4 py-3 border-t flex-shrink-0 ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-black/5 hover:bg-black/10 text-black'
            }`}
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )
}
