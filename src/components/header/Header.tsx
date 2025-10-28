'use client'

import Link from 'next/link'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import type { Locale } from '@/lib/i18n/config'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const isDark = theme === 'dark'

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'

  // Check authentication status
  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const loadUserData = async (user: { id: string; email?: string }) => {
      if (!mounted) return
      setRoleLoading(true)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!mounted) return
        setUserRole(profile?.role || null)

        const { data: pendingRequest } = await supabase
          .from('access_requests')
          .select('id, status, company_id')
          .eq('user_id', user.id)
          .eq('status', 'PENDING')
          .maybeSingle()
        
        if (!mounted) return
        setHasPendingRequest(!!pendingRequest)
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        if (mounted) {
          setRoleLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      const currentUser = session?.user
      setUser(currentUser || null)

      if (currentUser) {
        loadUserData(currentUser)
      } else {
        setUserRole(null)
        setHasPendingRequest(false)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    router.push(`/${currentLocale}`)
    setIsMenuOpen(false)
  }

  const navLinks = [
    { href: `/${currentLocale}/practices`, label: 'პრაქტიკა' },
    { href: `/${currentLocale}/specialists`, label: 'სპეციალისტები' },
    { href: `/${currentLocale}/companies`, label: 'კომპანიები' },
    { href: `/${currentLocale}/news`, label: 'სიახლეები' },
    { href: `/${currentLocale}/blog`, label: 'ბლოგი' },
    { href: `/${currentLocale}/contact`, label: 'კონტაქტი' },
  ]

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-2xl backdrop-saturate-150 border-b transition-colors duration-150 ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/20 border-black/10'}`}>
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className={`text-2xl font-bold transition-all duration-300 ${isDark ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'}`}>
              LegalGE
            </div>
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
            {!loading ? (
              <div className="hidden md:flex items-center gap-3 ml-2">
                {user ? (
                  <>
                    {/* Show loading or buttons based on roleLoading */}
                    {roleLoading ? (
                      <div className="px-4 py-2 text-sm font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                        Loading...
                      </div>
                    ) : (
                      <>
                        {/* SUPER_ADMIN Dashboard Button */}
                        {userRole === 'SUPER_ADMIN' && (
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
                        Admin Dashboard
                      </Link>
                    )}

                    {/* ADMIN Dashboard Button */}
                    {userRole === 'ADMIN' && (
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
                        Admin Panel
                      </Link>
                    )}

                    {/* MODERATOR Dashboard Button */}
                    {userRole === 'MODERATOR' && (
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
                        Moderator Panel
                      </Link>
                    )}

                    {/* COMPANY Dashboard Button */}
                    {userRole === 'COMPANY' && (
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
                        Company Dashboard
                      </Link>
                    )}

                    {/* SOLO_SPECIALIST Dashboard Button */}
                    {userRole === 'SOLO_SPECIALIST' && (
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
                        Specialist Dashboard
                      </Link>
                    )}

                    {/* SPECIALIST Dashboard Button */}
                    {userRole === 'SPECIALIST' && (
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
                        My Dashboard
                      </Link>
                    )}

                    {/* USER Profile Button (default for users without specific role) */}
                    {(!userRole || userRole === 'USER') && (
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
                        {hasPendingRequest ? 'Pending' : 'პროფილი'}
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
                      გასვლა
                    </button>
                    </>
                    )}
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
                      შესვლა
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
                      რეგისტრაცია
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
                {!loading ? (
                  <div className={`flex flex-col space-y-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    {user ? (
                      <>
                        {/* Show loading or buttons based on roleLoading */}
                        {roleLoading ? (
                          <div className="px-4 py-2 text-base font-medium text-center" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                            Loading...
                          </div>
                        ) : (
                          <>
                            {/* SUPER_ADMIN Dashboard Button for Mobile */}
                            {userRole === 'SUPER_ADMIN' && (
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
                            Admin Dashboard
                          </Link>
                        )}

                        {/* ADMIN Dashboard Button for Mobile */}
                        {userRole === 'ADMIN' && (
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
                            Admin Panel
                          </Link>
                        )}

                        {/* MODERATOR Dashboard Button for Mobile */}
                        {userRole === 'MODERATOR' && (
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
                            Moderator Panel
                          </Link>
                        )}

                        {/* COMPANY Dashboard Button for Mobile */}
                        {userRole === 'COMPANY' && (
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
                            Company Dashboard
                          </Link>
                        )}

                        {/* SOLO_SPECIALIST Dashboard Button for Mobile */}
                        {userRole === 'SOLO_SPECIALIST' && (
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
                            Specialist Dashboard
                          </Link>
                        )}

                        {/* SPECIALIST Dashboard Button for Mobile */}
                        {userRole === 'SPECIALIST' && (
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
                            My Dashboard
                          </Link>
                        )}

                        {/* USER Profile Button for Mobile (default for users without specific role) */}
                        {(!userRole || userRole === 'USER') && (
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
                            {hasPendingRequest ? 'Pending' : 'პროფილი'}
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
                          გასვლა
                        </button>
                        </>
                        )}
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
                          შესვლა
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
                          რეგისტრაცია
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
