'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Building2, MapPin, Phone, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { companiesTranslations } from '@/translations/companies';

interface CompanyCardProps {
  full_name: string;
  company_slug: string;
  logo_url?: string | null;
  summary?: string | null;
  address?: string | null;
  phone_number?: string | null;
  website?: string | null;
  viewMode?: 'grid' | 'list';
}

export default function CompanyCard({
  full_name,
  company_slug,
  logo_url,
  summary,
  address,
  phone_number,
  website,
  viewMode = 'grid',
}: CompanyCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;

  // List view layout
  if (viewMode === 'list') {
    return (
      <Link
        href={`/${locale}/companies/${company_slug}`}
        className={`group relative flex overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
          isDark
            ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl'
            : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl'
        }`}
      >
        {/* Compact mobile layout, full desktop layout */}
        <div className="flex w-full items-center gap-3 p-3 sm:gap-0 sm:p-0">
          {/* Left: Logo and Name - Always visible */}
          <div className="flex flex-1 items-center gap-3 sm:w-1/3 sm:gap-4 sm:p-4">
            {/* Logo - Smaller on mobile */}
            <div className={`h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-full border-2 ${
              isDark 
                ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' 
                : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
            }`}>
              {logo_url ? (
                <Image 
                  src={logo_url} 
                  alt={full_name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover p-1"
                  loading="lazy"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-sm sm:text-lg font-bold ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}>
                  <Building2 size={20} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Name - Compact on mobile */}
            <div className="flex-1 min-w-0">
              <h3 className={`mb-0.5 text-sm sm:text-base font-semibold truncate ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {full_name}
              </h3>
              {summary && (
                <p className={`text-xs line-clamp-1 sm:line-clamp-2 ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}>
                  {summary}
                </p>
              )}
            </div>
          </div>

          {/* Middle: Contact Info - Hidden on mobile */}
          <div className={`hidden sm:flex sm:flex-1 border-l p-4 ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="flex-1 space-y-1.5">
              {/* Address */}
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin size={12} strokeWidth={2} className={isDark ? 'text-white/50 flex-shrink-0 mt-0.5' : 'text-black/50 flex-shrink-0 mt-0.5'} />
                  <span className={`text-xs line-clamp-1 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {address}
                  </span>
                </div>
              )}
              
              {/* Phone */}
              {phone_number && (
                <div className="flex items-center gap-2">
                  <Phone size={12} strokeWidth={2} className={isDark ? 'text-white/50' : 'text-black/50'} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {phone_number}
                  </span>
                </div>
              )}

              {/* Website */}
              {website && (
                <div className="flex items-center gap-2">
                  <Globe size={12} strokeWidth={2} className={isDark ? 'text-white/50' : 'text-black/50'} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    ვებსაიტი
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Button */}
          <div className={`flex items-center sm:border-l p-0 sm:p-4 ${
            isDark ? 'sm:border-white/10' : 'sm:border-black/10'
          }`}>
            <div
              className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isDark
                  ? 'bg-white/10 text-white group-hover:bg-white group-hover:text-black'
                  : 'bg-black/10 text-black group-hover:bg-black group-hover:text-white'
              }`}
            >
              {t.viewProfile}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view layout (existing code)

  return (
    <Link
      href={`/${locale}/companies/${company_slug}`}
      className={`group relative block overflow-hidden rounded-lg border transition-all duration-300 ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          : 'border-black/10 bg-white hover:border-black/20 hover:bg-gray-50 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Logo Section */}
      <div className={`flex flex-col items-center justify-center border-b p-2.5 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        {logo_url ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white">
            <Image
              src={logo_url}
              alt={full_name}
              fill
              className="object-cover p-1"
            />
          </div>
        ) : (
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
          >
            <Building2
              className={isDark ? 'text-white/30' : 'text-black/30'}
              size={24}
              strokeWidth={1.5}
            />
          </div>
        )}
        
        {/* Company Name - moved here */}
        <h3
          className={`mt-2 text-base font-bold line-clamp-1 text-center transition-colors ${
            isDark ? 'text-white group-hover:text-blue-400' : 'text-black group-hover:text-blue-600'
          }`}
        >
          {full_name}
        </h3>
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-3 h-[200px]">
        {/* Summary */}
        <div className="mb-2">
          {summary && (
            <p
              className={`line-clamp-2 text-xs leading-relaxed ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}
            >
              {summary}
            </p>
          )}
        </div>

        {/* Info Items - flex-grow to push button down */}
        <div className="space-y-1.5 mb-2 flex-grow">
          {address && (
            <div className="flex items-start gap-2">
              <MapPin
                className={`flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`}
                size={14}
                strokeWidth={1.5}
              />
              <span
                className={`text-xs leading-tight line-clamp-2 ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}
              >
                {address}
              </span>
            </div>
          )}

          {phone_number && (
            <div className="flex items-center gap-2">
              <Phone
                className={`flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`}
                size={14}
                strokeWidth={1.5}
              />
              <span
                className={`text-xs ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}
              >
                {phone_number}
              </span>
            </div>
          )}

          {website && (
            <div className="flex items-center gap-2">
              <Globe
                className={`flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`}
                size={14}
                strokeWidth={1.5}
              />
              <span
                className={`text-xs ${
                  isDark ? 'text-white/50' : 'text-black/50'
                }`}
              >
                ვებსაიტი
              </span>
            </div>
          )}
        </div>

        {/* View Button - stays at bottom */}
        <div
          className={`flex items-center justify-center rounded py-2 text-xs font-medium transition-all ${
            isDark
              ? 'bg-white/10 text-white group-hover:bg-white group-hover:text-black'
              : 'bg-black/10 text-black group-hover:bg-black group-hover:text-white'
          }`}
        >
          {t.viewProfile}
        </div>
      </div>
    </Link>
  );
}
