'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/client'
import SimplePostEditor from '@/components/common/SimplePostEditor'
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Post {
  id: string
  status: 'draft' | 'published' | 'archived'
  featured_image_url: string | null
  created_at: string
  updated_at: string
  post_translations: Array<{
    language: string
    title: string
    excerpt: string
    content: string
    og_title?: string
    og_description?: string
    og_image?: string
    social_hashtags?: string
  }>
}

export default function MyPostsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)

  // Check verification status
  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', user.id)
          .single()
        
        setVerificationStatus(profile?.verification_status || null)
      }
    }
    
    checkVerification()
  }, [supabase])

  // Fetch user's posts
  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🔍 Fetching posts for user:', user.id)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          status,
          featured_image_url,
          created_at,
          updated_at,
          post_translations (
            language,
            title,
            excerpt,
            content,
            og_title,
            og_description,
            og_image,
            social_hashtags
          )
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      console.log('🔍 Posts query result:', { data, error })
      
      if (data && data.length > 0) {
        console.log('🔍 First post detail:', JSON.stringify(data[0], null, 2))
      }

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ პოსტის წაშლა?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      alert('პოსტი წარმატებით წაიშალა')
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('შეცდომა წაშლისას: ' + (error as Error).message)
    }
  }

  // Get status badge
  const getStatusBadge = (status: Post['status']) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
            <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
            გამოქვეყნებული
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-600" />
            მონახაზი
          </span>
        )
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-600">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-600" />
            არქივში
          </span>
        )
    }
  }

  // If editor is open
  if (showEditor || editingPost) {
    return (
      <SimplePostEditor
        onCancel={() => {
          setShowEditor(false)
          setEditingPost(null)
        }}
        onSuccess={() => {
          setShowEditor(false)
          setEditingPost(null)
          fetchPosts()
        }}
        editMode={!!editingPost}
        postData={editingPost ? {
          ...editingPost,
          featured_image_url: editingPost.featured_image_url || undefined
        } : undefined}
      />
    )
  }

  // If not verified, show message
  if (verificationStatus !== 'verified') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className={`rounded-2xl border p-8 text-center ${
            isDark ? 'border-amber-500/20 bg-amber-500/10' : 'border-amber-500/20 bg-amber-50'
          }`}>
            <AlertCircle className={`mx-auto h-16 w-16 mb-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              ვერიფიკაცია საჭიროა
            </h2>
            <p className={`text-lg mb-4 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
              პოსტების შესაქმნელად თქვენი პროფილი უნდა იყოს ვერიფიცირებული.
            </p>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {verificationStatus === 'pending' 
                ? 'თქვენი ვერიფიკაციის მოთხოვნა განხილვაშია. გთხოვთ დაელოდოთ ადმინისტრატორის დასტურს.'
                : 'გთხოვთ შეავსოთ პროფილი და გაიაროთ ვერიფიკაცია Profile სექციაში.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Minimal Header */}
        <div className="mb-10 flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ჩემი პოსტები
          </h1>

          <button
            onClick={() => setShowEditor(true)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] ${
              isDark
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-black text-white hover:bg-gray-900'
            }`}
          >
            <Plus className="inline h-4 w-4 mr-1.5" />
            ახალი პოსტი
          </button>
        </div>

        {/* Minimal Stats */}
        <div className="mb-8 flex gap-8">
          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              სულ
            </div>
            <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {posts.length}
            </div>
          </div>

          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              მონახაზი
            </div>
            <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {posts.filter(p => p.status === 'draft').length}
            </div>
          </div>

          <div>
            <div className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
              გამოქვეყნებული
            </div>
            <div className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {posts.filter(p => p.status === 'published').length}
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              იტვირთება...
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className={`mx-auto mb-4 h-12 w-12 ${isDark ? 'text-white/10' : 'text-gray-200'}`} />
            <h3 className={`text-lg font-medium ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              პოსტები ჯერ არ გაქვთ
            </h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              შექმენით თქვენი პირველი პოსტი
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const georgianTranslation = post.post_translations.find(t => t.language === 'ka')
              return (
                <div
                  key={post.id}
                  className={`group overflow-hidden rounded-lg border transition-all hover:shadow-lg ${
                    isDark ? 'border-white/10 bg-white/5 hover:border-white/20' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Featured Image */}
                  {post.featured_image_url && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={georgianTranslation?.title || ''}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        {new Date(post.created_at).toLocaleDateString('ka-GE')}
                      </div>
                      {getStatusBadge(post.status)}
                    </div>

                    <h3 className={`mb-2 line-clamp-2 text-lg font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {georgianTranslation?.title || 'უსათაურო პოსტი'}
                    </h3>

                    {georgianTranslation?.excerpt && (
                      <p className={`line-clamp-2 text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                        {georgianTranslation.excerpt}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setEditingPost(post)}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          isDark
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        რედაქტირება
                      </button>

                      {post.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            isDark
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          წაშლა
                        </button>
                      )}
                    </div>

                    {/* Status Info */}
                    {post.status === 'draft' && (
                      <div className={`mt-3 rounded-lg border p-2 text-xs ${isDark ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300' : 'border-yellow-500/30 bg-yellow-50 text-yellow-900'}`}>
                        ⏳ პოსტი ელოდება სუპერადმინის დამტკიცებას
                      </div>
                    )}
                    {post.status === 'published' && (
                      <div className={`mt-3 rounded-lg border p-2 text-xs ${isDark ? 'border-green-500/20 bg-green-500/5 text-green-300' : 'border-green-500/30 bg-green-50 text-green-900'}`}>
                        ✅ პოსტი გამოქვეყნებულია
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
