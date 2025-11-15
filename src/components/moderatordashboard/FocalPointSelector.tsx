'use client'

import { useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import { X } from 'lucide-react'

interface FocalPointSelectorProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  postTitle: string
  currentFocalPoint?: { x: number; y: number }
  onSave: (x: number, y: number) => Promise<void>
}

export default function FocalPointSelector({
  isOpen,
  onClose,
  imageUrl,
  postTitle,
  currentFocalPoint = { x: 50, y: 50 },
  onSave
}: FocalPointSelectorProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [focalPoint, setFocalPoint] = useState(currentFocalPoint)
  const [isSaving, setIsSaving] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  // Handle click on image to set focal point
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setFocalPoint({
      x: Math.round(Math.max(0, Math.min(100, x))),
      y: Math.round(Math.max(0, Math.min(100, y)))
    })
  }

  // Save focal point to database
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(focalPoint.x, focalPoint.y)
      onClose()
    } catch (error) {
      console.error('Error saving focal point:', error)
      alert('შეცდომა focal point-ის შენახვისას')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl p-6 ${
        isDark ? 'bg-zinc-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Focal Point Selector
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {postTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-white/10 text-white' 
                : 'hover:bg-black/10 text-black'
            }`}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Instructions */}
        <div className={`mb-4 p-4 rounded-lg text-sm ${
          isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
        }`}>
          📍 დააკლიკე სურათზე იმ ადგილას, რომელიც უნდა ჩანდეს Position 1-ში
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Image - Left 2/3 */}
          <div className="lg:col-span-2">
            <div 
              ref={imageRef}
              onClick={handleImageClick}
              className={`relative w-full aspect-video cursor-crosshair rounded-lg overflow-hidden border-2 border-dashed ${
                isDark ? 'border-blue-500' : 'border-blue-600'
              }`}
            >
              <Image
                src={imageUrl}
                alt={postTitle}
                fill
                className="object-contain"
                unoptimized
              />
              
              {/* Crosshair */}
              <div 
                className="absolute w-8 h-8 pointer-events-none"
                style={{
                  left: `${focalPoint.x}%`,
                  top: `${focalPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Horizontal line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-lg" />
                {/* Vertical line */}
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-red-500 shadow-lg" />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg" />
              </div>
            </div>

            {/* Coordinates Display */}
            <div className={`mt-4 text-center text-sm ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              Focal Point: <span className="font-mono font-bold">X: {focalPoint.x}%</span> / <span className="font-mono font-bold">Y: {focalPoint.y}%</span>
            </div>
          </div>

          {/* Preview - Right 1/3 */}
          <div className="space-y-4">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Preview
            </h3>
            
            {/* Desktop Preview - Position 1 actual size */}
            <div>
              <p className={`text-xs mb-2 font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Desktop (580×300px)
              </p>
              <div 
                className={`relative w-full rounded-lg overflow-hidden ${
                  isDark ? 'border border-white/10' : 'border border-black/10'
                }`}
                style={{ aspectRatio: '580/300' }}
              >
                <Image
                  src={imageUrl}
                  alt="Desktop Preview"
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
                  }}
                  unoptimized
                />
              </div>
            </div>

            {/* Tablet Preview */}
            <div>
              <p className={`text-xs mb-2 font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Tablet (450px height)
              </p>
              <div 
                className={`relative w-full h-40 rounded-lg overflow-hidden ${
                  isDark ? 'border border-white/10' : 'border border-black/10'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt="Tablet Preview"
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
                  }}
                  unoptimized
                />
              </div>
            </div>

            {/* Mobile Preview */}
            <div>
              <p className={`text-xs mb-2 font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Mobile (320px height)
              </p>
              <div 
                className={`relative w-full h-32 rounded-lg overflow-hidden ${
                  isDark ? 'border border-white/10' : 'border border-black/10'
                }`}
              >
                <Image
                  src={imageUrl}
                  alt="Mobile Preview"
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
                  }}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onClose}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 text-white' 
                : 'bg-black/10 hover:bg-black/20 text-black'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'შენახვა...' : 'შენახვა'}
          </button>
        </div>
      </div>
    </div>
  )
}
