'use client'

import { memo, useState, Fragment } from 'react'
import { 
  User, 
  Ban, 
  Trash2, 
  Eye, 
  Languages, 
  Building2, 
  Smartphone, 
  Loader2,
  ChevronDown,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import VerificationBadge from './VerificationBadge'
import type { 
  SoloSpecialistProfile, 
  Company, 
  LoadingStates, 
  SortColumn, 
  SortOrder 
} from '../types'

// ============================================================================
// Specialist Row - Memoized Component
// ============================================================================

interface SpecialistRowProps {
  specialist: SoloSpecialistProfile
  isDark: boolean
  isSelected: boolean
  isExpanded: boolean
  showTranslations: boolean
  companies: Company[]
  loading: LoadingStates
  selectedCompanyId: string
  onSelect: (id: string) => void
  onExpand: (id: string) => void
  onShowTranslations: (id: string) => void
  onToggleBlock: (specialist: SoloSpecialistProfile) => void
  onToggleInfoActivate: (specialist: SoloSpecialistProfile) => void
  onDelete: (id: string) => void
  onConvertToCompany: (specialistId: string, companyId: string, companyName: string) => void
  onSelectCompany: (companyId: string) => void
  convertingDropdownId: string | null
  onToggleConvertDropdown: (id: string | null) => void
  children?: React.ReactNode  // For expanded content
  translationsContent?: React.ReactNode  // For translations panel
  isMobileView?: boolean  // Whether to render mobile or desktop view
}

const SpecialistRow = memo(function SpecialistRow({
  specialist,
  isDark,
  isSelected,
  isExpanded,
  showTranslations,
  companies,
  loading,
  selectedCompanyId,
  onSelect,
  onExpand,
  onShowTranslations,
  onToggleBlock,
  onToggleInfoActivate,
  onDelete,
  onConvertToCompany,
  onSelectCompany,
  convertingDropdownId,
  onToggleConvertDropdown,
  children,
  translationsContent,
  isMobileView = false
}: SpecialistRowProps) {
  const isConverting = convertingDropdownId === specialist.id

  // Mobile Card View
  if (isMobileView) {
    return (
    <div className={`p-3 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Top Row: Checkbox + Name + Status */}
      <div className="flex items-start gap-3">
        <button onClick={() => onSelect(specialist.id)} className="mt-1 p-0.5">
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-500" />
          ) : (
            <Square className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              {specialist.avatar_url ? (
                <img 
                  src={specialist.avatar_url} 
                  alt={specialist.full_name || 'Avatar'} 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              )}
            </div>

            {/* Name & Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                  {specialist.full_name || 'N/A'}
                </span>
                {specialist.is_blocked && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                    isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Ban className="h-2 w-2" />
                  </span>
                )}
              </div>
              <span className={`text-[10px] block truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                {specialist.email || 'N/A'}
              </span>
            </div>
          </div>

          {/* Info Row */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <VerificationBadge status={specialist.verification_status} isDark={isDark} size="sm" />
            <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {new Date(specialist.created_at).toLocaleDateString('ka-GE')}
            </span>
          </div>

          {/* Action Buttons - Mobile */}
          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
            {/* Translations */}
            <button
              onClick={() => onShowTranslations(specialist.id)}
              className={`rounded-md p-1.5 transition-colors ${
                showTranslations
                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                  : isDark ? 'bg-white/10 text-white/60' : 'bg-black/5 text-black/60'
              }`}
              title="თარგმანები"
            >
              <Languages className="h-4 w-4" />
            </button>

            {/* View Details */}
            <button
              onClick={() => onExpand(specialist.id)}
              className={`rounded-md p-1.5 transition-colors ${
                isExpanded
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                  : isDark ? 'bg-white/10 text-emerald-400' : 'bg-black/5 text-emerald-600'
              }`}
              title="დეტალები"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Convert to Company */}
            <div className="relative">
              <button
                onClick={() => onToggleConvertDropdown(isConverting ? null : specialist.id)}
                disabled={!companies || companies.length === 0}
                className={`rounded-md p-1.5 transition-colors ${
                  isConverting
                    ? isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                    : isDark ? 'bg-white/10' : 'bg-black/5'
                } ${(!companies || companies.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="კომპანიის სპეც.-ად"
              >
                <Building2 className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </button>
              
              {/* Convert Dropdown - Mobile positioned */}
              {isConverting && (
                <div className={`absolute left-0 top-full mt-1 w-64 rounded-lg border shadow-lg z-50 ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'
                }`}>
                  <div className="p-2 space-y-2">
                    <p className={`text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      აირჩიეთ კომპანია:
                    </p>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => onSelectCompany(e.target.value)}
                      className={`w-full rounded-md border px-2 py-1.5 text-xs transition-colors focus:outline-none ${
                        isDark
                          ? 'border-white/10 bg-zinc-800 text-white'
                          : 'border-black/10 bg-white text-black'
                      }`}
                    >
                      <option value="">აირჩიეთ...</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.full_name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const company = companies.find(c => c.id === selectedCompanyId)
                          if (company) {
                            onConvertToCompany(specialist.id, selectedCompanyId, company.full_name)
                          }
                        }}
                        disabled={!selectedCompanyId}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          selectedCompanyId
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'opacity-50 cursor-not-allowed bg-white/5'
                        }`}
                      >
                        დამატება
                      </button>
                      <button
                        onClick={() => {
                          onToggleConvertDropdown(null)
                          onSelectCompany('')
                        }}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-black/10 text-black hover:bg-black/20'
                        }`}
                      >
                        გაუქმება
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Activate */}
            <button
              onClick={() => onToggleInfoActivate(specialist)}
              disabled={loading.togglingInfoActivate === specialist.id}
              className={`rounded-md p-1.5 transition-colors ${
                specialist.info_activate
                  ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                  : isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
              title={specialist.info_activate ? 'საკონტაქტო ინფო ჩართული' : 'საკონტაქტო ინფო გამორთული'}
            >
              {loading.togglingInfoActivate === specialist.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className={`h-4 w-4 ${
                  specialist.info_activate 
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
              )}
            </button>

            {/* Block */}
            <button
              onClick={() => onToggleBlock(specialist)}
              disabled={loading.blocking === specialist.id}
              className={`rounded-md p-1.5 transition-colors ${
                isDark ? 'bg-white/10' : 'bg-black/5'
              }`}
              title={specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
            >
              {loading.blocking === specialist.id ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              ) : (
                <Ban className={`h-4 w-4 ${
                  specialist.is_blocked 
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-orange-400' : 'text-orange-600'
                }`} />
              )}
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(specialist.id)}
              disabled={loading.deleting === specialist.id}
              className={`rounded-md p-1.5 transition-colors bg-red-500/10`}
              title="წაშლა"
            >
              {loading.deleting === specialist.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="h-4 w-4 text-red-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Expanded Content */}
      {isExpanded && children && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {children}
        </div>
      )}

      {/* Mobile Translations Content */}
      {showTranslations && translationsContent && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          {translationsContent}
        </div>
      )}
    </div>
    )
  }

  // Desktop Table Row
  return (
    <Fragment>
      <tr className={`border-t transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
        {/* Checkbox */}
        <td className="px-2 py-2">
          <button onClick={() => onSelect(specialist.id)} className="p-1">
            {isSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <Square className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
            )}
          </button>
        </td>

        {/* Specialist Info */}
        <td className="px-2 py-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
              {specialist.avatar_url ? (
                <img 
                  src={specialist.avatar_url} 
                  alt={specialist.full_name || 'Avatar'} 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                  {specialist.full_name || 'N/A'}
                </span>
                {specialist.is_blocked && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                    isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                  }`}>
                    <Ban className="h-2 w-2" />
                  </span>
                )}
              </div>
              {specialist.slug && (
                <span className={`text-[9px] truncate block ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  /{specialist.slug}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Email */}
        <td className="px-2 py-2">
          <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {specialist.email || 'N/A'}
          </span>
        </td>

        {/* Verification */}
        <td className="px-2 py-2">
          <VerificationBadge 
            status={specialist.verification_status} 
            isDark={isDark} 
            size="sm" 
          />
        </td>

        {/* Created */}
        <td className="px-2 py-2">
          <span className={`text-[10px] ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {new Date(specialist.created_at).toLocaleDateString('ka-GE')}
          </span>
        </td>

        {/* Actions */}
        <td className="px-2 py-2">
          <div className="flex items-center justify-end gap-1">
            {/* Translations */}
            <button
              onClick={() => onShowTranslations(specialist.id)}
              className={`rounded-md p-1 transition-colors ${
                showTranslations
                  ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                  : isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-black/60'
              }`}
              title="თარგმანები"
            >
              <Languages className="h-3.5 w-3.5" />
            </button>

            {/* Convert to Company Specialist */}
            <div className="relative">
              <button
                onClick={() => onToggleConvertDropdown(isConverting ? null : specialist.id)}
                disabled={!companies || companies.length === 0}
                className={`rounded-md p-1 transition-colors ${
                  isConverting
                    ? isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
                    : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                } ${(!companies || companies.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="კომპანიის სპეც.-ად გადაყვანა"
              >
                <Building2 className={`h-3.5 w-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </button>
              
              {/* Dropdown */}
              {isConverting && (
                <div className={`absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-lg z-50 ${
                  isDark ? 'bg-zinc-900 border-white/10' : 'bg-white border-black/10'
                }`}>
                  <div className="p-2 space-y-2">
                    <p className={`text-[9px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      აირჩიეთ კომპანია:
                    </p>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => onSelectCompany(e.target.value)}
                      className={`w-full rounded-md border px-2 py-1.5 text-[10px] transition-colors focus:outline-none ${
                        isDark
                          ? 'border-white/10 bg-zinc-800 text-white'
                          : 'border-black/10 bg-white text-black'
                      }`}
                    >
                      <option value="">აირჩიეთ...</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.full_name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const company = companies.find(c => c.id === selectedCompanyId)
                          if (company) {
                            onConvertToCompany(specialist.id, selectedCompanyId, company.full_name)
                          }
                        }}
                        disabled={!selectedCompanyId}
                        className={`flex-1 rounded-md px-2 py-1 text-[9px] font-medium transition-colors ${
                          selectedCompanyId
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'opacity-50 cursor-not-allowed bg-white/5'
                        }`}
                      >
                        დამატება
                      </button>
                      <button
                        onClick={() => {
                          onToggleConvertDropdown(null)
                          onSelectCompany('')
                        }}
                        className={`flex-1 rounded-md px-2 py-1 text-[9px] font-medium transition-colors ${
                          isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-black/10 text-black hover:bg-black/20'
                        }`}
                      >
                        გაუქმება
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Activate */}
            <button
              onClick={() => onToggleInfoActivate(specialist)}
              disabled={loading.togglingInfoActivate === specialist.id}
              className={`rounded-md p-1 transition-colors ${
                specialist.info_activate
                  ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                  : isDark ? 'bg-gray-500/20' : 'bg-gray-500/10'
              } ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              title={specialist.info_activate ? 'საკონტაქტო ინფო ჩართული' : 'საკონტაქტო ინფო გამორთული'}
            >
              {loading.togglingInfoActivate === specialist.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Smartphone className={`h-3.5 w-3.5 ${
                  specialist.info_activate 
                    ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
              )}
            </button>

            {/* View Details */}
            <button
              onClick={() => onExpand(specialist.id)}
              className={`rounded-md p-1 transition-colors ${
                isExpanded
                  ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'
                  : isDark ? 'hover:bg-white/10 text-emerald-400' : 'hover:bg-black/5 text-emerald-600'
              }`}
              title="დეტალები"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            {/* Block */}
            <button
              onClick={() => onToggleBlock(specialist)}
              disabled={loading.blocking === specialist.id}
              className={`rounded-md p-1 transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              title={specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'}
            >
              {loading.blocking === specialist.id ? (
                <Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              ) : (
                <Ban className={`h-3.5 w-3.5 ${
                  specialist.is_blocked 
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-orange-400' : 'text-orange-600'
                }`} />
              )}
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(specialist.id)}
              disabled={loading.deleting === specialist.id}
              className={`rounded-md p-1 text-red-500 transition-colors hover:bg-red-500/10`}
              title="წაშლა"
            >
              {loading.deleting === specialist.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Row - Details/Edit */}
      {isExpanded && children && (
        <tr>
          <td colSpan={6} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {children}
          </td>
        </tr>
      )}

      {/* Translations Row */}
      {showTranslations && translationsContent && (
        <tr>
          <td colSpan={6} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {translationsContent}
          </td>
        </tr>
      )}
    </Fragment>
  )
})

// ============================================================================
// Sort Icon Component
// ============================================================================

interface SortIconProps {
  column: SortColumn
  currentSort: SortColumn
  sortOrder: SortOrder
}

export const SortIcon = memo(function SortIcon({ column, currentSort, sortOrder }: SortIconProps) {
  if (currentSort !== column) {
    return <ArrowUpDown className="h-3 w-3 opacity-40" />
  }
  return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
})

export default SpecialistRow
