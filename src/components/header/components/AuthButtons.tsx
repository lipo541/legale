import Link from 'next/link'
import { LogOut } from 'lucide-react'
import type { AuthButtonsProps } from '../types'

interface LoginButtonProps {
  href: string
  label: string
  isDark: boolean
  isMobile?: boolean
  onClick?: () => void
}

function LoginButton({ href, label, isDark, isMobile = false, onClick }: LoginButtonProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      style={{
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        color: isDark ? '#FFFFFF' : '#000000',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      onMouseEnter={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.color = isDark ? '#000000' : '#FFFFFF'
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
      } : undefined}
      onMouseLeave={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = isDark ? '#000000' : '#FFFFFF'
        e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
      } : undefined}
      className={`px-4 py-2 rounded-lg ${isMobile ? 'text-base text-center' : 'text-xs'} font-medium transition-all duration-300 ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
    >
      {label}
    </Link>
  )
}

interface RegisterButtonProps {
  href: string
  label: string
  isDark: boolean
  isMobile?: boolean
  onClick?: () => void
}

function RegisterButton({ href, label, isDark, isMobile = false, onClick }: RegisterButtonProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'transparent',
        color: '#000000',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
      }}
      onMouseEnter={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = '#000000'
        e.currentTarget.style.color = '#FFFFFF'
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
      } : undefined}
      onMouseLeave={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF'
        e.currentTarget.style.color = '#000000'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
      } : undefined}
      className={`px-4 py-2 rounded-lg ${isMobile ? 'text-base text-center' : 'text-xs'} font-medium transition-all duration-300 ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
    >
      {label}
    </Link>
  )
}

interface LogoutButtonProps {
  label: string
  isDark: boolean
  isMobile?: boolean
  onClick: () => void
}

function LogoutButton({ label, isDark, isMobile = false, onClick }: LogoutButtonProps) {
  return (
    <button 
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'transparent',
        color: '#000000',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
      }}
      onMouseEnter={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = '#000000'
        e.currentTarget.style.color = '#FFFFFF'
        e.currentTarget.style.borderColor = isDark ? '#FFFFFF' : '#000000'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
      } : undefined}
      onMouseLeave={!isMobile ? (e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF'
        e.currentTarget.style.color = '#000000'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0,0,0,0.05)'
      } : undefined}
      className={`flex items-center ${isMobile ? 'justify-center' : ''} gap-2 px-4 py-2 rounded-lg ${isMobile ? 'text-base' : 'text-xs'} font-medium transition-all duration-300 ${isMobile ? 'active:scale-[0.98]' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
    >
      <LogOut className="w-4 h-4" />
      {label}
    </button>
  )
}

// Main component for unauthenticated users
export default function AuthButtons({ 
  locale, 
  isDark, 
  translations,
  onLogout,
  isMobile = false,
  onMobileClick
}: AuthButtonsProps) {
  return (
    <>
      <LoginButton 
        href={`/${locale}/login`}
        label={translations.login}
        isDark={isDark}
        isMobile={isMobile}
        onClick={onMobileClick}
      />
      <RegisterButton 
        href={`/${locale}/register`}
        label={translations.register}
        isDark={isDark}
        isMobile={isMobile}
        onClick={onMobileClick}
      />
    </>
  )
}

// Named exports for individual buttons
export { LoginButton, RegisterButton, LogoutButton }
