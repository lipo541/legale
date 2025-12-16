'use client'

import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { CheckSquare, Square } from 'lucide-react'
import SpecialistRow, { SortIcon } from './SpecialistRow'
import type { 
  SoloSpecialistProfile, 
  Company, 
  LoadingStates, 
  SortColumn, 
  SortOrder 
} from '../types'

// ============================================================================
// Specialist Table - Memoized Component
// ============================================================================

interface SpecialistTableProps {
  isDark: boolean
  specialists: SoloSpecialistProfile[]
  companies: Company[]
  loading: LoadingStates
  
  // Selection
  selectedIds: Set<string>
  onSelectAll: () => void
  onSelectOne: (id: string) => void
  
  // Sorting
  sortBy: SortColumn
  sortOrder: SortOrder
  onSort: (column: SortColumn) => void
  
  // Expansion
  expandedId: string | null
  showTranslationsId: string | null
  onExpand: (id: string) => void
  onShowTranslations: (id: string) => void
  
  // Actions
  onToggleBlock: (specialist: SoloSpecialistProfile) => void
  onToggleInfoActivate: (specialist: SoloSpecialistProfile) => void
  onDelete: (id: string) => void
  onConvertToCompany: (specialistId: string, companyId: string, companyName: string) => void
  
  // Convert dropdown
  convertingDropdownId: string | null
  selectedCompanyId: string
  onToggleConvertDropdown: (id: string | null) => void
  onSelectCompany: (companyId: string) => void
  
  // Render functions for expanded content
  renderExpandedContent?: (specialist: SoloSpecialistProfile) => React.ReactNode
  renderTranslationsContent?: (specialist: SoloSpecialistProfile) => React.ReactNode
}

