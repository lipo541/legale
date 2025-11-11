'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Users, Eye, Clock, Mail } from 'lucide-react'
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
      'USER': 'მომხმარებელი',
      'AUTHOR': 'ავტორი',
      'SPECIALIST': 'სპეციალისტი',
      'SOLO_SPECIALIST': 'სოლო სპეციალისტი',
      'COMPANY': 'კომპანია',
      'MODERATOR': 'მოდერატორი'
    }
    return roleLabels[role] || role
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-black'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'
        }`}>
          <div>
            <h2 className="text-2xl font-bold">წაკითხვის სტატისტიკა</h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {messageTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`mt-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                იტვირთება...
              </p>
            </div>
          ) : stats ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        წაკითხული
                      </p>
                      <p className="text-2xl font-bold">{stats.read_count}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-500/20">
                      <Users className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        სულ მომხმარებელი
                      </p>
                      <p className="text-2xl font-bold">{stats.target_count}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/20">
                      <Clock className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        წაკითხვის პროცენტი
                      </p>
                      <p className="text-2xl font-bold">{getReadPercentage()}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{stats.read_count} / {stats.target_count} მომხმარებელი</span>
                  <span>{getReadPercentage()}%</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${getReadPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Users List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  წაკითხული მომხმარებლები ({stats.read_users.length})
                </h3>
                
                {stats.read_users.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ჯერ არავინ წაუკითხავს ეს შეტყობინება</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.read_users.map((user) => (
                      <div
                        key={user.user_id}
                        className={`p-4 rounded-lg border ${
                          isDark
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-black/5 border-black/10 hover:bg-black/10'
                        } transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-600'
                              }`}>
                                {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {user.full_name || 'სახელი არ არის მითითებული'}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-3 h-3" />
                                  <span className={isDark ? 'text-white/60' : 'text-black/60'}>
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              isDark ? 'bg-white/10' : 'bg-black/10'
                            }`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(user.read_at).toLocaleString('ka-GE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className={isDark ? 'text-white/60' : 'text-black/60'}>
                ვერ ჩაიტვირთა სტატისტიკა
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex items-center justify-end p-6 border-t ${
          isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-black/10'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-white/5 hover:bg-white/10'
                : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  )
}
