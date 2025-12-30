'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import { getOptimizedImageUrl, imagePresets } from '@/lib/utils'
import { ArrowLeft, ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import NewsSearch from '@/components/news/common/NewsSearch'
import NewsSort, { SortOption } from '@/components/news/common/NewsSort'
import ViewModeToggle from '@/components/common/ViewModeToggle'
import { newsTranslations } from '@/translations/news'

// Tree Node interface
interface TreeNode {
  id: string
  name: string
  postCount: number
  depth: number
  children: TreeNode[]
  parentId: string | null
}

// Tree Node Component for collapsible hierarchy with navigation
function TreeNodeComponent({
  node,
  level,
  selectedId,
  expandedNodes,
  onSelect,
  onToggle,
  isDark,
  locale,
  subcategoryMap
}: {
  node: TreeNode
  level: number
  selectedId: string | null
  expandedNodes: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  isDark: boolean
  locale: string
  subcategoryMap: Array<{ id: string; slug: string }>
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const isSelected = selectedId === node.id
  
  // Get slug for navigation
  const categorySlug = subcategoryMap.find(c => c.id === node.id)?.slug || ''

  return (
    <div className="relative">
      {/* Vertical line connector for tree structure */}
      {level > 0 && (
        <div 
          className={`absolute top-0 bottom-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`}
          style={{ left: `${(level - 1) * 20 + 18}px`, width: '1px' }}
        />
      )}
      
      <div 
        className={`group flex items-center gap-1.5 rounded-xl transition-all duration-200 backdrop-blur-sm border ${
          isSelected
            ? isDark 
              ? 'bg-white/15 border-white/20 shadow-lg shadow-white/5' 
              : 'bg-black/10 border-black/20 shadow-lg shadow-black/5'
            : isDark 
              ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15' 
              : 'bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/15'
        }`}
        style={{ marginLeft: `${level * 20}px`, marginTop: level > 0 ? '4px' : '0' }}
      >
        {/* Expand/Collapse button - only for expand, not navigation */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggle(node.id)
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'hover:bg-white/15 active:scale-95' 
                : 'hover:bg-black/15 active:scale-95'
            }`}
          >
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <ChevronRight className={`h-3.5 w-3.5 ${
                isSelected 
                  ? isDark ? 'text-white' : 'text-black'
                  : isDark ? 'text-white/50' : 'text-black/50'
              }`} />
            </div>
          </button>
        ) : (
          <span className="w-8" /> // Spacer for alignment
        )}
        
        {/* Category Link - navigates to category page */}
        <Link
          href={`/${locale}/news/category/${categorySlug}`}
          onClick={(e) => {
            e.stopPropagation()
            // Also select this category for filtering
            onSelect(node.id)
          }}
          className={`flex-1 flex items-center gap-2 py-2 pr-3 transition-all duration-200 ${
            isSelected 
              ? isDark ? 'text-white' : 'text-black'
              : isDark ? 'text-white/70 group-hover:text-white' : 'text-black/70 group-hover:text-black'
          }`}
        >
          {/* Icon with glow effect */}
          <div className={`relative ${isSelected ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className={`h-4 w-4 ${
                  isSelected 
                    ? isDark ? 'text-amber-400' : 'text-amber-500'
                    : isDark ? 'text-amber-400/60' : 'text-amber-500/60'
                }`} />
              ) : (
                <Folder className={`h-4 w-4 ${
                  isSelected 
                    ? isDark ? 'text-amber-400' : 'text-amber-500'
                    : isDark ? 'text-amber-400/60' : 'text-amber-500/60'
                }`} />
              )
            ) : (
              <FileText className={`h-4 w-4 ${
                isSelected 
                  ? isDark ? 'text-blue-400' : 'text-blue-500'
                  : isDark ? 'text-blue-400/60' : 'text-blue-500/60'
              }`} />
            )}
          </div>
          
          {/* Name */}
          <span className="text-[11px] md:text-xs font-medium truncate">
            {node.name}
          </span>
          
          {/* Post count badge */}
          <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
            isSelected 
              ? isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
              : isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'
          }`}>
            {node.postCount}
          </span>
        </Link>
      </div>
      
      {/* Children with animated expand */}
      {hasChildren && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-1">
            {node.children.map(child => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                selectedId={selectedId}
                expandedNodes={expandedNodes}
                onSelect={onSelect}
                onToggle={onToggle}
                isDark={isDark}
                locale={locale}
                subcategoryMap={subcategoryMap}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Translation {
  language: string
  title?: string
  slug?: string
  excerpt?: string
  reading_time?: number
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  seo_title?: string
  seo_description?: string
  translations: Translation[]
}

interface Post {
  id: string
  featured_image_url?: string
  published_at: string
  category_id?: string
  post_translations: Translation[]
  author?: {
    id: string
    email: string
    full_name?: string
    role?: string
    company_id?: string
    company?: {
      full_name?: string
      company_slug?: string
    }
  }
}

interface BreadcrumbItem {
  id: string
  name: string
  slug: string
}

interface SubcategoryInfo {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

interface SiblingCategory {
  id: string
  name: string
  slug: string
  postCount: number
  depth?: number
}

interface CategoryPageClientProps {
  category: Category
  posts: Post[]
  locale: string
  parentBreadcrumbs: BreadcrumbItem[]
  subcategoryMap: SubcategoryInfo[]
  siblingCategories: SiblingCategory[]
  childCategories: SiblingCategory[]
}

export default function CategoryPageClient({ category, posts, locale, parentBreadcrumbs, subcategoryMap, siblingCategories, childCategories }: CategoryPageClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  // Build category lookup map for badge display
  const categoryLookup = useMemo(() => {
    const map = new Map<string, SubcategoryInfo>()
    subcategoryMap.forEach(cat => map.set(cat.id, cat))
    return map
  }, [subcategoryMap])
  
  // Search, Sort, View states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedChildCategory, setSelectedChildCategory] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Build tree structure from flat childCategories
  const categoryTree = useMemo(() => {
    // First, get parent_id info from subcategoryMap
    const parentMap = new Map<string, string | null>()
    subcategoryMap.forEach(cat => parentMap.set(cat.id, cat.parent_id))
    
    // Create nodes with parent info
    const nodesWithParent = childCategories
      .filter(c => c.postCount > 0)
      .map(c => ({
        ...c,
        parentId: parentMap.get(c.id) || null,
        children: [] as TreeNode[]
      }))
    
    // Build tree - find root level (direct children of current category)
    const nodeMap = new Map<string, TreeNode>()
    nodesWithParent.forEach(n => nodeMap.set(n.id, n as TreeNode))
    
    const roots: TreeNode[] = []
    nodesWithParent.forEach(node => {
      // If parent is in our list, add as child; otherwise it's a root
      const parent = node.parentId ? nodeMap.get(node.parentId) : null
      if (parent) {
        parent.children.push(node as TreeNode)
      } else {
        roots.push(node as TreeNode)
      }
    })
    
    return roots
  }, [childCategories, subcategoryMap])

  // Toggle expanded state
  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Format date manually to avoid SSR hydration mismatch
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime()) || date.getTime() === 0) return ''
    
    const day = date.getDate()
    const monthIndex = date.getMonth()
    const year = date.getFullYear()
    
    const months: Record<string, string[]> = {
      'ka': ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
      'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      'ru': ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    }
    
    const monthNames = months[locale] || months['ka']
    return `${day} ${monthNames[monthIndex]} ${year}`
  }

  // Helper function to find all descendants of a category (recursive)
  const findAllDescendants = useCallback((categoryId: string): string[] => {
    const descendants: string[] = []
    subcategoryMap.forEach(cat => {
      if (cat.parent_id === categoryId) {
        descendants.push(cat.id)
        // Recursively find children of this child
        descendants.push(...findAllDescendants(cat.id))
      }
    })
    return descendants
  }, [subcategoryMap])

  // Filtered and sorted posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...posts]
    
    // Apply child category filter (includes selected category + all its descendants)
    if (selectedChildCategory) {
      const descendantIds = findAllDescendants(selectedChildCategory)
      const categoryIdsToInclude = new Set([selectedChildCategory, ...descendantIds])
      filtered = filtered.filter(post => post.category_id && categoryIdsToInclude.has(post.category_id))
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(post => {
        const translation = post.post_translations?.find(t => t.language === locale) || post.post_translations?.[0]
        const title = translation?.title?.toLowerCase() || ''
        const excerpt = translation?.excerpt?.toLowerCase() || ''
        return title.includes(query) || excerpt.includes(query)
      })
    }
    
    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      const aTranslation = a.post_translations?.find(t => t.language === locale) || a.post_translations?.[0]
      const bTranslation = b.post_translations?.find(t => t.language === locale) || b.post_translations?.[0]
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        case 'oldest':
          return new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
        case 'a-z':
          return (aTranslation?.title || '').localeCompare(bTranslation?.title || '', locale)
        case 'z-a':
          return (bTranslation?.title || '').localeCompare(aTranslation?.title || '', locale)
        default:
          return 0
      }
    })
    
    return sorted
  }, [posts, searchQuery, sortBy, locale])

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort)
  }, [])

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedChildCategory !== null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-8">
        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className={`mb-4 inline-flex items-center gap-2 text-xs md:text-sm font-medium transition-colors ${
            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span>{t.breadcrumb || 'სიახლეები'}</span>
        </Link>

        {/* Category Header - Compact */}
        <div className="mb-6 md:mb-8">
          {/* Breadcrumbs - Parent hierarchy */}
          {parentBreadcrumbs.length > 0 && (
            <nav className="mb-3 flex items-center gap-1.5 flex-wrap text-xs md:text-sm">
              {parentBreadcrumbs.map((parent) => (
                <span key={parent.id} className="flex items-center gap-1.5">
                  <Link
                    href={`/${locale}/news/category/${parent.slug}`}
                    className={`transition-colors hover:underline ${
                      isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {parent.name}
                  </Link>
                  <ChevronRight className={`h-3 w-3 ${isDark ? 'text-white/30' : 'text-black/30'}`} />
                </span>
              ))}
            </nav>
          )}
          
          {/* Category Title - Smaller */}
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className={`h-1 w-8 md:w-12 rounded-full ${
              isDark ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`} />
            <h1 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {category.name}
            </h1>
            <span className={`rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
            }`}>
              {posts.length}
            </span>
          </div>
          
          {category.description && (
            <p className={`text-xs md:text-sm max-w-2xl ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              {category.description}
            </p>
          )}
        </div>

        {/* Two-tier Navigation */}
        <div className="mb-6 md:mb-8 space-y-3">
          {/* Tier 1: Sibling Categories (same parent) - Navigate to other category */}
          {siblingCategories.length > 0 && (
            <div className={`rounded-xl border p-2 md:p-3 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
            }`}>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20">
                {/* Current category - active */}
                <span className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition-all ${
                  isDark 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {category.name}
                </span>
                
                {/* Sibling categories - links */}
                {siblingCategories.map((sibling) => (
                  <Link
                    key={sibling.id}
                    href={`/${locale}/news/category/${sibling.slug}`}
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition-all ${
                      isDark 
                        ? 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white' 
                        : 'bg-black/10 text-black/70 hover:bg-black/20 hover:text-black'
                    }`}
                  >
                    {sibling.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tier 2: Child Categories (subcategories) - Collapsible Tree Filter */}
          {childCategories.length > 0 && (
            <div className={`rounded-2xl border backdrop-blur-md p-4 md:p-5 ${
              isDark 
                ? 'bg-white/5 border-white/10 shadow-xl shadow-black/20' 
                : 'bg-black/5 border-black/10 shadow-xl shadow-black/5'
            }`}>
              {/* Header */}
              <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}>
                <Folder className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                  ქვეკატეგორიები
                </span>
              </div>
              
              {/* "All" button - glass style */}
              <button
                onClick={() => setSelectedChildCategory(null)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] md:text-xs font-medium transition-all duration-200 mb-3 border backdrop-blur-sm ${
                  selectedChildCategory === null
                    ? isDark 
                      ? 'bg-white/15 border-white/20 text-white shadow-lg shadow-white/5' 
                      : 'bg-black/10 border-black/20 text-black shadow-lg shadow-black/5'
                    : isDark 
                      ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/15' 
                      : 'bg-black/5 border-black/5 text-black/70 hover:bg-black/10 hover:border-black/15'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                  selectedChildCategory === null
                    ? isDark ? 'bg-white/20' : 'bg-black/20'
                    : isDark ? 'bg-white/10' : 'bg-black/10'
                }`}>
                  <span className="text-[10px]">✦</span>
                </div>
                <span>{t.allCategories || 'ყველა'}</span>
                <span className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] ${
                  selectedChildCategory === null
                    ? isDark ? 'bg-white/20' : 'bg-black/20'
                    : isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'
                }`}>
                  {posts.length}
                </span>
              </button>
              
              {/* Tree structure */}
              <div className="space-y-1">
                {categoryTree.map(node => (
                  <TreeNodeComponent
                    key={node.id}
                    node={node}
                    level={0}
                    selectedId={selectedChildCategory}
                    expandedNodes={expandedNodes}
                    onSelect={setSelectedChildCategory}
                    onToggle={toggleExpanded}
                    isDark={isDark}
                    locale={locale}
                    subcategoryMap={subcategoryMap}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search, Sort, View Controls */}
        <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
          {/* Search Bar */}
          <NewsSearch 
            onSearch={handleSearch}
            resultsCount={hasActiveFilters ? filteredAndSortedPosts.length : undefined}
          />
          
          {/* Sort & View Mode */}
          <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
            <NewsSort 
              onSortChange={handleSortChange}
              currentSort={sortBy}
            />
            <ViewModeToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* No Results State */}
        {filteredAndSortedPosts.length === 0 && hasActiveFilters && (
          <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">{t.noResults}</p>
            <p className="mt-1 text-sm">{t.noResultsDescription}</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedChildCategory(null)
              }}
              className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-black/10 text-black hover:bg-black/20'
              }`}
            >
              {t.clearFilters}
            </button>
          </div>
        )}

        {/* Empty Category State */}
        {posts.length === 0 && !hasActiveFilters && (
          <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-lg font-medium">{t.noPosts}</p>
          </div>
        )}

        {/* Posts - Same style as AllPostsSection */}
        {filteredAndSortedPosts.length > 0 && (
          <div className={`${
            viewMode === 'grid' 
              ? 'flex gap-3 md:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin' 
              : 'grid grid-cols-1 gap-3 md:gap-4'
          } ${isDark ? 'scrollbar-thumb-white/20 scrollbar-track-white/5' : 'scrollbar-thumb-black/20 scrollbar-track-black/5'}`}>
            {filteredAndSortedPosts.map((post) => {
              const translation = post.post_translations?.find((t) => t.language === locale) || post.post_translations?.[0]
              
              // Get subcategory info for badge display
              const postCategory = categoryLookup.get(post.category_id || '')
              const isSubcategory = postCategory?.parent_id !== null && postCategory?.parent_id !== undefined
              
              return (
                <Link
                  key={post.id}
                  href={`/${locale}/news/${translation?.slug || post.id}`}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 hover:scale-[0.98] ${
                    viewMode === 'grid' 
                      ? 'flex flex-col flex-shrink-0 w-72 md:w-80 snap-start' 
                      : 'flex flex-row'
                  } ${
                    isDark 
                      ? 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20' 
                      : 'bg-white/20 border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl'
                  }`}
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden flex-shrink-0 ${
                    viewMode === 'grid' 
                      ? 'h-40 md:h-48 w-full' 
                      : 'h-28 md:h-32 w-32 md:w-48'
                  }`}>
                    {post.featured_image_url ? (
                      <img
                        src={getOptimizedImageUrl(post.featured_image_url, imagePresets.cardLargeAspect)}
                        alt={translation?.title || 'Post image'}
                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`h-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className={`h-8 md:h-12 w-8 md:w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Subcategory Badge - clickable button that navigates to category page */}
                    {isSubcategory && postCategory?.name && postCategory?.slug && (
                      <div className="absolute top-2 left-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.href = `/${locale}/news/category/${postCategory.slug}`
                          }}
                          title={postCategory.name}
                          className="block max-w-[120px] truncate rounded-full px-2.5 py-1 text-[10px] font-medium bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          {postCategory.name}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex flex-col flex-1 ${viewMode === 'grid' ? 'p-3 md:p-4' : 'p-3 md:p-5'}`}>
                    {/* Meta info */}
                    <div className="mb-1.5 md:mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        <span className={`text-[10px] md:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          {formatDate(post.published_at)}
                        </span>
                        {post.author?.full_name && post.author.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                window.location.href = `/${locale}/news/author/${post.author!.id}`
                              }}
                              className={`text-[10px] md:text-[10px] transition-colors hover:underline ${isDark ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`}
                            >
                              {post.author.full_name}
                            </button>
                            {post.author.role === 'SPECIALIST' && post.author.company?.full_name && post.author.company_id && (
                              <>
                                <span className={`text-[10px] md:text-[10px] ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                  •
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    window.location.href = `/${locale}/news/author/${post.author!.company_id}`
                                  }}
                                  className={`text-[10px] md:text-[10px] transition-colors hover:underline ${isDark ? 'text-emerald-400/60 hover:text-emerald-400' : 'text-emerald-600/60 hover:text-emerald-600'}`}
                                >
                                  {post.author.company.full_name}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] md:text-[10px] flex-shrink-0 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                        {translation?.reading_time ?? '-'} {t.readingTimeMinutes}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`mb-1 md:mb-1.5 font-semibold leading-tight transition-opacity group-hover:opacity-60 ${
                      viewMode === 'grid' 
                        ? 'text-xs md:text-sm line-clamp-2' 
                        : 'text-xs md:text-base line-clamp-2'
                    } ${
                      isDark ? 'text-white' : 'text-black'
                    }`}>
                      {translation?.title || 'უსათაურო'}
                    </h3>

                    {/* Excerpt */}
                    <p className={`mb-2 md:mb-2.5 text-[10px] md:text-xs leading-relaxed ${
                      viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-2 md:line-clamp-3'
                    } ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {translation?.excerpt}
                    </p>

                    {/* Action */}
                    <div className="flex justify-end pt-2 md:pt-2.5 mt-auto border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <span className={`flex items-center gap-0.5 text-[10px] md:text-[10px] font-medium transition-all group-hover:translate-x-1 ${
                        isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                      }`}>
                        <span>{t.readMore}</span>
                        <svg className="h-2 md:h-2.5 w-2 md:w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
