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
        setRequests(data as any || [])
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
      .select('user_id, company_id, company_slug')
      .eq('id', requestId)
      .single()

    if (!request) {
      alert('მოთხოვნა ვერ მოიძებნა')
      return
    }

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
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'SPECIALIST',
        company_id: request.company_id,
        company_slug: request.company_slug // Keep slug for URL purposes
      })
      .eq('id', request.user_id)

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          იტვირთება...
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Specialist Requests
        </h1>
        <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          თქვენს კომპანიაში გაწევრიანების მსურველი სპეციალისტები
        </p>
      </div>

      {requests.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <ClipboardList className={`mx-auto h-16 w-16 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`mt-4 text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            ამჟამად არ არის მოთხოვნები
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`rounded-xl border p-6 transition-all duration-300 ${
                isDark ? 'border-white/10 bg-black hover:border-white/20' : 'border-black/10 bg-white hover:border-black/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                    <User className={`h-6 w-6 ${isDark ? 'text-white' : 'text-black'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      {request.profiles?.full_name || request.full_name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {request.profiles?.email}
                    </p>
                    {request.profiles?.full_name && request.profiles.full_name !== request.full_name && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        კომპანია: {request.full_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {request.status === 'PENDING' && (
                    <span className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      <Clock className="h-4 w-4" />
                      Pending
                    </span>
                  )}
                  {request.status === 'APPROVED' && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      Approved
                    </span>
                  )}
                  {request.status === 'REJECTED' && (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    {request.phone_number}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className={`h-4 w-4 mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                    {request.about}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {new Date(request.created_at).toLocaleDateString('ka-GE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {request.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isDark
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    დადასტურება
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      isDark
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
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
