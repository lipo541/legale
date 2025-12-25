'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { HeroSlide } from '@/lib/types/hero'
import HeroSlideCard from './HeroSlideCard'
import { GripVertical } from 'lucide-react'

interface HeroSlideListProps {
  slides: HeroSlide[]
  onEdit: (slide: HeroSlide) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentStatus: boolean) => void
  onReorder: (slides: HeroSlide[]) => void
}

export default function HeroSlideList({
  slides,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder
}: HeroSlideListProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Simple drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex === dropIndex) return

    const newSlides = [...slides]
    const [draggedSlide] = newSlides.splice(dragIndex, 1)
    newSlides.splice(dropIndex, 0, draggedSlide)
    
    onReorder(newSlides)
  }

  return (
    <div className="space-y-3">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`
            group flex items-stretch gap-3 rounded-xl overflow-hidden
            border transition-all duration-200 cursor-move
            ${isDark 
              ? 'bg-white/5 border-white/10 hover:border-white/20' 
              : 'bg-black/5 border-black/10 hover:border-black/20'
            }
          `}
        >
          {/* Drag Handle */}
          <div className={`
            flex items-center justify-center w-10 
            ${isDark ? 'bg-white/5' : 'bg-black/5'}
          `}>
            <GripVertical className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          </div>

          {/* Card Content */}
          <div className="flex-1 py-3 pr-3">
            <HeroSlideCard
              slide={slide}
              index={index}
              onEdit={() => onEdit(slide)}
              onDelete={() => onDelete(slide.id)}
              onToggleActive={() => onToggleActive(slide.id, slide.is_active)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
