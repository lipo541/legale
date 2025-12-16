'use client'

import { memo } from 'react'
import { Trash, Ban, CheckCircle } from 'lucide-react'

// ============================================================================
// Bulk Actions Bar - Memoized Component
// ============================================================================

interface BulkActionsBarProps {
  isDark: boolean
  selectedCount: number
  onBulkDelete: () => void
  onBulkBlock: () => void
  onBulkUnblock: () => void
  onBulkVerify: () => void
  onClearSelection: () => void
}

const BulkActionsBar = memo(function BulkActionsBar({
  isDark,
  selectedCount,
  onBulkDelete,
  onBulkBlock,
  onBulkUnblock,
  onBulkVerify,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className={`mb-3 rounded-lg border p-2 ${
      isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-500/30 bg-blue-500/10'
    }`}>
      {/* Mobile: 2 rows layout, Desktop: single row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-[10px] font-medium text-blue-500">
          არჩეულია: {selectedCount}
        </span>
        
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={onBulkVerify}
            className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors"
            title="ვერიფიკაციის მინიჭება"
          >
            <CheckCircle className="h-3 w-3" />
            <span className="hidden xs:inline">ვერიფიკაცია</span>
            <span className="xs:hidden">✓</span>
          </button>

          <button
            onClick={onBulkBlock}
            className="flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-orange-500 hover:bg-orange-500/20 transition-colors"
            title="დაბლოკვა"
          >
            <Ban className="h-3 w-3" />
            <span className="hidden xs:inline">დაბლოკვა</span>
          </button>

          <button
            onClick={onBulkUnblock}
            className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-green-500 hover:bg-green-500/20 transition-colors"
            title="განბლოკვა"
          >
            <Ban className="h-3 w-3" />
            <span className="hidden xs:inline">განბლოკვა</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-red-500 hover:bg-red-500/20 transition-colors"
            title="წაშლა"
          >
            <Trash className="h-3 w-3" />
            <span className="hidden xs:inline">წაშლა</span>
          </button>
        </div>

        <button
          onClick={onClearSelection}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[9px] sm:text-[10px] font-medium transition-colors sm:ml-auto ${
            isDark 
              ? 'bg-white/10 text-white/70 hover:bg-white/20' 
              : 'bg-black/10 text-black/70 hover:bg-black/20'
          }`}
        >
          გაუქმება
        </button>
      </div>
    </div>
  )
})

export default BulkActionsBar
