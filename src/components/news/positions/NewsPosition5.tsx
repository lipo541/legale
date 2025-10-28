'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { Flame, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'

export default function NewsPosition5() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const hotNews = [
    {
      title: 'AI რეგულაციები 2025',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
      time: '2 სთ წინ'
    },
    {
      title: 'ბლოკჩეინი კანონში',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
      time: '4 სთ წინ'
    }
  ]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-2xl p-6 h-full backdrop-blur-xl border ${
        isDark 
          ? 'bg-gradient-to-br from-orange-900/30 to-red-900/20 border-orange-500/20' 
          : 'bg-gradient-to-br from-orange-50/80 to-red-50/50 border-orange-200/50'
      } shadow-2xl`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          ცხელი თემები
        </h3>
      </div>

      <div className="space-y-4">
        {hotNews.map((news, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            className="group relative rounded-xl overflow-hidden cursor-pointer"
          >
            <div className="relative h-32">
              <Image
                src={news.image}
                alt={news.title}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <div className={`absolute inset-0 ${
                isDark ? 'bg-gradient-to-t from-black/80 to-transparent' : 'bg-gradient-to-t from-white/80 to-transparent'
              }`} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                  {news.title}
                </p>
                <ArrowUpRight className="w-4 h-4 text-orange-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {news.time}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
