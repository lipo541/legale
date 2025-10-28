'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DraftPost {
  id: string
  title: string
  excerpt: string
  category: string
  image_url?: string
  created_at: string
  author_name: string
  author_avatar?: string
  status: 'draft' | 'pending' | 'published'
}

export default function AllPostsSection() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [posts, setPosts] = useState<DraftPost[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(6)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    const supabase = createClient()
    
    // TODO: Replace with actual news table query
    // For now, using placeholder data
    const placeholderPosts: DraftPost[] = Array.from({ length: 12 }, (_, i) => ({
      id: `post-${i + 1}`,
      title: `სამართლებრივი სიახლე #${i + 1}`,
      excerpt: 'ეს არის სიახლის მოკლე აღწერა რომელიც გამოჩნდება კარტზე. აქ იქნება ინფორმაცია სიახლის შესახებ და მთავარი იდეა.',
      category: ['რეგულაცია', 'სასამართლო', 'ფინანსები', 'IT სამართალი'][i % 4],
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      author_name: `ავტორი ${i + 1}`,
      status: i % 3 === 0 ? 'pending' : 'draft'
    }))

    setPosts(placeholderPosts)
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ka-GE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'pending': return 'განხილვაში'
      case 'published': return 'გამოქვეყნებული'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': 
        return isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-white'
      case 'pending': 
        return isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/20 text-yellow-700'
      case 'published': 
        return isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-700'
      default: 
        return isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-black'
    }
  }

  const loadMore = () => {
    setDisplayCount(prev => prev + 6)
  }

  if (loading) {
    return (
      <div className="mt-16">
        <div className={`text-center ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          იტვირთება...
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16">
      {/* Section Header */}
      <div className="mb-8 flex items-end justify-between border-b pb-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <div>
          <h2 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            ყველა პოსტი
          </h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            ავტორების მიერ ატვირთული სიახლეები • სულ {posts.length} პოსტი
          </p>
        </div>
        
        {/* Filter/Sort options */}
        <div className="flex items-center gap-2">
          <button className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-black/5 text-black/60 hover:bg-black/10'
          }`}>
            ყველა სტატუსი
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, displayCount).map((post) => (
          <div
            key={post.id}
            className={`group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[0.98] ${
              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            {/* Image placeholder */}
            <div className={`relative h-48 overflow-hidden ${
              isDark ? 'bg-white/10' : 'bg-black/10'
            }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className={`h-12 w-12 ${isDark ? 'text-white/20' : 'text-black/20'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Status badge */}
              <div className="absolute left-3 top-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${getStatusColor(post.status)}`}>
                  {getStatusLabel(post.status)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Meta info */}
              <div className="mb-3 flex items-center justify-between">
                <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  {formatDate(post.created_at)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                  isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h3 className={`mb-2 text-lg font-semibold leading-tight transition-opacity group-hover:opacity-60 ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className={`mb-4 line-clamp-2 text-sm leading-relaxed ${
                isDark ? 'text-white/60' : 'text-black/60'
              }`}>
                {post.excerpt}
              </p>

              {/* Author & Action */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDark ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                  }`}>
                    {post.author_name.charAt(0)}
                  </div>
                  <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                    {post.author_name}
                  </span>
                </div>
                
                <button className={`flex items-center gap-1 text-xs font-medium transition-all group-hover:translate-x-1 ${
                  isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
                }`}>
                  <span>იხილე</span>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {displayCount < posts.length && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={loadMore}
            className={`rounded-full px-8 py-3 text-sm font-medium transition-all hover:scale-105 ${
              isDark 
                ? 'bg-white/5 text-white hover:bg-white/10' 
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            მეტის ნახვა ({posts.length - displayCount} დარჩენილი)
          </button>
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && (
        <div className={`py-16 text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
          <svg className="mx-auto mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-lg font-medium">პოსტები ჯერ არ არის</p>
          <p className="mt-1 text-sm">ავტორების მიერ ატვირთული სიახლეები აქ გამოჩნდება</p>
        </div>
      )}
    </div>
  )
}
