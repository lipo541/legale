'use client'

import { useState, useEffect, Fragment } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Search,
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
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AccessRequest {
  id: string
  user_id: string
  request_type: 'SPECIALIST' | 'COMPANY'
  full_name: string
  company_slug: string | null
  phone_number: string
  about: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  user_email?: string
}

interface VerificationRequest {
  id: string
  email: string | null
  full_name: string | null
  role_title: string | null
  phone_number: string | null
  avatar_url: string | null
  slug: string | null
  bio: string | null
  philosophy: string | null
  languages: string[] | null
  focus_areas: string[] | null
  representative_matters: string[] | null
  teaching_writing_speaking: string | null
  credentials_memberships: string[] | null
  values_how_we_work: Record<string, string> | null
  verification_status: 'pending' | 'verified' | 'rejected' | 'unverified'
  verification_requested_at: string | null
  verification_reviewed_at: string | null
  verification_reviewed_by: string | null
  verification_notes: string | null
  created_at: string
  updated_at: string
}

export default function RequestsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState<'access' | 'verification'>('access')
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<'ALL' | 'pending' | 'verified' | 'rejected'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState<AccessRequest | null>(null)
  const [rejectingVerification, setRejectingVerification] = useState<VerificationRequest | null>(null)

  const supabase = createClient()

  const fetchRequests = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select(`
          *,
          profiles!access_requests_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching requests:', error)
      } else {
        const requestsWithEmail = (data || []).map(req => ({
          ...req,
          user_email: req.profiles?.email || null
        }))
        setRequests(requestsWithEmail)
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVerificationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role_title, phone_number, avatar_url, slug, bio, philosophy, languages, focus_areas, representative_matters, teaching_writing_speaking, credentials_memberships, values_how_we_work, verification_status, verification_requested_at, verification_reviewed_at, verification_reviewed_by, verification_notes, created_at, updated_at')
        .eq('role', 'SOLO_SPECIALIST')
        .in('verification_status', ['pending', 'verified', 'rejected'])
        .order('verification_requested_at', { ascending: false })

      if (error) {
        console.error('Error fetching verification requests:', error)
      } else {
        setVerificationRequests(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
    fetchVerificationRequests()
  }, [])

  const handleViewDetails = (request: AccessRequest | VerificationRequest) => {
    if (expandedId === request.id) {
      setExpandedId(null)
    } else {
      setExpandedId(request.id)
    }
  }

  const handleApprove = async (request: AccessRequest) => {
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${request.full_name}-ის მოთხოვნის დამტკიცება?`)) {
      return
    }

    setProcessingId(request.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('არ ხართ ავტორიზებული')
        return
      }

      // Update user role in profiles
      const newRole = request.request_type === 'SPECIALIST' ? 'SPECIALIST' : 'COMPANY'
      
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

      // If it's a company request and has a slug, copy it to profile
      if (request.request_type === 'COMPANY' && request.company_slug) {
        updateData.company_slug = request.company_slug
      }

      // Copy phone_number from request to profile
      if (request.phone_number) {
        updateData.phone_number = request.phone_number
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', request.user_id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        alert('შეცდომა პროფილის განახლებისას')
        return
      }

      // Update request status
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
        console.error('Request update error:', requestError)
        alert('შეცდომა მოთხოვნის განახლებისას')
      } else {
        await fetchRequests()
        setExpandedId(null)
        alert('მოთხოვნა წარმატებით დამტკიცდა!')
      }
    } catch (err) {
      console.error('Approval error:', err)
      alert('შეცდომა დამტკიცებისას')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = (request: AccessRequest) => {
    setRejectingRequest(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!rejectingRequest) return
    
    if (!rejectionReason.trim()) {
      alert('გთხოვთ მიუთითოთ უარყოფის მიზეზი')
      return
    }

    setProcessingId(rejectingRequest.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('არ ხართ ავტორიზებული')
        return
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
        console.error('Rejection error:', error)
        alert('შეცდომა უარყოფისას')
      } else {
        await fetchRequests()
        setExpandedId(null)
        setShowRejectModal(false)
        setRejectingRequest(null)
        alert('მოთხოვნა უარყოფილია')
      }
    } catch (err) {
      console.error('Rejection error:', err)
      alert('შეცდომა უარყოფისას')
    } finally {
      setProcessingId(null)
    }
  }

  // Verification Request Handlers
  const handleApproveVerification = async (request: VerificationRequest) => {
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${request.full_name}-ის ვერიფიკაციის დამტკიცება?`)) {
      return
    }

    setProcessingId(request.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('არ ხართ ავტორიზებული')
        return
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
        console.error('Verification approval error:', error)
        alert('შეცდომა ვერიფიკაციის დამტკიცებისას')
      } else {
        await fetchVerificationRequests()
        setExpandedId(null)
        alert('ვერიფიკაცია წარმატებით დამტკიცდა!')
      }
    } catch (err) {
      console.error('Verification approval error:', err)
      alert('შეცდომა დამტკიცებისას')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectVerification = (request: VerificationRequest) => {
    setRejectingVerification(request)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const confirmRejectVerification = async () => {
    if (!rejectingVerification) return
    
    if (!rejectionReason.trim()) {
      alert('გთხოვთ მიუთითოთ უარყოფის მიზეზი')
      return
    }

    setProcessingId(rejectingVerification.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('არ ხართ ავტორიზებული')
        return
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
        console.error('Verification rejection error:', error)
        alert('შეცდომა უარყოფისას')
      } else {
        await fetchVerificationRequests()
        setExpandedId(null)
        setShowRejectModal(false)
        setRejectingVerification(null)
        alert('ვერიფიკაცია უარყოფილია')
      }
    } catch (err) {
      console.error('Verification rejection error:', err)
      alert('შეცდომა უარყოფისას')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const filteredVerificationRequests = verificationRequests.filter((request) => {
    const matchesSearch = 
      request.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = verificationStatusFilter === 'ALL' || request.verification_status === verificationStatusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
            <Clock className="h-3.5 w-3.5" />
            მოლოდინში
          </span>
        )
      case 'APPROVED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'}`}>
            <CheckCircle className="h-3.5 w-3.5" />
            დამტკიცებული
          </span>
        )
      case 'REJECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
            <XCircle className="h-3.5 w-3.5" />
            უარყოფილი
          </span>
        )
      default:
        return null
    }
  }

  const getRequestTypeIcon = (type: string) => {
    if (type === 'COMPANY') {
      return <Building2 className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
    }
    return <User className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
  }

  const getRequestTypeBadge = (type: string) => {
    if (type === 'COMPANY') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'}`}>
          <Building2 className="h-3.5 w-3.5" />
          კომპანია
        </span>
      )
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
        <User className="h-3.5 w-3.5" />
        სპეციალისტი
      </span>
    )
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
            <Clock className="h-3.5 w-3.5" />
            მოლოდინში
          </span>
        )
      case 'verified':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-600'}`}>
            <CheckCircle className="h-3.5 w-3.5" />
            ვერიფიცირებული
          </span>
        )
      case 'rejected':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'}`}>
            <XCircle className="h-3.5 w-3.5" />
            უარყოფილი
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            All Requests
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            სპეციალისტებისა და კომპანიების მოთხოვნების მართვა
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('access')}
          className={`rounded-xl px-6 py-3 font-semibold transition-all ${
            activeTab === 'access'
              ? isDark
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDark
              ? 'bg-white/10 text-white/60 hover:bg-white/20'
              : 'bg-black/10 text-black/60 hover:bg-black/20'
          }`}
        >
          Access Requests ({requests.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`rounded-xl px-6 py-3 font-semibold transition-all ${
            activeTab === 'verification'
              ? isDark
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDark
              ? 'bg-white/10 text-white/60 hover:bg-white/20'
              : 'bg-black/10 text-black/60 hover:bg-black/20'
          }`}
        >
          Solo Specialist Verification ({verificationRequests.filter(r => r.verification_status === 'pending').length})
        </button>
      </div>

      {/* Access Requests Tab */}
      {activeTab === 'access' && (
        <>
          {/* Filters */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className={`relative rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა სახელით, ელფოსტით, ტელეფონით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>

        <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
            className={`w-full rounded-xl bg-transparent py-3 px-4 outline-none transition-colors ${
              isDark ? 'text-white' : 'text-black'
            }`}
          >
            <option value="ALL">ყველა სტატუსი</option>
            <option value="PENDING">მოლოდინში</option>
            <option value="APPROVED">დამტკიცებული</option>
            <option value="REJECTED">უარყოფილი</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {!loading && filteredRequests.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოთხოვნა
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ტიპი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  სტატუსი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  თარიღი
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-black' : 'bg-white'}>
              {filteredRequests.map((request) => (
                <Fragment key={request.id}>
                  <tr 
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/5'
                        : 'border-black/10 hover:bg-black/5'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                          {getRequestTypeIcon(request.request_type)}
                        </div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {request.full_name}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {request.user_email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRequestTypeBadge(request.request_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(request.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className={`rounded-lg p-2 transition-colors ${
                            expandedId === request.id
                              ? isDark
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-blue-500/10 text-blue-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალების ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(request)}
                              disabled={processingId === request.id}
                              className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                                isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'
                              }`}
                              title="დამტკიცება"
                            >
                              {processingId === request.id ? (
                                <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                              ) : (
                                <Check className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(request)}
                              disabled={processingId === request.id}
                              className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                                isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                              }`}
                              title="უარყოფა"
                            >
                              <X className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {expandedId === request.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={5} className="px-6 py-6">
                        <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                            მოთხოვნის დეტალები
                          </h3>

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                სახელი / კომპანიის სახელი
                              </label>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {request.full_name}
                              </p>
                            </div>

                            <div>
                              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                <Mail className="h-4 w-4" />
                                ელფოსტა
                              </label>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {request.user_email || 'N/A'}
                              </p>
                            </div>

                            <div>
                              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                <Phone className="h-4 w-4" />
                                ტელეფონი
                              </label>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {request.phone_number}
                              </p>
                            </div>

                            <div>
                              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                <Shield className="h-4 w-4" />
                                მოთხოვნის ტიპი
                              </label>
                              {getRequestTypeBadge(request.request_type)}
                            </div>

                            {request.company_slug && (
                              <div className="sm:col-span-2">
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                  კომპანიის Slug
                                </label>
                                <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                  {request.company_slug}
                                </p>
                              </div>
                            )}

                            <div className="sm:col-span-2">
                              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                <FileText className="h-4 w-4" />
                                ინფორმაცია
                              </label>
                              <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                {request.about}
                              </p>
                            </div>

                            <div>
                              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                <Calendar className="h-4 w-4" />
                                შექმნის თარიღი
                              </label>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {new Date(request.created_at).toLocaleString('ka-GE')}
                              </p>
                            </div>

                            <div>
                              <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                სტატუსი
                              </label>
                              {getStatusBadge(request.status)}
                            </div>

                            {request.reviewed_at && (
                              <div className="sm:col-span-2">
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                  განხილვის თარიღი
                                </label>
                                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                  {new Date(request.reviewed_at).toLocaleString('ka-GE')}
                                </p>
                              </div>
                            )}

                            {request.rejection_reason && (
                              <div className="sm:col-span-2">
                                <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                  უარყოფის მიზეზი
                                </label>
                                <p className={`whitespace-pre-wrap rounded-lg border p-4 text-sm ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>
                                  {request.rejection_reason}
                                </p>
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
      )}

      {!loading && filteredRequests.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery || statusFilter !== 'ALL' ? 'მოთხოვნები ვერ მოიძებნა' : 'მოთხოვნები ჯერ არ არის'}
          </p>
        </div>
      )}
        </>
      )}

      {/* Solo Specialist Verification Requests Tab */}
      {activeTab === 'verification' && (
        <>
          {/* Filters */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className={`relative rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
              <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              <input
                type="text"
                placeholder="ძებნა სახელით, ელფოსტით, ტელეფონით..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
                  isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
                }`}
              />
            </div>

            <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
              <select
                value={verificationStatusFilter}
                onChange={(e) => setVerificationStatusFilter(e.target.value as 'ALL' | 'pending' | 'verified' | 'rejected')}
                className={`w-full rounded-xl bg-transparent py-3 px-4 outline-none transition-colors ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                <option value="ALL">ყველა სტატუსი</option>
                <option value="pending">მოლოდინში</option>
                <option value="verified">ვერიფიცირებული</option>
                <option value="rejected">უარყოფილი</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
            </div>
          )}

          {!loading && filteredVerificationRequests.length > 0 && (
            <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <table className="w-full">
                <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      სპეციალისტი
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      სტატუსი
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      მოთხოვნის თარიღი
                    </th>
                    <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'bg-black' : 'bg-white'}>
                  {filteredVerificationRequests.map((request) => (
                    <Fragment key={request.id}>
                      <tr 
                        className={`border-b transition-colors ${
                          isDark
                            ? 'border-white/10 hover:bg-white/5'
                            : 'border-black/10 hover:bg-black/5'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                              {request.avatar_url ? (
                                <img src={request.avatar_url} alt={request.full_name || ''} className="h-full w-full object-cover" />
                              ) : (
                                <User className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                              )}
                            </div>
                            <div>
                              <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {request.full_name || 'N/A'}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                {request.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getVerificationStatusBadge(request.verification_status)}
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                          {request.verification_requested_at ? new Date(request.verification_requested_at).toLocaleDateString('ka-GE') : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className={`rounded-lg p-2 transition-colors ${
                                expandedId === request.id
                                  ? isDark
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-blue-500/10 text-blue-600'
                                  : isDark 
                                  ? 'hover:bg-white/10' 
                                  : 'hover:bg-black/5'
                              }`}
                              title="დეტალების ნახვა"
                            >
                              <Eye className={`h-4 w-4 ${expandedId === request.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                            </button>
                            {request.verification_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveVerification(request)}
                                  disabled={processingId === request.id}
                                  className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                                    isDark ? 'hover:bg-green-500/20' : 'hover:bg-green-500/10'
                                  }`}
                                  title="ვერიფიკაციის დამტკიცება"
                                >
                                  {processingId === request.id ? (
                                    <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                  ) : (
                                    <Check className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectVerification(request)}
                                  disabled={processingId === request.id}
                                  className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                                    isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                                  }`}
                                  title="ვერიფიკაციის უარყოფა"
                                >
                                  <X className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expandedId === request.id && (
                        <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                          <td colSpan={4} className="px-6 py-6">
                            <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                                ვერიფიკაციის დეტალები
                              </h3>

                              <div className="grid gap-6 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სახელი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {request.full_name || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Mail className="h-4 w-4" />
                                    ელფოსტა
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {request.email || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Phone className="h-4 w-4" />
                                    ტელეფონი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {request.phone_number || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პოზიცია
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {request.role_title || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Slug
                                  </label>
                                  <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                    {request.slug || 'N/A'}
                                  </p>
                                </div>

                                {request.languages && request.languages.length > 0 && (
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      ენები
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {request.languages.map((lang) => (
                                        <span key={lang} className={`px-2 py-1 rounded text-xs font-medium ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600'}`}>
                                          {lang}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სტატუსი
                                  </label>
                                  {getVerificationStatusBadge(request.verification_status)}
                                </div>

                                {request.bio && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      ბიოგრაფია
                                    </label>
                                    <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                      {request.bio}
                                    </p>
                                  </div>
                                )}

                                {request.philosophy && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      ფილოსოფია
                                    </label>
                                    <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                      {request.philosophy}
                                    </p>
                                  </div>
                                )}

                                {request.focus_areas && request.focus_areas.length > 0 && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      Focus Areas
                                    </label>
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {request.focus_areas.map((area, idx) => (
                                        <li key={idx}>{area}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {request.representative_matters && request.representative_matters.length > 0 && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      Representative Matters
                                    </label>
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {request.representative_matters.map((matter, idx) => (
                                        <li key={idx}>{matter}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {request.teaching_writing_speaking && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      Teaching, Writing & Speaking
                                    </label>
                                    <p className={`whitespace-pre-wrap text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                      {request.teaching_writing_speaking}
                                    </p>
                                  </div>
                                )}

                                {request.credentials_memberships && request.credentials_memberships.length > 0 && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      Credentials & Memberships
                                    </label>
                                    <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                      {request.credentials_memberships.map((cred, idx) => (
                                        <li key={idx}>{cred}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {request.values_how_we_work && Object.keys(request.values_how_we_work).length > 0 && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      Values & How We Work
                                    </label>
                                    <div className="space-y-2">
                                      {Object.entries(request.values_how_we_work).map(([key, val]) => (
                                        <div key={key} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                          <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            {key}
                                          </p>
                                          <p className={`text-sm mt-1 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                            {val}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {request.verification_requested_at && (
                                  <div>
                                    <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      <Calendar className="h-4 w-4" />
                                      მოთხოვნის თარიღი
                                    </label>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      {new Date(request.verification_requested_at).toLocaleString('ka-GE')}
                                    </p>
                                  </div>
                                )}

                                {request.verification_reviewed_at && (
                                  <div>
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      განხილვის თარიღი
                                    </label>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      {new Date(request.verification_reviewed_at).toLocaleString('ka-GE')}
                                    </p>
                                  </div>
                                )}

                                {request.verification_notes && (
                                  <div className="sm:col-span-2">
                                    <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                      შენიშვნები / უარყოფის მიზეზი
                                    </label>
                                    <p className={`whitespace-pre-wrap rounded-lg border p-4 text-sm ${isDark ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-red-500/20 bg-red-500/5 text-red-600'}`}>
                                      {request.verification_notes}
                                    </p>
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
          )}

          {!loading && filteredVerificationRequests.length === 0 && (
            <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
              <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {searchQuery || verificationStatusFilter !== 'ALL' ? 'ვერიფიკაციის მოთხოვნები ვერ მოიძებნა' : 'ვერიფიკაციის მოთხოვნები ჯერ არ არის'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (rejectingRequest || rejectingVerification) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
              {rejectingRequest ? 'მოთხოვნის უარყოფა' : 'ვერიფიკაციის უარყოფა'}
            </h3>
            <p className={`mb-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              გთხოვთ მიუთითოთ უარყოფის მიზეზი:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="მიზეზი..."
              rows={4}
              className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors resize-none ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40'
                  : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
              }`}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={rejectingRequest ? confirmReject : confirmRejectVerification}
                disabled={processingId === (rejectingRequest?.id || rejectingVerification?.id)}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                  isDark
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {processingId === (rejectingRequest?.id || rejectingVerification?.id) ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    უარყოფა...
                  </span>
                ) : (
                  'უარყოფა'
                )}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingRequest(null)
                  setRejectingVerification(null)
                  setRejectionReason('')
                }}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all duration-300 ${
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
  )
}
