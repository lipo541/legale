// ============================================================================
// CompanyRow Component
// ============================================================================

import { memo } from 'react'
import { 
  Building2, 
  Eye, 
  Edit,
  Trash2, 
  Ban, 
  CheckCircle, 
  XCircle,
  Languages,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import type { CompanyProfile, SortColumn, SortOrder } from '../types'
import VerificationBadge from './VerificationBadge'

// ============================================================================
// Sort Icon Helper
// ============================================================================

interface SortIconProps {
  column: SortColumn
  sortBy: SortColumn
  sortOrder: SortOrder
  isDark: boolean
}

export function SortIcon({ column, sortBy, sortOrder, isDark }: SortIconProps) {
  if (sortBy !== column) {
    return <ChevronUp className={`h-4 w-4 opacity-0 group-hover:opacity-30 ${isDark ? 'text-white' : 'text-black'}`} />
  }
  return sortOrder === 'asc' 
    ? <ChevronUp className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
    : <ChevronDown className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
}

// ============================================================================
// Company Row Props
// ============================================================================

interface CompanyRowProps {
  company: CompanyProfile
  isExpanded: boolean
  isSelected: boolean
  showTranslations: boolean
  blockingId: string | null
  verifyingId: string | null
  deletingId: string | null
  onToggleExpand: () => void
  onToggleSelect: () => void
  onToggleTranslations: () => void
  onToggleBlock: () => void
  onToggleVerification: () => void
  onDelete: () => void
  isDark: boolean
}

// ============================================================================
// Desktop Row Component
// ============================================================================

function CompanyRow({
  company,
  isExpanded,
  isSelected,
  showTranslations,
  blockingId,
  verifyingId,
  deletingId,
  onToggleExpand,
  onToggleSelect,
  onToggleTranslations,
  onToggleBlock,
  onToggleVerification,
  onDelete,
  isDark
}: CompanyRowProps) {
  return (
    <tr className={`border-t transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
      {/* Checkbox */}
      <td className="px-2 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
      </td>
      
      {/* Company Info */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            {company.logo_url || company.avatar_url ? (
              <img 
                src={company.logo_url || company.avatar_url || ''} 
                alt={company.full_name || 'Company'} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <Building2 className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                {company.full_name || 'N/A'}
              </span>
              {company.is_blocked && (
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                  isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                }`}>
                  <Ban className="h-2 w-2" />
                </span>
              )}
            </div>
            {company.company_slug && (
              <span className={`text-[9px] truncate block ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                /{company.company_slug}
              </span>
            )}
          </div>
        </div>
      </td>
      
      {/* Email */}
      <td className="px-2 py-2">
        <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {company.email || 'N/A'}
        </span>
      </td>
      
      {/* Status */}
      <td className="px-2 py-2">
        <VerificationBadge 
          status={company.verification_status} 
          isBlocked={company.is_blocked || false}
          isDark={isDark} 
          size="sm"
        />
      </td>
      
      {/* Created Date */}
      <td className="px-2 py-2">
        <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
          {new Date(company.created_at).toLocaleDateString('ka-GE')}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-2 py-2">
        <div className="flex items-center justify-end gap-1">
          {/* Translations */}
          <button
            onClick={onToggleTranslations}
            className={`rounded-md p-1.5 transition-colors ${
              showTranslations
                ? isDark
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-500/10 text-blue-600'
                : isDark 
                ? 'bg-white/10 text-white/60' 
                : 'bg-black/5 text-black/60'
            }`}
            title="თარგმანები / SEO"
          >
            <Languages className="h-4 w-4" />
          </button>
          
          {/* View Details */}
          <button
            onClick={onToggleExpand}
            className={`rounded-md p-1.5 transition-colors ${
              isExpanded
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-500/10 text-emerald-600'
                : isDark 
                ? 'bg-white/10 text-emerald-400' 
                : 'bg-black/5 text-emerald-600'
            }`}
            title="დეტალები"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {/* Block/Unblock */}
          <button
            onClick={onToggleBlock}
            disabled={blockingId === company.id}
            className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
            title={company.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
          >
            {blockingId === company.id ? (
              <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            ) : (
              <Ban className={`h-4 w-4 ${
                company.is_blocked 
                  ? isDark ? 'text-red-400' : 'text-red-600'
                  : isDark ? 'text-orange-400' : 'text-orange-600'
              }`} />
            )}
          </button>
          
          {/* Verify/Unverify */}
          <button
            onClick={onToggleVerification}
            disabled={verifyingId === company.id}
            className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
              isDark ? 'bg-white/10' : 'bg-black/5'
            }`}
            title={company.verification_status === 'verified' ? 'ვერიფიკაციის გაუქმება' : 'ვერიფიკაცია'}
          >
            {verifyingId === company.id ? (
              <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            ) : (
              company.verification_status === 'verified' ? (
                <CheckCircle className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <XCircle className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              )
            )}
          </button>
          
          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={deletingId === company.id}
            className={`rounded-md p-1.5 transition-colors disabled:opacity-50 bg-red-500/10`}
            title="წაშლა"
          >
            {deletingId === company.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-500" />
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================================
// Mobile Card Component
// ============================================================================

interface CompanyCardProps extends Omit<CompanyRowProps, 'onToggleExpand'> {
  onView: () => void
}

export function CompanyCard({
  company,
  isSelected,
  showTranslations,
  blockingId,
  verifyingId,
  deletingId,
  onToggleSelect,
  onToggleTranslations,
  onToggleBlock,
  onToggleVerification,
  onDelete,
  onView,
  isDark
}: CompanyCardProps) {
  return (
    <div className={`p-3 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Top Row: Checkbox + Name + Status */}
      <div className="flex items-start gap-3">
        <button onClick={onToggleSelect} className="mt-1 p-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              {company.logo_url || company.avatar_url ? (
                <img 
                  src={company.logo_url || company.avatar_url || ''} 
                  alt={company.full_name || 'Company'} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <Building2 className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              )}
            </div>

            {/* Name & Email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                  {company.full_name || 'N/A'}
                </span>
                {company.is_blocked && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                    isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Ban className="h-2 w-2" />
                  </span>
                )}
              </div>
              <span className={`text-[10px] block truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {company.email || 'N/A'}
              </span>
            </div>
          </div>

          {/* Info Row */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <VerificationBadge 
              status={company.verification_status}
              isBlocked={company.is_blocked || false}
              isDark={isDark}
              size="sm"
            />
            {company.company_slug && (
              <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                /{company.company_slug}
              </span>
            )}
            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {new Date(company.created_at).toLocaleDateString('ka-GE')}
            </span>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
            {/* Translations */}
            <button
              onClick={onToggleTranslations}
              className={`rounded-md p-1.5 transition-colors ${
                showTranslations
                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                  : isDark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/60'
              }`}
              title="თარგმანები / SEO"
            >
              <Languages className="h-4 w-4" />
            </button>

            {/* View Details */}
            <button
              onClick={onView}
              className={`rounded-md p-1.5 transition-colors ${
                isDark ? 'bg-white/10 text-emerald-400' : 'bg-black/5 text-emerald-600'
              }`}
              title="დეტალები"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Block/Unblock */}
            <button
              onClick={onToggleBlock}
              disabled={blockingId === company.id}
              className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
              title={company.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
            >
              {blockingId === company.id ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              ) : (
                <Ban className={`h-4 w-4 ${
                  company.is_blocked 
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-orange-400' : 'text-orange-600'
                }`} />
              )}
            </button>

            {/* Verify/Unverify */}
            <button
              onClick={onToggleVerification}
              disabled={verifyingId === company.id}
              className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
              title={company.verification_status === 'verified' ? 'ვერიფიკაციის გაუქმება' : 'ვერიფიკაცია'}
            >
              {verifyingId === company.id ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              ) : (
                company.verification_status === 'verified' ? (
                  <CheckCircle className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                ) : (
                  <XCircle className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                )
              )}
            </button>

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={deletingId === company.id}
              className={`rounded-md p-1.5 transition-colors disabled:opacity-50 bg-red-500/10`}
              title="წაშლა"
            >
              {deletingId === company.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(CompanyRow)
