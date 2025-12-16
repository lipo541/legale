// ============================================================================
// BulkActionsBar Component - Optimized Inline Version
// ============================================================================

import { memo } from 'react'
import { X, Trash2, Ban, Shield, CheckCircle } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onBlock: () => void
  onUnblock: () => void
  onVerify: () => void
  onUnverify: () => void
  isDark: boolean
}

function BulkActionsBar({
  selectedCount,
  onClear,
  onDelete,
  onBlock,
  onUnblock,
  onVerify,
  onUnverify,
  isDark
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 rounded-lg border p-2 ${
      isDark 
        ? 'border-white/10 bg-white/5' 
        : 'border-black/10 bg-black/5'
    }`}>
      <span className={`text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        არჩეულია: <strong className={isDark ? 'text-white' : 'text-black'}>{selectedCount}</strong>
      </span>
      
      <div className={`h-4 w-px ${isDark ? 'bg-white/20' : 'bg-black/10'}`} />
      
      <div className="flex flex-wrap items-center gap-1">
        <button
          onClick={onVerify}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            isDark 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
          }`}
          title="ვერიფიკაცია"
        >
          <CheckCircle className="h-3 w-3" />
          <span className="hidden sm:inline">ვერიფიკაცია</span>
        </button>
        
        <button
          onClick={onUnverify}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            isDark 
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
              : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
          }`}
          title="ვერიფიკაციის გაუქმება"
        >
          <Shield className="h-3 w-3" />
          <span className="hidden sm:inline">გაუქმება</span>
        </button>
        
        <button
          onClick={onBlock}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            isDark 
              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
              : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
          }`}
          title="დაბლოკვა"
        >
          <Ban className="h-3 w-3" />
          <span className="hidden sm:inline">ბლოკი</span>
        </button>
        
        <button
          onClick={onUnblock}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            isDark 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
          }`}
          title="განბლოკვა"
        >
          <Ban className="h-3 w-3" />
          <span className="hidden sm:inline">განბლოკვა</span>
        </button>
        
        <button
          onClick={onDelete}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            isDark 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
              : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
          }`}
          title="წაშლა"
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">წაშლა</span>
        </button>
      </div>
      
      <button
        onClick={onClear}
        className={`ml-auto rounded-md p-1 transition-colors ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
        }`}
        title="გაუქმება"
      >
        <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
      </button>
    </div>
  )
}

export default memo(BulkActionsBar)
