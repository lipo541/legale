'use client'

import { memo } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface RejectModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  onConfirm: () => Promise<{ success: boolean; message?: string; error?: string }>
  rejectionReason: string
  setRejectionReason: (value: string) => void
  isProcessing: boolean
}

function RejectModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  rejectionReason,
  setRejectionReason,
  isProcessing
}: RejectModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!isOpen) return null

  const handleConfirm = async () => {
    const result = await onConfirm()
    if (!result.success && result.error) {
      // Could show toast here
      console.error(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-lg border p-4 shadow-xl ${
        isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
          >
            <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className={`mb-1.5 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            უარყოფის მიზეზი *
          </label>
          <textarea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="მიუთითეთ უარყოფის მიზეზი..."
            className={`w-full rounded-lg border px-3 py-2 text-xs outline-none transition-colors resize-none ${
              isDark
                ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20'
                : 'border-black/10 bg-black/5 text-black placeholder:text-black/40 focus:border-black/20'
            }`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-black/10 text-black hover:bg-black/20'
            }`}
          >
            გაუქმება
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !rejectionReason.trim()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                დამუშავება...
              </>
            ) : (
              'უარყოფა'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(RejectModal)
