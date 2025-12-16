// ============================================================================
// CompaniesPage - Main Component (Optimized)
// ============================================================================

'use client'

import { useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2,
  Loader2,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  Users
} from 'lucide-react'
import Modal from '@/components/common/Modal'
import CityPicker from '@/components/companydashboard/companyprofile/CityPicker'
import CompanyTranslations from './companytranslations/CompanyTranslations'
import CompanyRepresentativesTable from './CompanyRepresentativesTable'

// Types
import type { 
  CompanyProfile, 
  CompanyEditForm,
  ModalConfig,
  City
} from './types'
import { defaultEditForm, defaultModalConfig } from './types'

// Hooks
import { useCompanies } from './hooks/useCompanies'
import { useCompanyActions } from './hooks/useCompanyActions'

// Components
import StatsCard from './components/StatsCard'
import CompanyFilters from './components/CompanyFilters'
import BulkActionsBar from './components/BulkActionsBar'
import CompanyTable, { Pagination } from './components/CompanyTable'
import CompanyDetails from './components/CompanyDetails'
import CompanyEditFormComponent from './components/CompanyEditForm'

// ============================================================================
// Main Component
// ============================================================================

export default function CompaniesPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // -------------------------------------------------------------------------
  // Custom Hooks
  // -------------------------------------------------------------------------
  const {
    companies,
    companyCities,
    paginatedCompanies,
    filteredCompanies,
    stats,
    loading,
    filters,
    updateFilter,
    clearFilters,
    sortBy,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    fetchCompanies,
    loadCompanyCities,
    setCompanies,
    setCompanyCities,
    supabase
  } = useCompanies()

  const {
    updatingId,
    deletingId,
    blockingId,
    verifyingId,
    handleSaveEdit,
    handleDelete,
    handleToggleBlock,
    handleToggleVerification,
    handleSaveCities,
    handleBulkDelete,
    handleBulkBlock,
    handleBulkVerify
  } = useCompanyActions({
    supabase,
    companies,
    setCompanies,
    fetchCompanies,
    loadCompanyCities,
    setCompanyCities
  })

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [showFilters, setShowFilters] = useState(true)
  const [showRepresentatives, setShowRepresentatives] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTranslationsId, setShowTranslationsId] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null)
  const [editForm, setEditForm] = useState<CompanyEditForm>(defaultEditForm)
  const [modalConfig, setModalConfig] = useState<ModalConfig>(defaultModalConfig)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [editingCitiesForId, setEditingCitiesForId] = useState<string | null>(null)
  const [selectedCities, setSelectedCities] = useState<City[]>([])

  // -------------------------------------------------------------------------
  // Modal Helper
  // -------------------------------------------------------------------------
  const showModal = useCallback((
    type: ModalConfig['type'],
    message: string,
    onConfirm?: () => void
  ) => {
    setModalConfig({
      isOpen: true,
      type,
      message,
      onConfirm
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalConfig(defaultModalConfig)
  }, [])

  // -------------------------------------------------------------------------
  // View/Edit Handlers
  // -------------------------------------------------------------------------
  const handleViewDetails = useCallback(async (companyId: string) => {
    if (expandedId === companyId) {
      setExpandedId(null)
    } else {
      setExpandedId(companyId)
      setEditingCompany(null)
      setShowTranslationsId(null)
      
      // Load cities if not already loaded
      if (!companyCities[companyId]) {
        await loadCompanyCities(companyId)
      }
    }
  }, [expandedId, companyCities, loadCompanyCities])

  const handleToggleTranslations = useCallback((companyId: string) => {
    if (showTranslationsId === companyId) {
      setShowTranslationsId(null)
    } else {
      setShowTranslationsId(companyId)
      setExpandedId(null)
    }
  }, [showTranslationsId])

  const handleStartEdit = useCallback(async (company: CompanyProfile) => {
    setEditingCompany(company)
    setEditForm({
      full_name: company.full_name || '',
      email: company.email || '',
      phone_number: company.phone_number || '',
      company_slug: company.company_slug || '',
      company_overview: company.company_overview || '',
      summary: company.summary || '',
      mission_statement: company.mission_statement || '',
      vision_values: company.vision_values || '',
      history: company.history || '',
      how_we_work: company.how_we_work || '',
      website: company.website || '',
      address: company.address || '',
      map_link: company.map_link || '',
      facebook_link: company.facebook_link || '',
      instagram_link: company.instagram_link || '',
      linkedin_link: company.linkedin_link || '',
      twitter_link: company.twitter_link || ''
    })
    
    // Load cities
    const cities = await loadCompanyCities(company.id)
    setSelectedCities(cities)
  }, [loadCompanyCities])

  const handleCancelEdit = useCallback(() => {
    setEditingCompany(null)
    setEditForm(defaultEditForm)
  }, [])

  const handleSave = useCallback(async () => {
    if (!editingCompany) return

    const result = await handleSaveEdit(editingCompany, editForm)
    if (result.success) {
      showModal('success', 'წარმატებით განახლდა! ✅')
      setEditingCompany(null)
      setExpandedId(null)
    } else {
      showModal('error', `შეცდომა განახლებისას: ${result.error}`)
    }
  }, [editingCompany, editForm, handleSaveEdit, showModal])

  // -------------------------------------------------------------------------
  // Delete Handler
  // -------------------------------------------------------------------------
  const handleDeleteCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ "${company?.full_name || 'ამ კომპანიის'}" წაშლა?`, async () => {
      const result = await handleDelete(companyId)
      if (result.success) {
        showModal('success', 'კომპანია წარმატებით წაიშალა! ✅')
      } else {
        showModal('error', `შეცდომა წაშლისას: ${result.error}`)
      }
    })
  }, [companies, handleDelete, showModal])

  // -------------------------------------------------------------------------
  // Block/Verify Handlers
  // -------------------------------------------------------------------------
  const handleBlockCompany = useCallback((company: CompanyProfile) => {
    const action = company.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'
    const message = company.is_blocked 
      ? `დარწმუნებული ხართ რომ გსურთ "${company.full_name}"-ის განბლოკვა?`
      : `დარწმუნებული ხართ რომ გსურთ "${company.full_name}"-ის დაბლოკვა?\n\n⚠️ კომპანიის დაბლოკვისას დაიბლოკება ყველა მისი სპეციალისტიც.`

    showModal('confirm', message, async () => {
      const result = await handleToggleBlock(company)
      if (result.success) {
        showModal('success', `კომპანია და მისი სპეციალისტები წარმატებით ${company.is_blocked ? 'განბლოკდა' : 'დაიბლოკა'}! ✅`)
      } else {
        showModal('error', `შეცდომა ${action}ისას: ${result.error}`)
      }
    })
  }, [handleToggleBlock, showModal])

  const handleVerifyCompany = useCallback((company: CompanyProfile) => {
    const isVerified = company.verification_status === 'verified'
    const message = isVerified
      ? `დარწმუნებული ხართ რომ გსურთ "${company.full_name}"-ის ვერიფიკაციის გაუქმება?\n\n⚠️ გაუქმდება ყველა სპეციალისტის ვერიფიკაციაც.`
      : `დარწმუნებული ხართ რომ გსურთ "${company.full_name}"-ის ვერიფიკაცია?\n\n✅ ვერიფიცირდება ყველა მისი სპეციალისტიც.`

    showModal('confirm', message, async () => {
      const result = await handleToggleVerification(company)
      if (result.success) {
        showModal('success', `კომპანია და მისი სპეციალისტები წარმატებით ${isVerified ? 'დაუვერიფიცირდა' : 'ვერიფიცირდა'}! ✅`)
      } else {
        showModal('error', `შეცდომა: ${result.error}`)
      }
    })
  }, [handleToggleVerification, showModal])

  // -------------------------------------------------------------------------
  // City Picker Handler
  // -------------------------------------------------------------------------
  const handleOpenCityPicker = useCallback((companyId: string) => {
    setEditingCitiesForId(companyId)
    setShowCityPicker(true)
  }, [])

  const handleCitySave = useCallback(async (cityIds: string[]) => {
    if (!editingCitiesForId) return

    const result = await handleSaveCities(editingCitiesForId, cityIds)
    if (result.success) {
      showModal('success', 'ქალაქები წარმატებით განახლდა! ✅')
      setShowCityPicker(false)
      setEditingCitiesForId(null)
      
      // Update local selected cities for edit form
      const newCities = await loadCompanyCities(editingCitiesForId)
      setSelectedCities(newCities)
    } else {
      showModal('error', `შეცდომა: ${result.error}`)
    }
  }, [editingCitiesForId, handleSaveCities, loadCompanyCities, showModal])

  // -------------------------------------------------------------------------
  // Bulk Action Handlers
  // -------------------------------------------------------------------------
  const handleBulkDeleteAction = useCallback(() => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} კომპანიის წაშლა?`, async () => {
      const result = await handleBulkDelete(selectedIds)
      if (result.success) {
        showModal('success', `${result.count} კომპანია წარმატებით წაიშალა! ✅`)
        clearSelection()
      } else {
        showModal('error', result.error || 'შეცდომა წაშლისას')
      }
    })
  }, [selectedIds, handleBulkDelete, clearSelection, showModal])

  const handleBulkBlockAction = useCallback(() => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} კომპანიის დაბლოკვა?\n\n⚠️ დაიბლოკება ყველა მათი სპეციალისტიც.`, async () => {
      const result = await handleBulkBlock(selectedIds, true)
      if (result.success) {
        showModal('success', `${result.count} კომპანია წარმატებით დაიბლოკა! ✅`)
        clearSelection()
      } else {
        showModal('error', result.error || 'შეცდომა დაბლოკვისას')
      }
    })
  }, [selectedIds, handleBulkBlock, clearSelection, showModal])

  const handleBulkUnblockAction = useCallback(() => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} კომპანიის განბლოკვა?`, async () => {
      const result = await handleBulkBlock(selectedIds, false)
      if (result.success) {
        showModal('success', `${result.count} კომპანია წარმატებით განბლოკდა! ✅`)
        clearSelection()
      } else {
        showModal('error', result.error || 'შეცდომა განბლოკვისას')
      }
    })
  }, [selectedIds, handleBulkBlock, clearSelection, showModal])

  const handleBulkVerifyAction = useCallback(() => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} კომპანიის ვერიფიკაცია?\n\n✅ ვერიფიცირდება ყველა მათი სპეციალისტიც.`, async () => {
      const result = await handleBulkVerify(selectedIds, true)
      if (result.success) {
        showModal('success', `${result.count} კომპანია წარმატებით ვერიფიცირდა! ✅`)
        clearSelection()
      } else {
        showModal('error', result.error || 'შეცდომა ვერიფიკაციისას')
      }
    })
  }, [selectedIds, handleBulkVerify, clearSelection, showModal])

  const handleBulkUnverifyAction = useCallback(() => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} კომპანიის ვერიფიკაციის გაუქმება?`, async () => {
      const result = await handleBulkVerify(selectedIds, false)
      if (result.success) {
        showModal('success', `${result.count} კომპანიას გაუუქმდა ვერიფიკაცია! ✅`)
        clearSelection()
      } else {
        showModal('error', result.error || 'შეცდომა')
      }
    })
  }, [selectedIds, handleBulkVerify, clearSelection, showModal])

  // -------------------------------------------------------------------------
  // Render Content Helpers
  // -------------------------------------------------------------------------
  const renderExpandedContent = useCallback((company: CompanyProfile) => {
    if (editingCompany?.id === company.id) {
      return (
        <CompanyEditFormComponent
          company={company}
          editForm={editForm}
          setEditForm={setEditForm}
          selectedCities={selectedCities}
          isSaving={updatingId === company.id}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onOpenCityPicker={() => handleOpenCityPicker(company.id)}
          isDark={isDark}
        />
      )
    }

    return (
      <CompanyDetails
        company={company}
        cities={companyCities[company.id] || []}
        onEdit={() => handleStartEdit(company)}
        isDark={isDark}
      />
    )
  }, [editingCompany, editForm, selectedCities, updatingId, handleSave, handleCancelEdit, handleOpenCityPicker, companyCities, handleStartEdit, isDark])

  const renderTranslationsContent = useCallback((company: CompanyProfile) => {
    return (
      <CompanyTranslations 
        companyId={company.id}
        companyName={company.full_name || 'N/A'}
      />
    )
  }, [])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className={`min-h-full px-4 sm:px-6 lg:px-8 py-4 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`relative p-2.5 rounded-xl ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/20 to-emerald-500/20' 
              : 'bg-gradient-to-br from-blue-500/10 to-emerald-500/10'
          }`}>
            <Building2 className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            {stats.pending > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white animate-pulse">
                {stats.pending > 9 ? '9+' : stats.pending}
              </span>
            )}
          </div>
          <div>
            <h1 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              კომპანიები
            </h1>
            <div className="flex items-center gap-2">
              <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                კომპანიების მართვა და კონტროლი
              </p>
              {stats.verified > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span className={`text-[10px] ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'}`}>
                    {stats.verified} ვერიფიცირებული
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRepresentatives(!showRepresentatives)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            showRepresentatives
              ? isDark
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : isDark
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
              : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">{showRepresentatives ? 'კომპანიები' : 'წარმომადგენლები'}</span>
        </button>
      </div>

      {showRepresentatives ? (
        <CompanyRepresentativesTable onBack={() => setShowRepresentatives(false)} />
      ) : (
        <>
          {/* Stats Dashboard */}
          <div className="mb-4 grid gap-2 grid-cols-2 md:grid-cols-6">
            <StatsCard
              icon={Building2}
              label="სულ კომპანიები"
              value={stats.total}
              color="blue"
              isDark={isDark}
            />
            <StatsCard
              icon={CheckCircle}
              label="ვერიფიცირებული"
              value={stats.verified}
              color="emerald"
              isDark={isDark}
              onClick={() => updateFilter('verification', 'verified')}
              isActive={filters.verification === 'verified'}
            />
            <StatsCard
              icon={AlertCircle}
              label="არავერიფიცირებული"
              value={stats.unverified}
              color="gray"
              isDark={isDark}
              onClick={() => updateFilter('verification', 'unverified')}
              isActive={filters.verification === 'unverified'}
            />
            <StatsCard
              icon={Clock}
              label="მოლოდინში"
              value={stats.pending}
              color="amber"
              isDark={isDark}
              onClick={() => updateFilter('verification', 'pending')}
              isActive={filters.verification === 'pending'}
            />
            <StatsCard
              icon={Ban}
              label="დაბლოკილი"
              value={stats.blocked}
              color="red"
              isDark={isDark}
              onClick={() => updateFilter('blocked', 'blocked')}
              isActive={filters.blocked === 'blocked'}
            />
            <StatsCard
              icon={Building2}
              label="ფილტრირებული"
              value={filteredCompanies.length}
              color="gray"
              isDark={isDark}
            />
          </div>

          {/* Filters */}
          <div className="mb-4">
            <CompanyFilters
              filters={filters}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              isDark={isDark}
              totalCount={companies.length}
              filteredCount={filteredCompanies.length}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            </div>
          )}

          {/* Company Table */}
          {!loading && paginatedCompanies.length > 0 && (
            <div className="space-y-4">
              <CompanyTable
                companies={paginatedCompanies}
                expandedId={expandedId}
                selectedIds={selectedIds}
                showTranslationsId={showTranslationsId}
                sortBy={sortBy}
                sortOrder={sortOrder}
                blockingId={blockingId}
                verifyingId={verifyingId}
                deletingId={deletingId}
                onSort={handleSort}
                onToggleExpand={handleViewDetails}
                onSelectAll={handleSelectAll}
                onSelectOne={handleSelectOne}
                onToggleTranslations={handleToggleTranslations}
                onToggleBlock={handleBlockCompany}
                onToggleVerification={handleVerifyCompany}
                onDelete={handleDeleteCompany}
                renderExpandedContent={renderExpandedContent}
                renderTranslationsContent={renderTranslationsContent}
                isDark={isDark}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredCompanies.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                isDark={isDark}
              />
            </div>
          )}

          {/* Empty State */}
          {!loading && paginatedCompanies.length === 0 && (
            <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <Building2 className={`mx-auto h-8 w-8 mb-3 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {filters.search || filters.verification !== 'ALL' || filters.blocked !== 'ALL' 
                  ? 'კომპანიები ვერ მოიძებნა' 
                  : 'კომპანიები ჯერ არ არის'}
              </p>
              {(filters.search || filters.verification !== 'ALL' || filters.blocked !== 'ALL') && (
                <button
                  onClick={clearFilters}
                  className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  ფილტრების გასუფთავება
                </button>
              )}
            </div>
          )}

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onClear={clearSelection}
            onDelete={handleBulkDeleteAction}
            onBlock={handleBulkBlockAction}
            onUnblock={handleBulkUnblockAction}
            onVerify={handleBulkVerifyAction}
            onUnverify={handleBulkUnverifyAction}
            isDark={isDark}
          />

          {/* City Picker Modal */}
          {showCityPicker && editingCitiesForId && (
            <CityPicker
              selectedCityIds={selectedCities.map(c => c.id)}
              onSave={handleCitySave}
              onClose={() => {
                setShowCityPicker(false)
                setEditingCitiesForId(null)
              }}
            />
          )}

          {/* Modal */}
          <Modal
            isOpen={modalConfig.isOpen}
            type={modalConfig.type}
            message={modalConfig.message}
            onClose={closeModal}
            onConfirm={modalConfig.onConfirm}
          />
        </>
      )}
    </div>
  )
}
