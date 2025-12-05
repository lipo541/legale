'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { createClient } from '@/lib/supabase/client'
import SimplePostEditor from '@/components/common/SimplePostEditor'
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'
import { specialistDashboardTranslations, Locale } from '@/translations/specialist-dashboard'

interface MyPostsPageProps {
  locale: Locale
}

interface Post {
  id: string
  status: 'draft' | 'pending' | 'published' | 'archived'
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

export default function MyPostsPage({ locale }: MyPostsPageProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { showToast } = useToast()
  const supabase = createClient()
  const t = specialistDashboardTranslations[locale] || specialistDashboardTranslations.ka

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
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
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      showToast(t.loadPostsError, 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, showToast, t])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!confirm(t.confirmDelete)) return

    setDeleting(postId)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      showToast(t.postDeleted, 'success')
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      showToast(t.deleteError, 'error')
    } finally {
      setDeleting(null)
    }
  }

  // Get status badge
  const getStatusBadge = (status: Post['status']) => {
    const styles = {
      published: {
        bg: isDark ? 'bg-white/10' : 'bg-black/10',
        text: isDark ? 'text-white' : 'text-black',
        icon: CheckCircle,
        label: t.published
      },
      draft: {
        bg: isDark ? 'bg-white/5' : 'bg-black/5',
        text: isDark ? 'text-white/60' : 'text-black/60',
        icon: Clock,
        label: t.draft
      },
      pending: {
        bg: isDark ? 'bg-white/5' : 'bg-black/5',
        text: isDark ? 'text-white/60' : 'text-black/60',
        icon: Eye,
        label: t.pending
      },
      archived: {
        bg: isDark ? 'bg-white/5' : 'bg-black/5',
        text: isDark ? 'text-white/40' : 'text-black/40',
        icon: FileText,
        label: t.archived
      }
    }
    
    const style = styles[status] || styles.draft
    const Icon = style.icon

    return (
      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-2.5 w-2.5" />
        {style.label}
      </span>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ka-GE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
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
        locale={locale}
      />
    )
  }

  // If not verified, show message
  if (verificationStatus !== 'verified') {
    return (
      <div className="w-full max-w-[600px] mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
          <AlertCircle className={`mx-auto h-10 w-10 mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <h2 className={`text-base font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
            {t.verificationNeeded}
          </h2>
          <p className={`text-sm mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {t.verificationNeededDesc}
          </p>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            {verificationStatus === 'pending' 
              ? t.requestPending
              : t.fillProfileAndVerify}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
      {/* Header */}
      <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {t.myPostsTitle}
          </h1>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            {t.manageArticles}
          </p>
        </div>

        <button
          onClick={() => setShowEditor(true)}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${
            isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.newPost}
        </button>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-3 gap-2 lg:gap-3 mb-4 lg:mb-6 p-3 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
        <div className="text-center">
          <div className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {posts.length}
          </div>
          <div className={`text-[10px] lg:text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{t.total}</div>
        </div>
        <div className="text-center">
          <div className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {posts.filter(p => p.status === 'draft' || p.status === 'pending').length}
          </div>
          <div className={`text-[10px] lg:text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{t.draft}</div>
        </div>
        <div className="text-center">
          <div className={`text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {posts.filter(p => p.status === 'published').length}
          </div>
          <div className={`text-[10px] lg:text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{t.published}</div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className={`h-5 w-5 animate-spin ${isDark ? 'text-white/50' : 'text-black/50'}`} />
        </div>
      ) : posts.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/[0.02]'}`}>
          <FileText className={`mx-auto mb-3 h-10 w-10 ${isDark ? 'text-white/20' : 'text-black/20'}`} />
          <h3 className={`text-sm font-medium mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            {t.noPostsYet}
          </h3>
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            {t.createFirstPost}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {posts.map((post) => {
            const georgianTranslation = post.post_translations.find(t => t.language === 'ka')
            const isDeleting = deleting === post.id
            
            return (
              <div
                key={post.id}
                className={`group overflow-hidden rounded-xl border transition-all ${
                  isDark 
                    ? 'border-white/10 bg-white/5 hover:border-white/20' 
                    : 'border-black/10 bg-black/[0.02] hover:border-black/20'
                } ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Featured Image */}
                {post.featured_image_url && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={post.featured_image_url}
                      alt={georgianTranslation?.title || ''}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-3 lg:p-4">
                  {!post.featured_image_url && (
                    <div className="mb-2">
                      {getStatusBadge(post.status)}
                    </div>
                  )}
                  
                  <div className={`text-[10px] mb-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                    {formatDate(post.created_at)}
                  </div>

                  <h3 className={`mb-1.5 line-clamp-2 text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                    {georgianTranslation?.title || t.untitledPost}
                  </h3>

                  {georgianTranslation?.excerpt && (
                    <p className={`line-clamp-2 text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      {georgianTranslation.excerpt}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setEditingPost(post)}
                      disabled={isDeleting}
                      className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isDark
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-black/10 text-black hover:bg-black/20'
                      }`}
                    >
                      <Edit2 className="h-3 w-3" />
                      {t.editPost}
                    </button>

                    {(post.status === 'draft' || post.status === 'pending') && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isDeleting}
                        className={`flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isDark
                            ? 'text-white/60 hover:bg-white/10 hover:text-white'
                            : 'text-black/60 hover:bg-black/10 hover:text-black'
                        }`}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Status Info */}
                  {post.status === 'draft' && (
                    <div className={`mt-2 rounded-lg p-2 text-[10px] ${isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}>
                      {t.awaitingApproval}
                    </div>
                  )}
                  {post.status === 'published' && (
                    <div className={`mt-2 rounded-lg p-2 text-[10px] ${isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}>
                      {t.postPublished}
                    </div>
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
