'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import { authTranslations } from '@/translations/auth'
import type { Locale } from '@/lib/i18n/config'

export default function UpdatePasswordForm() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // Extract locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const t = authTranslations[currentLocale] || authTranslations.ka

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  // Check for recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Get the hash from URL (Supabase sends tokens in hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      if (type === 'recovery' && accessToken) {
        // Set the session from the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        })

        if (error) {
          setIsValidSession(false)
          setError(t.invalidOrExpiredLink)
        } else {
          setIsValidSession(true)
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      } else {
        // Check if there's an existing session from PASSWORD_RECOVERY event
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setIsValidSession(true)
        } else {
          setIsValidSession(false)
          setError(t.invalidOrExpiredLink)
        }
      }
    }

    checkSession()

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
        setError(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, t.invalidOrExpiredLink])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password.length < 6) {
      setError(t.passwordTooShort)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      
      // Sign out after password change for security
      await supabase.auth.signOut()

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${currentLocale}/login`)
      }, 3000)
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

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-20">
        <div className={`flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-20">
      {/* Background */}
      <div className={`absolute inset-0 transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-white'}`} />

      {/* Form Container */}
      <div className={`relative z-10 w-full max-w-md rounded-3xl border p-8 sm:p-10 backdrop-blur-xl ${
        isDark 
          ? 'border-white/10 bg-black/40' 
          : 'border-black/10 bg-white/40'
      }`}>
        {/* Logo */}
        <Link href={`/${currentLocale}`} className="mb-8 flex justify-center">
          <Image
            src={isDark ? '/asset/logo-white.png' : '/asset/logo-black.png'}
            alt="Legal.ge"
            width={140}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {!success ? (
          <>
            {/* Header */}
            <div className="mb-6 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}>
                <KeyRound className={`h-7 w-7 ${isDark ? 'text-white' : 'text-black'}`} />
              </div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {t.resetPassword}
              </h1>
              <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {t.setNewPassword}
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

            {isValidSession ? (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className={`mb-2 block text-xs font-medium ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {t.newPassword}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                      isDark ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t.passwordRequirements}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className={`w-full rounded-2xl border py-3 pl-12 pr-12 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark 
                          ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white focus:ring-white' 
                          : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black focus:ring-black'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'
                      }`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className={`mb-2 block text-xs font-medium ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${
                      isDark ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t.confirmPassword}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className={`w-full rounded-2xl border py-3 pl-12 pr-12 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDark 
                          ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white focus:ring-white' 
                          : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black focus:ring-black'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                        isDark ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'
                      }`}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                    isDark 
                      ? 'border-white bg-white text-black hover:bg-black hover:text-white focus:ring-white' 
                      : 'border-black bg-black text-white hover:bg-white hover:text-black focus:ring-black'
                  }`}
                >
                  {loading ? t.updating : t.updatePassword}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>
            ) : (
              /* Invalid session - show link to login */
              <div className="text-center">
                <Link
                  href={`/${currentLocale}/login`}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] ${
                    isDark 
                      ? 'border-white/20 text-white hover:bg-white/10' 
                      : 'border-black/20 text-black hover:bg-black/10'
                  }`}
                >
                  {t.goToLogin}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
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
              {t.passwordUpdated}
            </h2>
            <p className={`mt-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {t.goToLogin}...
            </p>
            <div className="mt-4">
              <div className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full animate-[progress_3s_ease-in-out] bg-green-500" 
                  style={{ animation: 'progress 3s ease-in-out forwards' }} 
                />
              </div>
            </div>
            <style jsx>{`
              @keyframes progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
          </div>
        )}
      </div>
    </main>
  )
}
