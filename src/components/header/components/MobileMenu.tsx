import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import DashboardButton from './DashboardButton'
import AuthButtons, { LogoutButton } from './AuthButtons'
import NotificationBell from '../NotificationBell'
import type { MobileMenuProps } from '../types'

interface MobileMenuButtonProps {
  isOpen: boolean
  isDark: boolean
  onClick: () => void
}

export function MobileMenuButton({ isOpen, isDark, onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
      aria-label="Toggle menu"
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
      ) : (
        <Menu className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
      )}
    </button>
  )
}

export default function MobileMenu({ 
  isOpen, 
  navLinks, 
  isDark, 
  locale,
  translations,
  user,
  role,
  hasPendingRequest,
  loading,
  onToggle,
  onLogout
}: MobileMenuProps) {
  return (
    <div 
      className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${isOpen ? 'max-h-[520px] opacity-100 translate-y-0 pointer-events-auto' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      {isOpen && (
        <div className={`pb-4 mt-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <nav className="flex flex-col space-y-4">
            {/* Navigation Links */}
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onToggle}
                className={`text-base font-medium transition-all duration-300 ${isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}
              >
                {label}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            {!loading ? (
              <div className={`flex flex-col space-y-2 pt-4 border-t transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                {user ? (
                  <>
                    {/* Dashboard Button */}
                    <DashboardButton
                      role={role}
                      locale={locale}
                      isDark={isDark}
                      label={role === 'USER' || !role ? translations.myProfile : translations.dashboard}
                      adminLabel={translations.adminDashboard}
                      hasPendingRequest={hasPendingRequest}
                      isMobile={true}
                      onClick={onToggle}
                    />
                    
                    {/* Logout Button */}
                    <LogoutButton 
                      label={translations.logout}
                      isDark={isDark}
                      isMobile={true}
                      onClick={onLogout}
                    />
                  </>
                ) : (
                  <AuthButtons
                    locale={locale}
                    isDark={isDark}
                    translations={translations}
                    onLogout={onLogout}
                    isMobile={true}
                    onMobileClick={onToggle}
                  />
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
  )
}
