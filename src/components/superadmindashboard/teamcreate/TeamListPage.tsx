'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { 
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  Eye
} from 'lucide-react'

interface Team {
  id: string
  leader_id: string
  is_active: boolean
  created_at: string
  team_translations?: Array<{
    language: string
    name: string
    slug: string
    title: string
  }>
}

interface TeamListPageProps {
  onEdit: (teamId: string) => void
  onBack: () => void
}

export default function TeamListPage({ onEdit, onBack }: TeamListPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          leader_id,
          is_active,
          created_at,
          team_translations (
            language,
            name,
            slug,
            title
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      alert('გუნდების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (teamId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ გუნდის წაშლა?')) return

    setDeleting(teamId)
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      alert('გუნდი წარმატებით წაიშალა')
      fetchTeams()
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('გუნდის წაშლა ვერ მოხერხდა')
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (teamId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: !currentStatus })
        .eq('id', teamId)

      if (error) throw error

      alert(`გუნდი ${!currentStatus ? 'გააქტიურდა' : 'გაითიშა'}`)
      fetchTeams()
    } catch (error) {
      console.error('Error toggling team status:', error)
      alert('სტატუსის შეცვლა ვერ მოხერხდა')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className={`mb-4 flex items-center gap-2 text-sm ${
              isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            უკან დაბრუნება
          </button>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            არსებული გუნდები
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            გუნდების რედაქტირება და მართვა
          </p>
        </div>
      </div>

      {/* Teams List */}
      <div className={`rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'} p-6`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ჯერ არ გაქვთ შექმნილი გუნდები
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => {
              const kaTranslation = team.team_translations?.find(t => t.language === 'ka')
              const enTranslation = team.team_translations?.find(t => t.language === 'en')
              const ruTranslation = team.team_translations?.find(t => t.language === 'ru')

              return (
                <div
                  key={team.id}
                  className={`rounded-lg border p-6 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        {kaTranslation?.name || 'უსახელო გუნდი'}
                      </h3>
                      <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                        {kaTranslation?.title}
                      </p>

                      {/* Slugs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                        {kaTranslation && (
                          <div className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                            <span className="font-medium">🇬🇪 Slug:</span> {kaTranslation.slug}
                          </div>
                        )}
                        {enTranslation && (
                          <div className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                            <span className="font-medium">🇬🇧 Slug:</span> {enTranslation.slug}
                          </div>
                        )}
                        {ruTranslation && (
                          <div className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                            <span className="font-medium">🇷🇺 Slug:</span> {ruTranslation.slug}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          team.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {team.is_active ? 'აქტიური' : 'არააქტიური'}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          შექმნილია: {new Date(team.created_at).toLocaleDateString('ka-GE')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => onEdit(team.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Edit className="h-4 w-4" />
                        რედაქტირება
                      </button>

                      <button
                        onClick={() => toggleActive(team.id, team.is_active)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(team.id)}
                        disabled={deleting === team.id}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          isDark
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {deleting === team.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
