'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Search, SlidersHorizontal } from 'lucide-react';

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
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ძებნა..."
          className={`w-full rounded-lg border py-2 pl-10 pr-3 text-sm transition-all duration-300 placeholder:text-sm focus:outline-none ${
            isDark
              ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 hover:border-white/20 focus:border-white/30 focus:bg-white/10'
              : 'border-black/10 bg-white text-black placeholder:text-black/40 hover:border-black/20 focus:border-black/30 focus:bg-gray-50'
          }`}
        />
      </div>

      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-300 ${
          isFilterOpen
            ? isDark
              ? 'border-white bg-white text-black'
              : 'border-black bg-black text-white'
            : isDark
            ? 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
            : 'border-black/10 bg-white text-black hover:border-black/20 hover:bg-gray-50'
        }`}
      >
        <SlidersHorizontal size={16} strokeWidth={1.5} />
        <span className="hidden sm:inline">ფილტრაცია</span>
      </button>
    </div>
  );
}
