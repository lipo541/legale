'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Mail, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { authTranslations } from '@/translations/auth'
import type { Locale } from '@/lib/i18n/config'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  locale: Locale
}

export default function ForgotPasswordModal({ isOpen, onClose, locale }: ForgotPasswordModalProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()
  const t = authTranslations[locale] || authTranslations.ka

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ESC key handler
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscKey])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setError(null)
      setSuccess(false)
      setLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email.trim()) {
      setError(t.enterEmail)
      setLoading(false)
      return
    }

    try {
      // Check if email exists in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (!profile) {
        setError(t.emailNotFound)
        setLoading(false)
        return
      }

      // Send reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/${locale}/update-password`,
      })

      if (resetError) {
        throw resetError
      }

      setSuccess(true)
    } catch (err) {
      const error = err as Error & { status?: number }
      
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
        setError(t.rateLimitError)
      } else {
        setError(t.genericError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
          isDark 
            ? 'border-white/10 bg-black/95' 
            : 'border-black/10 bg-white/95'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-full p-2 transition-colors duration-200 ${
            isDark 
              ? 'text-white/60 hover:bg-white/10 hover:text-white' 
              : 'text-black/60 hover:bg-black/10 hover:text-black'
          }`}
          aria-label={t.close}
        >
          <X className="h-5 w-5" />
        </button>

        {!success ? (
          <>
            {/* Header */}
            <div className="mb-6 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}>
                <KeyRound className={`h-7 w-7 ${isDark ? 'text-white' : 'text-black'}`} />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {t.resetPassword}
              </h2>
              <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.enterEmail}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                isDark 
                  ? 'border-red-500/20 bg-red-500/10 text-red-400' 
                  : 'border-red-500/20 bg-red-50 text-red-600'
              }`}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`} />
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`w-full rounded-2xl border py-3 pl-12 pr-4 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white focus:ring-white' 
                      : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black focus:ring-black'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-4 w-full rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isDark 
                    ? 'border-white bg-white text-black hover:bg-black hover:text-white focus:ring-white' 
                    : 'border-black bg-black text-white hover:bg-white hover:text-black focus:ring-black'
                }`}
              >
                {loading ? t.sending : t.sendResetLink}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              isDark ? 'bg-green-500/20' : 'bg-green-50'
            }`}>
              <CheckCircle className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {t.resetLinkSent}
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {t.linkSentTo}
            </p>
            <p className={`mt-1 text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {email}
            </p>
            <p className={`mt-4 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
              {t.checkEmail}
            </p>

            <button
              onClick={onClose}
              className={`mt-6 w-full rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                isDark 
                  ? 'border-white/20 text-white hover:bg-white/10' 
                  : 'border-black/20 text-black hover:bg-black/10'
              }`}
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
