'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoWarning } from 'react-icons/io5'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border animate-in slide-in-from-right duration-300 ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-600 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-600 text-white'
                : toast.type === 'warning'
                ? 'bg-yellow-500/90 border-yellow-600 text-white'
                : 'bg-blue-500/90 border-blue-600 text-white'
            }`}
          >
            {toast.type === 'success' && <IoCheckmarkCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'error' && <IoCloseCircle className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'warning' && <IoWarning className="h-5 w-5 flex-shrink-0" />}
            {toast.type === 'info' && <IoInformationCircle className="h-5 w-5 flex-shrink-0" />}
            
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              aria-label="Close notification"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
