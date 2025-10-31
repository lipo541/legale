'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Search, SlidersHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { companiesTranslations } from '@/translations/companies';

interface CompanySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  isFilterOpen: boolean;
}

export default function CompanySearch({
  searchTerm,
  onSearchChange,
  onFilterClick,
  isFilterOpen,
}: CompanySearchProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ka';
  const t = companiesTranslations[locale as keyof typeof companiesTranslations] || companiesTranslations.ka;

  return (
    <div className="flex w-full gap-2">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
            isDark ? 'text-white/30' : 'text-black/30'
          }`}
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAriaLabel}
          aria-describedby="search-description"
          className={`w-full rounded-lg border py-2 pl-10 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isDark
              ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-white/10 focus:ring-white/20'
              : 'border-black/10 bg-white text-black placeholder:text-black/40 hover:border-black/20 focus:border-black/30 focus:bg-gray-50 focus:ring-black/20'
          }`}
        />
        <span id="search-description" className="sr-only">
          {t.searchPlaceholder}
        </span>
      </div>

      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        aria-label={t.filterButton}
        aria-expanded={isFilterOpen}
        aria-controls="company-filters"
        className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isFilterOpen
            ? isDark
              ? 'border-white bg-white text-black focus-visible:ring-white/20'
              : 'border-black bg-black text-white focus-visible:ring-black/20'
            : isDark
            ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 focus-visible:ring-white/20'
            : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-gray-50 focus-visible:ring-black/20'
        }`}
      >
        <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden sm:inline">{t.filterButton}</span>
      </button>
    </div>
  );
}
