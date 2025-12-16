'use client'

import { memo, useState, useRef, useEffect } from 'react'
import { Search, Filter, ChevronDown, Calendar, X, Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { RequestFilters as FilterType, RequestTab } from '../types'

interface RequestFiltersProps {
  filters: FilterType
  updateFilter: (key: keyof FilterType, value: string) => void
  resetFilters: () => void
  activeFiltersCount: number
  activeTab: RequestTab
}

interface SelectOption {
  value: string
  label: string
}

function CustomSelect({ 
  value, 
  options, 
  onChange, 
  isDark 
}: { 
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  isDark: boolean 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label || 'აირჩიეთ'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
          isDark
            ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
            : 'border-black/10 bg-black/5 text-black hover:bg-black/10'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full rounded-lg border shadow-lg ${
          isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-white'
        }`}>
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors first:rounded-t-lg last:rounded-b-lg ${
                value === option.value
                  ? isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                  : isDark ? 'text-white/70 hover:bg-white/5' : 'text-black/70 hover:bg-black/5'
              }`}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RequestFilters({ filters, updateFilter, resetFilters, activeFiltersCount, activeTab }: RequestFiltersProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showFilters, setShowFilters] = useState(false)

  const accessStatusOptions: SelectOption[] = [
    { value: 'ALL', label: 'ყველა სტატუსი' },
    { value: 'PENDING', label: 'მოლოდინში' },
    { value: 'APPROVED', label: 'დამტკიცებული' },
    { value: 'REJECTED', label: 'უარყოფილი' }
  ]

  const verificationStatusOptions: SelectOption[] = [
    { value: 'ALL', label: 'ყველა სტატუსი' },
    { value: 'pending', label: 'მოლოდინში' },
    { value: 'verified', label: 'ვერიფიცირებული' },
    { value: 'rejected', label: 'უარყოფილი' }
  ]

  const statusOptions = activeTab === 'access' ? accessStatusOptions : verificationStatusOptions
  const currentStatusValue = activeTab === 'access' ? filters.statusFilter : filters.verificationStatusFilter
  const statusFilterKey = activeTab === 'access' ? 'statusFilter' : 'verificationStatusFilter'

  return (
    <div className="mb-4">
      {/* Toggle + Search Row */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showFilters || activeFiltersCount > 0
              ? isDark
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDark
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-black/10 text-black hover:bg-black/20'
          }`}
        >
          <Filter className="h-3 w-3" />
          <span className="hidden sm:inline">ფილტრები</span>
          {activeFiltersCount > 0 && (
            <span className={`ml-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
              showFilters || activeFiltersCount > 0
                ? isDark ? 'bg-black/20 text-black' : 'bg-white/20 text-white'
                : isDark ? 'bg-white/20' : 'bg-black/20'
            }`}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Search */}
        <div className={`relative flex-1 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <Search className={`absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className={`w-full rounded-lg bg-transparent py-1.5 pl-8 pr-3 text-xs outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={resetFilters}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
              isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-500/10'
            }`}
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">გასუფთავება</span>
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className={`grid gap-2 sm:grid-cols-2 lg:grid-cols-4 p-3 rounded-lg border ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          {/* Status Filter */}
          <div>
            <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სტატუსი
            </label>
            <CustomSelect
              value={currentStatusValue}
              options={statusOptions}
              onChange={(value) => updateFilter(statusFilterKey as keyof FilterType, value)}
              isDark={isDark}
            />
          </div>

          {/* Date From */}
          <div>
            <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              თარიღიდან
            </label>
            <div className={`relative rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <Calendar className={`absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className={`w-full rounded-lg bg-transparent py-1.5 pl-7 pr-2 text-xs outline-none ${
                  isDark ? 'text-white [color-scheme:dark]' : 'text-black'
                }`}
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              თარიღამდე
            </label>
            <div className={`relative rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <Calendar className={`absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className={`w-full rounded-lg bg-transparent py-1.5 pl-7 pr-2 text-xs outline-none ${
                  isDark ? 'text-white [color-scheme:dark]' : 'text-black'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(RequestFilters)
