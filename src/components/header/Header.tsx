'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'
import { headerTranslations } from '@/translations/header'

// Create the Supabase client once, outside the component
const supabase = createClient()

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()

  // Unified auth state
  const [authState, setAuthState] = useState({
    user: null as { id: string; email?: string } | null,
    role: null as string | null,
    hasPendingRequest: false,
    loading: true,
  })

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const isDark = theme === 'dark'

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const t = headerTranslations[currentLocale] || headerTranslations.ka

  // Fetch user session and profile data
  const fetchUserSession = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Error fetching session:', sessionError)
      setAuthState({ user: null, role: null, hasPendingRequest: false, loading: false })
      return
    }

    // If no session, reset auth state
    if (!session) {
      setAuthState({ user: null, role: null, hasPendingRequest: false, loading: false })
      return
    }

    // If session exists, fetch user profile and access request status
    try {
      const { user } = session
      const [profileRes, requestRes] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).single(),
        supabase.from('access_requests').select('id, status').eq('user_id', user.id).eq('status', 'PENDING').maybeSingle()
      ])

      setAuthState({
        user,
        role: profileRes.data?.role || null,
        hasPendingRequest: !!requestRes.data,
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching user profile or request status:', error)
      setAuthState({ user: session.user, role: null, hasPendingRequest: false, loading: false })
    }
  }, [])

  // Check authentication status and user data
  useEffect(() => {
    // Initial fetch
    fetchUserSession()

    // Listen for auth state changes (only SIGNED_IN and SIGNED_OUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Only re-fetch on actual sign in/out events, NOT on token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserSession()
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [fetchUserSession])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthState({ user: null, role: null, hasPendingRequest: false, loading: false })
    router.push(`/${currentLocale}`)
    setIsMenuOpen(false)
  }

  const navLinks = [
    { href: `/${currentLocale}/practices`, label: t.practices },
    { href: `/${currentLocale}/specialists`, label: t.specialists },
    { href: `/${currentLocale}/companies`, label: t.companies },
    { href: `/${currentLocale}/news`, label: t.news },
    { href: `/${currentLocale}/contact`, label: t.contact },
  ]

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150 border-b transition-colors duration-150 ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/20 border-black/10'}`}>
      <div className="mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={isDark ? "/asset/Legal.ge.png" : "/asset/legal.ge.black.png"}
              alt="LegalGE"
              width={140}
              height={40}
              className="object-contain object-left h-8 sm:h-9"
              priority
            />
            {/* Visible text for screen-readers only (keeps semantic branding) */}
            <span className="sr-only">LegalGE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map(({ href, label }) => (
              <Link 
                key={href} 
                href={href} 
                className={`relative inline-block text-sm font-medium transition-all duration-300 after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:content-[""] after:transition-transform after:duration-300 ${isDark ? 'text-white/70 hover:text-white after:bg-white hover:after:scale-x-100' : 'text-black/70 hover:text-black after:bg-black hover:after:scale-x-100'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Side: Theme, Language, Auth */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Desktop Auth Buttons */}
            {!authState.loading ? (
              <div className="hidden md:flex items-center gap-3 ml-2">
                {authState.user ? (
                  <>
                        {/* SUPER_ADMIN Dashboard Button */}
                        {authState.role === 'SUPER_ADMIN' && (
                      <Link 
                        href={`/${currentLocale}/admin`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.adminDashboard}
                      </Link>
                    )}

                    {/* ADMIN Dashboard Button */}
                    {authState.role === 'ADMIN' && (
                      <Link 
                        href={`/${currentLocale}/admin`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* MODERATOR Dashboard Button */}
                    {authState.role === 'MODERATOR' && (
                      <Link 
                        href={`/${currentLocale}/moderator-dashboard`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* COMPANY Dashboard Button */}
                    {authState.role === 'COMPANY' && (
                      <Link 
                        href={`/${currentLocale}/company-dashboard`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* SOLO_SPECIALIST Dashboard Button */}
                    {authState.role === 'SOLO_SPECIALIST' && (
                      <Link 
                        href={`/${currentLocale}/solo-specialist-dashboard`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* SPECIALIST Dashboard Button */}
                    {authState.role === 'SPECIALIST' && (
                      <Link 
                        href={`/${currentLocale}/specialist-dashboard`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* AUTHOR Dashboard Button */}
                    {authState.role === 'AUTHOR' && (
                      <Link 
                        href={`/${currentLocale}/author-dashboard`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t.dashboard}
                      </Link>
                    )}

                    {/* USER Profile Button (default for users without specific role) */}
                    {(!authState.role || authState.role === 'USER') && (
                      <Link
                        href={`/${currentLocale}/complete-profile`}
                        style={{
                          backgroundColor: isDark ? '#000000' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {authState.hasPendingRequest ? t.requestPending : t.myProfile}
                      </Link>
                    )}

                    {/* Logout Button (for all authenticated users) */}
                    <button 
                      onClick={handleLogout}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: 'transparent',
                        color: '#000000',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000'
                        e.currentTarget.style.color = '#FFFFFF'
                        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF'
                        e.currentTarget.style.color = '#000000'
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href={`/${currentLocale}/login`}
                      style={{
                        backgroundColor: isDark ? '#000000' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        color: isDark ? '#FFFFFF' : '#000000',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
                        e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
                        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
                        e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t.login}
                    </Link>
                    <Link 
                      href={`/${currentLocale}/register`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: 'transparent',
                        color: '#000000',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000'
                        e.currentTarget.style.color = '#FFFFFF'
                        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF'
                        e.currentTarget.style.color = '#000000'
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t.register}
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 ml-2">
                <div className="px-4 py-2 text-sm font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                  Loading...
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${isMenuOpen ? 'max-h-[520px] opacity-100 translate-y-0 pointer-events-auto' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'}`}
          aria-hidden={!isMenuOpen}
        >
          {isMenuOpen && (
            <div className={`pb-4 mt-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <nav className="flex flex-col space-y-4">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={toggleMenu}
                    className={`text-base font-medium transition-all duration-300 ${isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}
                  >
                    {label}
                  </Link>
                ))}

                {/* Mobile Auth Buttons */}
                {!authState.loading ? (
                  <div className={`flex flex-col space-y-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    {authState.user ? (
                      <>
                            {/* SUPER_ADMIN Dashboard Button for Mobile */}
                            {authState.role === 'SUPER_ADMIN' && (
                          <Link
                            href={`/${currentLocale}/admin`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.adminDashboard}
                          </Link>
                        )}

                        {/* ADMIN Dashboard Button for Mobile */}
                        {authState.role === 'ADMIN' && (
                          <Link
                            href={`/${currentLocale}/admin`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* MODERATOR Dashboard Button for Mobile */}
                        {authState.role === 'MODERATOR' && (
                          <Link
                            href={`/${currentLocale}/moderator-dashboard`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* COMPANY Dashboard Button for Mobile */}
                        {authState.role === 'COMPANY' && (
                          <Link
                            href={`/${currentLocale}/company-dashboard`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* SOLO_SPECIALIST Dashboard Button for Mobile */}
                        {authState.role === 'SOLO_SPECIALIST' && (
                          <Link
                            href={`/${currentLocale}/solo-specialist-dashboard`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* SPECIALIST Dashboard Button for Mobile */}
                        {authState.role === 'SPECIALIST' && (
                          <Link
                            href={`/${currentLocale}/specialist-dashboard`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* AUTHOR Dashboard Button for Mobile */}
                        {authState.role === 'AUTHOR' && (
                          <Link
                            href={`/${currentLocale}/author-dashboard`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t.dashboard}
                          </Link>
                        )}

                        {/* USER Profile Button for Mobile (default for users without specific role) */}
                        {(!authState.role || authState.role === 'USER') && (
                          <Link
                            href={`/${currentLocale}/complete-profile`}
                            onClick={toggleMenu}
                            style={{
                              backgroundColor: isDark ? '#000000' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                              color: isDark ? '#FFFFFF' : '#000000',
                              borderWidth: '1px',
                              borderStyle: 'solid'
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                          >
                            {authState.hasPendingRequest ? t.requestPending : t.myProfile}
                          </Link>
                        )}
                        
                        {/* Logout Button for Mobile */}
                        <button
                          onClick={handleLogout}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: 'transparent',
                            color: '#000000',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-300 active:scale-[0.98]"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.logout}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/${currentLocale}/login`}
                          onClick={toggleMenu}
                          style={{
                            backgroundColor: isDark ? '#000000' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                            color: isDark ? '#FFFFFF' : '#000000',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                          className="px-4 py-2 rounded-lg text-base font-medium text-center transition-all duration-300 active:scale-[0.98]"
                        >
                          {t.login}
                        </Link>
                        <Link
                          href={`/${currentLocale}/register`}
                          onClick={toggleMenu}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: 'transparent',
                            color: '#000000',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                          }}
                          className="px-4 py-2 rounded-lg text-base font-medium text-center transition-all duration-300 active:scale-[0.98]"
                        >
                          {t.register}
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col space-y-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="px-4 py-2 text-base font-medium text-center" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                      Loading...
                    </div>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
