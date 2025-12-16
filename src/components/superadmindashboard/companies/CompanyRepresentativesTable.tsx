'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Building2,
  User,
  Phone,
  Mail,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  ArrowLeft,
  Search,
  Ban
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CompanySpecialist {
  id: string
  full_name: string | null
  email: string | null
  phone_number: string | null
  role_title: string | null
  avatar_url: string | null
  is_blocked: boolean | null
}

interface CompanyWithSpecialists {
  id: string
  full_name: string | null
  company_slug: string | null
  email: string | null
  is_blocked: boolean | null
  specialists: CompanySpecialist[]
}

interface CompanyRepresentativesTableProps {
  onBack?: () => void
}

export default function CompanyRepresentativesTable({ onBack }: CompanyRepresentativesTableProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [companies, setCompanies] = useState<CompanyWithSpecialists[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  const fetchCompaniesWithSpecialists = useCallback(async () => {
    setLoading(true)
    
    try {
      // Fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('profiles')
        .select('id, full_name, company_slug, email, is_blocked')
        .eq('role', 'COMPANY')
        .order('full_name', { ascending: true })

      if (companiesError) {
        console.error('Error fetching companies:', companiesError)
        setLoading(false)
        return
      }

      // For each company, fetch their specialists
      const companiesWithSpecialists = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: specialistsData, error: specialistsError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number, role_title, avatar_url, is_blocked')
            .eq('role', 'SPECIALIST')
            .eq('company_id', company.id)
            .order('full_name', { ascending: true })

          if (specialistsError) {
            console.error(`Error fetching specialists for company ${company.id}:`, specialistsError)
          }

          return {
            ...company,
            specialists: specialistsData || []
          }
        })
      )

      setCompanies(companiesWithSpecialists)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCompaniesWithSpecialists()
  }, [fetchCompaniesWithSpecialists])

  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedCompanyId(expandedCompanyId === companyId ? null : companyId)
  }

  const filteredCompanies = companies.filter((company) => {
    const companyMatches = 
      company.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.company_slug?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Also search in specialists
    const specialistMatches = company.specialists.some(specialist =>
      specialist.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialist.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return companyMatches || specialistMatches
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              title="უკან დაბრუნება"
            >
              <ArrowLeft className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
            </button>
          )}
          <div>
            <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              კომპანიების წარმომადგენლები
            </h2>
            <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              სულ: {companies.length} კომპანია
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`relative rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
        <Search className={`absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        <input
          type="text"
          placeholder="ძებნა კომპანიით, სპეციალისტით..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-lg bg-transparent py-2 pl-9 pr-4 text-xs outline-none transition-colors ${
            isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
          }`}
        />
      </div>

      {filteredCompanies.length === 0 ? (
        <div className={`rounded-lg border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'შედეგები ვერ მოიძებნა' : 'კომპანიები ჯერ არ არის'}
          </p>
        </div>
      ) : (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
          {filteredCompanies.map((company) => (
            <div key={company.id}>
              {/* Company Header */}
              <button
                onClick={() => toggleCompanyExpansion(company.id)}
                className={`w-full px-4 py-3 transition-colors ${
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                } ${expandedCompanyId === company.id ? (isDark ? 'bg-white/5' : 'bg-black/5') : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                          {company.full_name || 'N/A'}
                        </h3>
                        {company.is_blocked && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                            isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                          }`}>
                            <Ban className="h-2 w-2" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {company.company_slug && (
                          <p className={`text-[10px] font-mono ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                            /{company.company_slug}
                          </p>
                        )}
                        {company.email && (
                          <p className={`text-[10px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                            {company.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 rounded-full px-2 py-1 ${
                      isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                    }`}>
                      <Users className={`h-3 w-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={`text-[10px] font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {company.specialists.length}
                      </span>
                    </div>
                    {expandedCompanyId === company.id ? (
                      <ChevronUp className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                    ) : (
                      <ChevronDown className={`h-4 w-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                    )}
                  </div>
                </div>
              </button>

              {/* Specialists Table */}
              {expandedCompanyId === company.id && (
                <div className={`border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                  {company.specialists.length === 0 ? (
                    <div className="px-4 py-4 text-center">
                      <p className={`text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        ამ კომპანიას ჯერ არ ყავს დამატებული სპეციალისტები
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                          <tr>
                            <th className={`px-4 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                              სპეციალისტი
                            </th>
                            <th className={`px-4 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                              პოზიცია
                            </th>
                            <th className={`px-4 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                              ელფოსტა
                            </th>
                            <th className={`px-4 py-2 text-left text-[10px] font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                              ტელეფონი
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {company.specialists.map((specialist) => (
                            <tr
                              key={specialist.id}
                              className={`border-t ${
                                isDark
                                  ? 'border-white/5 hover:bg-white/5'
                                  : 'border-black/5 hover:bg-black/5'
                              }`}
                            >
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                    isDark ? 'bg-white/10' : 'bg-black/10'
                                  }`}>
                                    {specialist.avatar_url ? (
                                      <img
                                        src={specialist.avatar_url}
                                        alt={specialist.full_name || 'Specialist'}
                                        className="h-full w-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <User className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      {specialist.full_name || 'N/A'}
                                    </span>
                                    {specialist.is_blocked && (
                                      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${
                                        isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-600'
                                      }`}>
                                        <Ban className="h-2 w-2" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className={`px-4 py-2 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                {specialist.role_title || '-'}
                              </td>
                              <td className="px-4 py-2">
                                {specialist.email ? (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                                    <span className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      {specialist.email}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>-</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {specialist.phone_number ? (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                                    <span className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      {specialist.phone_number}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-black/30'}`}>-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}
