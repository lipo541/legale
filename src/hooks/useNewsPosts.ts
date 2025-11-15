/**
 * Custom Hook for fetching News Posts
 * Optimizes performance by fetching all posts once instead of multiple API calls
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PostTranslation {
  language: string
  title: string
  excerpt?: string
  slug: string
  category?: string
  reading_time?: number
}

interface Post {
  id: string
  display_position?: number
  position_order?: number
  category_id?: string
  featured_image_url?: string
  published_at: string
  status: string
  post_translations: PostTranslation[]
  display_settings?: {
    focal_point_x: number
    focal_point_y: number
  }
  author?: {
    email: string
    full_name?: string
  }
}

interface UseNewsPostsResult {
  posts: Post[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch all news posts for a specific locale
 * @param locale - Language code (ka, en, ru)
 * @returns Posts array, loading state, error, and refetch function
 */
export function useNewsPosts(locale: string): UseNewsPostsResult {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPosts = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          post_translations!inner (*),
          display_settings:post_display_settings(focal_point_x, focal_point_y),
          author:profiles!posts_author_id_fkey(email, full_name)
        `)
        .eq('status', 'published')
        .eq('post_translations.language', locale)
        .order('published_at', { ascending: false })

      if (fetchError) throw fetchError

      // Deduplicate posts by ID
      const uniquePosts = data ? Array.from(
        new Map(data.map(post => [post.id, post])).values()
      ) : []

      setPosts(uniquePosts)
    } catch (err) {
      console.error('Error fetching news posts:', err)
      console.error('Full error details:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err : new Error('Failed to fetch posts'))
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts
  }
}

/**
 * Filter posts by display position
 * @param posts - All posts array
 * @param position - Position number (1-10)
 * @param limit - Optional limit for number of posts
 * @returns Filtered and sorted posts
 */
export function getPostsByPosition(
  posts: Post[],
  position: number,
  limit?: number
): Post[] {
  const filtered = posts
    .filter(post => post.display_position === position)
    .sort((a, b) => (a.position_order || 0) - (b.position_order || 0))

  return limit ? filtered.slice(0, limit) : filtered
}

/**
 * Get posts without assigned positions (for AllPostsSection)
 * @param posts - All posts array
 * @returns Posts without display_position
 */
export function getUnassignedPosts(posts: Post[]): Post[] {
  return posts.filter(post => !post.display_position)
}
