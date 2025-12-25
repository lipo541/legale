'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { HeroSlide, HeroSlideButton } from '@/lib/types/hero'
import HeroImageUploader from './HeroImageUploader'
import HeroButtonEditor from './HeroButtonEditor'
import { X, Save, Loader2 } from 'lucide-react'

interface HeroSlideFormProps {
  slide: HeroSlide | null
  onClose: () => void
  onSuccess: () => void
}

export default function HeroSlideForm({ slide, onClose, onSuccess }: HeroSlideFormProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const isEditing = !!slide

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'ka' | 'en' | 'ru'>('ka')

  // Form state
  const [formData, setFormData] = useState({
    image_url_light: '',
    image_url_dark: '',
    title_ka: '',
    title_en: '',
    title_ru: '',
    description_ka: '',
    description_en: '',
    description_ru: '',
    is_active: true
  })

  const [buttons, setButtons] = useState<HeroSlideButton[]>([])

  // Load slide data if editing
  useEffect(() => {
    if (slide) {
      setFormData({
        image_url_light: slide.image_url_light,
        image_url_dark: slide.image_url_dark,
        title_ka: slide.title_ka,
        title_en: slide.title_en,
        title_ru: slide.title_ru,
        description_ka: slide.description_ka || '',
        description_en: slide.description_en || '',
        description_ru: slide.description_ru || '',
        is_active: slide.is_active
      })
      setButtons(slide.buttons || [])
    }
  }, [slide])

  const handleSave = async () => {
    // Validation
    if (!formData.image_url_light || !formData.image_url_dark) {
      alert('გთხოვთ ატვირთოთ ორივე სურათი (Light და Dark mode)')
      return
    }
    if (!formData.title_ka || !formData.title_en || !formData.title_ru) {
      alert('გთხოვთ შეავსოთ სათაური სამივე ენაზე')
      return
    }

    setSaving(true)

    try {
      let slideId = slide?.id

      if (isEditing && slideId) {
        // Update existing slide
        const { error } = await supabase
          .from('hero_slides')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', slideId)

        if (error) throw error
      } else {
        // Create new slide
        const { data, error } = await supabase
          .from('hero_slides')
          .insert({
            ...formData,
            display_order: 999 // Will be reordered
          })
          .select('id')
          .single()

        if (error) throw error
        slideId = data.id
      }

      // Handle buttons
      if (slideId) {
        // Delete existing buttons
        await supabase
          .from('hero_slide_buttons')
          .delete()
          .eq('slide_id', slideId)

        // Insert new buttons
        if (buttons.length > 0) {
          const buttonsToInsert = buttons.map((btn, index) => ({
            slide_id: slideId,
            text_ka: btn.text_ka,
            text_en: btn.text_en,
            text_ru: btn.text_ru,
            action_type: btn.action_type,
            action_url: btn.action_url || null,
            specialist_id: btn.specialist_id || null,
            practice_id: btn.practice_id || null,
            company_id: btn.company_id || null,
            open_in_new_tab: btn.open_in_new_tab,
            variant: btn.variant,
            display_order: index
          }))

          const { error: btnError } = await supabase
            .from('hero_slide_buttons')
            .insert(buttonsToInsert)

          if (btnError) throw btnError
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving slide:', error)
      alert('შეცდომა შენახვისას')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl
        ${isDark ? 'bg-zinc-900' : 'bg-white'}
      `}>
        {/* Header */}
        <div className={`
          sticky top-0 z-10 flex items-center justify-between p-4 border-b
          ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'}
        `}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {isEditing ? 'სლაიდის რედაქტირება' : 'ახალი სლაიდი'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Images */}
          <div>
            <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
              სურათები
            </h3>
            <HeroImageUploader
              lightImageUrl={formData.image_url_light}
              darkImageUrl={formData.image_url_dark}
              onLightImageChange={(url) => setFormData(prev => ({ ...prev, image_url_light: url }))}
              onDarkImageChange={(url) => setFormData(prev => ({ ...prev, image_url_dark: url }))}
            />
          </div>

          {/* Text Content */}
          <div>
            <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
              ტექსტი
            </h3>

            {/* Language Tabs */}
            <div className="flex gap-1 mb-4">
              {(['ka', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveTab(lang)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium uppercase
                    ${activeTab === lang
                      ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                      : isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                    }
                  `}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                სათაური ({activeTab.toUpperCase()}) *
              </label>
              <input
                type="text"
                value={formData[`title_${activeTab}`]}
                onChange={(e) => setFormData(prev => ({ ...prev, [`title_${activeTab}`]: e.target.value }))}
                placeholder="შეიყვანეთ სათაური"
                className={`
                  w-full px-4 py-3 rounded-lg text-base
                  ${isDark 
                    ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                    : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                `}
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                აღწერა ({activeTab.toUpperCase()})
              </label>
              <textarea
                value={formData[`description_${activeTab}`]}
                onChange={(e) => setFormData(prev => ({ ...prev, [`description_${activeTab}`]: e.target.value }))}
                placeholder="შეიყვანეთ აღწერა"
                rows={3}
                className={`
                  w-full px-4 py-3 rounded-lg text-base resize-none
                  ${isDark 
                    ? 'bg-white/10 text-white placeholder:text-white/40 border-white/10' 
                    : 'bg-black/5 text-black placeholder:text-black/40 border-black/10'
                  }
                  border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                `}
              />
            </div>
          </div>

          {/* Buttons */}
          <HeroButtonEditor buttons={buttons} onChange={setButtons} />

          {/* Active Status */}
          <label className={`
            flex items-center gap-3 p-4 rounded-lg cursor-pointer
            ${isDark ? 'bg-white/5' : 'bg-black/5'}
          `}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-5 h-5 rounded"
            />
            <div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                აქტიური სლაიდი
              </p>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                აქტიური სლაიდები გამოჩნდება მთავარ გვერდზე
              </p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className={`
          sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t
          ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'}
        `}>
          <button
            onClick={onClose}
            disabled={saving}
            className={`
              px-4 py-2 rounded-lg font-medium
              ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}
            `}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium
              ${isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'ინახება...' : 'შენახვა'}
          </button>
        </div>
      </div>
    </div>
  )
}