const SpecialistTable = memo(function SpecialistTable({
  isDark,
  specialists,
  companies,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  sortBy,
  sortOrder,
  onSort,
  expandedId,
  showTranslationsId,
  onExpand,
  onShowTranslations,
  onToggleBlock,
  onToggleInfoActivate,
  onDelete,
  onConvertToCompany,
  convertingDropdownId,
  selectedCompanyId,
  onToggleConvertDropdown,
  onSelectCompany,
  renderExpandedContent,
  renderTranslationsContent
}: SpecialistTableProps) {
  const allSelected = specialists.length > 0 && selectedIds.size === specialists.length

  return (
    <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className={`${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <tr>
              {/* Select All */}
              <th className="px-2 py-2 w-10">
                <button onClick={onSelectAll} className="p-1">
                  {allSelected ? (
                    <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
                  ) : (
                    <Square className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  )}
                </button>
              </th>

              {/* Name */}
              <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                <div 
                  className="flex items-center gap-1 cursor-pointer" 
                  onClick={() => onSort('full_name')}
                >
                  სპეციალისტი
                  <SortIcon column="full_name" currentSort={sortBy} sortOrder={sortOrder} />
                </div>
              </th>

              {/* Email */}
              <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                <div 
                  className="flex items-center gap-1 cursor-pointer" 
                  onClick={() => onSort('email')}
                >
                  ელფოსტა
                  <SortIcon column="email" currentSort={sortBy} sortOrder={sortOrder} />
                </div>
              </th>

              {/* Verification */}
              <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                <div 
                  className="flex items-center gap-1 cursor-pointer" 
                  onClick={() => onSort('verification_status')}
                >
                  ვერიფიკაცია
                  <SortIcon column="verification_status" currentSort={sortBy} sortOrder={sortOrder} />
                </div>
              </th>

              {/* Created */}
              <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                <div 
                  className="flex items-center gap-1 cursor-pointer" 
                  onClick={() => onSort('created_at')}
                >
                  რეგისტრაცია
                  <SortIcon column="created_at" currentSort={sortBy} sortOrder={sortOrder} />
                </div>
              </th>

              {/* Actions */}
              <th className={`px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                მოქმედებები
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
            {specialists.map((specialist) => (
              <SpecialistRow
                key={specialist.id}
                specialist={specialist}
                isDark={isDark}
                isSelected={selectedIds.has(specialist.id)}
                isExpanded={expandedId === specialist.id}
                showTranslations={showTranslationsId === specialist.id}
                companies={companies}
                loading={loading}
                selectedCompanyId={selectedCompanyId}
                onSelect={onSelectOne}
                onExpand={onExpand}
                onShowTranslations={onShowTranslations}
                onToggleBlock={onToggleBlock}
                onToggleInfoActivate={onToggleInfoActivate}
                onDelete={onDelete}
                onConvertToCompany={onConvertToCompany}
                onSelectCompany={onSelectCompany}
                convertingDropdownId={convertingDropdownId}
                onToggleConvertDropdown={onToggleConvertDropdown}
                translationsContent={renderTranslationsContent?.(specialist)}
                isMobileView={false}
              >
                {renderExpandedContent?.(specialist)}
              </SpecialistRow>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {/* Mobile Select All */}
        <div className={`flex items-center justify-between px-3 py-2 ${isDark ? 'bg-white/5 border-b border-white/10' : 'bg-black/5 border-b border-black/10'}`}>
          <button onClick={onSelectAll} className="flex items-center gap-2">
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-500" />
            ) : (
              <Square className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
            )}
            <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              ყველას მონიშვნა
            </span>
          </button>
          <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {selectedIds.size > 0 ? `${selectedIds.size} მონიშნული` : ''}
          </span>
        </div>

        {/* Mobile Cards */}
        <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
          {specialists.map((specialist) => (
            <SpecialistRow
              key={specialist.id}
              specialist={specialist}
              isDark={isDark}
              isSelected={selectedIds.has(specialist.id)}
              isExpanded={expandedId === specialist.id}
              showTranslations={showTranslationsId === specialist.id}
              companies={companies}
              loading={loading}
              selectedCompanyId={selectedCompanyId}
              onSelect={onSelectOne}
              onExpand={onExpand}
              onShowTranslations={onShowTranslations}
              onToggleBlock={onToggleBlock}
              onToggleInfoActivate={onToggleInfoActivate}
              onDelete={onDelete}
              onConvertToCompany={onConvertToCompany}
              onSelectCompany={onSelectCompany}
              convertingDropdownId={convertingDropdownId}
              onToggleConvertDropdown={onToggleConvertDropdown}
              translationsContent={renderTranslationsContent?.(specialist)}
              isMobileView={true}
            >
              {renderExpandedContent?.(specialist)}
            </SpecialistRow>
          ))}
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  isDark: boolean
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

export const Pagination = memo(function Pagination({
  isDark,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  return (
    <div className={`mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-2 ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}>
      {/* Items per page - on mobile: full width, on desktop: inline */}
      <div className="flex items-center justify-between sm:justify-start gap-2">
        <span className={`text-[11px] sm:text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          <span className="hidden sm:inline">თითო გვერდზე:</span>
          <span className="sm:hidden">ჩვენება:</span>
        </span>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className={`appearance-none cursor-pointer rounded-md border px-3 py-1.5 sm:px-2 sm:py-1 pr-7 sm:pr-6 text-[11px] sm:text-[10px] ${
              isDark ? 'border-white/10 bg-zinc-800 text-white' : 'border-black/10 bg-white text-black'
            }`}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <ChevronDown className={`absolute right-2 sm:right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isDark ? 'text-white/50' : 'text-black/50'}`} />
        </div>
      </div>

      {/* Pagination controls - on mobile: centered, on desktop: right */}
      <div className="flex items-center justify-center sm:justify-end gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-md border px-3 py-1.5 sm:px-2 sm:py-1 text-[11px] sm:text-[10px] transition-colors ${
            currentPage === 1
              ? 'opacity-50 cursor-not-allowed'
              : isDark
              ? 'border-white/10 bg-white/5 hover:bg-white/10'
              : 'border-black/10 bg-black/5 hover:bg-black/10'
          }`}
        >
          წინა
        </button>
        <span className={`text-[11px] sm:text-[10px] min-w-[50px] text-center ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          className={`rounded-md border px-3 py-1.5 sm:px-2 sm:py-1 text-[11px] sm:text-[10px] transition-colors ${
            currentPage >= totalPages || totalPages === 0
              ? 'opacity-50 cursor-not-allowed'
              : isDark
              ? 'border-white/10 bg-white/5 hover:bg-white/10'
              : 'border-black/10 bg-black/5 hover:bg-black/10'
          }`}
        >
          შემდეგი
        </button>
      </div>
    </div>
  )
})

export default SpecialistTable
