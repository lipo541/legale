'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Building2, MapPin, Phone, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CompanyCardProps {
  full_name: string;
  company_slug: string;
  logo_url?: string | null;
  summary?: string | null;
  address?: string | null;
  phone_number?: string | null;
  website?: string | null;
}

export default function CompanyCard({
  full_name,
  company_slug,
  logo_url,
  summary,
  address,
  phone_number,
  website,
}: CompanyCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Link
      href={`/practices/${company_slug}`}
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
          ნახვა
        </div>
      </div>
    </Link>
  );
}
