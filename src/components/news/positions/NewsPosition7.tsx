'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Eye, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function NewsPosition7() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stats, setStats] = useState({ views: 0, users: 0, growth: 0 })

  useEffect(() => {
    // Animated counter effect
    const interval = setInterval(() => {
      setStats(prev => ({
        views: prev.views < 125000 ? prev.views + 2500 : 125000,
        users: prev.users < 8500 ? prev.users + 170 : 8500,
        growth: prev.growth < 24 ? prev.growth + 0.5 : 24
      }))
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`rounded-2xl p-6 h-full backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border-emerald-500/20' 
          : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-200/50'
      } shadow-2xl`}
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-emerald-500" />
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          სტატისტიკა
        </h3>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/60'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ნახვები
            </span>
          </div>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
            {stats.views.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/60'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მკითხველი
            </span>
          </div>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
            {stats.users.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/60'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ზრდა
            </span>
          </div>
          <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
            +{stats.growth.toFixed(1)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
