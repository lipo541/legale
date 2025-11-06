'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'
import { SiGoogle, SiFacebook } from 'react-icons/si'
import { PiCloudBold } from 'react-icons/pi'
import { useTheme } from '@/contexts/ThemeContext'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'

type SocialProvider = {
  id: string
  label: string
  badge: ReactNode
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    badge: <SiGoogle className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    badge: <PiCloudBold className="h-5 w-5" aria-hidden="true" />,
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    badge: <SiFacebook className="h-5 w-5" aria-hidden="true" />,
  },
]

export default function RegisterForm() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isDark = theme === 'dark'
  const supabase = createClient()
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError('გთხოვთ შეავსოთ ყველა ველი')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('პაროლები არ ემთხვევა')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან')
      setLoading(false)
      return
    }

    try {
      // 1. Register user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // 2. Create profile in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'USER',
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // 3. Redirect to login page
        router.push(`/${currentLocale}/login?registered=true`)
      }
    } catch (err) {
      setError((err as Error).message || 'რეგისტრაცია ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) throw error
    } catch (err) {
      setError((err as Error).message || 'ავტორიზაცია ვერ მოხერხდა')
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
            LegalGE
          </span>
        </div>

        <div className={`rounded-3xl border p-8 transition-all duration-300 sm:p-10 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <div className="space-y-2 text-center">
            <h1 className={`text-[30px] font-semibold transition-all duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
              Create your account
            </h1>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Join Legal-Ge to access our legal services
            </p>
          </div>

          {error && (
            <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {/* Google Button at Top */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className={`group flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isDark ? 'border-white/20 bg-transparent text-white hover:bg-white hover:text-black focus:ring-white' : 'border-black/20 bg-transparent text-black hover:bg-black hover:text-white focus:ring-black'}`}
            >
              <SiGoogle className="h-5 w-5" aria-hidden="true" />
              Continue with Google
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              <span className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
              OR CONTINUE WITH EMAIL
              <span className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            </div>
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullname" className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Full name
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  required
                  className={`w-full rounded-xl border px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30 focus:ring-black/20'}`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Email address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="zazaliparteliani888@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className={`w-full rounded-xl border px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30 focus:ring-black/20'}`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={`w-full rounded-xl border px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30 focus:ring-black/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 disabled:opacity-50 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                Confirm password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={`w-full rounded-xl border px-12 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-white/10 bg-black text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20' : 'border-black/10 bg-white text-black placeholder:text-black/40 focus:border-black/30 focus:ring-black/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-300 disabled:opacity-50 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className={`group flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isDark ? 'border-white bg-white text-black hover:bg-black hover:text-white focus:ring-white' : 'border-black bg-black text-white hover:bg-white hover:text-black focus:ring-black'}`}
            >
              {loading ? 'იტვირთება...' : 'Create account'}
            </button>
          </form>

          {/* Already have account */}
          <div className={`mt-5 text-center text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Already have an account?{' '}
            <Link href={`/${currentLocale}/login`} className={`font-semibold transition-colors duration-300 ${isDark ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'}`}>
              Sign in
            </Link>
          </div>

          {/* Terms and Privacy */}
          <div className={`mt-6 text-center text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            By creating an account, you agree to our{' '}
            <Link href={`/${currentLocale}/terms`} className={`font-medium transition-colors duration-300 ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href={`/${currentLocale}/privacy`} className={`font-medium transition-colors duration-300 ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
