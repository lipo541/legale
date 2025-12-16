'use client'

import { useState, Fragment, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Eye,
  Check,
  X,
  Mail,
  Phone,
  Building2,
  User,
  Calendar,
  Loader2,
  Shield,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useRequests, useRequestActions } from './hooks'
import { 
  RequestFilters, 
  StatusBadge, 
  RequestTypeBadge, 
  RequestStatsCard, 
  RejectModal, 
  Pagination,
  TabNavigation
} from './components'
import { RequestTab, AccessRequest, VerificationRequest, CompanyVerificationRequest } from './types'

export default function RequestsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<RequestTab>('access')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    loading,
    filters,
    currentPage,
    filteredAccessRequests,
    filteredVerificationRequests,
    filteredCompanySpecialistRequests,
    filteredCompanyRequests,
    accessStats,
    verificationStats,
    companySpecialistStats,
    companyStats,
    setCurrentPage,
    updateFilter,
    resetFilters,
    refreshAll,
    getPaginatedData,
    getTotalPages,
    activeFiltersCount,
    ITEMS_PER_PAGE
  } = useRequests()

  const {
    processingId,
    showRejectModal,
    rejectionReason,
    rejectingRequest,
    rejectingVerification,
    setRejectionReason,
    approveAccessRequest,
    rejectAccessRequest,
    approveVerification,
    rejectVerification,
    openRejectModal,
    closeRejectModal
  } = useRequestActions({ onSuccess: refreshAll })

  const handleViewDetails = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const handleApproveAccess = useCallback(async (request: AccessRequest) => {
    const result = await approveAccessRequest(request)
    if (result.success) {
      setExpandedId(null)
    }
  }, [approveAccessRequest])

  const handleApproveVerification = useCallback(async (request: VerificationRequest | CompanyVerificationRequest) => {
    const result = await approveVerification(request)
    if (result.success) {
      setExpandedId(null)
    }
  }, [approveVerification])

  // Get current tab's data
  const getCurrentData = () => {
    switch (activeTab) {
      case 'access':
        return {
          data: getPaginatedData(filteredAccessRequests),
          total: filteredAccessRequests.length,
          stats: accessStats
        }
      case 'verification':
        return {
          data: getPaginatedData(filteredVerificationRequests),
          total: filteredVerificationRequests.length,
          stats: verificationStats
        }
      case 'companySpecialist':
        return {
          data: getPaginatedData(filteredCompanySpecialistRequests),
          total: filteredCompanySpecialistRequests.length,
          stats: companySpecialistStats
        }
      case 'company':
        return {
          data: getPaginatedData(filteredCompanyRequests),
          total: filteredCompanyRequests.length,
          stats: companyStats
        }
    }
  }

  const currentData = getCurrentData()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
          isDark ? 'from-blue-500/20 to-purple-500/20' : 'from-blue-500/10 to-purple-500/10'
        }`}>
          <FileText className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          {(accessStats.pending + verificationStats.pending + companySpecialistStats.pending + companyStats.pending) > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-black">
                {accessStats.pending + verificationStats.pending + companySpecialistStats.pending + companyStats.pending}
              </span>
            </span>
          )}
        </div>
        <div>
          <h1 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            მოთხოვნები
          </h1>
          <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            სპეციალისტებისა და კომპანიების მართვა
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <RequestStatsCard label="სულ" value={currentData.stats.total} icon={Users} color="blue" />
        <RequestStatsCard label="მოლოდინში" value={currentData.stats.pending} icon={Clock} color="yellow" />
        <RequestStatsCard 
          label={activeTab === 'access' ? 'დამტკიცებული' : 'ვერიფიცირებული'} 
          value={'approved' in currentData.stats ? currentData.stats.approved : currentData.stats.verified} 
          icon={CheckCircle} 
          color="green" 
        />
        <RequestStatsCard label="უარყოფილი" value={currentData.stats.rejected} icon={XCircle} color="red" />
      </div>

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          setCurrentPage(1)
          setExpandedId(null)
        }}
        accessPendingCount={accessStats.pending}
        verificationPendingCount={verificationStats.pending}
        companySpecialistPendingCount={companySpecialistStats.pending}
        companyPendingCount={companyStats.pending}
      />

      {/* Filters */}
      <RequestFilters
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        activeFiltersCount={activeFiltersCount}
        activeTab={activeTab}
      />

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
          <p className={`mt-2 text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>იტვირთება...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Access Requests Table */}
          {activeTab === 'access' && filteredAccessRequests.length > 0 && (
            <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                    <tr>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>მოთხოვნა</th>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>ტიპი</th>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>სტატუსი</th>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>თარიღი</th>
                      <th className={`px-3 py-2 text-right text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'bg-black' : 'bg-white'}>
                    {getPaginatedData(filteredAccessRequests).map((request: AccessRequest) => (
                      <Fragment key={request.id}>
                        <tr className={`border-b transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                {request.request_type === 'COMPANY' ? (
                                  <Building2 className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                ) : (
                                  <User className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name}</div>
                                <div className={`text-[10px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>{request.user_email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <RequestTypeBadge type={request.request_type} />
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={request.status} type="access" />
                          </td>
                          <td className={`px-3 py-2 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {new Date(request.created_at).toLocaleDateString('ka-GE')}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewDetails(request.id)}
                                className={`rounded-lg p-1.5 transition-colors ${
                                  expandedId === request.id
                                    ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                    : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                                }`}
                              >
                                <Eye className={`h-3.5 w-3.5 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                              </button>
                              {request.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveAccess(request)}
                                    disabled={processingId === request.id}
                                    className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'}`}
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    ) : (
                                      <Check className={`h-3.5 w-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(request, 'access')}
                                    disabled={processingId === request.id}
                                    className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}
                                  >
                                    <X className={`h-3.5 w-3.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedId === request.id && (
                          <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                            <td colSpan={5} className="px-3 py-3">
                              <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                                <h4 className={`text-xs font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>მოთხოვნის დეტალები</h4>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <User className="h-2.5 w-2.5" /> სახელი
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Mail className="h-2.5 w-2.5" /> ელფოსტა
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.user_email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Phone className="h-2.5 w-2.5" /> ტელეფონი
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.phone_number}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Shield className="h-2.5 w-2.5" /> ტიპი
                                    </label>
                                    <RequestTypeBadge type={request.request_type} />
                                  </div>
                                  {request.company_slug && (
                                    <div className="sm:col-span-2">
                                      <label className={`mb-1 block text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>Slug</label>
                                      <p className={`text-[10px] font-mono ${isDark ? 'text-white' : 'text-black'}`}>{request.company_slug}</p>
                                    </div>
                                  )}
                                  <div className="sm:col-span-2 lg:col-span-4">
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <FileText className="h-2.5 w-2.5" /> ინფორმაცია
                                    </label>
                                    <p className={`text-[10px] whitespace-pre-wrap ${isDark ? 'text-white' : 'text-black'}`}>{request.about}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Calendar className="h-2.5 w-2.5" /> შექმნილია
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{new Date(request.created_at).toLocaleString('ka-GE')}</p>
                                  </div>
                                  {request.rejection_reason && (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                      <label className={`mb-1 block text-[9px] font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>უარყოფის მიზეზი</label>
                                      <p className={`text-[10px] p-2 rounded-lg border ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>{request.rejection_reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-white/10">
                {getPaginatedData(filteredAccessRequests).map((request: AccessRequest) => (
                  <div key={request.id} className={`${isDark ? 'bg-black' : 'bg-white'}`}>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                            {request.request_type === 'COMPANY' ? (
                              <Building2 className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                            ) : (
                              <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name}</p>
                            <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>{request.user_email || 'N/A'}</p>
                          </div>
                        </div>
                        <StatusBadge status={request.status} type="access" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RequestTypeBadge type={request.request_type} />
                          <span className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            {new Date(request.created_at).toLocaleDateString('ka-GE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetails(request.id)}
                            className={`rounded-lg p-1.5 ${
                              expandedId === request.id
                                ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                          >
                            <Eye className={`h-4 w-4 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                          </button>
                          {request.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApproveAccess(request)} className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'}`}>
                                <Check className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                              </button>
                              <button onClick={() => openRejectModal(request, 'access')} className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}>
                                <X className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Mobile Expanded Details */}
                    {expandedId === request.id && (
                      <div className={`px-3 pb-3`}>
                        <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                          <h4 className={`text-[10px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>დეტალები</h4>
                          <div className="space-y-2">
                            <div>
                              <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                <Phone className="h-2.5 w-2.5" /> ტელეფონი
                              </label>
                              <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.phone_number}</p>
                            </div>
                            {request.company_slug && (
                              <div>
                                <label className={`text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>Slug</label>
                                <p className={`text-[10px] font-mono ${isDark ? 'text-white' : 'text-black'}`}>{request.company_slug}</p>
                              </div>
                            )}
                            <div>
                              <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                <FileText className="h-2.5 w-2.5" /> ინფორმაცია
                              </label>
                              <p className={`text-[10px] whitespace-pre-wrap ${isDark ? 'text-white' : 'text-black'}`}>{request.about}</p>
                            </div>
                            <div>
                              <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                <Calendar className="h-2.5 w-2.5" /> შექმნილია
                              </label>
                              <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{new Date(request.created_at).toLocaleString('ka-GE')}</p>
                            </div>
                            {request.rejection_reason && (
                              <div>
                                <label className={`text-[9px] font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>უარყოფის მიზეზი</label>
                                <p className={`text-[10px] p-2 rounded-lg border mt-1 ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>{request.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(filteredAccessRequests.length)}
                totalItems={filteredAccessRequests.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Verification Requests Table */}
          {(activeTab === 'verification' || activeTab === 'companySpecialist' || activeTab === 'company') && currentData.data.length > 0 && (
            <div className={`overflow-hidden rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                    <tr>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                        {activeTab === 'company' ? 'კომპანია' : 'სპეციალისტი'}
                      </th>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>სტატუსი</th>
                      <th className={`px-3 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>თარიღი</th>
                      <th className={`px-3 py-2 text-right text-[10px] font-semibold ${isDark ? 'text-white' : 'text-black'}`}>მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'bg-black' : 'bg-white'}>
                    {(currentData.data as (VerificationRequest | CompanyVerificationRequest)[]).map((request) => (
                      <Fragment key={request.id}>
                        <tr className={`border-b transition-colors ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                {request.avatar_url ? (
                                  <img src={request.avatar_url} alt={request.full_name || ''} className="h-full w-full object-cover" />
                                ) : (
                                  <User className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name || 'N/A'}</div>
                                <div className={`text-[10px] truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>{request.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={request.verification_status} type="verification" />
                          </td>
                          <td className={`px-3 py-2 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {request.verification_requested_at 
                              ? new Date(request.verification_requested_at).toLocaleDateString('ka-GE')
                              : new Date(request.created_at).toLocaleDateString('ka-GE')}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewDetails(request.id)}
                                className={`rounded-lg p-1.5 transition-colors ${
                                  expandedId === request.id
                                    ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                    : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                                }`}
                              >
                                <Eye className={`h-3.5 w-3.5 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                              </button>
                              {request.verification_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveVerification(request)}
                                    disabled={processingId === request.id}
                                    className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'}`}
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className={`h-3.5 w-3.5 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    ) : (
                                      <Check className={`h-3.5 w-3.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(request, 'verification')}
                                    disabled={processingId === request.id}
                                    className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}
                                  >
                                    <X className={`h-3.5 w-3.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedId === request.id && (
                          <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                            <td colSpan={4} className="px-3 py-3">
                              <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                                <h4 className={`text-xs font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>დეტალები</h4>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <User className="h-2.5 w-2.5" /> სახელი
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Mail className="h-2.5 w-2.5" /> ელფოსტა
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Phone className="h-2.5 w-2.5" /> ტელეფონი
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.phone_number || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                      <Calendar className="h-2.5 w-2.5" /> შექმნილია
                                    </label>
                                    <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{new Date(request.created_at).toLocaleString('ka-GE')}</p>
                                  </div>
                                  {request.bio && (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                      <label className={`flex items-center gap-1 mb-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                        <FileText className="h-2.5 w-2.5" /> ბიო
                                      </label>
                                      <p className={`text-[10px] whitespace-pre-wrap ${isDark ? 'text-white' : 'text-black'}`}>{request.bio}</p>
                                    </div>
                                  )}
                                  {request.verification_notes && (
                                    <div className="sm:col-span-2 lg:col-span-4">
                                      <label className={`mb-1 block text-[9px] font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>უარყოფის მიზეზი</label>
                                      <p className={`text-[10px] p-2 rounded-lg border ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>{request.verification_notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-white/10">
                {(currentData.data as (VerificationRequest | CompanyVerificationRequest)[]).map((request) => (
                  <div key={request.id} className={`${isDark ? 'bg-black' : 'bg-white'}`}>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                            {request.avatar_url ? (
                              <img src={request.avatar_url} alt={request.full_name || ''} className="h-full w-full object-cover" />
                            ) : (
                              <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{request.full_name || 'N/A'}</p>
                            <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>{request.email || 'N/A'}</p>
                          </div>
                        </div>
                        <StatusBadge status={request.verification_status} type="verification" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          {request.verification_requested_at 
                            ? new Date(request.verification_requested_at).toLocaleDateString('ka-GE')
                            : new Date(request.created_at).toLocaleDateString('ka-GE')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleViewDetails(request.id)} 
                            className={`rounded-lg p-1.5 ${
                              expandedId === request.id
                                ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                : isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                            }`}
                          >
                            <Eye className={`h-4 w-4 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                          </button>
                          {request.verification_status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveVerification(request)} className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'}`}>
                                <Check className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                              </button>
                              <button onClick={() => openRejectModal(request, 'verification')} className={`rounded-lg p-1.5 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'}`}>
                                <X className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Mobile Expanded Details */}
                    {expandedId === request.id && (
                      <div className={`px-3 pb-3`}>
                        <div className={`rounded-lg border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                          <h4 className={`text-[10px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>დეტალები</h4>
                          <div className="space-y-2">
                            <div>
                              <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                <Phone className="h-2.5 w-2.5" /> ტელეფონი
                              </label>
                              <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{request.phone_number || 'N/A'}</p>
                            </div>
                            {request.bio && (
                              <div>
                                <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  <FileText className="h-2.5 w-2.5" /> ბიო
                                </label>
                                <p className={`text-[10px] whitespace-pre-wrap ${isDark ? 'text-white' : 'text-black'}`}>{request.bio}</p>
                              </div>
                            )}
                            <div>
                              <label className={`flex items-center gap-1 text-[9px] font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                <Calendar className="h-2.5 w-2.5" /> შექმნილია
                              </label>
                              <p className={`text-[10px] ${isDark ? 'text-white' : 'text-black'}`}>{new Date(request.created_at).toLocaleString('ka-GE')}</p>
                            </div>
                            {request.verification_notes && (
                              <div>
                                <label className={`text-[9px] font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>უარყოფის მიზეზი</label>
                                <p className={`text-[10px] p-2 rounded-lg border mt-1 ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>{request.verification_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(currentData.total)}
                totalItems={currentData.total}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {/* Empty State */}
          {currentData.data.length === 0 && (
            <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <User className={`mx-auto h-8 w-8 mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
              <p className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {activeFiltersCount > 0 ? 'მოთხოვნები ვერ მოიძებნა' : 'მოთხოვნები ჯერ არ არის'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        title={rejectingRequest ? 'მოთხოვნის უარყოფა' : 'ვერიფიკაციის უარყოფა'}
        onClose={closeRejectModal}
        onConfirm={rejectingRequest ? rejectAccessRequest : rejectVerification}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isProcessing={!!processingId}
      />
    </div>
  )
}
