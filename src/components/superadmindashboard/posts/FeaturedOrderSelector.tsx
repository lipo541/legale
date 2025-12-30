'use client'

import { memo } from 'react'
import { X, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface FeaturedSlot {
  order: number
  post: {
    id: string
    title: string
    imageUrl: string | null
  } | null
}

interface FeaturedOrderSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (order: number) => void
  slots: FeaturedSlot[]
  currentPostId: string
  currentPostTitle: string
}

const FeaturedOrderSelector = memo(function FeaturedOrderSelector({
  isOpen,
  onClose,
  onSelect,
  slots,
  currentPostId,
  currentPostTitle
}: FeaturedOrderSelectorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-2xl rounded-2xl shadow-2xl
        ${isDark ? 'bg-zinc-900 border border-white/10' : 'bg-white border border-black/10'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4 border-b
          ${isDark ? 'border-white/10' : 'border-black/10'}
        `}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              აირჩიეთ პოზიცია
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პოსტი: {currentPostTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`
              rounded-lg p-2 transition-colors
              ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/10 text-black/60'}
            `}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slots Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isCurrentPost = slot.post?.id === currentPostId
              const isOccupied = slot.post && !isCurrentPost
              
              return (
                <button
                  key={slot.order}
                  onClick={() => onSelect(slot.order)}
                  className={`
                    group relative flex flex-col items-center justify-start 
                    rounded-xl border-2 p-3 min-h-[120px] transition-all
                    ${isCurrentPost
                      ? isDark 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-emerald-500 bg-emerald-50'
                      : isOccupied
                        ? isDark
                          ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10'
                          : 'border-amber-500/50 bg-amber-50 hover:border-amber-500 hover:bg-amber-100'
                        : isDark
                          ? 'border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                          : 'border-black/10 hover:border-emerald-500/50 hover:bg-emerald-50'
                    }
                  `}
                >
                  {/* Order Number */}
                  <div className={`
                    text-2xl font-bold mb-2
                    ${isCurrentPost
                      ? 'text-emerald-500'
                      : isOccupied
                        ? isDark ? 'text-amber-400' : 'text-amber-600'
                        : isDark 
                          ? 'text-white/30 group-hover:text-emerald-400' 
                          : 'text-black/30 group-hover:text-emerald-500'
                    }
                  `}>
                    #{slot.order}
                  </div>
                  
                  {slot.post ? (
                    <div className="text-center w-full flex-1 flex flex-col">
                      {slot.post.imageUrl && (
                        <div className="relative mx-auto mb-2 h-10 w-10 overflow-hidden rounded-lg flex-shrink-0">
                          <img
                            src={slot.post.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className={`
                        line-clamp-2 text-[10px] font-medium flex-1
                        ${isDark ? 'text-white/80' : 'text-black/80'}
                      `}>
                        {slot.post.title}
                      </p>
                      {isOccupied && (
                        <span className={`
                          mt-1 block text-[9px] font-medium
                          ${isDark ? 'text-amber-400' : 'text-amber-600'}
                        `}>
                          ⚠️ ჩანაცვლდება
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className={`
                      text-[10px] font-medium
                      ${isDark ? 'text-white/40' : 'text-black/40'}
                    `}>
                      თავისუფალი
                    </div>
                  )}

                  {/* Current Post Indicator */}
                  {isCurrentPost && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-emerald-500 p-1 text-white shadow-lg">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`
          p-4 border-t flex items-center justify-between
          ${isDark ? 'border-white/10' : 'border-black/10'}
        `}>
          <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            💡 დაკავებულ სლოტზე დაჭერით ძველი პოსტი წაიშლება Featured-იდან
          </p>
          <button
            onClick={onClose}
            className={`
              px-4 py-2 rounded-lg text-xs font-medium transition-colors
              ${isDark 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-black/10 hover:bg-black/20 text-black'
              }
            `}
          >
            გაუქმება
          </button>
        </div>
      </div>
    </div>
  )
})

export default FeaturedOrderSelector
