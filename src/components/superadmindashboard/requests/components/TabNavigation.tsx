'use client'

import { memo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { RequestTab } from '../types'

interface TabNavigationProps {
  activeTab: RequestTab
  setActiveTab: (tab: RequestTab) => void
  accessPendingCount: number
  verificationPendingCount: number
  companySpecialistPendingCount: number
  companyPendingCount: number
}

function TabNavigation({
  activeTab,
  setActiveTab,
  accessPendingCount,
  verificationPendingCount,
  companySpecialistPendingCount,
  companyPendingCount
}: TabNavigationProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const tabs: { id: RequestTab; label: string; count: number }[] = [
    { id: 'access', label: 'წვდომის მოთხოვნები', count: accessPendingCount },
    { id: 'verification', label: 'სოლო სპეციალისტები', count: verificationPendingCount },
    { id: 'companySpecialist', label: 'კომპანიის სპეციალისტები', count: companySpecialistPendingCount },
    { id: 'company', label: 'კომპანიები', count: companyPendingCount }
  ]

  return (
    <div className="mb-4 flex gap-1.5 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] sm:text-xs font-medium transition-all ${
            activeTab === tab.id
              ? isDark
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDark
              ? 'bg-white/10 text-white/60 hover:bg-white/20'
              : 'bg-black/10 text-black/60 hover:bg-black/20'
          }`}
        >
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">
            {tab.id === 'access' && 'წვდომა'}
            {tab.id === 'verification' && 'სოლო'}
            {tab.id === 'companySpecialist' && 'სპეც.'}
            {tab.id === 'company' && 'კომპ.'}
          </span>
          {tab.count > 0 && (
            <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
              activeTab === tab.id
                ? isDark
                  ? 'bg-black/20 text-black'
                  : 'bg-white/30 text-white'
                : isDark
                ? 'bg-yellow-500/30 text-yellow-400'
                : 'bg-yellow-500/20 text-yellow-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default memo(TabNavigation)
