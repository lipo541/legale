'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { HeroSlide } from '@/lib/types/hero'
import { Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'

interface HeroSlideCardProps {
  slide: HeroSlide
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export default function HeroSlideCard({
  slide,
  index,
  onEdit,
  onDelete,
  onToggleActive
}: HeroSlideCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-4">
      {/* Preview Image */}
      <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
        {slide.image_url_light ? (
          <img
            src={isDark ? slide.image_url_dark : slide.image_url_light}
            alt={slide.title_ka}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`
            w-full h-full flex items-center justify-center
            ${isDark ? 'bg-white/10' : 'bg-black/10'}
          `}>
            <ImageIcon className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
          </div>
        )}
        
        {/* Order Badge */}
        <div className={`
          absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-bold
          ${isDark ? 'bg-black/80 text-white' : 'bg-white/80 text-black'}
        `}>
          #{index + 1}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
            {slide.title_ka || 'უსათაურო'}
          </h3>
          <span className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${slide.is_active 
              ? 'bg-green-500/20 text-green-500' 
              : isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'
            }
          `}>
            {slide.is_active ? 'აქტიური' : 'არააქტიური'}
          </span>
        </div>
        
        <p className={`text-sm truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {slide.description_ka || 'აღწერა არ არის'}
        </p>
        
        <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          {slide.buttons?.length || 0} ღილაკი
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleActive}
          className={`
            p-2 rounded-lg transition-colors
            ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}
          `}
          title={slide.is_active ? 'გამორთვა' : 'ჩართვა'}
        >
          {slide.is_active ? (
            <Eye className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          ) : (
            <EyeOff className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          )}
        </button>

        <button
          onClick={onEdit}
          className={`
            p-2 rounded-lg transition-colors
            ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}
          `}
          title="რედაქტირება"
        >
          <Edit className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
        </button>

        <button
          onClick={onDelete}
          className={`
            p-2 rounded-lg transition-colors
            hover:bg-red-500/20
          `}
          title="წაშლა"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  )
}
