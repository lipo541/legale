'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Users, Edit2, Lock, Unlock, Trash2, Save, X, Mail, Phone, User, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Specialist {
  id: string
  full_name: string
  email: string
  phone_number: string | null
  is_blocked: boolean
  created_at: string
  company_id: string | null
}

export default function ManageSpecialistsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [loading, setLoading] = useState(true)
  const [companySlug, setCompanySlug] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  })

  useEffect(() => {
    fetchSpecialists()
  }, [])

  const fetchSpecialists = async () => {
    try {
      const supabase = createClient()
      
      // Get current user's company slug
      const { data: { user } } = await supabase.auth.getUser()
      console.log('🔍 Current User ID:', user?.id)
      
      if (!user) {
        console.log('❌ No user found')
        return
      }

      // Fetch specialists where company_id matches current user's ID
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, created_at, company_id, role, is_blocked')
        .eq('company_id', user.id)
        .eq('role', 'SPECIALIST')
        .order('created_at', { ascending: false })

      console.log('🔍 Fetching specialists for company:', user.id)
      console.log('📊 Query Results:', { 
        data, 
        error, 
        count: data?.length || 0,
        specialists: data?.map(s => ({
          id: s.id,
          name: s.full_name,
          company_id: s.company_id,
          role: s.role
        }))
      })

      if (error) {
        console.error('❌ Error fetching specialists:', error)
      } else {
        // Map data and set is_blocked to false by default if not exists
        const specialistsWithBlock = (data || []).map(s => ({
          ...s,
          is_blocked: s.is_blocked || false
        }))
        console.log('✅ Setting specialists:', specialistsWithBlock.length, 'specialists')
        setSpecialists(specialistsWithBlock)
      }
    } catch (error) {
      console.error('❌ Unexpected Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (specialist: Specialist) => {
    setEditingId(specialist.id)
    setEditForm({
      full_name: specialist.full_name || '',
      email: specialist.email || '',
      phone_number: specialist.phone_number || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ full_name: '', email: '', phone_number: '' })
  }

  const saveEdit = async (specialistId: string) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        email: editForm.email,
        phone_number: editForm.phone_number
      })
      .eq('id', specialistId)

    if (error) {
      console.error('Error updating specialist:', error)
      alert('შეცდომა განახლებისას')
    } else {
      alert('სპეციალისტი წარმატებით განახლდა!')
      setEditingId(null)
      fetchSpecialists()
    }
  }

  const toggleBlock = async (specialistId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'განბლოკვა' : 'დაბლოკვა'
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ სპეციალისტის ${action}?`)) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', specialistId)

    if (error) {
      console.error('Error toggling block:', error)
      alert('შეცდომა')
    } else {
      alert(`სპეციალისტი წარმატებით ${currentStatus ? 'განბლოკილია' : 'დაბლოკილია'}!`)
      fetchSpecialists()
    }
  }

  const deleteSpecialist = async (specialistId: string, name: string) => {
    if (!confirm(`დარწმუნებული ხართ რომ გსურთ ${name}-ის წაშლა? ეს მოქმედება შეუქცევადია!`)) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', specialistId)

    if (error) {
      console.error('Error deleting specialist:', error)
      alert('შეცდომა წაშლისას')
    } else {
      alert('სპეციალისტი წარმატებით წაშლილია!')
      fetchSpecialists()
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
          Manage Specialists
        </h1>
        <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          კომპანიის სპეციალისტების მართვა
        </p>
      </div>

      {specialists.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Users className={`mx-auto h-16 w-16 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <p className={`mt-4 text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            ჯერ არ გაქვთ დამატებული სპეციალისტები
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {specialists.map((specialist) => {
            const isEditing = editingId === specialist.id
            
            return (
              <div
                key={specialist.id}
                className={`rounded-xl border p-6 transition-all duration-300 ${
                  specialist.is_blocked
                    ? isDark ? 'border-red-500/30 bg-red-500/5' : 'border-red-500/30 bg-red-500/5'
                    : isDark ? 'border-white/10 bg-black hover:border-white/20' : 'border-black/10 bg-white hover:border-black/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      specialist.is_blocked
                        ? 'bg-red-500/20'
                        : isDark ? 'bg-white/10' : 'bg-black/10'
                    }`}>
                      <User className={`h-6 w-6 ${
                        specialist.is_blocked
                          ? 'text-red-500'
                          : isDark ? 'text-white' : 'text-black'
                      }`} />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isDark
                                ? 'border-white/10 bg-black text-white'
                                : 'border-black/10 bg-white text-black'
                            }`}
                            placeholder="სახელი და გვარი"
                          />
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isDark
                                ? 'border-white/10 bg-black text-white'
                                : 'border-black/10 bg-white text-black'
                            }`}
                            placeholder="Email"
                          />
                          <input
                            type="tel"
                            value={editForm.phone_number}
                            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              isDark
                                ? 'border-white/10 bg-black text-white'
                                : 'border-black/10 bg-white text-black'
                            }`}
                            placeholder="ტელეფონი"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                            {specialist.full_name}
                            {specialist.is_blocked && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                                <Lock className="h-3 w-3" />
                                დაბლოკილია
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <Mail className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                {specialist.email}
                              </span>
                            </div>
                            {specialist.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className={`h-3 w-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                  {specialist.phone_number}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-white/10">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(specialist.id)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isDark
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                        }`}
                      >
                        <Save className="h-4 w-4" />
                        შენახვა
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-black/10 text-black hover:bg-black/20'
                        }`}
                      >
                        <X className="h-4 w-4" />
                        გაუქმება
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(specialist)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isDark
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                        }`}
                      >
                        <Edit2 className="h-4 w-4" />
                        რედაქტირება
                      </button>
                      <button
                        onClick={() => toggleBlock(specialist.id, specialist.is_blocked)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          specialist.is_blocked
                            ? isDark
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                            : isDark
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30'
                        }`}
                      >
                        {specialist.is_blocked ? (
                          <>
                            <Unlock className="h-4 w-4" />
                            განბლოკვა
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            დაბლოკვა
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteSpecialist(specialist.id, specialist.full_name)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isDark
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        წაშლა
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
