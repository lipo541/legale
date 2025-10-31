'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Phone, Building2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface CompanySpecialist {
  id: string;
  full_name: string;
  role_title: string | null;
  company: string;
  company_slug?: string;
  slug?: string;
  bio: string | null;
  avatar_url?: string | null;
}

interface CompanySpecialistCardProps {
  specialist?: CompanySpecialist;
  viewMode?: 'grid' | 'list';
}

export default function CompanySpecialistCard({ specialist, viewMode = 'grid' }: CompanySpecialistCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = useParams();
  const locale = params?.locale || 'ka';

  const COMPANY_EMAIL = 'contact@legalsandbox.ge';
  const COMPANY_PHONE = '+995 555 123 456';

  if (!specialist) return null;

  // List view - compact horizontal
  if (viewMode === 'list') {
    return (
      <div 
        className={`group relative flex overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.005] ${
          isDark
            ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-xl'
            : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-lg'
        }`}
      >
        <div className="flex w-full flex-col sm:flex-row">
          {/* Left: Avatar + Name */}
          <div className="flex items-center gap-3 p-4 sm:w-64">
            <div className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border ${
              isDark ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
            }`}>
              {specialist.avatar_url ? (
                <img src={specialist.avatar_url} alt={specialist.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center text-base font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {specialist.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {specialist.full_name}
              </h3>
              {specialist.role_title && (
                <p className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-black/60'}`}>{specialist.role_title}</p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 size={10} className={isDark ? 'text-white/40' : 'text-black/40'} />
                {specialist.company_slug ? (
                  <Link href={`/${locale}/companies/${specialist.company_slug}`} className={`text-xs font-medium transition-colors hover:underline truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {specialist.company}
                  </Link>
                ) : (
                  <span className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>{specialist.company}</span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Bio */}
          <div className="flex-1 border-t p-4 sm:border-l sm:border-t-0 border-white/10 min-w-0">
            {specialist.bio ? (
              <p className={`text-xs leading-snug line-clamp-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>{specialist.bio}</p>
            ) : (
              <p className={`text-xs italic ${isDark ? 'text-white/30' : 'text-black/30'}`}>No description</p>
            )}
          </div>

          {/* Right: Action */}
          <div className={`flex items-center border-t p-3 sm:border-l sm:border-t-0 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            {specialist.slug ? (
              <Link href={`/${locale}/specialists/${specialist.slug}`}>
                <button className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium transition-all rounded-lg ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                  იხილეთ მეტი
                </button>
              </Link>
            ) : (
              <button className={`whitespace-nowrap px-4 py-1.5 text-xs font-medium transition-all rounded-lg ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-black hover:bg-black/20'}`}>
                იხილეთ მეტი
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view - compact vertical
  return (
    <div 
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-2xl'
          : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Header: Avatar + Name */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <div className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border ${
            isDark ? 'border-white/10 bg-gradient-to-br from-white/10 to-white/5' : 'border-black/10 bg-gradient-to-br from-gray-100 to-gray-50'
          }`}>
            {specialist.avatar_url ? (
              <img src={specialist.avatar_url} alt={specialist.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-lg font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                {specialist.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold leading-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {specialist.full_name}
            </h3>
            {specialist.role_title && (
              <p className={`text-xs mb-1 line-clamp-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{specialist.role_title}</p>
            )}
            <div className="flex items-center gap-1">
              <Building2 size={10} className={isDark ? 'text-white/40' : 'text-black/40'} />
              {specialist.company_slug ? (
                <Link href={`/${locale}/companies/${specialist.company_slug}`} className={`text-xs font-medium transition-colors hover:underline truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  {specialist.company}
                </Link>
              ) : (
                <span className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>{specialist.company}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact - Compact */}
      <div className={`px-4 py-2 border-y my-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-center justify-between text-xs">
          <a href={`mailto:${COMPANY_EMAIL}`} className={`flex items-center gap-1 transition-colors hover:underline ${isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'}`} title="Email">
            <Mail size={10} />
            <span>Email</span>
          </a>
          <span className={isDark ? 'text-white/20' : 'text-black/20'}>•</span>
          <a href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`} className={`flex items-center gap-1 transition-colors hover:underline ${isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'}`} title="Phone">
            <Phone size={10} />
            <span>Tel</span>
          </a>
        </div>
      </div>

      {/* Bio */}
      <div className="px-4 pb-3 flex-1">
        {specialist.bio ? (
          <p className={`text-xs leading-snug line-clamp-2 ${isDark ? 'text-white/50' : 'text-black/50'}`}>{specialist.bio}</p>
        ) : (
          <p className={`text-xs italic ${isDark ? 'text-white/30' : 'text-black/30'}`}>No description available</p>
        )}
      </div>

      {/* Button */}
      <div className={`border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        {specialist.slug ? (
          <Link href={`/${locale}/specialists/${specialist.slug}`}>
            <button className={`w-full px-4 py-2 text-xs font-medium transition-all ${isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'}`}>
              იხილეთ მეტი
            </button>
          </Link>
        ) : (
          <button className={`w-full px-4 py-2 text-xs font-medium transition-all ${isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'}`}>
            იხილეთ მეტი
          </button>
        )}
      </div>
    </div>
  );
}
