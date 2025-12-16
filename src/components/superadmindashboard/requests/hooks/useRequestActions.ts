'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AccessRequest, VerificationRequest, CompanyVerificationRequest } from '../types'

interface UseRequestActionsProps {
  onSuccess: () => void
}

export function useRequestActions({ onSuccess }: UseRequestActionsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectingRequest, setRejectingRequest] = useState<AccessRequest | null>(null)
  const [rejectingVerification, setRejectingVerification] = useState<VerificationRequest | CompanyVerificationRequest | null>(null)

  const supabase = createClient()

  // Approve access request
  const approveAccessRequest = useCallback(async (request: AccessRequest) => {
    setProcessingId(request.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const newRole = request.request_type === 'SOLO_SPECIALIST' 
        ? 'SOLO_SPECIALIST' 
        : request.request_type === 'SPECIALIST' 
        ? 'SPECIALIST' 
        : 'COMPANY'
      
      const updateData: {
        role: string
        full_name: string
        updated_at: string
        company_slug?: string
        phone_number?: string
      } = {
        role: newRole,
        full_name: request.full_name,
        updated_at: new Date().toISOString()
      }

      if (request.request_type === 'COMPANY' && request.company_slug) {
        updateData.company_slug = request.company_slug
      }

      if (request.phone_number) {
        updateData.phone_number = request.phone_number
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', request.user_id)

      if (profileError) {
        return { success: false, error: 'შეცდომა პროფილის განახლებისას' }
      }

      const { error: requestError } = await supabase
        .from('access_requests')
        .update({
          status: 'APPROVED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (requestError) {
        return { success: false, error: 'შეცდომა მოთხოვნის განახლებისას' }
      }

      onSuccess()
      return { success: true, message: 'მოთხოვნა წარმატებით დამტკიცდა!' }
    } catch {
      return { success: false, error: 'შეცდომა დამტკიცებისას' }
    } finally {
      setProcessingId(null)
    }
  }, [supabase, onSuccess])

  // Reject access request
  const rejectAccessRequest = useCallback(async () => {
    if (!rejectingRequest) return { success: false, error: 'მოთხოვნა არ არის არჩეული' }
    
    if (!rejectionReason.trim()) {
      return { success: false, error: 'გთხოვთ მიუთითოთ უარყოფის მიზეზი' }
    }

    setProcessingId(rejectingRequest.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'REJECTED',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', rejectingRequest.id)

      if (error) {
        return { success: false, error: 'შეცდომა უარყოფისას' }
      }

      onSuccess()
      closeRejectModal()
      return { success: true, message: 'მოთხოვნა უარყოფილია' }
    } catch {
      return { success: false, error: 'შეცდომა უარყოფისას' }
    } finally {
      setProcessingId(null)
    }
  }, [rejectingRequest, rejectionReason, supabase, onSuccess])

  // Approve verification
  const approveVerification = useCallback(async (request: VerificationRequest | CompanyVerificationRequest) => {
    setProcessingId(request.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          verification_reviewed_by: user.id,
          verification_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) {
        return { success: false, error: 'შეცდომა ვერიფიკაციის დამტკიცებისას' }
      }

      onSuccess()
      return { success: true, message: 'ვერიფიკაცია წარმატებით დამტკიცდა!' }
    } catch {
      return { success: false, error: 'შეცდომა დამტკიცებისას' }
    } finally {
      setProcessingId(null)
    }
  }, [supabase, onSuccess])

  // Reject verification
  const rejectVerification = useCallback(async () => {
    if (!rejectingVerification) return { success: false, error: 'მოთხოვნა არ არის არჩეული' }
    
    if (!rejectionReason.trim()) {
      return { success: false, error: 'გთხოვთ მიუთითოთ უარყოფის მიზეზი' }
    }

    setProcessingId(rejectingVerification.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { success: false, error: 'არ ხართ ავტორიზებული' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          verification_reviewed_by: user.id,
          verification_reviewed_at: new Date().toISOString(),
          verification_notes: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', rejectingVerification.id)

      if (error) {
        return { success: false, error: 'შეცდომა უარყოფისას' }
      }

      onSuccess()
      closeRejectModal()
      return { success: true, message: 'ვერიფიკაცია უარყოფილია' }
    } catch {
      return { success: false, error: 'შეცდომა უარყოფისას' }
    } finally {
      setProcessingId(null)
    }
  }, [rejectingVerification, rejectionReason, supabase, onSuccess])

  // Modal helpers
  const openRejectModal = useCallback((request: AccessRequest | VerificationRequest | CompanyVerificationRequest, type: 'access' | 'verification') => {
    setRejectionReason('')
    if (type === 'access') {
      setRejectingRequest(request as AccessRequest)
      setRejectingVerification(null)
    } else {
      setRejectingVerification(request as VerificationRequest | CompanyVerificationRequest)
      setRejectingRequest(null)
    }
    setShowRejectModal(true)
  }, [])

  const closeRejectModal = useCallback(() => {
    setShowRejectModal(false)
    setRejectingRequest(null)
    setRejectingVerification(null)
    setRejectionReason('')
  }, [])

  return {
    // State
    processingId,
    showRejectModal,
    rejectionReason,
    rejectingRequest,
    rejectingVerification,
    // Setters
    setRejectionReason,
    // Actions
    approveAccessRequest,
    rejectAccessRequest,
    approveVerification,
    rejectVerification,
    openRejectModal,
    closeRejectModal
  }
}
