'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { Scale, TrendingUp, Users, FileText } from 'lucide-react'

export default function NewsPosition4() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const categories = [
    { icon: Scale, name: 'სამართალი', count: 156, color: 'emerald' },
    { icon: FileText, name: 'ბიზნესი', count: 89, color: 'blue' },
    { icon: Users, name: 'საზოგადოება', count: 234, color: 'purple' },
    { icon: TrendingUp, name: 'ფინანსები', count: 67, color: 'orange' },
  ]

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`rounded-2xl p-6 h-full backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/20' 
          : 'bg-gradient-to-br from-purple-50/80 to-pink-50/50 border-purple-200/50'
      } shadow-2xl`}
    >
      <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
        კატეგორიები
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((category, index) => {
          const Icon = category.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            >
              <Icon className={`w-8 h-8 mb-2 ${
                category.color === 'emerald' ? 'text-emerald-500' :
                category.color === 'blue' ? 'text-blue-500' :
                category.color === 'purple' ? 'text-purple-500' :
                'text-orange-500'
              }`} />
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                {category.name}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {category.count} სტატია
              </p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
