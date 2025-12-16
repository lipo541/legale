'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CompanySpecialistProfile, 
  LoadingStates, 
  VerificationStatus,
  SpecialistEditForm 
} from '../types'

interface UseSpecialistActionsProps {
  specialists: CompanySpecialistProfile[]
  setSpecialists: React.Dispatch<React.SetStateAction<CompanySpecialistProfile[]>>
  setLoading: React.Dispatch<React.SetStateAction<LoadingStates>>
  showModal: (type: 'success' | 'error' | 'confirm', message: string, onConfirm?: () => void) => void
  fetchSpecialists: () => Promise<void>
}

const useSpecialistActions = ({
  specialists,
  setSpecialists,
  setLoading,
  showModal,
  fetchSpecialists
}: UseSpecialistActionsProps) => {
  const supabase = createClient()

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = useCallback(async (specialist: CompanySpecialistProfile) => {
    showModal(
      'confirm', 
      `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} წაშლა? (კომპანია: ${specialist.company_name || 'უცნობი'})`,
      async () => {
        setLoading(prev => ({ ...prev, deleting: specialist.id }))

        try {
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', specialist.id)

          if (error) {
            console.error('Delete error:', error)
            showModal('error', 'შეცდომა წაშლისას')
          } else {
            setSpecialists(prev => prev.filter(s => s.id !== specialist.id))
            showModal('success', 'სპეციალისტი წარმატებით წაიშალა!')
          }
        } catch (err) {
          console.error('Delete error:', err)
          showModal('error', 'შეცდომა წაშლისას')
        } finally {
          setLoading(prev => ({ ...prev, deleting: null }))
        }
      }
    )
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Bulk Delete
  // -------------------------------------------------------------------------
  const handleBulkDelete = useCallback(async (
    selectedIds: string[],
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedIds.length === 0) return

    const selectedSpecialists = specialists.filter(s => selectedIds.includes(s.id))
    const names = selectedSpecialists.map(s => s.full_name || 'უცნობი').join(', ')

    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.length} სპეციალისტის წაშლა? (${names})`, async () => {
      setLoading(prev => ({ ...prev, bulkDeleting: true }))

      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .in('id', selectedIds)

        if (error) {
          console.error('Bulk delete error:', error)
          showModal('error', 'შეცდომა წაშლისას')
        } else {
          setSpecialists(prev => prev.filter(s => !selectedIds.includes(s.id)))
          setSelectedIds([])
          showModal('success', `${selectedIds.length} სპეციალისტი წარმატებით წაიშალა!`)
        }
      } catch (err) {
        console.error('Bulk delete error:', err)
        showModal('error', 'შეცდომა წაშლისას')
      } finally {
        setLoading(prev => ({ ...prev, bulkDeleting: false }))
      }
    })
  }, [specialists, supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Toggle Block
  // -------------------------------------------------------------------------
  const handleToggleBlock = useCallback(async (specialist: CompanySpecialistProfile) => {
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
          console.error('Block toggle error:', error)
          showModal('error', `შეცდომა ${action}სას`)
        } else {
          setSpecialists(prev => prev.map(s =>
            s.id === specialist.id
              ? { ...s, is_blocked: !s.is_blocked, updated_at: new Date().toISOString() }
              : s
          ))
          showModal('success', `სპეციალისტი წარმატებით ${specialist.is_blocked ? 'განიბლოკა' : 'დაიბლოკა'}!`)
        }
      } catch (err) {
        console.error('Block toggle error:', err)
        showModal('error', `შეცდომა ${action}სას`)
      } finally {
        setLoading(prev => ({ ...prev, blocking: null }))
      }
    })
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Bulk Block
  // -------------------------------------------------------------------------
  const handleBulkBlock = useCallback(async (
    selectedIds: string[],
    block: boolean,
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedIds.length === 0) return
    const action = block ? 'დაბლოკვა' : 'განბლოკვა'

    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${selectedIds.length} სპეციალისტის ${action}?`, async () => {
      setLoading(prev => ({ ...prev, bulkBlocking: true }))

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_blocked: block,
            updated_at: new Date().toISOString()
          })
          .in('id', selectedIds)

        if (error) {
          console.error('Bulk block error:', error)
          showModal('error', `შეცდომა ${action}სას`)
        } else {
          setSpecialists(prev => prev.map(s =>
            selectedIds.includes(s.id)
              ? { ...s, is_blocked: block, updated_at: new Date().toISOString() }
              : s
          ))
          setSelectedIds([])
          showModal('success', `${selectedIds.length} სპეციალისტი წარმატებით ${block ? 'დაიბლოკა' : 'განიბლოკა'}!`)
        }
      } catch (err) {
        console.error('Bulk block error:', err)
        showModal('error', `შეცდომა ${action}სას`)
      } finally {
        setLoading(prev => ({ ...prev, bulkBlocking: false }))
      }
    })
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Toggle Info Activate
  // -------------------------------------------------------------------------
  const handleToggleInfoActivate = useCallback(async (specialist: CompanySpecialistProfile) => {
    const action = specialist.info_activate ? 'გამორთვა' : 'ჩართვა'

    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} ინფოს ${action}?`, async () => {
      setLoading(prev => ({ ...prev, togglingInfoActivate: specialist.id }))

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            info_activate: !specialist.info_activate,
            updated_at: new Date().toISOString()
          })
          .eq('id', specialist.id)

        if (error) {
          console.error('Info activate toggle error:', error)
          showModal('error', `შეცდომა ინფოს ${action}სას`)
        } else {
          setSpecialists(prev => prev.map(s =>
            s.id === specialist.id
              ? { ...s, info_activate: !s.info_activate, updated_at: new Date().toISOString() }
              : s
          ))
          showModal('success', `ინფო წარმატებით ${specialist.info_activate ? 'გამოირთო' : 'ჩაირთო'}!`)
        }
      } catch (err) {
        console.error('Info activate toggle error:', err)
        showModal('error', `შეცდომა ინფოს ${action}სას`)
      } finally {
        setLoading(prev => ({ ...prev, togglingInfoActivate: null }))
      }
    })
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Change Verification Status
  // -------------------------------------------------------------------------
  const handleChangeVerificationStatus = useCallback(async (
    specialist: CompanySpecialistProfile,
    newStatus: VerificationStatus,
    notes?: string
  ) => {
    showModal('confirm', `დარწმუნებული ხართ რომ გსურთ ვერიფიკაციის სტატუსის შეცვლა "${newStatus}"-ზე?`, async () => {
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
  // Convert to Solo Specialist
  // -------------------------------------------------------------------------
  const handleConvertToSoloSpecialist = useCallback(async (specialist: CompanySpecialistProfile) => {
    showModal(
      'confirm',
      `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} სოლო სპეციალისტად გადაყვანა? (წაიშლება კომპანიის კავშირი)`,
      async () => {
        setLoading(prev => ({ ...prev, convertingToSolo: specialist.id }))

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              role: 'SOLO_SPECIALIST',
              company_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', specialist.id)

          if (error) {
            console.error('Convert error:', error)
            showModal('error', `შეცდომა გადაყვანისას: ${error.message}`)
          } else {
            setSpecialists(prev => prev.filter(s => s.id !== specialist.id))
            showModal('success', `${specialist.full_name || 'სპეციალისტი'} წარმატებით გადაიყვანა სოლო სპეციალისტად!`)
          }
        } catch (err) {
          console.error('Convert error:', err)
          showModal('error', 'შეცდომა გადაყვანისას')
        } finally {
          setLoading(prev => ({ ...prev, convertingToSolo: null }))
        }
      }
    )
  }, [supabase, setSpecialists, setLoading, showModal])

  // -------------------------------------------------------------------------
  // Change Company
  // -------------------------------------------------------------------------
  const handleChangeCompany = useCallback(async (
    specialistId: string,
    newCompanyId: string,
    newCompanyName: string
  ) => {
    const specialist = specialists.find(s => s.id === specialistId)
    if (!specialist) return

    showModal(
      'confirm',
      `დარწმუნებული ხართ რომ გსურთ ${specialist.full_name || 'სპეციალისტის'} გადაყვანა კომპანია "${newCompanyName}"-ში?`,
      async () => {
        setLoading(prev => ({ ...prev, changingCompany: specialistId }))

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              company_id: newCompanyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', specialistId)

          if (error) {
            console.error('Change company error:', error)
            showModal('error', `შეცდომა კომპანიის შეცვლისას: ${error.message}`)
          } else {
            // Update local state with new company info
            setSpecialists(prev => prev.map(s =>
              s.id === specialistId
                ? { ...s, company_id: newCompanyId, company_name: newCompanyName, updated_at: new Date().toISOString() }
                : s
            ))
            showModal('success', `${specialist.full_name || 'სპეციალისტი'} წარმატებით გადაიყვანა კომპანია "${newCompanyName}"-ში!`)
          }
        } catch (err) {
          console.error('Change company error:', err)
          showModal('error', 'შეცდომა კომპანიის შეცვლისას')
        } finally {
          setLoading(prev => ({ ...prev, changingCompany: null }))
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
    handleConvertToSoloSpecialist,
    handleChangeCompany,
    handleSaveCities
  }
}

export default useSpecialistActions
