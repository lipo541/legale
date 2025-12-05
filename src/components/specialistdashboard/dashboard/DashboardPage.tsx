'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { 
  User,
  FileText,
  Eye,
  TrendingUp,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

interface DashboardPageProps {
  userProfile: {
    full_name?: string
    email?: string
    avatar_url?: string
    verification_status?: string
  } | null
  postsCount: number
  viewsCount: number
  verificationStatus: string | null
  onNavigate: (tab: 'profile' | 'posts') => void
  locale: Locale
}

export default function DashboardPage({
  userProfile,
  postsCount,
  viewsCount,
  verificationStatus,
  onNavigate,
  locale
}: DashboardPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = specialistDashboardTranslations[locale] || specialistDashboardTranslations.ka

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-4 lg:py-6">
      {/* Header - Compact */}
      <div className="mb-4 lg:mb-6">
        <h1 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {t.hello}, {userProfile?.full_name?.split(' ')[0] || t.specialist}! 👋
        </h1>
        <p className={`text-xs lg:text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          {t.yourDashboard}
        </p>
      </div>
      
      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4 lg:mb-6">
        {/* Profile */}
        <div className={`
          rounded-xl p-3 lg:p-4 border
          ${isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-black/[0.02] border-black/10'
          }
        `}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className={`
              w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white/10' : 'bg-black/10'}
            `}>
              <User className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <p className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>1</p>
              <p className={`text-[10px] lg:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.profileStats}</p>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className={`
          rounded-xl p-3 lg:p-4 border
          ${isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-black/[0.02] border-black/10'
          }
        `}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className={`
              w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white/10' : 'bg-black/10'}
            `}>
              <FileText className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <p className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{postsCount}</p>
              <p className={`text-[10px] lg:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.posts}</p>
            </div>
          </div>
        </div>

        {/* Views */}
        <div className={`
          rounded-xl p-3 lg:p-4 border
          ${isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-black/[0.02] border-black/10'
          }
        `}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className={`
              w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white/10' : 'bg-black/10'}
            `}>
              <Eye className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <p className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{viewsCount}</p>
              <p className={`text-[10px] lg:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.views}</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className={`
          rounded-xl p-3 lg:p-4 border
          ${isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-black/[0.02] border-black/10'
          }
        `}>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className={`
              w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center
              ${isDark ? 'bg-white/10' : 'bg-black/10'}
            `}>
              <TrendingUp className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <p className={`text-xs lg:text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {verificationStatus === 'verified' ? '✓' : '⏳'}
              </p>
              <p className={`text-[10px] lg:text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Compact */}
      <div className="mb-4 lg:mb-6">
        <h2 className={`text-sm lg:text-base font-semibold mb-2 lg:mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
          {t.quickActions}
        </h2>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('profile')}
            className={`
              w-full flex items-center justify-between p-3 rounded-xl border
              transition-all duration-200 active:scale-[0.98]
              ${isDark 
                ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                : 'bg-black/[0.02] border-black/10 hover:bg-black/5'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${isDark ? 'bg-white/10' : 'bg-black/10'}
              `}>
                <User className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{t.profile}</p>
                <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.edit}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          </button>

          {verificationStatus === 'verified' && (
            <button
              onClick={() => onNavigate('posts')}
              className={`
                w-full flex items-center justify-between p-3 rounded-xl border
                transition-all duration-200 active:scale-[0.98]
                ${isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-black/[0.02] border-black/10 hover:bg-black/5'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isDark ? 'bg-white/10' : 'bg-black/10'}
                `}>
                  <FileText className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{t.posts}</p>
                  <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>{t.manage}</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
            </button>
          )}
        </div>
      </div>

      {/* Activity - Compact */}
      <div className={`
        rounded-xl p-3 lg:p-4 border
        ${isDark 
          ? 'bg-white/5 border-white/10' 
          : 'bg-black/[0.02] border-black/10'
        }
      `}>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-black/50'}`} />
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {t.activity}
          </h2>
        </div>
        <p className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>
          {t.comingSoon}
        </p>
      </div>
    </div>
  )
}
