'use client'

import { memo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
      <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        {startItem}-{endItem} / {totalItems}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1 rounded-lg transition-colors disabled:opacity-30 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
          }`}
        >
          <ChevronLeft className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[24px] h-6 rounded-md text-[10px] font-medium transition-colors ${
                  currentPage === pageNum
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                    ? 'text-white/60 hover:bg-white/10'
                    : 'text-black/60 hover:bg-black/10'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1 rounded-lg transition-colors disabled:opacity-30 ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
          }`}
        >
          <ChevronRight className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
        </button>
      </div>
    </div>
  )
}

export default memo(Pagination)
