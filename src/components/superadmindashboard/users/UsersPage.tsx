'use client'

import { useState, useEffect, Fragment, useCallback, useMemo, memo } from 'react'
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
  Award,
  UserCog,
  Users,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RefreshCw,
  CheckSquare,
  Square,
  Trash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  UserCheck,
  UserX,
  Filter,
  Clock,
  Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Modal from '@/components/common/Modal'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

type UserRole = 'USER' | 'AUTHOR' | 'MODERATOR'
type SortColumn = 'created_at' | 'full_name' | 'email' | 'role' | 'updated_at'
type SortOrder = 'asc' | 'desc'

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  users: number
  authors: number
  moderators: number
  filtered: number
}

// ============================================================================
// Memoized Components
// ============================================================================

const StatsCard = memo(function StatsCard({ 
  label, 
  value, 
  isDark,
  icon: Icon,
  color
}: { 
  label: string
  value: number
  isDark: boolean
  icon?: React.ComponentType<{ className?: string }>
  color?: 'default' | 'blue' | 'purple' | 'gray'
}) {
  const colorClasses = {
    default: isDark ? 'text-white/40' : 'text-black/40',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    gray: isDark ? 'text-gray-400' : 'text-gray-500'
  }

  return (
    <div className={`rounded-lg border p-3 transition-all hover:scale-[1.02] ${
      isDark ? 'border-white/10 bg-white/5 hover:bg-white/[0.07]' : 'border-black/10 bg-black/5 hover:bg-black/[0.07]'
    }`}>
      <div className="flex items-center justify-between">
        <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {value}
        </div>
        {Icon && (
          <Icon className={`h-4 w-4 ${colorClasses[color || 'default']}`} />
        )}
      </div>
      <div className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {label}
      </div>
    </div>
  )
})

