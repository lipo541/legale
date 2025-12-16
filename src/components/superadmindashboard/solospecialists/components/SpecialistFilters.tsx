'use client'

import { memo, useMemo } from 'react'
import { 
  Search, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import CustomSelect from './CustomSelect'
import type { FiltersState, VerificationFilter, BlockFilter, InfoActivateFilter } from '../types'

// ============================================================================
// Specialist Filters - Memoized Component
// ============================================================================

interface SpecialistFiltersProps {
  isDark: boolean
  filters: FiltersState
  showFilters: boolean
  onToggleFilters: () => void
  onUpdateFilter: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void
  onClearFilters: () => void
}

const SpecialistFilters = memo(function SpecialistFilters({
  isDark,
  filters,
  showFilters,
  onToggleFilters,
  onUpdateFilter,
  onClearFilters
}: SpecialistFiltersProps) {
  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.verificationFilter !== 'ALL' ||
    filters.blockFilter !== 'ALL' ||
    filters.infoActivateFilter !== 'ALL' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== ''

  // Dropdown options
  const verificationOptions = useMemo(() => [
    { value: 'ALL', label: 'ვერიფიკაცია' },
    { value: 'verified', label: '✅ დადასტურებული' },
    { value: 'pending', label: '⏳ განხილვაში' },
    { value: 'rejected', label: '❌ უარყოფილი' },
    { value: 'unverified', label: '⚪ არადასტურებული' }
  ], [])

  const blockOptions = useMemo(() => [
    { value: 'ALL', label: 'სტატუსი' },
    { value: 'active', label: '✅ აქტიური' },
    { value: 'blocked', label: '🚫 დაბლოკილი' }
  ], [])

  return (
    <>
      {/* Filters Toggle */}
      <div className="mb-3">
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {showFilters ? 'ფილტრების დამალვა' : 'ფილტრების ჩვენება'}
          {hasActiveFilters && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] text-white">
              !
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={`mb-4 rounded-xl border p-2 sm:p-3 ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className={`absolute left-2 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`} />
              <input
                type="text"
                placeholder="ძებნა..."
                value={filters.searchTerm}
                onChange={(e) => onUpdateFilter('searchTerm', e.target.value)}
                style={{ fontSize: '12px' }}
                className={`w-full rounded-lg border py-1.5 sm:py-2 pl-7 sm:pl-8 pr-2 transition-colors ${
                  isDark 
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                    : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                }`}
              />
            </div>

            {/* Verification Status Filter */}
            <CustomSelect
              value={filters.verificationFilter}
              onChange={(value) => onUpdateFilter('verificationFilter', value as VerificationFilter)}
              options={verificationOptions}
              isDark={isDark}
            />

            {/* Block Status Filter */}
            <CustomSelect
              value={filters.blockFilter}
              onChange={(value) => onUpdateFilter('blockFilter', value as BlockFilter)}
              options={blockOptions}
              isDark={isDark}
            />

            {/* Date Filters Row - Mobile: stack, Desktop: side by side */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:col-span-2 lg:col-span-2">
              {/* Date From */}
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onUpdateFilter('dateFrom', e.target.value)}
                className={`w-full rounded-lg border px-1.5 py-1.5 sm:py-2 transition-colors ${
                  isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
                }`}
                style={isDark ? { colorScheme: 'dark', fontSize: '11px' } : { fontSize: '11px' }}
              />

              {/* Date To */}
              <div className="flex gap-1">
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onUpdateFilter('dateTo', e.target.value)}
                  className={`flex-1 min-w-0 rounded-lg border px-1.5 py-1.5 sm:py-2 transition-colors ${
                    isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark', fontSize: '11px' } : { fontSize: '11px' }}
                />
                <button
                  onClick={onClearFilters}
                  disabled={!hasActiveFilters}
                  className={`flex-shrink-0 rounded-lg border px-2 py-2 transition-colors ${
                    hasActiveFilters
                      ? isDark 
                        ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' 
                        : 'border-black/10 bg-black/5 hover:bg-black/10 text-black'
                      : 'opacity-50 cursor-not-allowed'
                  } ${isDark ? 'border-white/10' : 'border-black/10'}`}
                  title="ფილტრების გასუფთავება"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

export default SpecialistFilters
