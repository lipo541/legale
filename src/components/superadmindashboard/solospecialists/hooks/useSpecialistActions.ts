'use client'

import { useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  SoloSpecialistProfile, 
  VerificationStatus, 
  LoadingStates,
  SpecialistEditForm
} from '../types'

// ============================================================================
// useSpecialistActions Hook
// ============================================================================

interface UseSpecialistActionsOptions {
  supabase: SupabaseClient
  specialists: SoloSpecialistProfile[]
  setSpecialists: React.Dispatch<React.SetStateAction<SoloSpecialistProfile[]>>
  loading: LoadingStates
  setLoading: React.Dispatch<React.SetStateAction<LoadingStates>>
  fetchSpecialists: () => Promise<void>
  showModal: (type: 'info' | 'success' | 'warning' | 'error' | 'confirm', message: string, onConfirm?: () => void) => void
}

export function useSpecialistActions({
  supabase,
  specialists,
  setSpecialists,
  loading,
  setLoading,
  fetchSpecialists,
  showModal
}: UseSpecialistActionsOptions) {

  // -------------------------------------------------------------------------
  // Delete Specialist
  // -------------------------------------------------------------------------
  const handleDelete = useCallback(async (id: string) => {
    const specialist = specialists.find(s => s.id === id)
    if (!specialist) return

    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} წაშლა?\n\nგაფრთხილება: წაიშლება ყველა დაკავშირებული მონაცემი.`, async () => {
      setLoading(prev => ({ ...prev, deleting: id }))
      
      try {
        // Delete via API route that uses service_role for proper permissions
        const response = await fetch('/api/admin/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id })
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('Delete error:', result)
          if (result.code === '23503') {
            showModal('error', 'სპეციალისტი ვერ იშლება, რადგან დაკავშირებულია სხვა ჩანაწერებთან.')
          } else {
            showModal('error', `შეცდომა წაშლისას: ${result.error || result.message}`)
          }
        } else {
          setSpecialists(prev => prev.filter(s => s.id !== id))
          showModal('success', 'სპეციალისტი წარმატებით წაიშალა!')
        }
      } catch (err) {
        console.error('Delete error:', err)
        showModal('error', 'შეცდომა წაშლისას')
      } finally {
        setLoading(prev => ({ ...prev, deleting: null }))
      }
    })
  }, [specialists, supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Bulk Delete
  // -------------------------------------------------------------------------
  const handleBulkDelete = useCallback(async (ids: Set<string>) => {
    if (ids.size === 0) return

    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${ids.size} სპეციალისტის წაშლა?`, async () => {
      try {
        const idsArray = Array.from(ids)
        const results = await Promise.all(
          idsArray.map(id =>
            fetch('/api/admin/delete-user', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: id })
            }).then(res => res.json().then(data => ({ ok: res.ok, data })))
          )
        )

        const failed = results.filter(r => !r.ok)
        
        if (failed.length > 0) {
          console.error('Bulk delete errors:', failed)
          showModal('error', `${failed.length} სპეციალისტი ვერ წაიშალა`)
        } else {
          setSpecialists(prev => prev.filter(s => !ids.has(s.id)))
          showModal('success', `${ids.size} სპეციალისტი წარმატებით წაიშალა!`)
        }
      } catch (err) {
        console.error('Bulk delete error:', err)
        showModal('error', 'შეცდომა მასობრივი წაშლისას')
      }
    })
  }, [supabase, setSpecialists, showModal])

  // -------------------------------------------------------------------------
  // Toggle Block Status
  // -------------------------------------------------------------------------
  const handleToggleBlock = useCallback(async (specialist: SoloSpecialistProfile) => {
    const action = specialist.is_blocked ? 'განბლოკვა' : 'დაბლოკვა'
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ${action}?`, async () => {
      setLoading(prev => ({ ...prev, blocking: specialist.id }))

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_blocked: !specialist.is_blocked,
            updated_at: new Date().toISOString()
          })
          .eq('id', specialist.id)

        if (error) {
          console.error('Block/Unblock error:', error)
          showModal('error', `შეცდომა ${action}ისას`)
        } else {
          setSpecialists(prev => prev.map(s => 
            s.id === specialist.id 
              ? { ...s, is_blocked: !specialist.is_blocked, updated_at: new Date().toISOString() }
              : s
          ))
          showModal('success', `სპეციალისტი წარმატებით ${specialist.is_blocked ? 'განბლოკილია' : 'დაბლოკილია'}!`)
        }
      } catch (err) {
        console.error('Block/Unblock error:', err)
        showModal('error', `შეცდომა ${action}ისას`)
      } finally {
        setLoading(prev => ({ ...prev, blocking: null }))
      }
    })
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Bulk Block/Unblock
  // -------------------------------------------------------------------------
  const handleBulkBlock = useCallback(async (ids: Set<string>, block: boolean) => {
    if (ids.size === 0) return

    const action = block ? 'დაბლოკვა' : 'განბლოკვა'
    
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${ids.size} სპეციალისტის ${action}?`, async () => {
      try {
        for (const id of ids) {
          await supabase
            .from('profiles')
            .update({
              is_blocked: block,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        }
        
        setSpecialists(prev => prev.map(s => 
          ids.has(s.id) 
            ? { ...s, is_blocked: block, updated_at: new Date().toISOString() }
            : s
        ))
        showModal('success', `${ids.size} სპეციალისტი წარმატებით ${block ? 'დაბლოკილია' : 'განბლოკილია'}!`)
      } catch (err) {
        console.error('Bulk block error:', err)
        showModal('error', `შეცდომა მასობრივი ${action}ისას`)
      }
    })
  }, [supabase, setSpecialists, showModal])

  // -------------------------------------------------------------------------
  // Toggle Info Activate
  // -------------------------------------------------------------------------
  const handleToggleInfoActivate = useCallback(async (specialist: SoloSpecialistProfile) => {
    const newStatus = !specialist.info_activate
    const statusText = newStatus ? 'ჩართვა' : 'გამორთვა'
    
    showModal(
      'confirm', 
      `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} საკონტაქტო ინფორმაციის ${statusText}?\n\n${newStatus ? 'ჩაირთვება რეალური email, ტელეფონი და სოციალური ლინკები.' : 'გამოჩნდება სტატიკური საკონტაქტო ინფო.'}`,
      async () => {
        setLoading(prev => ({ ...prev, togglingInfoActivate: specialist.id }))

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              info_activate: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', specialist.id)

          if (error) {
            console.error('Info activate toggle error:', error)
            showModal('error', 'შეცდომა სტატუსის შეცვლისას')
          } else {
            setSpecialists(prev => prev.map(s => 
              s.id === specialist.id 
                ? { ...s, info_activate: newStatus, updated_at: new Date().toISOString() }
                : s
            ))
            showModal('success', `საკონტაქტო ინფო ${newStatus ? 'ჩართულია' : 'გამორთულია'}!`)
          }
        } catch (err) {
          console.error('Info activate toggle error:', err)
          showModal('error', 'შეცდომა სტატუსის შეცვლისას')
        } finally {
          setLoading(prev => ({ ...prev, togglingInfoActivate: null }))
        }
      }
    )
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Change Verification Status
  // -------------------------------------------------------------------------
  const handleChangeVerificationStatus = useCallback(async (
    specialist: SoloSpecialistProfile, 
    newStatus: VerificationStatus,
    notes?: string
  ) => {
    const getConfirmMessage = () => {
      if (newStatus === 'verified' && specialist.verification_status === 'pending') {
        return `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ვერიფიკაციის მოთხოვნის დადასტურება?`
      }
      if (newStatus === 'verified') {
        return `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტს'} ვერიფიკაციის მინიჭება?`
      }
      if (newStatus === 'rejected') {
        return `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ვერიფიკაციის მოთხოვნის უარყოფა?`
      }
      if (newStatus === 'unverified') {
        return `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ვერიფიკაციის გაუქმება?`
      }
      return `დარწმუნებული ხართ რომ გსურთ ვერიფიკაციის სტატუსის შეცვლა?`
    }

    showModal('confirm', getConfirmMessage(), async () => {
      setLoading(prev => ({ ...prev, changingVerification: specialist.id }))

      try {
        const updateData: Record<string, unknown> = {
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        }

        if (newStatus === 'verified' || newStatus === 'rejected') {
          updateData.verification_reviewed_at = new Date().toISOString()
        }

        if (notes !== undefined) {
          updateData.verification_notes = notes
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', specialist.id)

        if (error) {
          console.error('Verification status change error:', error)
          showModal('error', 'შეცდომა სტატუსის შეცვლისას')
        } else {
          setSpecialists(prev => prev.map(s => 
            s.id === specialist.id 
              ? { 
                  ...s, 
                  verification_status: newStatus,
                  verification_reviewed_at: (newStatus === 'verified' || newStatus === 'rejected') 
                    ? new Date().toISOString() 
                    : s.verification_reviewed_at,
                  verification_notes: notes !== undefined ? notes : s.verification_notes,
                  updated_at: new Date().toISOString()
                }
              : s
          ))

          const successMessages: Record<VerificationStatus, string> = {
            verified: specialist.verification_status === 'pending' 
              ? 'ვერიფიკაციის მოთხოვნა დადასტურდა!' 
              : 'ვერიფიკაცია წარმატებით მიენიჭა!',
            unverified: 'ვერიფიკაცია გაუქმდა!',
            pending: 'სტატუსი შეიცვალა: განხილვაში',
            rejected: 'ვერიფიკაციის მოთხოვნა უარყოფილია!'
          }
          showModal('success', successMessages[newStatus])
        }
      } catch (err) {
        console.error('Verification status change error:', err)
        showModal('error', 'შეცდომა სტატუსის შეცვლისას')
      } finally {
        setLoading(prev => ({ ...prev, changingVerification: null }))
      }
    })
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Save Edit
  // -------------------------------------------------------------------------
  const handleSaveEdit = useCallback(async (
    specialistId: string,
    editForm: SpecialistEditForm
  ) => {
    setLoading(prev => ({ ...prev, updating: specialistId }))

    try {
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        role_title: editForm.role_title,
        phone_number: editForm.phone_number,
        slug: editForm.slug,
        bio: editForm.bio,
        philosophy: editForm.philosophy,
        languages: editForm.languages,
        focus_areas: editForm.focus_areas_text 
          ? editForm.focus_areas_text.split('\n').filter(item => item.trim()) 
          : [],
        representative_matters: editForm.representative_matters_text 
          ? editForm.representative_matters_text.split('\n').filter(item => item.trim()) 
          : [],
        teaching_writing_speaking: editForm.teaching_writing_speaking,
        credentials_memberships: editForm.credentials_memberships_text 
          ? editForm.credentials_memberships_text.split('\n').filter(item => item.trim()) 
          : [],
        values_how_we_work: editForm.values_how_we_work,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', specialistId)

      if (error) {
        console.error('Update error:', error)
        showModal('error', `შეცდომა განახლებისას: ${error.message}`)
        return false
      } else {
        await fetchSpecialists()
        showModal('success', 'სპეციალისტი წარმატებით განახლდა!')
        return true
      }
    } catch (err) {
      console.error('Catch error:', err)
      showModal('error', 'შეცდომა განახლებისას')
      return false
    } finally {
      setLoading(prev => ({ ...prev, updating: null }))
    }
  }, [supabase, fetchSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Photo Upload
  // -------------------------------------------------------------------------
  const handlePhotoUpload = useCallback(async (
    specialistId: string, 
    file: File
  ) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showModal('error', 'გთხოვთ ატვირთოთ მხოლოდ JPEG, PNG ან WebP ფორმატის სურათი')
      return false
    }

    if (file.size > 5 * 1024 * 1024) {
      showModal('error', 'ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს')
      return false
    }

    setLoading(prev => ({ ...prev, uploadingPhoto: specialistId }))
    
    try {
      const specialist = specialists.find(s => s.id === specialistId)
      if (!specialist) return false

      const fileExt = file.name.split('.').pop()
      const fileName = `${specialistId}/photo-${Date.now()}.${fileExt}`

      if (specialist.avatar_url) {
        const oldPath = specialist.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('specialist-photos').remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from('specialist-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        showModal('error', `ატვირთვისას მოხდა შეცდომა: ${uploadError.message}`)
        return false
      }

      const { data: { publicUrl } } = supabase.storage
        .from('specialist-photos')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', specialistId)

      if (updateError) {
        showModal('error', `მონაცემთა ბაზის განახლება ვერ მოხერხდა: ${updateError.message}`)
        return false
      }

      setSpecialists(prev => prev.map(s => 
        s.id === specialistId 
          ? { ...s, avatar_url: publicUrl, updated_at: new Date().toISOString() }
          : s
      ))
      showModal('success', 'ფოტო წარმატებით აიტვირთა!')
      return true
    } catch (error) {
      console.error('Photo upload error:', error)
      showModal('error', 'ფოტოს ატვირთვისას მოხდა შეცდომა')
      return false
    } finally {
      setLoading(prev => ({ ...prev, uploadingPhoto: null }))
    }
  }, [specialists, supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Convert to Company Specialist
  // -------------------------------------------------------------------------
  const handleConvertToCompanySpecialist = useCallback(async (
    specialistId: string, 
    companyId: string,
    companyName: string
  ) => {
    const specialist = specialists.find(s => s.id === specialistId)
    if (!specialist) return

    showModal(
      'confirm', 
      `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} კომპანია "${companyName}"-ის სპეციალისტად გადაყვანა?`,
      async () => {
        setLoading(prev => ({ ...prev, convertingToCompany: specialistId }))

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              role: 'SPECIALIST',
              company_id: companyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', specialistId)

          if (error) {
            console.error('Convert error:', error)
            showModal('error', `შეცდომა გადაყვანისას: ${error.message}`)
          } else {
            setSpecialists(prev => prev.filter(s => s.id !== specialistId))
            showModal('success', `${specialist.full_name || 'სპეციალისტი'} წარმატებით გადაიყვანა კომპანიის სპეციალისტად!`)
          }
        } catch (err) {
          console.error('Convert error:', err)
          showModal('error', 'შეცდომა გადაყვანისას')
        } finally {
          setLoading(prev => ({ ...prev, convertingToCompany: null }))
        }
      }
    )
  }, [specialists, supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Save Cities
  // -------------------------------------------------------------------------
  const handleSaveCities = useCallback(async (
    specialistId: string,
    cityIds: string[]
  ) => {
    try {
      // Delete all existing cities
      await supabase
        .from('specialist_cities')
        .delete()
        .eq('specialist_id', specialistId)

      // Insert new cities
      if (cityIds.length > 0) {
        const insertData = cityIds.map(cityId => ({
          specialist_id: specialistId,
          city_id: cityId
        }))

        await supabase
          .from('specialist_cities')
          .insert(insertData)
      }

      showModal('success', 'ქალაქები წარმატებით განახლდა!')
      return true
    } catch (error) {
      console.error('Error saving cities:', error)
      showModal('error', 'ქალაქების შენახვისას მოხდა შეცდომა')
      return false
    }
  }, [supabase, showModal])

  // -------------------------------------------------------------------------
  // Toggle Homepage Featured
  // -------------------------------------------------------------------------
  const handleToggleHomepageFeatured = useCallback(async (specialist: SoloSpecialistProfile) => {
    const newStatus = !specialist.is_homepage_featured
    
    // Check featured count if trying to add
    if (newStatus) {
      const featuredCount = specialists.filter(s => s.is_homepage_featured).length
      if (featuredCount >= 8) {
        showModal('error', 'მაქსიმუმ 8 Featured სპეციალისტი შესაძლებელია')
        return
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_homepage_featured: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', specialist.id)

      if (error) {
        console.error('Toggle homepage featured error:', error)
        showModal('error', 'შეცდომა Featured სტატუსის შეცვლისას')
      } else {
        // Calculate new order
        const maxOrder = Math.max(
          ...specialists
            .filter(s => s.is_homepage_featured && s.id !== specialist.id)
            .map(s => s.homepage_featured_order || 0),
          0
        )
        
        setSpecialists(prev => prev.map(s => 
          s.id === specialist.id 
            ? { 
                ...s, 
                is_homepage_featured: newStatus,
                homepage_featured_order: newStatus ? maxOrder + 1 : null,
                updated_at: new Date().toISOString() 
              }
            : s
        ))
        showModal('success', newStatus ? 'სპეციალისტი დაემატა მთავარ გვერდზე' : 'სპეციალისტი წაიშალა მთავარი გვერდიდან')
      }
    } catch (err) {
      console.error('Toggle homepage featured error:', err)
      showModal('error', 'შეცდომა Featured სტატუსის შეცვლისას')
    }
  }, [specialists, supabase, setSpecialists, showModal])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    handleDelete,
    handleBulkDelete,
    handleToggleBlock,
    handleBulkBlock,
    handleToggleInfoActivate,
    handleChangeVerificationStatus,
    handleSaveEdit,
    handlePhotoUpload,
    handleConvertToCompanySpecialist,
    handleSaveCities,
    handleToggleHomepageFeatured
  }
}

export default useSpecialistActions
