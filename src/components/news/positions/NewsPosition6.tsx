'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { Sparkles, ChevronRight } from 'lucide-react'

export default function NewsPosition6() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const recommendations = [
    { title: 'მონაცემთა დაცვის საფუძვლები', type: 'სახელმძღვანელო', duration: '10 წთ' },
    { title: 'GDPR compliance 2025', type: 'კურსი', duration: '45 წთ' },
    { title: 'ხელშეკრულებების შაბლონები', type: 'რესურსი', duration: '—' },
  ]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-2xl p-6 h-full backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-500/20' 
          : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/50 border-blue-200/50'
      } shadow-2xl`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          რეკომენდაციები
        </h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`group p-3 rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'bg-white/5 hover:bg-blue-500/20' 
                : 'bg-white/60 hover:bg-blue-100/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-700'
                  }`}>
                    {item.type}
                  </span>
                  <span className={isDark ? 'text-white/50' : 'text-black/50'}>
                    {item.duration}
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
