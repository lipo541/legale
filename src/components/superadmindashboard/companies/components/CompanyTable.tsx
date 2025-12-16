// ============================================================================
// CompanyTable Component
// ============================================================================

import { memo, Fragment } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CompanyProfile, SortColumn, SortOrder } from '../types'
import CompanyRow, { CompanyCard, SortIcon } from './CompanyRow'
import CustomSelect from './CustomSelect'

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  isDark: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  isDark
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const pageOptions = [
    { value: '10', label: '10 / გვერდი' },
    { value: '20', label: '20 / გვერდი' },
    { value: '50', label: '50 / გვერდი' },
    { value: '100', label: '100 / გვერდი' }
  ]

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
      isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'
    }`}>
      <div className="flex items-center gap-4">
        <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {startItem}-{endItem} / {totalItems}
        </span>
        <CustomSelect
          value={itemsPerPage.toString()}
          onChange={(val) => onItemsPerPageChange(parseInt(val))}
          options={pageOptions}
          isDark={isDark}
          className="w-32"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-lg p-2 transition-colors disabled:opacity-30 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <ChevronLeft className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number
            if (totalPages <= 5) {
              page = i + 1
            } else if (currentPage <= 3) {
              page = i + 1
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i
            } else {
              page = currentPage - 2 + i
            }
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500/10 text-emerald-600'
                    : isDark
                    ? 'text-white/60 hover:bg-white/10'
                    : 'text-black/60 hover:bg-black/5'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`rounded-lg p-2 transition-colors disabled:opacity-30 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <ChevronRight className={`h-5 w-5 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Company Table Props
// ============================================================================

interface CompanyTableProps {
  companies: CompanyProfile[]
  expandedId: string | null
  selectedIds: Set<string>
  showTranslationsId: string | null
  sortBy: SortColumn
  sortOrder: SortOrder
  blockingId: string | null
  verifyingId: string | null
  deletingId: string | null
  onSort: (column: SortColumn) => void
  onToggleExpand: (id: string) => void
  onSelectAll: () => void
  onSelectOne: (id: string) => void
  onToggleTranslations: (id: string) => void
  onToggleBlock: (company: CompanyProfile) => void
  onToggleVerification: (company: CompanyProfile) => void
  onDelete: (id: string) => void
  renderExpandedContent: (company: CompanyProfile) => React.ReactNode
  renderTranslationsContent: (company: CompanyProfile) => React.ReactNode
  isDark: boolean
}

// ============================================================================
// Company Table Component
// ============================================================================

function CompanyTable({
  companies,
  expandedId,
  selectedIds,
  showTranslationsId,
  sortBy,
  sortOrder,
  blockingId,
  verifyingId,
  deletingId,
  onSort,
  onToggleExpand,
  onSelectAll,
  onSelectOne,
  onToggleTranslations,
  onToggleBlock,
  onToggleVerification,
  onDelete,
  renderExpandedContent,
  renderTranslationsContent,
  isDark
}: CompanyTableProps) {
  const allSelected = companies.length > 0 && selectedIds.size === companies.length

  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden lg:block overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <table className="w-full">
          <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
            <tr>
              <th className="px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="px-2 py-2 text-left">
                <button
                  onClick={() => onSort('full_name')}
                  className={`group flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}
                >
                  კომპანია
                  <SortIcon column="full_name" sortBy={sortBy} sortOrder={sortOrder} isDark={isDark} />
                </button>
              </th>
              <th className="px-2 py-2 text-left">
                <button
                  onClick={() => onSort('email')}
                  className={`group flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}
                >
                  ელფოსტა
                  <SortIcon column="email" sortBy={sortBy} sortOrder={sortOrder} isDark={isDark} />
                </button>
              </th>
              <th className="px-2 py-2 text-left">
                <button
                  onClick={() => onSort('verification_status')}
                  className={`group flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}
                >
                  სტატუსი
                  <SortIcon column="verification_status" sortBy={sortBy} sortOrder={sortOrder} isDark={isDark} />
                </button>
              </th>
              <th className="px-2 py-2 text-left">
                <button
                  onClick={() => onSort('created_at')}
                  className={`group flex items-center gap-1 text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}
                >
                  რეგისტრაცია
                  <SortIcon column="created_at" sortBy={sortBy} sortOrder={sortOrder} isDark={isDark} />
                </button>
              </th>
              <th className={`px-2 py-2 text-right text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                მოქმედებები
              </th>
            </tr>
          </thead>
          <tbody className={isDark ? 'bg-black' : 'bg-white'}>
            {companies.map(company => (
              <Fragment key={company.id}>
                <CompanyRow
                  company={company}
                  isExpanded={expandedId === company.id}
                  isSelected={selectedIds.has(company.id)}
                  showTranslations={showTranslationsId === company.id}
                  blockingId={blockingId}
                  verifyingId={verifyingId}
                  deletingId={deletingId}
                  onToggleExpand={() => onToggleExpand(company.id)}
                  onToggleSelect={() => onSelectOne(company.id)}
                  onToggleTranslations={() => onToggleTranslations(company.id)}
                  onToggleBlock={() => onToggleBlock(company)}
                  onToggleVerification={() => onToggleVerification(company)}
                  onDelete={() => onDelete(company.id)}
                  isDark={isDark}
                />
                
                {/* Expanded Details Row */}
                {expandedId === company.id && (
                  <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                    <td colSpan={6} className="px-2 py-3">
                      {renderExpandedContent(company)}
                    </td>
                  </tr>
                )}
                
                {/* Translations Row */}
                {showTranslationsId === company.id && (
                  <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                    <td colSpan={6} className="px-2 py-3">
                      {renderTranslationsContent(company)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={`lg:hidden rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <div className={`flex items-center justify-between px-3 py-2 ${
          isDark ? 'bg-white/5' : 'bg-black/5'
        }`}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className={`text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ყველას მონიშვნა
            </span>
          </label>
          <span className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            {companies.length} კომპანია
          </span>
        </div>
        
        <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
        {companies.map(company => (
          <div key={company.id}>
            <CompanyCard
              company={company}
              isExpanded={expandedId === company.id}
              isSelected={selectedIds.has(company.id)}
              showTranslations={showTranslationsId === company.id}
              blockingId={blockingId}
              verifyingId={verifyingId}
              deletingId={deletingId}
              onToggleSelect={() => onSelectOne(company.id)}
              onToggleTranslations={() => onToggleTranslations(company.id)}
              onToggleBlock={() => onToggleBlock(company)}
              onToggleVerification={() => onToggleVerification(company)}
              onDelete={() => onDelete(company.id)}
              onView={() => onToggleExpand(company.id)}
              isDark={isDark}
            />
            
            {/* Mobile Expanded Content */}
            {expandedId === company.id && (
              <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                {renderExpandedContent(company)}
              </div>
            )}
            
            {/* Mobile Translations Content */}
            {showTranslationsId === company.id && (
              <div className={`p-3 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                {renderTranslationsContent(company)}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </>
  )
}

export default memo(CompanyTable)
