'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { Clock, ArrowRight } from 'lucide-react'

export default function NewsPosition8() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const latestUpdates = [
    { id: 1, title: 'ახალი შესწორებები საგადასახადო კოდექსში', time: '10 წთ წინ', tag: 'ახალი' },
    { id: 2, title: 'საკონსტიტუციო სასამართლოს გადაწყვეტილება', time: '1 სთ წინ', tag: 'მნიშვნელოვანი' },
    { id: 3, title: 'ბიზნეს რეგისტრაციის ახალი წესები', time: '2 სთ წინ', tag: 'განახლება' },
    { id: 4, title: 'მომხმარებელთა უფლებები E-commerce-ში', time: '3 სთ წინ', tag: 'სახელმძღვანელო' },
  ]

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`rounded-2xl p-6 h-full backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20 border-violet-500/20' 
          : 'bg-gradient-to-br from-violet-50/80 to-fuchsia-50/50 border-violet-200/50'
      } shadow-2xl`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-violet-500" />
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          ბოლო განახლებები
        </h3>
      </div>

      <div className="space-y-2">
        {latestUpdates.map((update, index) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group p-3 rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'bg-white/5 hover:bg-violet-500/20' 
                : 'bg-white/60 hover:bg-violet-100/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    update.tag === 'ახალი' ? 'bg-emerald-500/20 text-emerald-500' :
                    update.tag === 'მნიშვნელოვანი' ? 'bg-orange-500/20 text-orange-500' :
                    update.tag === 'განახლება' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-purple-500/20 text-purple-500'
                  }`}>
                    {update.tag}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {update.time}
                  </span>
                </div>
                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                  {update.title}
                </p>
              </div>
              <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${isDark ? 'text-white/50' : 'text-black/50'}`} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
          isDark 
            ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400' 
            : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-700'
        }`}
      >
        ყველას ნახვა
      </motion.button>
    </motion.div>
  )
}
