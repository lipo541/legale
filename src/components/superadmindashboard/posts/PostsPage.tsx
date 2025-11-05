'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/contexts/ThemeContext'
import CreatePostPage from './createpost/CreatePostPage'
import { 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Tag,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface Post {
  id: string
  author_id: string
  practice_id: string | null
  display_position: number | null
  position_order: number | null
  status: 'draft' | 'published' | 'archived'
  featured_image_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  post_translations: Array<{
    id: string
    language: string
    title: string
    excerpt: string
    content: string
    category: string
    category_id: string | null
    slug: string
    meta_title?: string
    meta_description?: string
    keywords?: string
    og_title?: string
    og_description?: string
    og_image?: string
    social_hashtags?: string
    word_count?: number
    reading_time?: number
  }>
  author?: {
    email: string
    full_name?: string
  }
}

export default function PostsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'published' | 'archived'>('ALL')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [pendingOrderChanges, setPendingOrderChanges] = useState<Record<string, number | null>>({})
  const [sortBy, setSortBy] = useState<'created_at' | 'position'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [categories, setCategories] = useState<Array<{ id: string; georgian: string; english: string; russian: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          post_translations (*),
          author:profiles!posts_author_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const { data, error } = await supabase
        .from('post_categories')
        .select(`
          id,
          post_category_translations (
            language,
            name
          )
        `)
        .order('created_at', { ascending: true })

      if (error) throw error

      interface CategoryTranslation {
        language: string
        name: string
      }

      interface CategoryData {
        id: string
        post_category_translations: CategoryTranslation[]
      }

      // Transform data to flat structure
      const transformedCategories = (data || []).map((cat: CategoryData) => {
        const ka = cat.post_category_translations.find((t) => t.language === 'ka')
        const en = cat.post_category_translations.find((t) => t.language === 'en')
        const ru = cat.post_category_translations.find((t) => t.language === 'ru')

        return {
          id: cat.id,
          georgian: ka?.name || '',
          english: en?.name || '',
          russian: ru?.name || ''
        }
      })

      setCategories(transformedCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [statusFilter])

  // Filter posts by search term
  const filteredPosts = posts.filter(post => {
    const georgianTranslation = post.post_translations?.find(t => t.language === 'ka')
    const searchLower = searchTerm.toLowerCase()
    
    return (
      georgianTranslation?.title?.toLowerCase().includes(searchLower) ||
      post.author?.email?.toLowerCase().includes(searchLower) ||
      post.author?.full_name?.toLowerCase().includes(searchLower)
    )
  })

  // Sort filtered posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'position') {
      // Sort by position (nulls last), then by position_order
      const aPos = a.display_position ?? 999
      const bPos = b.display_position ?? 999
      
      if (aPos !== bPos) {
        return sortOrder === 'asc' ? aPos - bPos : bPos - aPos
      }
      
      // If same position, sort by position_order
      const aOrder = a.position_order ?? 999
      const bOrder = b.position_order ?? 999
      return aOrder - bOrder
    } else {
      // Sort by created_at
      const aDate = new Date(a.created_at).getTime()
      const bDate = new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    }
  })

  // Toggle sort
  const handleSort = (column: 'created_at' | 'position') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder(column === 'position' ? 'asc' : 'desc')
    }
  }

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ პოსტის წაშლა?')) return

    try {
      // 1. Get post to find featured_image_url
      const postToDelete = posts.find(p => p.id === postId)
      
      // 2. Delete featured image from storage if it exists
      if (postToDelete?.featured_image_url) {
        try {
          // Extract file path from URL
          // URL format: https://[project].supabase.co/storage/v1/object/public/post-images/[path]
          const urlParts = postToDelete.featured_image_url.split('/post-images/')
          if (urlParts.length > 1) {
            const filePath = urlParts[1]
            
            const { error: storageError } = await supabase.storage
              .from('post-images')
              .remove([filePath])
            
            if (storageError) {
              console.error('Error deleting image from storage:', storageError)
              // Continue with post deletion even if image deletion fails
            } else {
              console.log('Featured image deleted from storage:', filePath)
            }
          }
        } catch (storageError) {
          console.error('Storage deletion error:', storageError)
          // Continue with post deletion
        }
      }

      // 3. Delete post from database (CASCADE will delete translations)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.filter(p => p.id !== postId))
      alert('პოსტი და სურათი წარმატებით წაიშალა')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('შეცდომა პოსტის წაშლისას')
    }
  }

  // Update post status
  const handleStatusChange = async (postId: string, newStatus: Post['status']) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.map(p => 
        p.id === postId ? { ...p, status: newStatus } : p
      ))
      alert('სტატუსი წარმატებით შეიცვალა')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('შეცდომა სტატუსის შეცვლისას')
    }
  }

  // Update post position
  const handlePositionChange = async (postId: string, newPosition: string) => {
    try {
      // Parse position - can be number (1-10) or null (remove from position)
      const positionValue = newPosition === '' || newPosition === 'null' 
        ? null 
        : parseInt(newPosition)

      // Validate position range
      if (positionValue !== null && (positionValue < 1 || positionValue > 10)) {
        alert('პოზიცია უნდა იყოს 1-დან 10-მდე')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ display_position: positionValue })
        .eq('id', postId)

      if (error) throw error

      setPosts(posts.map(p => 
        p.id === postId ? { ...p, display_position: positionValue } : p
      ))
      
      alert('პოზიცია წარმატებით შეიცვალა')
      fetchPosts() // Refresh to show updated positions
    } catch (error) {
      console.error('Error updating position:', error)
      alert('შეცდომა პოზიციის შეცვლისას')
    }
  }

  // Update post position order
  const handlePositionOrderChange = (postId: string, newOrder: string) => {
    const orderValue = newOrder === '' ? null : parseInt(newOrder)
    
    // Update pending changes
    setPendingOrderChanges(prev => ({
      ...prev,
      [postId]: orderValue
    }))
  }

  // Save position order to database
  const savePositionOrder = async (postId: string) => {
    try {
      const orderValue = pendingOrderChanges[postId]

      const { error } = await supabase
        .from('posts')
        .update({ position_order: orderValue })
        .eq('id', postId)

      if (error) throw error

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, position_order: orderValue } : p
      ))
      
      // Remove from pending changes
      setPendingOrderChanges(prev => {
        const newPending = { ...prev }
        delete newPending[postId]
        return newPending
      })
      
      alert('რიგითობა წარმატებით შეიცვალა')
      fetchPosts() // Refresh to show updated order
    } catch (error) {
      console.error('Error updating position order:', error)
      alert('შეცდომა რიგითობის შეცვლისას')
    }
  }

  // Cancel position order change
  const cancelPositionOrderChange = (postId: string) => {
    setPendingOrderChanges(prev => {
      const newPending = { ...prev }
      delete newPending[postId]
      return newPending
    })
  }

  // If creating new post, show CreatePostPage
  if (showCreatePost) {
    return <CreatePostPage onCancel={() => setShowCreatePost(false)} />
  }

  // If editing post, show CreatePostPage with post data
  if (editingPostId) {
    const postToEdit = posts.find(p => p.id === editingPostId)
    if (postToEdit) {
      return (
        <CreatePostPage 
          onCancel={() => setEditingPostId(null)} 
          editMode={true}
          postData={postToEdit}
        />
      )
    }
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              პოსტების მართვა
            </h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              ყველა ავტორის პოსტის ნახვა და მართვა
            </p>
          </div>
          
          <button
            onClick={() => setShowCreatePost(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all ${
              isDark 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <Plus className="h-4 w-4" />
            ახალი პოსტი
          </button>
        </div>

        {/* Filters */}
        <div className={`mb-6 rounded-xl border p-4 ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isDark ? 'text-white/40' : 'text-black/40'
              }`} />
              <input
                type="text"
                placeholder="ძებნა სათაურით ან ავტორით..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-colors ${
                  isDark 
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-white/40' 
                    : 'border-black/10 bg-black/5 text-black placeholder:text-black/40'
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  isDark 
                    ? 'border-white/10 bg-white/5 text-white' 
                    : 'border-black/10 bg-black/5 text-black'
                }`}
                style={isDark ? {
                  colorScheme: 'dark'
                } : {}}
              >
                <option value="ALL" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>ყველა სტატუსი</option>
                <option value="draft" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Draft</option>
                <option value="published" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Published</option>
                <option value="archived" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={`rounded-xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {posts.length}
            </div>
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              სულ პოსტი
            </div>
          </div>
          
          <div className={`rounded-xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {posts.filter(p => p.status === 'draft').length}
            </div>
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Draft
            </div>
          </div>
          
          <div className={`rounded-xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {posts.filter(p => p.status === 'published').length}
            </div>
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Published
            </div>
          </div>
          
          <div className={`rounded-xl border p-4 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {posts.filter(p => p.display_position !== null).length}
            </div>
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პოზიციებზე
            </div>
          </div>
        </div>

        {/* Posts Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              იტვირთება...
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
          }`}>
            <FileText className={`mx-auto mb-4 h-12 w-12 ${
              isDark ? 'text-white/20' : 'text-black/20'
            }`} />
            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              პოსტები არ მოიძებნა
            </p>
          </div>
        ) : (
          <div className={`overflow-hidden rounded-xl border ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <tr>
                    <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      სათაური
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      ავტორი
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      სტატუსი
                    </th>
                    <th 
                      onClick={() => handleSort('position')}
                      className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      } ${sortBy === 'position' ? 'text-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        პოზ.
                        {sortBy === 'position' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      რიგ.
                    </th>
                    <th 
                      onClick={() => handleSort('created_at')}
                      className={`px-2 py-2 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      } ${sortBy === 'created_at' ? 'text-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        თარიღი
                        {sortBy === 'created_at' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className={`px-2 py-2 text-right text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      მოქმედებები
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-black/10'}`}>
                  {sortedPosts.map((post) => {
                    const isExpanded = expandedPostId === post.id
                    const georgianTranslation = post.post_translations?.find(t => t.language === 'ka')
                    const englishTranslation = post.post_translations?.find(t => t.language === 'en')
                    const russianTranslation = post.post_translations?.find(t => t.language === 'ru')
                    
                    return (
                      <Fragment key={post.id}>
                        <tr className={`transition-colors ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                        }`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 max-w-[250px]">
                          <FileText className={`h-4 w-4 flex-shrink-0 ${
                            isDark ? 'text-white/40' : 'text-black/40'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div 
                              className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}
                              title={post.post_translations?.find(t => t.language === 'ka')?.title || 'უსათაურო პოსტი'}
                            >
                              {post.post_translations?.find(t => t.language === 'ka')?.title || 'უსათაურო პოსტი'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <User className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                          <span className={`text-xs truncate ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                            {post.author?.full_name || post.author?.email || 'უცნობი'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="relative inline-block w-full max-w-[110px]">
                          <select
                            value={post.status}
                            onChange={(e) => handleStatusChange(post.id, e.target.value as Post['status'])}
                            className={`appearance-none w-full rounded-md border px-2 py-1.5 pr-7 text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 ${
                              post.status === 'published'
                                ? 'bg-green-500/10 text-green-500 border-green-500/30 focus:ring-green-500/40'
                                : post.status === 'draft'
                                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 focus:ring-yellow-500/40'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/30 focus:ring-gray-500/40'
                            }`}
                            style={isDark ? { colorScheme: 'dark' } : {}}
                          >
                            <option value="draft" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Draft</option>
                            <option value="published" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Published</option>
                            <option value="archived" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Archived</option>
                          </select>
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                            post.status === 'published'
                              ? 'text-green-500'
                              : post.status === 'draft'
                              ? 'text-yellow-500'
                              : 'text-gray-500'
                          }`}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="relative inline-block w-full max-w-[200px]">
                          <select
                            value={post.display_position ?? 'null'}
                            onChange={(e) => handlePositionChange(post.id, e.target.value)}
                            className={`appearance-none w-full rounded-md border px-2 py-1.5 pr-7 text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-1 ${
                              post.display_position
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 focus:ring-blue-500/40'
                                : isDark
                                ? 'bg-white/5 text-white/70 border-white/10 focus:ring-white/20'
                                : 'bg-black/5 text-black/70 border-black/10 focus:ring-black/20'
                            }`}
                            style={isDark ? { colorScheme: 'dark' } : {}}
                          >
                            <option value="null" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>-</option>
                            <option value="1" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 1 - Hero (მარცხ. დიდი)</option>
                            <option value="3" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 2 - Feature (ცენტრი)</option>
                            <option value="5" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 3 - Ticker (მარჯვ.)</option>
                            <option value="4" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 4 - Archive (შუა 1)</option>
                            <option value="6" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 5 - Card (შუა 2)</option>
                            <option value="7" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 6 - Card (შუა 3)</option>
                            <option value="2" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 7 - Feed (ქვედა მარცხ.)</option>
                            <option value="9" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 8 - Carousel (ქვედა ც.)</option>
                            <option value="10" style={isDark ? { backgroundColor: '#18181b', color: 'white' } : { backgroundColor: 'white', color: 'black' }}>Position 9 - Topics (ქვედა მ.)</option>
                          </select>
                          <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                            post.display_position ? 'text-blue-500' : isDark ? 'text-white/70' : 'text-black/70'
                          }`}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={
                              pendingOrderChanges[post.id] !== undefined 
                                ? (pendingOrderChanges[post.id] ?? '') 
                                : (post.position_order ?? '')
                            }
                            onChange={(e) => handlePositionOrderChange(post.id, e.target.value)}
                            placeholder="-"
                            min="0"
                            className={`w-12 rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                              pendingOrderChanges[post.id] !== undefined
                                ? isDark
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 ring-1 ring-blue-500/20'
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/30 ring-1 ring-blue-500/20'
                                : isDark
                                ? 'bg-white/5 text-white border-white/10 placeholder:text-white/40'
                                : 'bg-black/5 text-black border-black/10 placeholder:text-black/40'
                            }`}
                          />
                          {pendingOrderChanges[post.id] !== undefined && (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => savePositionOrder(post.id)}
                                className="flex items-center gap-0.5 rounded-md bg-green-500/10 px-1.5 py-1 text-xs font-medium text-green-500 border border-green-500/30 hover:bg-green-500/20 transition-all"
                                title="შენახვა"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => cancelPositionOrderChange(post.id)}
                                className="flex items-center gap-0.5 rounded-md bg-red-500/10 px-1.5 py-1 text-xs font-medium text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-all"
                                title="გაუქმება"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className={`h-3 w-3 flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
                          <span className={`text-xs ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                            {new Date(post.created_at).toLocaleDateString('ka-GE')}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                            className={`rounded-md p-1.5 transition-colors ${
                              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                            title="ნახვა"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPostId(post.id)}
                            className={`rounded-md p-1.5 transition-colors ${
                              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                            title="რედაქტირება"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                            title="წაშლა"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className={`px-3 py-3 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div className="space-y-6">
                            {/* Post Main Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                  Post ID
                                </p>
                                <p className={`mt-1 font-mono text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                  {post.id}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs font-medium uppercase ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                  Featured Image
                                </p>
                                {post.featured_image_url ? (
                                  <img 
                                    src={post.featured_image_url} 
                                    alt="Featured" 
                                    className="mt-1 h-20 w-32 rounded-lg object-cover"
                                  />
                                ) : (
                                  <p className={`mt-1 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                    არ არის
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Translations */}
                            <div className="space-y-4">
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                თარგმანები
                              </h4>
                              
                              {/* Georgian */}
                              {georgianTranslation && (
                                <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-lg">🇬🇪</span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      ქართული
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>სათაური</p>
                                      <p className={`mt-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {georgianTranslation.title}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Slug</p>
                                      <p className={`mt-1 font-mono text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {georgianTranslation.slug}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>კატეგორია</p>
                                      {(() => {
                                        const categoryId = georgianTranslation.category_id || georgianTranslation.category
                                        const category = categories.find(c => c.id === categoryId)
                                        
                                        return (
                                          <div>
                                            <p className={`mt-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                              {category ? `${category.georgian} / ${category.english} / ${category.russian}` : (georgianTranslation.category || 'არ არის მითითებული')}
                                            </p>
                                            {categoryId && (
                                              <p className={`mt-0.5 text-xs font-mono ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                                                ID: {categoryId}
                                              </p>
                                            )}
                                          </div>
                                        )
                                      })()}
                                    </div>
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>ამონარიდი</p>
                                      <p className={`mt-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {georgianTranslation.excerpt?.slice(0, 100)}...
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>შინაარსი</p>
                                    <div 
                                      className={`mt-1 max-h-40 overflow-y-auto rounded border p-2 text-sm ${
                                        isDark ? 'border-white/10 bg-black/20 text-white/70' : 'border-black/10 bg-white text-black/70'
                                      }`}
                                      dangerouslySetInnerHTML={{ __html: georgianTranslation.content?.slice(0, 500) }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* English */}
                              {englishTranslation && (
                                <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-lg">🇬🇧</span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      English
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Title</p>
                                      <p className={`mt-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {englishTranslation.title}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Slug</p>
                                      <p className={`mt-1 font-mono text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {englishTranslation.slug}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Russian */}
                              {russianTranslation && (
                                <div className={`rounded-lg border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="text-lg">🇷🇺</span>
                                    <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                      Русский
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Заголовок</p>
                                      <p className={`mt-1 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {russianTranslation.title}
                                      </p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Slug</p>
                                      <p className={`mt-1 font-mono text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                                        {russianTranslation.slug}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
