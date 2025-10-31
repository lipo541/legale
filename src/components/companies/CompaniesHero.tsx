'use client';

import { Building2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { companiesTranslations } from '@/translations/companies';

interface CompaniesHeroProps {
  locale: string;
  totalCompanies: number;
}

export default function CompaniesHero({ locale, totalCompanies }: CompaniesHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;

  return (
    <div className="mb-8 text-center">
      {/* Icon Decoration */}
      <div className="mb-4 flex justify-center">
        <div
          className={`rounded-full p-3 transition-all duration-300 ${
            isDark ? 'bg-white/5' : 'bg-black/5'
          }`}
        >
          <Building2
            className={`transition-colors duration-300 ${
              isDark ? 'text-white/40' : 'text-black/40'
            }`}
            size={32}
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Title */}
      <h1
        className={`mb-3 text-2xl font-bold transition-colors duration-300 sm:text-3xl md:text-4xl ${
          isDark ? 'text-white' : 'text-black'
        }`}
      >
        {t.title}
      </h1>

      {/* Subtitle */}
      <p
        className={`mx-auto max-w-2xl text-sm transition-colors duration-300 sm:text-base ${
          isDark ? 'text-white/60' : 'text-black/60'
        }`}
      >
        {t.subtitle}
      </p>

      {/* Statistics */}
      <div
        className={`mt-4 text-xs transition-colors duration-300 ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`}
      >
        <span className={`font-bold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {totalCompanies}
        </span>{' '}
        {t.companiesFound}
      </div>
    </div>
  );
}
