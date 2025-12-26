/**
 * useNewsData Hook
 * Manages news posts data with SSR initial data support
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Post, GroupedPosts, Category } from '../types'

// ============================================================================
// HELPER FUNCTIONS (exported for use in NewsLayout)
// ============================================================================

/**
 * Filter posts by display position
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
 */
export function getUnassignedPosts(posts: Post[]): Post[] {
  return posts.filter(post => !post.display_position)
}

// ============================================================================
// GROUPING FUNCTIONS
// ============================================================================

interface CategoryHierarchy {
  id: string
  parent_id: string | null
}

/**
 * Group posts by their root category
 */
export function groupPostsByCategory(
  posts: Post[],
  categories: Category[],
  locale: string,
  uncategorizedLabel: string = 'Uncategorized'
): GroupedPosts {
  // Create category map for quick lookup
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
  
  const grouped: GroupedPosts = {}
  
  posts.forEach((post) => {
    if (post.category_id) {
      const category = categoryMap.get(post.category_id)
      
      if (!grouped[post.category_id]) {
        grouped[post.category_id] = {
          name: category?.name || uncategorizedLabel,
          slug: category?.slug || 'uncategorized',
          posts: []
        }
      }
      grouped[post.category_id].posts.push(post)
    }
  })
  
  return grouped
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseNewsDataOptions {
  initialPosts: Post[]
  categories: Category[]
  locale: string
  uncategorizedLabel?: string
}

interface UseNewsDataReturn {
  posts: Post[]
  groupedPosts: GroupedPosts
  loading: boolean
  // Position-based post getters
  getPositionPosts: (position: number, limit?: number) => Post[]
  // Unassigned posts for AllPostsSection
  unassignedPosts: Post[]
}

export function useNewsData({
  initialPosts,
  categories,
  locale,
  uncategorizedLabel = 'Uncategorized'
}: UseNewsDataOptions): UseNewsDataReturn {
  // Use initial posts from SSR - no client-side refetching needed
  const [posts] = useState<Post[]>(initialPosts)
  const [loading] = useState(false)

  // Memoized position-based post getter
  const getPositionPosts = useCallback((position: number, limit?: number) => {
    return getPostsByPosition(posts, position, limit)
  }, [posts])

  // Memoized unassigned posts
  const unassignedPosts = useMemo(() => {
    return getUnassignedPosts(posts)
  }, [posts])

  // Memoized grouped posts by category
  const groupedPosts = useMemo(() => {
    return groupPostsByCategory(posts, categories, locale, uncategorizedLabel)
  }, [posts, categories, locale, uncategorizedLabel])

  return {
    posts,
    groupedPosts,
    loading,
    getPositionPosts,
    unassignedPosts
  }
}

export default useNewsData
