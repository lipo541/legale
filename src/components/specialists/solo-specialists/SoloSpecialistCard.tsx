'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Phone, UserCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { specialistsTranslations } from '@/translations/specialists';

interface SoloSpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  slug?: string;
  bio: string | null;
  avatar_url?: string | null;
}

interface SoloSpecialistCardProps {
  specialist?: SoloSpecialist;
  viewMode?: 'grid' | 'list';
}

export default function SoloSpecialistCard({ specialist, viewMode = 'grid' }: SoloSpecialistCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = useParams();
  const locale = params?.locale || 'ka';
  const t = specialistsTranslations[locale as keyof typeof specialistsTranslations] || specialistsTranslations.ka;

  // Static contact info - same for all specialists
  const COMPANY_EMAIL = 'contact@legalsandbox.ge';
  const COMPANY_PHONE = '+995 555 123 456';

  if (!specialist) return null;

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
        {/* Compact mobile layout, full desktop layout */}
        <div className="flex w-full items-center gap-3 p-3 sm:gap-0 sm:p-0">
          {/* Left: Avatar and Name - Always visible */}
          <div className="flex flex-1 items-center gap-3 sm:w-1/3 sm:gap-4 sm:p-4">
            {/* Avatar - Smaller on mobile */}
            <div className={`h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-full border-2 ${
              isDark 
                ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' 
                : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
            }`}>
              {specialist.avatar_url ? (
                <Image 
                  src={specialist.avatar_url} 
                  alt={specialist.full_name}
                  width={64}
                  height={64}
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

            {/* Name and Position - Compact on mobile */}
            <div className="flex-1 min-w-0">
              <h3 className={`mb-0.5 text-sm sm:text-base font-semibold truncate ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {specialist.full_name}
              </h3>
              {specialist.role_title && (
                <div className="flex items-center gap-1">
                  <UserCircle 
                    size={11} 
                    strokeWidth={2}
                    className={isDark ? 'text-white/50' : 'text-black/50'}
                  />
                  <p className={`text-xs truncate ${
                    isDark ? 'text-white/70' : 'text-black/70'
                  }`}>
                    {specialist.role_title}
                  </p>
                </div>
              )}
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
                    {COMPANY_EMAIL}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={12} strokeWidth={2} className={isDark ? 'text-white/50' : 'text-black/50'} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {COMPANY_PHONE}
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
          <div className={`flex items-center sm:border-l p-0 sm:p-3 ${
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
                  <span className="sm:hidden">მეტი</span>
                </button>
              </Link>
            ) : (
              <button
                className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium transition-all duration-300 rounded-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/50'
                    : 'bg-black/10 text-black hover:bg-black/20 focus-visible:ring-black/50'
                }`}
              >
                <span className="hidden sm:inline">{t.viewMore}</span>
                <span className="sm:hidden">მეტი</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout (default)
  return (
    <div 
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl'
          : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Avatar and Info Section */}
        <div className="mb-3 flex items-start gap-3">
          {/* Avatar - Large */}
          <div className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 ${
            isDark 
              ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' 
              : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
          }`}>
            {specialist.avatar_url ? (
              <Image 
                src={specialist.avatar_url} 
                alt={specialist.full_name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-xl font-bold ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}>
                {specialist.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            )}
          </div>

          {/* Name and Position */}
          <div className="flex-1">
            <h3 className={`mb-1 text-sm font-bold leading-tight ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              {specialist.full_name.split(' ').map((name, index) => (
                <div key={index}>{name}</div>
              ))}
            </h3>
            {specialist.role_title && (
              <div className="flex items-center gap-1.5">
                <UserCircle 
                  size={12} 
                  strokeWidth={2}
                  className={isDark ? 'text-white/50' : 'text-black/50'}
                />
                <p className={`text-xs ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}>
                  {specialist.role_title}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-4 space-y-2">
          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail 
              size={14} 
              strokeWidth={2}
              className={isDark ? 'text-white/50' : 'text-black/50'}
            />
            <a 
              href={`mailto:${COMPANY_EMAIL}`}
              className={`text-sm transition-colors hover:underline ${
                isDark ? 'text-white/70 hover:text-white/90' : 'text-black/70 hover:text-black/90'
              }`}
              title="Send email"
            >
              {COMPANY_EMAIL}
            </a>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-1.5">
            <Phone 
              size={12} 
              strokeWidth={2}
              className={isDark ? 'text-white/50' : 'text-black/50'}
            />
            <a
              href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`}
              className={`text-xs font-medium transition-colors hover:underline ${
                isDark ? 'text-white/70 hover:text-white/90' : 'text-black/70 hover:text-black/90'
              }`}
              title="Call phone"
            >
              {COMPANY_PHONE}
            </a>
          </div>
        </div>

        {/* Bio Section */}
        {specialist.bio && (
          <p className={`text-xs leading-relaxed line-clamp-3 ${
            isDark ? 'text-white/60' : 'text-black/60'
          }`}>
            {specialist.bio}
          </p>
        )}
      </div>

      {/* View More Button - Fixed at bottom */}
      <div className={`mt-auto border-t ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}>
        {specialist.slug ? (
          <Link href={`/${locale}/specialists/${specialist.slug}`}>
            <button
              className={`w-full px-4 py-2.5 text-xs font-medium transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isDark
                  ? 'text-white hover:bg-white/5 focus-visible:ring-white/50'
                  : 'text-black hover:bg-black/5 focus-visible:ring-black/50'
              }`}
            >
              {t.viewMore}
            </button>
          </Link>
        ) : (
          <button
            className={`w-full px-4 py-2.5 text-xs font-medium transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDark
                ? 'text-white hover:bg-white/5 focus-visible:ring-white/50'
                : 'text-black hover:bg-black/5 focus-visible:ring-black/50'
            }`}
          >
            {t.viewMore}
          </button>
        )}
      </div>
    </div>
  );
}

