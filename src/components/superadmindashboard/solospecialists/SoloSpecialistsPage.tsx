'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User,
  Loader2,
  CheckCircle,
  Clock,
  Ban,
  UserX
} from 'lucide-react'
import Modal from '@/components/common/Modal'
import SpecialistTranslations from '@/components/superadmindashboard/specialists/translations/SpecialistTranslations'
import CityPicker from '@/components/companydashboard/companyprofile/CityPicker'

// Types
import type { 
  SoloSpecialistProfile, 
  SpecialistEditForm,
  ModalConfig,
  VerificationStatus,
  City
} from './types'
import { defaultEditForm, defaultModalConfig } from './types'

// Hooks
import { useSoloSpecialists } from './hooks/useSoloSpecialists'
import { useSpecialistActions } from './hooks/useSpecialistActions'

// Components
import StatsCard from './components/StatsCard'
import SpecialistFilters from './components/SpecialistFilters'
import BulkActionsBar from './components/BulkActionsBar'
import SpecialistTable, { Pagination } from './components/SpecialistTable'
import SpecialistDetails from './components/SpecialistDetails'
import SpecialistEditFormComponent from './components/SpecialistEditForm'

// ============================================================================
// Main Component
// ============================================================================

export default function SoloSpecialistsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // -------------------------------------------------------------------------
  // Custom Hooks
  // -------------------------------------------------------------------------
  const {
    specialists,
    companies,
    specialistCities,
    paginatedSpecialists,
    stats,
    loading,
    setLoading,
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
    fetchSpecialists,
    loadSpecialistCities,
    setSpecialists,
    setSpecialistCities,
    supabase
  } = useSoloSpecialists()

  // -------------------------------------------------------------------------
  // Local State
  // -------------------------------------------------------------------------
  const [showFilters, setShowFilters] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTranslationsId, setShowTranslationsId] = useState<string | null>(null)
  const [editingSpecialist, setEditingSpecialist] = useState<SoloSpecialistProfile | null>(null)
  const [editForm, setEditForm] = useState<SpecialistEditForm>(defaultEditForm)
  const [modalConfig, setModalConfig] = useState<ModalConfig>(defaultModalConfig)
  const [convertingDropdownId, setConvertingDropdownId] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [editingCitiesForId, setEditingCitiesForId] = useState<string | null>(null)

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

  // -------------------------------------------------------------------------
  // Actions Hook
  // -------------------------------------------------------------------------
  const {
    handleDelete,
    handleBulkDelete,
    handleToggleBlock,
    handleBulkBlock,
    handleToggleInfoActivate,
    handleChangeVerificationStatus,
    handleSaveEdit,
    handlePhotoUpload,
    handleConvertToCompanySpecialist,
    handleSaveCities
  } = useSpecialistActions({
    supabase,
    specialists,
    setSpecialists,
    loading,
    setLoading,
    fetchSpecialists,
    showModal
  })

  // -------------------------------------------------------------------------
  // Local Handlers
  // -------------------------------------------------------------------------
  const handleExpand = useCallback(async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setEditingSpecialist(null)
    } else {
      setExpandedId(id)
      setShowTranslationsId(null)
      // Load cities if not already loaded
      if (!specialistCities[id]) {
        await loadSpecialistCities(id)
      }
    }
  }, [expandedId, specialistCities, loadSpecialistCities])

  const handleShowTranslations = useCallback((id: string) => {
    if (showTranslationsId === id) {
      setShowTranslationsId(null)
    } else {
      setShowTranslationsId(id)
      setExpandedId(null)
      setEditingSpecialist(null)
    }
  }, [showTranslationsId])

  const handleStartEdit = useCallback(async (specialist: SoloSpecialistProfile) => {
    setEditingSpecialist(specialist)
    setEditForm({
      full_name: specialist.full_name || '',
      email: specialist.email || '',
      role_title: specialist.role_title || '',
      phone_number: specialist.phone_number || '',
      slug: specialist.slug || '',
      bio: specialist.bio || '',
      philosophy: specialist.philosophy || '',
      languages: specialist.languages || [],
      focus_areas_text: specialist.focus_areas?.join('\n') || '',
      representative_matters_text: specialist.representative_matters?.join('\n') || '',
      teaching_writing_speaking: specialist.teaching_writing_speaking || '',
      credentials_memberships_text: specialist.credentials_memberships?.join('\n') || '',
      values_how_we_work: specialist.values_how_we_work || {}
    })
    
    // Ensure cities are loaded
    if (!specialistCities[specialist.id]) {
      await loadSpecialistCities(specialist.id)
    }
  }, [specialistCities, loadSpecialistCities])

  const handleCancelEdit = useCallback(() => {
    setEditingSpecialist(null)
    setEditForm(defaultEditForm)
  }, [])

  const handleUpdateForm = useCallback((updates: Partial<SpecialistEditForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [])

  const handleSaveEditWrapper = useCallback(async () => {
    if (!editingSpecialist) return
    const success = await handleSaveEdit(editingSpecialist.id, editForm)
    if (success) {
      setEditingSpecialist(null)
      setEditForm(defaultEditForm)
      setExpandedId(null)
    }
  }, [editingSpecialist, editForm, handleSaveEdit])

  const handlePhotoUploadWrapper = useCallback(async (specialistId: string, file: File) => {
    await handlePhotoUpload(specialistId, file)
  }, [handlePhotoUpload])

  const handleChangeVerificationWrapper = useCallback((
    specialist: SoloSpecialistProfile,
    status: VerificationStatus,
    notes?: string
  ) => {
    handleChangeVerificationStatus(specialist, status, notes)
  }, [handleChangeVerificationStatus])

  const handleOpenCityPicker = useCallback((specialistId: string) => {
    setEditingCitiesForId(specialistId)
    setShowCityPicker(true)
  }, [])

  const handleSaveCitiesWrapper = useCallback(async (cityIds: string[]) => {
    if (!editingCitiesForId) return
    const success = await handleSaveCities(editingCitiesForId, cityIds)
    if (success) {
      // Reload cities for this specialist
      await loadSpecialistCities(editingCitiesForId)
      setShowCityPicker(false)
      setEditingCitiesForId(null)
    }
  }, [editingCitiesForId, handleSaveCities, loadSpecialistCities])

  const handleBulkVerify = useCallback(async () => {
    if (selectedIds.size === 0) return
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.size} სპეციალისტის ვერიფიკაცია?`, async () => {
      try {
        for (const id of selectedIds) {
          await supabase
            .from('profiles')
            .update({
              verification_status: 'verified',
              verification_reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        }
        
        setSpecialists(prev => prev.map(s => 
          selectedIds.has(s.id) 
            ? { 
                ...s, 
                verification_status: 'verified' as VerificationStatus,
                verification_reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : s
        ))
        clearSelection()
        showModal('success', `${selectedIds.size} სპეციალისტი წარმატებით ვერიფიცირდა!`)
      } catch (err) {
        console.error('Bulk verify error:', err)
        showModal('error', 'შეცდომა მასობრივი ვერიფიკაციისას')
      }
    })
  }, [selectedIds, supabase, setSpecialists, clearSelection, showModal])

  // -------------------------------------------------------------------------
  // Current cities for city picker
  // -------------------------------------------------------------------------
  const currentCityIds = useMemo(() => {
    if (!editingCitiesForId) return []
    return specialistCities[editingCitiesForId]?.map(c => c.id) || []
  }, [editingCitiesForId, specialistCities])

  // -------------------------------------------------------------------------
  // Render expanded content
  // -------------------------------------------------------------------------
  const renderExpandedContent = useCallback((specialist: SoloSpecialistProfile) => {
    const isEditing = editingSpecialist?.id === specialist.id
    const cities = specialistCities[specialist.id] || []

    if (isEditing) {
      return (
        <SpecialistEditFormComponent
          specialist={specialist}
          isDark={isDark}
          editForm={editForm}
          cities={cities}
          loading={loading}
          onUpdateForm={handleUpdateForm}
          onSave={handleSaveEditWrapper}
          onCancel={handleCancelEdit}
          onPhotoUpload={handlePhotoUploadWrapper}
          onOpenCityPicker={() => handleOpenCityPicker(specialist.id)}
        />
      )
    }

    return (
      <SpecialistDetails
        specialist={specialist}
        isDark={isDark}
        cities={cities}
        loading={loading}
        onEdit={handleStartEdit}
        onChangeVerificationStatus={handleChangeVerificationWrapper}
        onPhotoUpload={handlePhotoUploadWrapper}
      />
    )
  }, [
    editingSpecialist, 
    specialistCities, 
    isDark, 
    editForm, 
    loading, 
    handleUpdateForm, 
    handleSaveEditWrapper, 
    handleCancelEdit, 
    handlePhotoUploadWrapper,
    handleOpenCityPicker,
    handleStartEdit,
    handleChangeVerificationWrapper
  ])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className={`min-h-full px-4 sm:px-6 lg:px-8 py-4 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title with Icon */}
          <div className="flex items-center gap-3">
            <div className={`relative p-2.5 rounded-xl ${
              isDark 
                ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' 
                : 'bg-gradient-to-br from-purple-500/10 to-blue-500/10'
            }`}>
              <User className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              {stats.pending > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[7px] text-white font-bold items-center justify-center">
                    {stats.pending}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h1 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                სოლო სპეციალისტები
              </h1>
              <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${stats.verified > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {stats.verified} ვერიფიცირებული
                </span>
                <span className={isDark ? 'text-white/20' : 'text-black/20'}>•</span>
                <span>სოლო სპეციალისტების მართვა</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        <StatsCard label="სულ" value={stats.total} isDark={isDark} icon={User} />
        <StatsCard label="ვერიფიცირებული" value={stats.verified} isDark={isDark} icon={CheckCircle} color="emerald" />
        <StatsCard label="განხილვაში" value={stats.pending} isDark={isDark} icon={Clock} color="yellow" />
        <StatsCard label="დაბლოკილი" value={stats.blocked} isDark={isDark} icon={Ban} color="red" />
        <StatsCard label="უარყოფილი" value={stats.rejected} isDark={isDark} icon={UserX} color="red" />
        <StatsCard label="ნაპოვნი" value={stats.filtered} isDark={isDark} color="blue" />
      </div>

      {/* Filters */}
      <SpecialistFilters
        isDark={isDark}
        filters={filters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onUpdateFilter={updateFilter}
        onClearFilters={clearFilters}
      />

      {/* Bulk Actions */}
      <BulkActionsBar
        isDark={isDark}
        selectedCount={selectedIds.size}
        onBulkDelete={() => handleBulkDelete(selectedIds)}
        onBulkBlock={() => handleBulkBlock(selectedIds, true)}
        onBulkUnblock={() => handleBulkBlock(selectedIds, false)}
        onBulkVerify={handleBulkVerify}
        onClearSelection={clearSelection}
      />

      {/* Table or Loading */}
      {loading.fetching ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className={`h-6 w-6 animate-spin mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>იტვირთება...</span>
        </div>
      ) : paginatedSpecialists.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <User className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {filters.searchTerm || filters.verificationFilter !== 'ALL' || filters.blockFilter !== 'ALL' 
              ? 'სპეციალისტები ვერ მოიძებნა' 
              : 'სოლო სპეციალისტები ჯერ არ არის'}
          </p>
        </div>
      ) : (
        <>
          <SpecialistTable
            isDark={isDark}
            specialists={paginatedSpecialists}
            companies={companies}
            loading={loading}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            expandedId={expandedId}
            showTranslationsId={showTranslationsId}
            onExpand={handleExpand}
            onShowTranslations={handleShowTranslations}
            onToggleBlock={handleToggleBlock}
            onToggleInfoActivate={handleToggleInfoActivate}
            onDelete={handleDelete}
            onConvertToCompany={handleConvertToCompanySpecialist}
            convertingDropdownId={convertingDropdownId}
            selectedCompanyId={selectedCompanyId}
            onToggleConvertDropdown={setConvertingDropdownId}
            onSelectCompany={setSelectedCompanyId}
            renderExpandedContent={renderExpandedContent}
            renderTranslationsContent={(specialist) => (
              <SpecialistTranslations
                specialistId={specialist.id}
                specialistName={specialist.full_name || 'N/A'}
              />
            )}
          />

          {/* Pagination */}
          <Pagination
            isDark={isDark}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items)
              setCurrentPage(1)
            }}
          />
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.type === 'confirm'}
        confirmText={modalConfig.type === 'confirm' ? 'დიახ' : 'კარგი'}
        cancelText="გაუქმება"
      />

      {/* City Picker Modal */}
      {showCityPicker && (
        <CityPicker
          selectedCityIds={currentCityIds}
          onSave={handleSaveCitiesWrapper}
          onClose={() => {
            setShowCityPicker(false)
            setEditingCitiesForId(null)
          }}
        />
      )}
    </div>
  )
}
