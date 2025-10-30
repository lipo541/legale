'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { Mail, Phone, Building2 } from 'lucide-react';

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
}

export default function CompanySpecialistCard({ specialist }: CompanySpecialistCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Static contact info - same for all specialists
  const COMPANY_EMAIL = 'contact@legalsandbox.ge';
  const COMPANY_PHONE = '+995 555 123 456';

  if (!specialist) return null;

  return (
    <div 
      className={`group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-white/20'
          : 'border-black/10 bg-white hover:border-black/20 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6 pb-0">
        {/* Avatar and Name Section - Horizontal Layout */}
        <div className="mb-5 flex items-start gap-4">
          {/* Avatar */}
          <div className={`h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-2 ${
            isDark 
              ? 'border-white/10 bg-white/5' 
              : 'border-black/10 bg-gray-100'
          }`}>
            {specialist.avatar_url ? (
              <img 
                src={specialist.avatar_url} 
                alt={specialist.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-2xl font-bold ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`}>
                {specialist.full_name.split(' ').map((n: string) => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Name and Position */}
          <div className="flex-1">
            <h3 className={`mb-2 text-base font-semibold leading-relaxed ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              {specialist.full_name.split(' ').map((name, index) => (
                <div key={index}>{name}</div>
              ))}
            </h3>
            {specialist.role_title && (
              <p className={`mb-2 text-xs ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}>
                {specialist.role_title}
              </p>
            )}
            {/* Company with icon */}
            <div className="flex items-center gap-1.5">
              <Building2 
                size={13} 
                strokeWidth={2}
                className={isDark ? 'text-white/50' : 'text-black/50'}
              />
              {specialist.company_slug ? (
                <Link 
                  href={`/companies/${specialist.company_slug}`}
                  className={`text-xs transition-colors hover:underline ${
                    isDark ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
                  }`}
                >
                  {specialist.company}
                </Link>
              ) : (
                <span className={`text-xs ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  {specialist.company}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information - Single Line */}
        <div className="mb-5 space-y-2">
          {/* Email - Static company email */}
          <div className="flex items-center gap-2">
            <Mail 
              size={13} 
              strokeWidth={2}
              className={isDark ? 'text-white/50' : 'text-black/50'}
            />
            <span className={`text-xs ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {COMPANY_EMAIL}
            </span>
          </div>

          {/* Phone - Static company phone */}
          <div className="flex items-center gap-2">
            <Phone 
              size={13} 
              strokeWidth={2}
              className={isDark ? 'text-white/50' : 'text-black/50'}
            />
            <span className={`text-xs font-medium ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {COMPANY_PHONE}
            </span>
          </div>
        </div>

        {/* Bio Section */}
        {specialist.bio && (
          <div className="mb-5">
            <p className={`text-xs leading-relaxed ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              {specialist.bio}
            </p>
          </div>
        )}
      </div>

      {/* View More Button - Fixed at bottom */}
      <div className={`mt-auto border-t ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}>
        {specialist.slug ? (
          <Link href={`/specialists/${specialist.slug}`}>
            <button
              className={`w-full px-6 py-3 text-xs font-medium transition-all duration-300 ${
                isDark
                  ? 'text-white hover:bg-white/5'
                  : 'text-black hover:bg-black/5'
              }`}
            >
              იხილეთ მეტი
            </button>
          </Link>
        ) : (
          <button
            className={`w-full px-6 py-3 text-xs font-medium transition-all duration-300 ${
              isDark
                ? 'text-white hover:bg-white/5'
                : 'text-black hover:bg-black/5'
            }`}
          >
            იხილეთ მეტი
          </button>
        )}
      </div>
    </div>
  );
}