// Role Badge Component
const RoleBadge = memo(function RoleBadge({ 
  role, 
  isDark,
  size = 'sm'
}: { 
  role: UserRole
  isDark: boolean
  size?: 'sm' | 'md'
}) {
  const config = {
    USER: {
      label: 'მომხმარებელი',
      icon: User,
      classes: isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/10 text-gray-600'
    },
    AUTHOR: {
      label: 'ავტორი',
      icon: Award,
      classes: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
    },
    MODERATOR: {
      label: 'მოდერატორი',
      icon: UserCog,
      classes: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-600'
    }
  }

  const { label, icon: Icon, classes } = config[role]
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[9px] gap-1' 
    : 'px-3 py-1.5 text-xs gap-1.5'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${classes} ${sizeClasses}`}>
      <Icon className={iconSize} />
      {label}
    </span>
  )
})

// Toggle Switch Component
const ToggleSwitch = memo(function ToggleSwitch({
  isActive,
  isLoading,
  isDisabled,
  onClick,
  isDark,
  activeColor,
  title
}: {
  isActive: boolean
  isLoading: boolean
  isDisabled: boolean
  onClick: () => void
  isDark: boolean
  activeColor: 'blue' | 'purple'
  title: string
}) {
  if (isLoading) {
    return <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
  }

  const bgColor = isActive 
    ? activeColor === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
    : isDark ? 'bg-white/20' : 'bg-black/20'

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${bgColor}`}
      title={title}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isActive ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export default function UsersPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  // ============================================================================
  // State
  // ============================================================================

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Sorting
  const [sortBy, setSortBy] = useState<SortColumn>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Expanded/Edit
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', email: '' })

  // Loading states
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [authorRoleUpdatingId, setAuthorRoleUpdatingId] = useState<string | null>(null)
  const [moderatorRoleUpdatingId, setModeratorRoleUpdatingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Modal
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; userId?: string; isBulk?: boolean }>({ show: false })

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['USER', 'AUTHOR', 'MODERATOR'])
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

  // ============================================================================
  // Computed Values
  // ============================================================================

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user => 
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      result = result.filter(user => user.role === roleFilter)
    }

    // Date filters
    if (dateFrom) {
      result = result.filter(user => new Date(user.created_at) >= new Date(dateFrom))
    }
    if (dateTo) {
      result = result.filter(user => new Date(user.created_at) <= new Date(dateTo + 'T23:59:59'))
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'full_name':
          comparison = (a.full_name || '').localeCompare(b.full_name || '')
          break
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '')
          break
        case 'role':
          comparison = a.role.localeCompare(b.role)
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [users, searchQuery, roleFilter, dateFrom, dateTo, sortBy, sortOrder])

  const stats: Stats = useMemo(() => ({
    total: users.length,
    users: users.filter(u => u.role === 'USER').length,
    authors: users.filter(u => u.role === 'AUTHOR').length,
    moderators: users.filter(u => u.role === 'MODERATOR').length,
    filtered: filteredAndSortedUsers.length
  }), [users, filteredAndSortedUsers])

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedUsers.slice(start, start + itemsPerPage)
  }, [filteredAndSortedUsers, currentPage, itemsPerPage])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }, [sortBy])

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)))
    }
  }, [selectedUsers.size, paginatedUsers])

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }, [])

  const handleViewDetails = useCallback((user: UserProfile) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(user.id)
      setEditingUser(null)
    }
  }, [expandedUserId])

  const handleEditUser = useCallback((user: UserProfile) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || ''
    })
  }, [])

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

  const handleAuthorRoleToggle = async (user: UserProfile) => {
    const newRole: UserRole = user.role === 'AUTHOR' ? 'USER' : 'AUTHOR'
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
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('ავტორის როლის განახლებისას მოხდა შეცდომა')
    } finally {
      setAuthorRoleUpdatingId(null)
    }
  }

  const handleModeratorRoleToggle = async (user: UserProfile) => {
    const newRole: UserRole = user.role === 'MODERATOR' ? 'USER' : 'MODERATOR'
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
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('მოდერატორის როლის განახლებისას მოხდა შეცდომა')
    } finally {
      setModeratorRoleUpdatingId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId)
    setDeleteModal({ show: false })

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
        setSelectedUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return

    setBulkDeleting(true)
    setDeleteModal({ show: false })

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', Array.from(selectedUsers))

      if (error) {
        console.error('Bulk delete error:', error)
        alert('შეცდომა წაშლისას: ' + error.message)
      } else {
        await fetchUsers()
        setSelectedUsers(new Set())
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setBulkDeleting(false)
    }
  }

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setRoleFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }, [])

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-40" />
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`min-h-screen px-4 sm:px-6 lg:px-8 py-4 transition-colors ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="mx-auto max-w-[1600px]">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Gradient Icon */}
            <div className="relative">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20' 
                  : 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
              }`}>
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              {/* Pulsating indicator for authors */}
              {stats.authors > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[7px] font-bold text-white">
                    {stats.authors > 9 ? '9+' : stats.authors}
                  </span>
                </span>
              )}
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                მომხმარებლების მართვა
              </h1>
              <p className={`text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                USER, AUTHOR და MODERATOR როლების მართვა
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchUsers}
            disabled={loading}
            className={`group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105' 
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-105'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            განახლება
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <StatsCard label="სულ მომხმარებელი" value={stats.total} isDark={isDark} icon={BarChart3} />
          <StatsCard label="Users" value={stats.users} isDark={isDark} icon={User} color="gray" />
          <StatsCard label="Authors" value={stats.authors} isDark={isDark} icon={Award} color="blue" />
          <StatsCard label="Moderators" value={stats.moderators} isDark={isDark} icon={UserCog} color="purple" />
          <StatsCard label="ნაპოვნი" value={stats.filtered} isDark={isDark} icon={Filter} />
        </div>

        {/* Filters Toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? 'ფილტრების დამალვა' : 'ფილტრების ჩვენება'}
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={`mb-4 rounded-xl border p-3 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className={`absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`} />
                <input
                  type="text"
                  placeholder="ძებნა სახელით, ელფოსტით, ID-ით..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-[10px] transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                      : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                  }`}
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className={`w-full appearance-none rounded-lg border py-1.5 pl-2 pr-7 text-[10px] transition-all cursor-pointer ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-white hover:border-white/20 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20' 
                      : 'border-black/10 bg-black/5 text-black hover:border-black/20 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>👥 ყველა როლი</option>
                  <option value="USER" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>👤 მომხმარებელი</option>
                  <option value="AUTHOR" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>✍️ ავტორი</option>
                  <option value="MODERATOR" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>🛡️ მოდერატორი</option>
                </select>
                <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                />
              </div>

              {/* Date To + Clear */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] transition-colors ${
                    isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-black/5 text-black'
                  }`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                />
                <button
                  onClick={clearFilters}
                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                    isDark 
                      ? 'border-white/10 bg-white/5 hover:bg-white/10' 
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                  title="ფილტრების გასუფთავება"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className={`mb-3 flex items-center gap-2 rounded-lg border p-2 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <span className="text-[10px] font-medium text-violet-500">
              არჩეულია: {selectedUsers.size}
            </span>
            <button
              onClick={() => setDeleteModal({ show: true, isBulk: true })}
              disabled={bulkDeleting}
              className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-500 hover:bg-red-500/20 disabled:opacity-50"
            >
              {bulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}
              წაშლა
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/60' : 'text-black/60'}`} />
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <Users className={`mx-auto mb-2 h-8 w-8 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {searchQuery || roleFilter !== 'ALL' ? 'მომხმარებლები ვერ მოიძებნა' : 'მომხმარებლები ჯერ არ არის'}
            </p>
          </div>
        ) : (
          <>
            <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <tr>
                      <th className="px-2 py-2">
                        <button onClick={handleSelectAll}>
                          {selectedUsers.size === paginatedUsers.length ? (
                            <CheckSquare className="h-3.5 w-3.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('full_name')}>
                          მომხმარებელი
                          <SortIcon column="full_name" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('role')}>
                          როლი
                          <SortIcon column="role" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          ავტორი
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1">
                          <UserCog className="h-3 w-3" />
                          მოდერ.
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('created_at')}>
                          რეგისტრაცია
                          <SortIcon column="created_at" />
                        </div>
                      </th>
                      <th className={`px-2 py-2 text-right text-[10px] font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        მოქმედება
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <Fragment key={user.id}>
                        <tr className={`border-t transition-colors ${
                          isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-black/5 hover:bg-black/[0.02]'
                        } ${selectedUsers.has(user.id) ? (isDark ? 'bg-violet-500/10' : 'bg-violet-500/5') : ''}`}>
                          <td className="px-2 py-2">
                            <button onClick={() => handleSelectUser(user.id)}>
                              {selectedUsers.has(user.id) ? (
                                <CheckSquare className="h-3.5 w-3.5 text-violet-500" />
                              ) : (
                                <Square className={`h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                              )}
                            </button>
                          </td>
                          
                          {/* User Info */}
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  <User className={`h-3.5 w-3.5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className={`truncate text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                  {user.full_name || 'N/A'}
                                </div>
                                <div className={`truncate text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                  {user.email || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="px-2 py-2">
                            <RoleBadge role={user.role} isDark={isDark} />
                          </td>

                          {/* Author Toggle */}
                          <td className="px-2 py-2">
                            <ToggleSwitch
                              isActive={user.role === 'AUTHOR'}
                              isLoading={authorRoleUpdatingId === user.id}
                              isDisabled={moderatorRoleUpdatingId === user.id}
                              onClick={() => handleAuthorRoleToggle(user)}
                              isDark={isDark}
                              activeColor="blue"
                              title={user.role === 'AUTHOR' ? 'ავტორის როლის ჩამორთმევა' : 'ავტორის როლის მინიჭება'}
                            />
                          </td>

                          {/* Moderator Toggle */}
                          <td className="px-2 py-2">
                            <ToggleSwitch
                              isActive={user.role === 'MODERATOR'}
                              isLoading={moderatorRoleUpdatingId === user.id}
                              isDisabled={authorRoleUpdatingId === user.id}
                              onClick={() => handleModeratorRoleToggle(user)}
                              isDark={isDark}
                              activeColor="purple"
                              title={user.role === 'MODERATOR' ? 'მოდერატორის როლის ჩამორთმევა' : 'მოდერატორის როლის მინიჭება'}
                            />
                          </td>

                          {/* Created At */}
                          <td className={`px-2 py-2 text-[10px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                            {new Date(user.created_at).toLocaleDateString('ka-GE')}
                          </td>

                          {/* Actions */}
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleViewDetails(user)}
                                className={`rounded-md p-1.5 transition-colors ${
                                  expandedUserId === user.id
                                    ? isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-500/10 text-violet-600'
                                    : isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-black/60'
                                }`}
                                title="დეტალები"
                              >
                                {expandedUserId === user.id ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={() => setDeleteModal({ show: true, userId: user.id })}
                                disabled={deletingId === user.id}
                                className={`rounded-md p-1.5 transition-colors disabled:opacity-50 ${
                                  isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-500/10 text-red-600'
                                }`}
                                title="წაშლა"
                              >
                                {deletingId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {expandedUserId === user.id && (
                          <tr className={isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}>
                            <td colSpan={7} className="px-2 py-3">
                              <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-black/50' : 'border-black/10 bg-white/50'}`}>
                                {editingUser?.id === user.id ? (
                                  /* Edit Mode */
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        რედაქტირება
                                      </h3>
                                      <button
                                        onClick={() => setEditingUser(null)}
                                        className={`rounded-md p-1 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                      >
                                        <X className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                      </button>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                          სახელი და გვარი
                                        </label>
                                        <input
                                          type="text"
                                          value={editForm.full_name}
                                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                          className={`w-full rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${
                                            isDark
                                              ? 'border-white/10 bg-white/5 text-white focus:border-violet-500/50'
                                              : 'border-black/10 bg-black/5 text-black focus:border-violet-500/50'
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                          ელფოსტა
                                        </label>
                                        <input
                                          type="email"
                                          value={editForm.email}
                                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                          className={`w-full rounded-lg border px-3 py-1.5 text-[11px] transition-colors ${
                                            isDark
                                              ? 'border-white/10 bg-white/5 text-white focus:border-violet-500/50'
                                              : 'border-black/10 bg-black/5 text-black focus:border-violet-500/50'
                                          }`}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                      <button
                                        onClick={handleSaveEdit}
                                        disabled={updatingId === user.id}
                                        className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-[10px] font-medium text-white transition-all hover:bg-violet-600 disabled:opacity-50"
                                      >
                                        {updatingId === user.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                        შენახვა
                                      </button>
                                      <button
                                        onClick={() => setEditingUser(null)}
                                        className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all ${
                                          isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
                                        }`}
                                      >
                                        გაუქმება
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* View Mode */
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        დეტალური ინფორმაცია
                                      </h3>
                                      <button
                                        onClick={() => handleEditUser(user)}
                                        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                                          isDark
                                            ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
                                            : 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20'
                                        }`}
                                      >
                                        <Edit className="h-3 w-3" />
                                        რედაქტირება
                                      </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                      {/* Avatar */}
                                      <div className="sm:col-span-2 lg:col-span-1">
                                        <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          სურათი
                                        </label>
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                          {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.full_name || 'User'} className="h-full w-full rounded-xl object-cover" />
                                          ) : (
                                            <User className={`h-6 w-6 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                                          )}
                                        </div>
                                      </div>

                                      {/* Full Name */}
                                      <div>
                                        <label className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          <User className="h-3 w-3" />
                                          სახელი
                                        </label>
                                        <p className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                          {user.full_name || 'N/A'}
                                        </p>
                                      </div>

                                      {/* Email */}
                                      <div>
                                        <label className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          <Mail className="h-3 w-3" />
                                          ელფოსტა
                                        </label>
                                        <p className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                          {user.email || 'N/A'}
                                        </p>
                                      </div>

                                      {/* Role */}
                                      <div>
                                        <label className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          <Shield className="h-3 w-3" />
                                          როლი
                                        </label>
                                        <RoleBadge role={user.role} isDark={isDark} size="md" />
                                      </div>

                                      {/* Created At */}
                                      <div>
                                        <label className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          <Calendar className="h-3 w-3" />
                                          რეგისტრაცია
                                        </label>
                                        <p className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                          {new Date(user.created_at).toLocaleString('ka-GE')}
                                        </p>
                                      </div>

                                      {/* Updated At */}
                                      <div>
                                        <label className={`mb-1 flex items-center gap-1 text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          <Clock className="h-3 w-3" />
                                          განახლება
                                        </label>
                                        <p className={`text-[11px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                          {new Date(user.updated_at).toLocaleString('ka-GE')}
                                        </p>
                                      </div>

                                      {/* User ID */}
                                      <div className="sm:col-span-2">
                                        <label className={`mb-1 block text-[10px] font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                          User ID
                                        </label>
                                        <p className={`font-mono text-[9px] ${isDark ? 'text-white/50' : 'text-black/50'}`}>
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
            </div>

            {/* Pagination */}
            <div className={`mt-3 flex items-center justify-between rounded-lg border p-2 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">თითო გვერდზე:</span>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className={`appearance-none rounded-md border py-1 pl-2 pr-6 text-[10px] cursor-pointer ${
                      isDark 
                        ? 'border-white/10 bg-white/5 text-white hover:border-white/20' 
                        : 'border-black/10 bg-black/5 text-black hover:border-black/20'
                    }`}
                    style={isDark ? { colorScheme: 'dark' } : {}}
                  >
                    <option value={10} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>10</option>
                    <option value={25} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>25</option>
                    <option value={50} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>50</option>
                    <option value={100} style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>100</option>
                  </select>
                  <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  წინა
                </button>
                <span className="text-[10px]">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
                    currentPage === totalPages || totalPages === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-black/10 bg-black/5 hover:bg-black/10'
                  }`}
                >
                  შემდეგი
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false })}
          title="წაშლის დადასტურება"
          message={deleteModal.isBulk 
            ? `დარწმუნებული ხართ რომ გსურთ ${selectedUsers.size} მომხმარებლის წაშლა? ეს მოქმედება შეუქცევადია!`
            : 'დარწმუნებული ხართ რომ გსურთ ამ მომხმარებლის წაშლა? ეს მოქმედება შეუქცევადია!'
          }
          type="confirm"
          confirmText="წაშლა"
          cancelText="გაუქმება"
          onConfirm={() => {
            if (deleteModal.isBulk) {
              handleBulkDelete()
            } else if (deleteModal.userId) {
              handleDeleteUser(deleteModal.userId)
            }
          }}
        />
      </div>
    </div>
  )
}
