'use client'

import { useState, useEffect, Fragment } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  FileText,
  Calendar,
  Loader2,
  Shield,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AuthorProfile {
  id: string
  email: string | null
  full_name: string | null
  role: 'AUTHOR'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function AuthorsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [authors, setAuthors] = useState<AuthorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingAuthor, setEditingAuthor] = useState<AuthorProfile | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: ''
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAuthors = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'AUTHOR')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching authors:', error)
      } else {
        setAuthors(data || [])
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthors()
  }, [])

  const handleViewDetails = (author: AuthorProfile) => {
    if (expandedId === author.id) {
      setExpandedId(null)
    } else {
      setExpandedId(author.id)
      setEditingAuthor(null)
    }
  }

  const handleEdit = (author: AuthorProfile) => {
    setEditingAuthor(author)
    setEditForm({
      full_name: author.full_name || '',
      email: author.email || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingAuthor) return

    setUpdatingId(editingAuthor.id)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAuthor.id)

      if (error) {
        console.error('Update error:', error)
        alert('შეცდომა განახლებისას: ' + error.message)
      } else {
        await fetchAuthors()
        setEditingAuthor(null)
        setExpandedId(null)
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა განახლებისას')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ ამ ავტორის წაშლა?')) {
      return
    }

    setDeletingId(id)

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete error:', error)
        alert('შეცდომა წაშლისას: ' + error.message)
      } else {
        await fetchAuthors()
      }
    } catch (err) {
      console.error('Catch error:', err)
      alert('შეცდომა წაშლისას')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredAuthors = authors.filter((author) => {
    const matchesSearch = 
      author.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.email?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Authors
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            ავტორების მართვა
          </p>
        </div>
      </div>

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

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className={`h-8 w-8 animate-spin ${isDark ? 'text-white' : 'text-black'}`} />
        </div>
      )}

      {!loading && filteredAuthors.length > 0 && (
        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <table className="w-full">
            <thead className={`border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ავტორი
                </th>
                <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  ელფოსტა
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
              {filteredAuthors.map((author) => (
                <Fragment key={author.id}>
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
                          {author.avatar_url ? (
                            <img src={author.avatar_url} alt={author.full_name || 'Author'} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <FileText className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {author.full_name || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {author.email || 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {new Date(author.created_at).toLocaleDateString('ka-GE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(author)}
                          className={`rounded-lg p-2 transition-colors ${
                            expandedId === author.id
                              ? isDark
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-yellow-500/10 text-yellow-600'
                              : isDark 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-black/5'
                          }`}
                          title="დეტალების ნახვა"
                        >
                          <Eye className={`h-4 w-4 ${expandedId === author.id ? '' : isDark ? 'text-white/60' : 'text-black/60'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(author.id)}
                          disabled={deletingId === author.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
                          }`}
                          title="წაშლა"
                        >
                          {deletingId === author.id ? (
                            <Loader2 className={`h-4 w-4 animate-spin ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          ) : (
                            <Trash2 className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === author.id && (
                    <tr className={isDark ? 'bg-white/5' : 'bg-black/5'}>
                      <td colSpan={4} className="px-6 py-6">
                        <div className={`rounded-xl border p-6 ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
                          {editingAuthor?.id === author.id ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  ავტორის რედაქტირება
                                </h3>
                                <button
                                  onClick={() => setEditingAuthor(null)}
                                  className={`rounded-lg p-2 transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                  <X className={`h-5 w-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სრული სახელი
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

                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Author ID
                                  </label>
                                  <input
                                    type="text"
                                    value={author.id}
                                    readOnly
                                    className={`w-full rounded-lg border px-4 py-2 cursor-not-allowed ${
                                      isDark
                                        ? 'border-white/10 bg-white/5 text-white/40'
                                        : 'border-black/10 bg-black/5 text-black/40'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={updatingId === author.id}
                                  className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 ${
                                    isDark
                                      ? 'bg-yellow-500 hover:bg-yellow-600'
                                      : 'bg-yellow-500 hover:bg-yellow-600'
                                  }`}
                                >
                                  {updatingId === author.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      შენახვა...
                                    </span>
                                  ) : (
                                    'შენახვა'
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingAuthor(null)}
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
                            <div className="space-y-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  ავტორის დეტალები
                                </h3>
                                <button
                                  onClick={() => handleEdit(author)}
                                  className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors ${
                                    isDark
                                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                      : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                                  }`}
                                >
                                  <Edit className="h-4 w-4" />
                                  რედაქტირება
                                </button>
                              </div>

                              <div className="grid gap-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ავატარი
                                  </label>
                                  <div className="flex items-center gap-4">
                                    <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                      {author.avatar_url ? (
                                        <img src={author.avatar_url} alt={author.full_name || 'Author'} className="h-full w-full rounded-full object-cover" />
                                      ) : (
                                        <FileText className={`h-8 w-8 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                                      )}
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                      {author.avatar_url || 'ავატარი არ არის'}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    სრული სახელი
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {author.full_name || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Mail className="h-4 w-4" />
                                    ელფოსტა
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {author.email || 'N/A'}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Shield className="h-4 w-4" />
                                    როლი
                                  </label>
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                    ავტორი
                                  </span>
                                </div>

                                <div>
                                  <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    <Calendar className="h-4 w-4" />
                                    რეგისტრაცია
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(author.created_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    ბოლო განახლება
                                  </label>
                                  <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                    {new Date(author.updated_at).toLocaleString('ka-GE')}
                                  </p>
                                </div>

                                <div>
                                  <label className={`mb-2 block text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    Author ID
                                  </label>
                                  <p className={`font-mono text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                                    {author.id}
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

      {!loading && filteredAuthors.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
          <p className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {searchQuery ? 'ავტორები ვერ მოიძებნა' : 'ავტორები ჯერ არ არის'}
          </p>
        </div>
      )}
    </div>
  )
}
