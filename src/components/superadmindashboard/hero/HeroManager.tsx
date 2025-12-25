'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { HeroSlide } from '@/lib/types/hero'
import { 
  HeroSlideList, 
  HeroSlideForm, 
  HeroSlideCard 
} from './components'
import { Plus, LayoutDashboard } from 'lucide-react'

export default function HeroManager() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // State
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)

  // Fetch slides
  const fetchSlides = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('hero_slides')
      .select(`
        *,
        buttons:hero_slide_buttons(*)
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching slides:', error)
    } else {
      setSlides(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  // Handlers
  const handleAddNew = () => {
    setEditingSlide(null)
    setShowForm(true)
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ სლაიდის წაშლა?')) return

    const { error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting slide:', error)
      alert('შეცდომა წაშლისას')
    } else {
      fetchSlides()
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('hero_slides')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Error toggling status:', error)
    } else {
      fetchSlides()
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSlide(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingSlide(null)
    fetchSlides()
  }

  const handleReorder = async (reorderedSlides: HeroSlide[]) => {
    // Update local state immediately
    setSlides(reorderedSlides)

    // Update database
    const updates = reorderedSlides.map((slide, index) => 
      supabase
        .from('hero_slides')
        .update({ display_order: index })
        .eq('id', slide.id)
    )

    await Promise.all(updates)
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
            <LayoutDashboard className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Hero სლაიდერის მართვა
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              მთავარი გვერდის ბანერების მართვა
            </p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${isDark 
              ? 'bg-white text-black hover:bg-white/90' 
              : 'bg-black text-white hover:bg-black/90'
            }
          `}
        >
          <Plus className="w-4 h-4" />
          ახალი სლაიდი
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`animate-spin w-8 h-8 border-2 rounded-full ${
            isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'
          }`} />
        </div>
      ) : slides.length === 0 ? (
        <div className={`
          text-center py-12 rounded-xl border-2 border-dashed
          ${isDark ? 'border-white/20 text-white/60' : 'border-black/20 text-black/60'}
        `}>
          <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">სლაიდები არ არის</p>
          <p className="text-sm mb-4">დაამატეთ პირველი სლაიდი Hero სექციისთვის</p>
          <button
            onClick={handleAddNew}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              ${isDark 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-black/10 text-black hover:bg-black/20'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            დაამატე სლაიდი
          </button>
        </div>
      ) : (
        <HeroSlideList
          slides={slides}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onReorder={handleReorder}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <HeroSlideForm
          slide={editingSlide}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
