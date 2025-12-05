'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  title?: string
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, title?: string) => void
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

  const showToast = useCallback((message: string, type: ToastType, title?: string) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type, title }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      case 'warning':
        return <AlertCircle className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
    }
  }

  const getDefaultTitle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'წარმატება'
      case 'error':
        return 'შეცდომა'
      case 'warning':
        return 'გაფრთხილება'
      case 'info':
        return 'ინფორმაცია'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - positioned above mobile nav */}
      <div className="fixed bottom-24 lg:bottom-6 right-3 lg:right-6 z-[100] flex flex-col gap-2 max-w-[calc(100vw-24px)] lg:max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border
              animate-in slide-in-from-right-full duration-300 ease-out
              ${toast.type === 'success'
                ? 'bg-black/90 border-white/20 text-white'
                : toast.type === 'error'
                ? 'bg-black/90 border-red-500/30 text-white'
                : toast.type === 'warning'
                ? 'bg-black/90 border-yellow-500/30 text-white'
                : 'bg-black/90 border-white/20 text-white'
              }
            `}
          >
            <div className={`flex-shrink-0 mt-0.5 ${
              toast.type === 'success' ? 'text-green-400' :
              toast.type === 'error' ? 'text-red-400' :
              toast.type === 'warning' ? 'text-yellow-400' :
              'text-blue-400'
            }`}>
              {getIcon(toast.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {toast.title || getDefaultTitle(toast.type)}
              </p>
              <p className="text-xs text-white/70 mt-0.5 break-words">
                {toast.message}
              </p>
            </div>
            
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-white/50 hover:text-white transition-colors p-0.5 -m-0.5 rounded"
              aria-label="დახურვა"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
