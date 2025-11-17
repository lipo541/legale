'use client'

import React, { useEffect } from 'react'
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'დიახ',
  cancelText = 'გაუქმება',
  showCancel = true,
}: ModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getIcon = () => {
    const iconClass = 'w-6 h-6'
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />
      case 'confirm':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />
      default:
        return <Info className={`${iconClass} text-blue-500`} />
    }
  }

  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'success':
        return 'წარმატება'
      case 'warning':
        return 'გაფრთხილება'
      case 'error':
        return 'შეცდომა'
      case 'confirm':
        return 'დადასტურება'
      default:
        return 'ინფორმაცია'
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity ${
          isDark ? 'bg-black/60' : 'bg-black/40'
        }`}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transform transition-all ${
          isDark ? 'bg-zinc-900' : 'bg-white'
        } rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-lg transition-colors ${
            isDark
              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {getTitle()}
              </h3>
            </div>
          </div>

          {/* Message */}
          <div className="ml-10">
            <p
              className={`text-sm ${
                isDark ? 'text-zinc-300' : 'text-gray-600'
              }`}
            >
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 ml-10">
            {showCancel && (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm?.()
                onClose()
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === 'error' || type === 'confirm'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : type === 'success'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
