'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Mail, Phone, Building2, UserCircle } from 'lucide-react'
import { specialistsTranslations } from '@/translations/specialists'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import type { SpecialistCardProps, CompanySpecialist } from '../types'

// Static contact info - shown when info_activate is false
const STATIC_EMAIL = 'info.01199@gmail.com'
const STATIC_PHONE = '+995551911961'

// Clean phone number from any non-numeric characters except +, spaces, and hyphens
const cleanPhone = (phone: string | null | undefined): string => {
  if (!phone) return ''
  return phone.replace(/[^0-9+\s-]/g, '')
}

export default function SpecialistCard({ specialist, type, viewMode = 'grid', locale = 'ka' }: SpecialistCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations] || specialistsTranslations.ka

  const isCompany = type === 'company'
  const companySpecialist = isCompany ? (specialist as CompanySpecialist) : null

  // Determine which contact info to show based on info_activate
  const getDisplayEmail = () => {
    if (!specialist.info_activate) return STATIC_EMAIL
    if (isCompany && companySpecialist) {
      return specialist.email || companySpecialist.company_email || STATIC_EMAIL
    }
    return specialist.email || STATIC_EMAIL
  }

  const getDisplayPhone = () => {
    if (!specialist.info_activate) return STATIC_PHONE
    if (isCompany && companySpecialist) {
      return cleanPhone(specialist.phone_number || companySpecialist.company_phone) || STATIC_PHONE
    }
    return cleanPhone(specialist.phone_number) || STATIC_PHONE
  }

  const displayEmail = getDisplayEmail()
  const displayPhone = getDisplayPhone()

  // List view layout
  if (viewMode === 'list') {
    return (
      <div 
        className={`group relative flex overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
          isDark
            ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl'
            : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl'
        }`}
      >
        <div className="flex w-full items-center gap-3 p-3 sm:gap-0 sm:p-0">
          {/* Left: Avatar and Name */}
          <div className="flex flex-1 max-w-[calc(100%-70px)] sm:max-w-none items-center gap-3 sm:w-1/3 sm:flex-none sm:gap-4 sm:p-4">
            {/* Avatar */}
            <div className={`h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-full border-2 ${
              isDark 
                ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' 
                : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
            }`}>
              {specialist.avatar_url ? (
                <img 
                  src={getOptimizedImageUrl(specialist.avatar_url, imagePresets.avatarMedium)} 
                  alt={specialist.full_name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-sm sm:text-lg font-bold ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}>
                  {specialist.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
              )}
            </div>

            {/* Name and Position */}
            <div className="flex-1 min-w-0">
              <h3 className={`mb-0.5 text-sm sm:text-base font-semibold truncate ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {specialist.full_name}
              </h3>
              {specialist.role_title && (
                <p className={`mb-0.5 text-xs truncate ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}>
                  {specialist.role_title}
                </p>
              )}
              {/* Company or Solo indicator */}
              <div className="flex items-center gap-1">
                {isCompany && companySpecialist ? (
                  <>
                    <Building2 
                      size={11} 
                      strokeWidth={2}
                      className={isDark ? 'text-white/50' : 'text-black/50'}
                    />
                    {companySpecialist.company_slug ? (
                      <Link 
                        href={`/${locale}/companies/${companySpecialist.company_slug}`}
                        className={`text-xs truncate transition-colors hover:underline ${
                          isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
                        }`}
                      >
                        {companySpecialist.company}
                      </Link>
                    ) : (
                      <span className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        {companySpecialist.company}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <UserCircle 
                      size={11} 
                      strokeWidth={2}
                      className={isDark ? 'text-white/50' : 'text-black/50'}
                    />
                    <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {t.soloSpecialist || 'დამოუკიდებელი'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Contact & Bio - Hidden on mobile */}
          <div className={`hidden sm:flex sm:flex-1 border-l p-4 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="flex-1">
              {/* Contact Information */}
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Mail size={12} strokeWidth={2} className={isDark ? 'text-white/50' : 'text-black/50'} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {displayEmail}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={12} strokeWidth={2} className={isDark ? 'text-white/50' : 'text-black/50'} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {displayPhone}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {specialist.bio && (
                <p className={`text-xs leading-relaxed line-clamp-2 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  {specialist.bio}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action Button */}
          <div className={`flex-shrink-0 flex items-center sm:border-l p-0 sm:p-3 ${
            isDark ? 'sm:border-white/10' : 'sm:border-black/10'
          }`}>
            {specialist.slug ? (
              <Link href={`/${locale}/specialists/${specialist.slug}`}>
                <button
                  className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium transition-all duration-300 rounded-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50'
                      : 'bg-black/10 text-black hover:bg-black/20 focus-visible:ring-black/50'
                  }`}
                >
                  <span className="hidden sm:inline">{t.viewMore}</span>
                  <span className="sm:hidden">{t.viewMore}</span>
                </button>
              </Link>
            ) : (
              <button
                disabled
                className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium rounded-lg opacity-50 cursor-not-allowed ${
                  isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'
                }`}
              >
                {t.loading || 'იტვირთება...'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Grid view layout
  return (
    <div 
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl'
          : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Type Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
          isCompany
            ? 'bg-blue-500/20 text-blue-500'
            : 'bg-green-500/20 text-green-500'
        }`}>
          {isCompany ? (
            <>
              <Building2 size={10} />
              {t.companySpecialist || 'კომპანიის'}
            </>
          ) : (
            <>
              <UserCircle size={10} />
              {t.soloSpecialist || 'დამოუკიდებელი'}
            </>
          )}
        </span>
      </div>

      {/* Avatar Section */}
      <div className="relative flex justify-center pt-6 pb-4">
        <div className={`h-24 w-24 overflow-hidden rounded-full border-3 ${
          isDark 
            ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' 
            : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
        }`}>
          {specialist.avatar_url ? (
            <img 
              src={getOptimizedImageUrl(specialist.avatar_url, imagePresets.avatarLarge)} 
              alt={specialist.full_name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}>
              {specialist.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 pb-4">
        {/* Name */}
        <h3 className={`text-center text-base font-semibold mb-1 truncate ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          {specialist.full_name}
        </h3>

        {/* Role */}
        {specialist.role_title && (
          <p className={`text-center text-xs mb-2 truncate ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}>
            {specialist.role_title}
          </p>
        )}

        {/* Company name for company specialists */}
        {isCompany && companySpecialist && (
          <div className="flex items-center justify-center gap-1 mb-3">
            <Building2 size={12} className={isDark ? 'text-white/50' : 'text-black/50'} />
            {companySpecialist.company_slug ? (
              <Link 
                href={`/${locale}/companies/${companySpecialist.company_slug}`}
                className={`text-xs truncate transition-colors hover:underline ${
                  isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
                }`}
              >
                {companySpecialist.company}
              </Link>
            ) : (
              <span className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {companySpecialist.company}
              </span>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className={`space-y-1.5 mb-3 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          <div className="flex items-center justify-center gap-1.5">
            <Mail size={12} className={isDark ? 'text-white/40' : 'text-black/40'} />
            <span className="truncate">{displayEmail}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Phone size={12} className={isDark ? 'text-white/40' : 'text-black/40'} />
            <span>{displayPhone}</span>
          </div>
        </div>

        {/* Bio */}
        {specialist.bio && (
          <p className={`text-xs text-center leading-relaxed line-clamp-2 mb-3 ${
            isDark ? 'text-white/50' : 'text-black/50'
          }`}>
            {specialist.bio}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className={`px-4 pb-4 pt-2 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        {specialist.slug ? (
          <Link href={`/${locale}/specialists/${specialist.slug}`} className="block">
            <button
              className={`w-full py-2 text-xs font-medium transition-all duration-300 rounded-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50'
                  : 'bg-black/10 text-black hover:bg-black/20 focus-visible:ring-black/50'
              }`}
            >
              {t.viewMore}
            </button>
          </Link>
        ) : (
          <button
            disabled
            className={`w-full py-2 text-xs font-medium rounded-lg opacity-50 cursor-not-allowed ${
              isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'
            }`}
          >
            {t.loading || 'იტვირთება...'}
          </button>
        )}
      </div>
    </div>
  )
}
