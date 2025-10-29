'use client'

import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, User, Clock, Tag, Facebook, Twitter, Linkedin } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Translation {
  language: string
  title?: string
  slug?: string
}

interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  featuredImage?: string
  publishedAt: string
  wordCount?: number
  readingTime?: number
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  translations: Translation[]
}

interface Author {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface Category {
  name: string
  slug: string
}

interface RelatedPost {
  id: string
  featured_image_url?: string
  published_at: string
  post_translations: Array<{
    title: string
    excerpt?: string
    slug: string
    language?: string
  }>
}

interface PostPageClientProps {
  post: Post
  author: Author | null
  category: Category | null
  relatedPosts: RelatedPost[]
  locale: string
}

export default function PostPageClient({ post, author, category, relatedPosts, locale }: PostPageClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [formattedDate, setFormattedDate] = useState('')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Format date on client-side to avoid hydration mismatch
  useEffect(() => {
    setFormattedDate(formatDate(post.publishedAt))
  }, [post.publishedAt, locale])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleShare = (platform: string) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }
    
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className={`mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>უკან ბლოგზე</span>
        </Link>

        {/* Category Badge */}
        {category && (
          <Link
            href={`/${locale}/news/category/${category.slug}`}
            className={`inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Tag className="h-3 w-3" />
            {category.name}
          </Link>
        )}

        {/* Title */}
        <h1 className={`text-4xl md:text-5xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className={`text-xl mb-6 leading-relaxed ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            {post.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className={`flex flex-wrap items-center gap-4 mb-8 pb-6 border-b ${
          isDark ? 'border-white/10' : 'border-black/10'
        }`}>
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
            <Calendar className="h-4 w-4" />
            <span>{formattedDate || '...'}</span>
          </div>
          
          {author?.full_name && (
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <User className="h-4 w-4" />
              <span>{author.full_name}</span>
            </div>
          )}
          
          {post.readingTime && (
            <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <Clock className="h-4 w-4" />
              <span>{post.readingTime} წუთი</span>
            </div>
          )}

          {/* Share Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => handleShare('facebook')}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
              }`}
              aria-label="Share on Facebook"
            >
              <Facebook className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
              }`}
              aria-label="Share on LinkedIn"
            >
              <Linkedin className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className={`p-2 rounded-full transition-all hover:scale-110 ${
                isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'
              }`}
              aria-label="Share on Twitter"
            >
              <Twitter className={`h-4 w-4 ${isDark ? 'text-white' : 'text-black'}`} />
            </button>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative w-full h-96 mb-8 rounded-2xl overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div 
          className={`prose prose-lg max-w-none mb-12 ${
            isDark ? 'prose-invert' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className={`mt-16 pt-12 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
              მსგავსი სტატიები
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => {
                const translation = relatedPost.post_translations[0]
                
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/${locale}/news/${translation.slug}`}
                    className={`group overflow-hidden rounded-xl transition-all hover:scale-[0.98] ${
                      isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                    }`}
                  >
                    {relatedPost.featured_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={relatedPost.featured_image_url}
                          alt={translation.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className={`font-semibold mb-2 line-clamp-2 ${
                        isDark ? 'text-white' : 'text-black'
                      }`}>
                        {translation.title}
                      </h3>
                      <p className={`text-sm line-clamp-2 ${
                        isDark ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {translation.excerpt}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
