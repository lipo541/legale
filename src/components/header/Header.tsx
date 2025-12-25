'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import NotificationBell from './NotificationBell'
import type { Locale } from '@/lib/i18n/config'
import { headerTranslations } from '@/translations/header'

// Import sub-components using barrel pattern
import { 
  Logo, 
  DesktopNav, 
  DashboardButton, 
  AuthButtons, 
  LogoutButton,
  MobileMenu,
  MobileMenuButton 
} from './components'

import type { NavLink, UserRole } from './types'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme } = useTheme()
  const pathname = usePathname()
  
  // Use centralized auth context
  const { user, role, hasPendingRequest, loading, signOut } = useAuth()

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const isDark = theme === 'dark'

  // Extract current locale from pathname
  const currentLocale = (pathname.split('/')[1] as Locale) || 'ka'
  const t = headerTranslations[currentLocale] || headerTranslations.ka

  // Handle logout
  const handleLogout = async () => {
    setIsMenuOpen(false)
    await signOut()
  }

  // Navigation links
  const navLinks: NavLink[] = [
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
          <Logo isDark={isDark} />

          {/* Desktop Navigation */}
          <DesktopNav navLinks={navLinks} isDark={isDark} />

          {/* Right Side: Theme, Language, Auth */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Desktop Auth Section */}
            {!loading ? (
              <div className="hidden md:flex items-center gap-3 ml-2">
                {user ? (
                  <>
                    {/* Notification Bell - For all roles except SUPER_ADMIN */}
                    {role && role !== 'SUPER_ADMIN' && (
                      <NotificationBell locale={currentLocale} />
                    )}
                    
                    {/* Dashboard Button */}
                    <DashboardButton
                      role={role as UserRole}
                      locale={currentLocale}
                      isDark={isDark}
                      label={role === 'USER' || !role ? t.myProfile : t.dashboard}
                      adminLabel={t.adminDashboard}
                      hasPendingRequest={hasPendingRequest}
                    />

                    {/* Logout Button */}
                    <LogoutButton 
                      label={t.logout}
                      isDark={isDark}
                      onClick={handleLogout}
                    />
                  </>
                ) : (
                  <AuthButtons
                    locale={currentLocale}
                    isDark={isDark}
                    translations={t}
                    onLogout={handleLogout}
                  />
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
            <MobileMenuButton 
              isOpen={isMenuOpen} 
              isDark={isDark} 
              onClick={toggleMenu} 
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileMenu
          isOpen={isMenuOpen}
          navLinks={navLinks}
          isDark={isDark}
          locale={currentLocale}
          translations={t}
          user={user}
          role={role as UserRole}
          hasPendingRequest={hasPendingRequest}
          loading={loading}
          onToggle={toggleMenu}
          onLogout={handleLogout}
        />
      </div>
    </header>
  )
}
