'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { AuthErrorProvider } from '@/contexts/AuthErrorContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthErrorProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </AuthErrorProvider>
  )
}
