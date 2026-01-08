'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { ClipboardList, CheckCircle, XCircle, Clock, User, Phone, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SpecialistRequest {
  id: string
  user_id: string
  full_name: string
  phone_number: string
  about: string
  status: string
  created_at: string
  profiles: {
    email: string
    full_name: string
  } | null
}

export default function SpecialistRequestsPage({ onRequestUpdate }: { onRequestUpdate?: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [requests, setRequests] = useState<SpecialistRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const supabase = createClient()
      
      // Get current user's company ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCompanyId(user.id)

      // Fetch specialist requests for this company
      const { data, error } = await supabase
        .from('access_requests')
        .select(`
          id,
          user_id,
          full_name,
          phone_number,
          about,
          status,
          created_at,
          profiles!access_requests_user_id_fkey (
            email,
            full_name
          )
        `)
        .eq('company_id', user.id)
        .eq('request_type', 'SPECIALIST')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching requests:', error)
      } else {
        // Transform the data to extract single profile object from array
        const transformedData = (data || []).map(item => ({
          ...item,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
        }))
        setRequests(transformedData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    const supabase = createClient()
    
    // First, get the request details
    const { data: request } = await supabase
      .from('access_requests')
      .select('user_id, company_id')
      .eq('id', requestId)
      .single()

    if (!request) {
      alert('მოთხოვნა ვერ მოიძებნა')
      return
    }

    console.log('🔍 Approving request:', {
      requestId,
      user_id: request.user_id,
      company_id: request.company_id,
      current_company_id: companyId
    })

    // Update access request status
    const { error: requestError } = await supabase
      .from('access_requests')
      .update({
        status: 'APPROVED',
        reviewed_by: companyId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (requestError) {
      console.error('Error approving request:', requestError)
      alert('შეცდომა მოთხოვნის დადასტურებისას')
      return
    }

    // Update user profile with SPECIALIST role and company_id
    // company_id should be set to the company that approved the request
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'SPECIALIST',
        company_id: request.company_id // This is already the correct company ID from access_requests
      })
      .eq('id', request.user_id)

    console.log('✅ Profile update:', {
      user_id: request.user_id,
      setting_company_id: request.company_id,
      error: profileError
    })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      alert('შეცდომა პროფილის განახლებისას')
    } else {
      alert('სპეციალისტი წარმატებით დადასტურდა!')
      fetchRequests()
      onRequestUpdate?.() // Update badge count
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('გთხოვთ მიუთითოთ უარყოფის მიზეზი:')
    if (!reason) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from('access_requests')
      .update({
        status: 'REJECTED',
        reviewed_by: companyId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error rejecting request:', error)
      alert('შეცდომა უარყოფისას')
    } else {
      alert('მოთხოვნა უარყოფილია')
      fetchRequests()
      onRequestUpdate?.() // Update badge count
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] px-4 sm:px-6 lg:px-8">
        <div className={`animate-spin rounded-full h-6 w-6 border-2 border-t-transparent ${isDark ? 'border-white' : 'border-black'}`} />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-500/10'}`}>
            <ClipboardList className={`h-4 w-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
          </div>
          <div>
            <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              მოთხოვნები
            </h1>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {requests.filter(r => r.status === 'PENDING').length} მოლოდინში
            </p>
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <ClipboardList className={`mx-auto h-12 w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`mt-3 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            ამჟამად არ არის მოთხოვნები
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`rounded-lg border p-3 transition-all ${
                isDark ? 'border-white/10 bg-white/5 hover:border-white/20' : 'border-black/10 bg-black/5 hover:border-black/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <User className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>
                      {request.profiles?.full_name || request.full_name}
                    </h3>
                    <p className={`text-xs truncate ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {request.profiles?.email}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {request.status === 'PENDING' && (
                    <span className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                      <Clock className="h-3 w-3" />
                      მოლოდინში
                    </span>
                  )}
                  {request.status === 'APPROVED' && (
                    <span className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium bg-green-500/20 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" />
                      დადასტურებული
                    </span>
                  )}
                  {request.status === 'REJECTED' && (
                    <span className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium bg-red-500/20 text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3" />
                      უარყოფილი
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className={`mt-2 pt-2 border-t space-y-1.5 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-center gap-1.5">
                  <Phone className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {request.phone_number}
                  </span>
                </div>
                {request.about && (
                  <div className="flex items-start gap-1.5">
                    <FileText className={`h-3 w-3 mt-0.5 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                    <p className={`text-xs line-clamp-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      {request.about}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {new Date(request.created_at).toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {request.status === 'PENDING' && (
                <div className={`flex gap-2 mt-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <button
                    onClick={() => handleApprove(request.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
                      isDark
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    დადასტურება
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
                      isDark
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    უარყოფა
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
