'use client'

import { useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Sun, Moon, Loader2 } from 'lucide-react'

interface HeroImageUploaderProps {
  lightImageUrl: string
  darkImageUrl: string
  onLightImageChange: (url: string) => void
  onDarkImageChange: (url: string) => void
}

export default function HeroImageUploader({
  lightImageUrl,
  darkImageUrl,
  onLightImageChange,
  onDarkImageChange
}: HeroImageUploaderProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [uploadingLight, setUploadingLight] = useState(false)
  const [uploadingDark, setUploadingDark] = useState(false)

  const lightInputRef = useRef<HTMLInputElement>(null)
  const darkInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (
    file: File, 
    type: 'light' | 'dark',
    setUploading: (v: boolean) => void,
    onSuccess: (url: string) => void
  ) => {
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('hero-slides')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('hero-slides')
        .getPublicUrl(fileName)

      onSuccess(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('სურათის ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
    }
  }

  const handleLightUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file, 'light', setUploadingLight, onLightImageChange)
    }
  }

  const handleDarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file, 'dark', setUploadingDark, onDarkImageChange)
    }
  }

  const ImageUploadBox = ({
    label,
    icon: Icon,
    imageUrl,
    uploading,
    inputRef,
    onUpload,
    onClear
  }: {
    label: string
    icon: typeof Sun
    imageUrl: string
    uploading: boolean
    inputRef: React.RefObject<HTMLInputElement>
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onClear: () => void
  }) => (
    <div className="flex-1">
      <label className={`
        flex items-center gap-2 text-sm font-medium mb-2
        ${isDark ? 'text-white' : 'text-black'}
      `}>
        <Icon className="w-4 h-4" />
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onUpload}
        className="hidden"
      />

      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-40 object-cover"
          />
          <div className={`
            absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
            transition-opacity flex items-center justify-center gap-2
          `}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-2 bg-red-500/50 rounded-lg hover:bg-red-500/70"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`
            w-full h-40 rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-2
            transition-colors
            ${isDark 
              ? 'border-white/20 hover:border-white/40 text-white/60' 
              : 'border-black/20 hover:border-black/40 text-black/60'
            }
            ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8" />
              <span className="text-sm">ატვირთე სურათი</span>
            </>
          )}
        </button>
      )}
    </div>
  )

  return (
    <div className="flex gap-4">
      <ImageUploadBox
        label="Light Mode"
        icon={Sun}
        imageUrl={lightImageUrl}
        uploading={uploadingLight}
        inputRef={lightInputRef as React.RefObject<HTMLInputElement>}
        onUpload={handleLightUpload}
        onClear={() => onLightImageChange('')}
      />
      <ImageUploadBox
        label="Dark Mode"
        icon={Moon}
        imageUrl={darkImageUrl}
        uploading={uploadingDark}
        inputRef={darkInputRef as React.RefObject<HTMLInputElement>}
        onUpload={handleDarkUpload}
        onClear={() => onDarkImageChange('')}
      />
    </div>
  )
}
