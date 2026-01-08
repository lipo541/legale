// ============================================================================
// useCompanyActions Hook - CRUD Operations & Cascading Actions
// ============================================================================

import { useState, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompanyProfile, CompanyEditForm, City } from '../types'

interface UseCompanyActionsProps {
  supabase: SupabaseClient
  companies: CompanyProfile[]
  setCompanies: React.Dispatch<React.SetStateAction<CompanyProfile[]>>
  fetchCompanies: () => Promise<void>
  loadCompanyCities: (companyId: string) => Promise<City[]>
  setCompanyCities: React.Dispatch<React.SetStateAction<Record<string, City[]>>>
}

export function useCompanyActions({
  supabase,
  companies,
  setCompanies,
  fetchCompanies,
  loadCompanyCities,
  setCompanyCities
}: UseCompanyActionsProps) {
  // -------------------------------------------------------------------------
  // Loading States
  // -------------------------------------------------------------------------
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [savingCities, setSavingCities] = useState(false)

  // -------------------------------------------------------------------------
  // Save Company Edit
  // -------------------------------------------------------------------------
  const handleSaveEdit = useCallback(async (
    company: CompanyProfile,
    editForm: CompanyEditForm
  ): Promise<{ success: boolean; error?: string }> => {
    setUpdatingId(company.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone_number: editForm.phone_number,
          company_slug: editForm.company_slug,
          company_overview: editForm.company_overview,
          summary: editForm.summary,
          mission_statement: editForm.mission_statement,
          vision_values: editForm.vision_values,
          history: editForm.history,
          how_we_work: editForm.how_we_work,
          website: editForm.website,
          address: editForm.address,
          map_link: editForm.map_link,
          facebook_link: editForm.facebook_link,
          instagram_link: editForm.instagram_link,
          linkedin_link: editForm.linkedin_link,
          twitter_link: editForm.twitter_link,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)

      if (error) {
        return { success: false, error: error.message }
      }

      await fetchCompanies()
      return { success: true }
    } catch (err) {
      console.error('Save edit error:', err)
      return { success: false, error: 'შეცდომა განახლებისას' }
    } finally {
      setUpdatingId(null)
    }
  }, [supabase, fetchCompanies])

  // -------------------------------------------------------------------------
  // Delete Company
  // -------------------------------------------------------------------------
  const handleDelete = useCallback(async (
    companyId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setDeletingId(companyId)

    try {
      // Use API route for proper cascade deletion with service role
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: companyId })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || result.message }
      }

      await fetchCompanies()
      return { success: true }
    } catch (err) {
      console.error('Delete error:', err)
      return { success: false, error: 'შეცდომა წაშლისას' }
    } finally {
      setDeletingId(null)
    }
  }, [supabase, fetchCompanies])

  // -------------------------------------------------------------------------
  // Toggle Block (with cascade to specialists)
  // -------------------------------------------------------------------------
  const handleToggleBlock = useCallback(async (
    company: CompanyProfile
  ): Promise<{ success: boolean; error?: string }> => {
    setBlockingId(company.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const updateData = company.is_blocked
        ? {
            is_blocked: false,
            blocked_by: null,
            blocked_at: null,
            block_reason: null,
            updated_at: new Date().toISOString()
          }
        : {
            is_blocked: true,
            blocked_by: user.id,
            blocked_at: new Date().toISOString(),
            block_reason: 'დაბლოკილია სუპერ ადმინის მიერ',
            updated_at: new Date().toISOString()
          }

      // Update company
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', company.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Cascade to specialists
      const specialistUpdateData = company.is_blocked
        ? {
            is_blocked: false,
            blocked_by: null,
            blocked_at: null,
            block_reason: null,
            updated_at: new Date().toISOString()
          }
        : {
            is_blocked: true,
            blocked_by: user.id,
            blocked_at: new Date().toISOString(),
            block_reason: `დაბლოკილია კომპანიის "${company.full_name}" დაბლოკვის გამო`,
            updated_at: new Date().toISOString()
          }

      const { error: specialistsError } = await supabase
        .from('profiles')
        .update(specialistUpdateData)
        .eq('role', 'SPECIALIST')
        .eq('company_id', company.id)

      if (specialistsError) {
        console.error('Cascade block error:', specialistsError)
      }

      await fetchCompanies()
      return { 
        success: true, 
        error: specialistsError ? 'კომპანია განახლდა, მაგრამ სპეციალისტების განახლებისას მოხდა შეცდომა' : undefined 
      }
    } catch (err) {
      console.error('Block error:', err)
      return { success: false, error: 'შეცდომა დაბლოკვისას' }
    } finally {
      setBlockingId(null)
    }
  }, [supabase, fetchCompanies])

  // -------------------------------------------------------------------------
  // Toggle Verification (with cascade to specialists)
  // -------------------------------------------------------------------------
  const handleToggleVerification = useCallback(async (
    company: CompanyProfile
  ): Promise<{ success: boolean; error?: string }> => {
    setVerifyingId(company.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const isVerified = company.verification_status === 'verified'

      const updateData = isVerified
        ? {
            verification_status: 'unverified',
            verification_reviewed_at: null,
            verification_reviewed_by: null,
            verification_notes: null,
            updated_at: new Date().toISOString()
          }
        : {
            verification_status: 'verified',
            verification_reviewed_at: new Date().toISOString(),
            verification_reviewed_by: user.id,
            verification_notes: 'ვერიფიცირებულია სუპერ ადმინის მიერ',
            updated_at: new Date().toISOString()
          }

      // Update company
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', company.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Cascade to specialists
      const specialistUpdateData = isVerified
        ? {
            verification_status: 'unverified',
            verification_reviewed_at: null,
            verification_reviewed_by: null,
            verification_notes: null,
            updated_at: new Date().toISOString()
          }
        : {
            verification_status: 'verified',
            verification_reviewed_at: new Date().toISOString(),
            verification_reviewed_by: user.id,
            verification_notes: `ვერიფიცირებულია კომპანიის "${company.full_name}" ვერიფიკაციის გამო`,
            updated_at: new Date().toISOString()
          }

      const { error: specialistsError } = await supabase
        .from('profiles')
        .update(specialistUpdateData)
        .eq('role', 'SPECIALIST')
        .eq('company_id', company.id)

      if (specialistsError) {
        console.error('Cascade verification error:', specialistsError)
      }

      await fetchCompanies()
      return { 
        success: true, 
        error: specialistsError ? 'კომპანია განახლდა, მაგრამ სპეციალისტების განახლებისას მოხდა შეცდომა' : undefined 
      }
    } catch (err) {
      console.error('Verification error:', err)
      return { success: false, error: 'შეცდომა ვერიფიკაციისას' }
    } finally {
      setVerifyingId(null)
    }
  }, [supabase, fetchCompanies])

  // -------------------------------------------------------------------------
  // Save Cities
  // -------------------------------------------------------------------------
  const handleSaveCities = useCallback(async (
    companyId: string,
    cityIds: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    setSavingCities(true)

    try {
      // Delete existing
      await supabase
        .from('company_cities')
        .delete()
        .eq('company_id', companyId)

      // Insert new
      if (cityIds.length > 0) {
        const insertData = cityIds.map(cityId => ({
          company_id: companyId,
          city_id: cityId
        }))

        const { error } = await supabase
          .from('company_cities')
          .insert(insertData)

        if (error) {
          return { success: false, error: error.message }
        }
      }

      // Reload cities
      await loadCompanyCities(companyId)
      return { success: true }
    } catch (err) {
      console.error('Save cities error:', err)
      return { success: false, error: 'შეცდომა ქალაქების შენახვისას' }
    } finally {
      setSavingCities(false)
    }
  }, [supabase, loadCompanyCities])

  // -------------------------------------------------------------------------
  // Bulk Delete
  // -------------------------------------------------------------------------
  const handleBulkDelete = useCallback(async (
    ids: Set<string>
  ): Promise<{ success: boolean; error?: string; count: number }> => {
    const idsArray = Array.from(ids)
    let deletedCount = 0

    // Use API route for proper cascade deletion
    const results = await Promise.all(
      idsArray.map(id =>
        fetch('/api/admin/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        }).then(res => res.json().then(data => ({ ok: res.ok, data })))
      )
    )

    deletedCount = results.filter(r => r.ok).length

    await fetchCompanies()
    return { 
      success: deletedCount > 0, 
      count: deletedCount,
      error: deletedCount < idsArray.length ? `${idsArray.length - deletedCount} კომპანია ვერ წაიშალა` : undefined
    }
  }, [supabase, fetchCompanies])

  // -------------------------------------------------------------------------
  // Bulk Block
  // -------------------------------------------------------------------------
  const handleBulkBlock = useCallback(async (
    ids: Set<string>,
    block: boolean
  ): Promise<{ success: boolean; error?: string; count: number }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'არ ხართ ავტორიზებული', count: 0 }
    }

    const idsArray = Array.from(ids)
    let updatedCount = 0

    const updateData = block
      ? {
          is_blocked: true,
          blocked_by: user.id,
          blocked_at: new Date().toISOString(),
          block_reason: 'მასობრივი დაბლოკვა',
          updated_at: new Date().toISOString()
        }
      : {
          is_blocked: false,
          blocked_by: null,
          blocked_at: null,
          block_reason: null,
          updated_at: new Date().toISOString()
        }

    for (const id of idsArray) {
      const company = companies.find(c => c.id === id)
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)

      if (!error) {
        updatedCount++
        
        // Cascade to specialists
        if (company) {
          await supabase
            .from('profiles')
            .update(block ? {
              is_blocked: true,
              blocked_by: user.id,
              blocked_at: new Date().toISOString(),
              block_reason: `დაბლოკილია კომპანიის "${company.full_name}" დაბლოკვის გამო`,
              updated_at: new Date().toISOString()
            } : {
              is_blocked: false,
              blocked_by: null,
              blocked_at: null,
              block_reason: null,
              updated_at: new Date().toISOString()
            })
            .eq('role', 'SPECIALIST')
            .eq('company_id', id)
        }
      }
    }

    await fetchCompanies()
    return { 
      success: updatedCount > 0, 
      count: updatedCount,
      error: updatedCount < idsArray.length ? `${idsArray.length - updatedCount} კომპანია ვერ განახლდა` : undefined
    }
  }, [supabase, companies, fetchCompanies])

  // -------------------------------------------------------------------------
  // Bulk Verify
  // -------------------------------------------------------------------------
  const handleBulkVerify = useCallback(async (
    ids: Set<string>,
    verify: boolean
  ): Promise<{ success: boolean; error?: string; count: number }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'არ ხართ ავტორიზებული', count: 0 }
    }

    const idsArray = Array.from(ids)
    let updatedCount = 0

    const updateData = verify
      ? {
          verification_status: 'verified',
          verification_reviewed_at: new Date().toISOString(),
          verification_reviewed_by: user.id,
          verification_notes: 'მასობრივი ვერიფიკაცია',
          updated_at: new Date().toISOString()
        }
      : {
          verification_status: 'unverified',
          verification_reviewed_at: null,
          verification_reviewed_by: null,
          verification_notes: null,
          updated_at: new Date().toISOString()
        }

    for (const id of idsArray) {
      const company = companies.find(c => c.id === id)
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)

      if (!error) {
        updatedCount++
        
        // Cascade to specialists
        if (company) {
          await supabase
            .from('profiles')
            .update(verify ? {
              verification_status: 'verified',
              verification_reviewed_at: new Date().toISOString(),
              verification_reviewed_by: user.id,
              verification_notes: `ვერიფიცირებულია კომპანიის "${company.full_name}" ვერიფიკაციის გამო`,
              updated_at: new Date().toISOString()
            } : {
              verification_status: 'unverified',
              verification_reviewed_at: null,
              verification_reviewed_by: null,
              verification_notes: null,
              updated_at: new Date().toISOString()
            })
            .eq('role', 'SPECIALIST')
            .eq('company_id', id)
        }
      }
    }

    await fetchCompanies()
    return { 
      success: updatedCount > 0, 
      count: updatedCount,
      error: updatedCount < idsArray.length ? `${idsArray.length - updatedCount} კომპანია ვერ განახლდა` : undefined
    }
  }, [supabase, companies, fetchCompanies])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    // Loading states
    updatingId,
    deletingId,
    blockingId,
    verifyingId,
    savingCities,
    
    // Actions
    handleSaveEdit,
    handleDelete,
    handleToggleBlock,
    handleToggleVerification,
    handleSaveCities,
    handleBulkDelete,
    handleBulkBlock,
    handleBulkVerify
  }
}
