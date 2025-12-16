// ============================================================================
// CompanyFilters Component - Optimized
// ============================================================================

import { memo } from 'react'
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import type { CompanyFilters as FiltersType, VerificationFilter, BlockFilter } from '../types'
import CustomSelect from './CustomSelect'

interface CompanyFiltersProps {
  filters: FiltersType
  updateFilter: <K extends keyof FiltersType>(key: K, value: FiltersType[K]) => void
  clearFilters: () => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  isDark: boolean
  totalCount: number
  filteredCount: number
}

const verificationOptions = [
  { value: 'ALL', label: 'ვერიფიკაცია' },
  { value: 'verified', label: '✅ ვერიფიცირებული' },
  { value: 'unverified', label: '⚪ არავერიფიცირებული' },
  { value: 'pending', label: '⏳ მოლოდინში' },
  { value: 'rejected', label: '❌ უარყოფილი' }
]

const blockOptions = [
  { value: 'ALL', label: 'სტატუსი' },
  { value: 'active', label: '✅ აქტიური' },
  { value: 'blocked', label: '🚫 დაბლოკილი' }
]

function CompanyFilters({
  filters,
  updateFilter,
  clearFilters,
  showFilters,
  setShowFilters,
  isDark,
  totalCount,
  filteredCount
}: CompanyFiltersProps) {
  const hasActiveFilters = 
    filters.search ||
    filters.verification !== 'ALL' ||
    filters.blocked !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo

  return (
    <div className="space-y-3">
      {/* Filters Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? 'ფილტრების დამალვა' : 'ფილტრების ჩვენება'}
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
              !
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              isDark
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-red-600 hover:bg-red-500/10'
            }`}
          >
            <RefreshCw className="h-3 w-3" />
            გასუფთავება
          </button>
        )}
        
        <span className={`ml-auto text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          ნაპოვნია: <strong className={isDark ? 'text-white/60' : 'text-black/60'}>{filteredCount}</strong> / {totalCount}
        </span>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className={`absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="text"
                  placeholder="ძებნა..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className={`w-full rounded-lg border py-1.5 pl-8 pr-8 text-xs outline-none transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/20'
                      : 'border-black/10 bg-black/5 text-black placeholder:text-black/40 focus:border-black/20'
                  }`}
                />
                {filters.search && (
                  <button
                    onClick={() => updateFilter('search', '')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Verification Filter */}
            <CustomSelect
              value={filters.verification}
              onChange={(val) => updateFilter('verification', val as VerificationFilter)}
              options={verificationOptions}
              isDark={isDark}
            />
            
            {/* Block Filter */}
            <CustomSelect
              value={filters.blocked}
              onChange={(val) => updateFilter('blocked', val as BlockFilter)}
              options={blockOptions}
              isDark={isDark}
            />
            
            {/* Date From */}
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20 [color-scheme:dark]'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
            
            {/* Date To */}
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white focus:border-white/20 [color-scheme:dark]'
                  : 'border-black/10 bg-black/5 text-black focus:border-black/20'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(CompanyFilters)
