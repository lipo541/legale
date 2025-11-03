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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <div className="mx-auto max-w-[1200px] px-6 sm:px-8 lg:px-10 py-12 sm:py-16">
        {/* Back Button */}
        <Link
          href={`/${locale}/news`}
          className={`group flex items-center gap-2 mb-8 text-sm font-light transition-colors ${
            isDark ? 'text-white/50 hover:text-white/80' : 'text-black/50 hover:text-black/80'
          }`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>უკან ბლოგზე</span>
        </Link>

        {/* Main Article Card */}
        <article className={`p-8 sm:p-10 rounded-2xl ring-1 mb-12 ${
          isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
        }`}>
          {/* Category Badge */}
          {category && (
            <Link
              href={`/${locale}/news/category/${category.slug}`}
              className={`inline-flex items-center gap-1.5 mb-4 px-3 py-1.5 rounded-full text-xs font-light transition-all ring-1 ${
                isDark 
                  ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20 hover:bg-blue-500/20' 
                  : 'bg-blue-500/10 text-blue-600 ring-blue-500/20 hover:bg-blue-500/20'
              }`}
            >
              <Tag className="h-3 w-3" />
              {category.name}
            </Link>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className={`text-lg font-light mb-6 leading-relaxed ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className={`flex flex-wrap items-center gap-4 mb-8 pb-6 border-b ${
            isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
          }`}>
            <div className={`flex items-center gap-2 text-sm font-light ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              <Calendar className="h-4 w-4 opacity-50" />
              <span>{formattedDate || '...'}</span>
            </div>
            
            {author?.full_name && (
              <div className={`flex items-center gap-2 text-sm font-light ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`}>
                <User className="h-4 w-4 opacity-50" />
                <span>{author.full_name}</span>
              </div>
            )}
            
            {post.readingTime && (
              <div className={`flex items-center gap-2 text-sm font-light ${
                isDark ? 'text-white/50' : 'text-black/50'
              }`}>
                <Clock className="h-4 w-4 opacity-50" />
                <span>{post.readingTime} წუთი</span>
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => handleShare('facebook')}
                className={`p-2 rounded-full transition-all ring-1 ${
                  isDark 
                    ? 'bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] ring-black/[0.08] hover:bg-black/[0.05]'
                }`}
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4 opacity-50" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className={`p-2 rounded-full transition-all ring-1 ${
                  isDark 
                    ? 'bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] ring-black/[0.08] hover:bg-black/[0.05]'
                }`}
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4 opacity-50" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className={`p-2 rounded-full transition-all ring-1 ${
                  isDark 
                    ? 'bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] ring-black/[0.08] hover:bg-black/[0.05]'
                }`}
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4 opacity-50" />
              </button>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-xl overflow-hidden ring-1 ring-black/5">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-news.svg';
                }}
              />
            </div>
          )}

          {/* Content */}
          <div 
            className={`prose prose-lg max-w-none ${
              isDark 
                ? 'prose-invert prose-headings:font-extralight prose-headings:tracking-tight prose-p:font-light prose-p:text-white/70' 
                : 'prose-headings:font-extralight prose-headings:tracking-tight prose-p:font-light prose-p:text-black/70'
            }`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className={`p-8 sm:p-10 rounded-2xl ring-1 ${
            isDark ? 'bg-white/[0.02] ring-white/[0.08]' : 'bg-black/[0.02] ring-black/[0.08]'
          }`}>
            <h2 className="text-2xl font-extralight tracking-tight mb-6">
              მსგავსი სტატიები
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => {
                const translation = relatedPost.post_translations[0]
                
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/${locale}/news/${translation.slug}`}
                    className={`group overflow-hidden rounded-xl transition-all ring-1 ${
                      isDark 
                        ? 'bg-white/[0.02] ring-white/[0.08] hover:bg-white/[0.05]' 
                        : 'bg-black/[0.02] ring-black/[0.08] hover:bg-black/[0.05]'
                    }`}
                  >
                    {relatedPost.featured_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={relatedPost.featured_image_url}
                          alt={translation.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-news.svg';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h3 className="font-light text-base mb-2 line-clamp-2">
                        {translation.title}
                      </h3>
                      <p className={`text-sm font-light line-clamp-2 ${
                        isDark ? 'text-white/50' : 'text-black/50'
                      }`}>
                        {translation.excerpt}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
