'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  User,
  Calendar,
  Loader2,
  Shield,
  X,
  Award, // Award icon for Author role
  UserCog // Add UserCog icon for Moderator role
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'USER' | 'AUTHOR' | 'MODERATOR' // Allow USER, AUTHOR, and MODERATOR roles
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function UsersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: ''
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [authorRoleUpdatingId, setAuthorRoleUpdatingId] = useState<string | null>(null)
  const [moderatorRoleUpdatingId, setModeratorRoleUpdatingId] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch USER, AUTHOR, and MODERATOR role users from database
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['USER', 'AUTHOR', 'MODERATOR']) // Fetch USER, AUTHOR, and MODERATOR
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleViewDetails = (user: UserProfile) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(user.id)
      setEditingUser(null)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    setUpdatingId(editingUser.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchUsers()
        setEditingUser(null)
        setExpandedUserId(null)
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა განახლებისას')
    } finally {
      setUpdatingId(null)
    }
  }

  // Toggle Author role (USER <-> AUTHOR)
  const handleAuthorRoleToggle = async (user: UserProfile) => {
    // If currently AUTHOR, switch to USER
    // If currently USER or MODERATOR, switch to AUTHOR
    const newRole: 'USER' | 'AUTHOR' | 'MODERATOR' = user.role === 'AUTHOR' ? 'USER' : 'AUTHOR'
    
    setAuthorRoleUpdatingId(user.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Author role update error:', error)
        alert('ავტორის როლის განახლებისას მოხდა შეცდომა: ' + error.message)
      } else {
        // Update local state for immediate UI feedback
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === user.id ? { ...u, role: newRole } : u)
        )
      }
    } catch (err) {
      console.error('Catch error on author role update:', err)
      alert('ავტორის როლის განახლებისას მოხდა შეცდომა')
    } finally {
      setAuthorRoleUpdatingId(null)
    }
  }

  // Toggle Moderator role (USER <-> MODERATOR)
  const handleModeratorRoleToggle = async (user: UserProfile) => {
    // If currently MODERATOR, switch to USER
    // If currently USER or AUTHOR, switch to MODERATOR
    const newRole: 'USER' | 'AUTHOR' | 'MODERATOR' = user.role === 'MODERATOR' ? 'USER' : 'MODERATOR'
    
    setModeratorRoleUpdatingId(user.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Moderator role update error:', error)
        alert('მოდერატორის როლის განახლებისას მოხდა შეცდომა: ' + error.message)
      } else {
        // Update local state for immediate UI feedback
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === user.id ? { ...u, role: newRole } : u)
        )
      }
    } catch (err) {
      console.error('Catch error on moderator role update:', err)
      alert('მოდერატორის როლის განახლებისას მოხდა შეცდომა')
    } finally {
      setModeratorRoleUpdatingId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ მომხმარებლის წაშლა?')) {
      return
    }

    setDeletingId(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Delete error:', error)
        alert('შეცდომა წაშლისას: ' + error.message)
      } else {
        await fetchUsers()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Users
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            USER, AUTHOR და MODERATOR როლების მართვა
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className={`relative rounded-xl border ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <Search className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="ძებნა სახელით, ელფოსტით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl bg-transparent py-3 pl-12 pr-4 outline-none transition-colors ${
              isDark ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'
            }`}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {/* Users Table */}
      {!loading && filteredUsers.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მომხმარებელი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  როლი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ავტორის როლი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოდერატორის როლი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  რეგისტრაცია
                </th>
                <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className={isDark ? 'bg-black' : 'bg-white'}>
              {filteredUsers.map((user) => (
                <Fragment key={user.id}>
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
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <User className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {user.full_name || 'N/A'}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {user.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                        user.role === 'AUTHOR'
                          ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                          : user.role === 'MODERATOR'
                          ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
                          : isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {user.role === 'AUTHOR' ? 'ავტორი' : user.role === 'MODERATOR' ? 'მოდერატორი' : 'მომხმარებელი'}
                      </span>
                    </td>
                    
                    {/* Author Role Toggle */}
                    <td className="px-6 py-4">
                      {authorRoleUpdatingId === user.id ? (
                        <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                      ) : (
                        <button
                          onClick={() => handleAuthorRoleToggle(user)}
                          disabled={moderatorRoleUpdatingId === user.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.role === 'AUTHOR' 
                              ? 'bg-blue-500' 
                              : isDark ? 'bg-white/20' : 'bg-black/20'
                          } ${isDark ? 'focus:ring-offset-black' : 'focus:ring-offset-white'}`}
                          title={user.role === 'AUTHOR' ? 'ავტორის როლის ჩამორთმევა' : 'ავტორის როლის მინიჭება'}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              user.role === 'AUTHOR' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </td>
                    
                    {/* Moderator Role Toggle */}
                    <td className="px-6 py-4">
                      {moderatorRoleUpdatingId === user.id ? (
                        <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                      ) : (
                        <button
                          onClick={() => handleModeratorRoleToggle(user)}
                          disabled={authorRoleUpdatingId === user.id}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.role === 'MODERATOR' 
                              ? 'bg-purple-500' 
                              : isDark ? 'bg-white/20' : 'bg-black/20'
                          } ${isDark ? 'focus:ring-offset-black' : 'focus:ring-offset-white'}`}
                          title={user.role === 'MODERATOR' ? 'მოდერატორის როლის ჩამორთმევა' : 'მოდერატორის როლის მინიჭება'}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              user.role === 'MODERATOR' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </td>
                    
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(user.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className={`rounded-lg p-2 transition-colors ${
                            expandedUserId === user.id
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალების ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${expandedUserId === user.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingId === user.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Dropdown */}
                  {expandedUserId === user.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={6} className="px-6 py-6">
                        <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          {editingUser?.id === user.id ? (
                            /* Edit Mode */
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  მომხმარებლის რედაქტირება
                                </h3>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                  <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                {/* Full Name */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სახელი და გვარი
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                {/* Email */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ელფოსტა
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className={`w-full rounded-lg border px-4 py-2 transition-colors ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white focus:border-white/20'
                                        : 'border-black/10 bg-black/5 text-black focus:border-black/20'
                                    }`}
                                  />
                                </div>

                                {/* User ID (Read-only) */}
                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    User ID
                                  </label>
                                  <input
                                    type="text"
                                    value={user.id}
                                    readOnly
                                    className={`w-full rounded-lg border px-4 py-2 cursor-not-allowed ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white/40'
                                        : 'border-black/10 bg-black/5 text-black/40'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={updatingId === user.id}
                                  className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                                    isDark
                                      ? 'bg-emerald-500 hover:bg-emerald-600'
                                      : 'bg-emerald-500 hover:bg-emerald-600'
                                  }`}
                                >
                                  {updatingId === user.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      შენახვა...
                                    </span>
                                  ) : (
                                    'შენახვა'
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
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
                          ) : (
                            /* View Mode */
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  მომხმარებლის დეტალები
                                </h3>
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                    isDark
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                      : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  <Edit className="h-4 w-4" />
                                  რედაქტირება
                                </button>
                              </div>

                              <div className="grid gap-6 sm:grid-cols-2">
                                {/* Profile Picture */}
                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    პროფილის სურათი
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                      {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full rounded-full object-cover" />
                                      ) : (
                                        <User className={`h-8 w-8 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                      )}
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      {user.avatar_url || 'სურათი არ არის'}
                                    </p>
                                  </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სახელი და გვარი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {user.full_name || 'N/A'}
                                  </p>
                                </div>

                                {/* Email */}
                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Mail className="h-4 w-4" />
                                    ელფოსტა
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {user.email || 'N/A'}
                                  </p>
                                </div>

                                {/* Role */}
                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Shield className="h-4 w-4" />
                                    როლი
                                  </label>
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                                    user.role === 'AUTHOR'
                                      ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
                                      : user.role === 'MODERATOR'
                                      ? isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
                                      : isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/10 text-gray-600'
                                  }`}>
                                    {user.role === 'AUTHOR' ? (
                                      <Award className="h-4 w-4" />
                                    ) : user.role === 'MODERATOR' ? (
                                      <UserCog className="h-4 w-4" />
                                    ) : (
                                      <Shield className="h-4 w-4" />
                                    )}
                                    {user.role === 'AUTHOR' ? 'ავტორი' : user.role === 'MODERATOR' ? 'მოდერატორი' : 'მომხმარებელი'}
                                  </span>
                                </div>

                                {/* Created At */}
                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Calendar className="h-4 w-4" />
                                    რეგისტრაცია
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(user.created_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>

                                {/* Updated At */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ბოლო განახლება
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(user.updated_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>

                                {/* User ID */}
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    User ID
                                  </label>
                                  <p className={`font-mono text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    {user.id}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
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

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'მომხმარებლები ვერ მოიძებნა' : 'USER, AUTHOR ან MODERATOR როლის მომხმარებლები ჯერ არ არის'}
          </p>
        </div>
      )}
    </div>
  )
}
