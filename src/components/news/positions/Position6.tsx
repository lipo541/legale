'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { newsTranslations } from '@/translations/news'

interface PostTranslation {
  title: string
  excerpt?: string
  slug: string
  reading_time?: number
  category?: string
}

interface Post {
  id: string
  featured_image_url?: string
  published_at?: string
  post_translations: PostTranslation[]
}

interface Position6Props {
  posts: Post[]
}

// Featured Post Card - Compact & Visual
export default function Position6({ posts }: Position6Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const locale = (params?.locale as string) || 'ka'
  const t = newsTranslations[locale as keyof typeof newsTranslations]
  
  const post = posts[0] || null

  if (!post) {
    return (
      <div className={`relative h-full overflow-hidden rounded-2xl flex items-center justify-center ${
        isDark ? 'bg-white/5' : 'bg-black'
      }`}>
        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-white/60'}`}>{t.noPostsPosition6}</p>
      </div>
    )
  }

  const translation = post.post_translations[0]

  return (
    <Link href={`/${locale}/news/${translation.slug}`} className="block h-full">
      <div className={`group relative h-full overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg ${
        isDark 
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 hover:border-white/20' 
          : 'bg-black border border-gray-800 hover:border-gray-700'
      }`}>
        {/* Image Section (Top Half) */}
        {post.featured_image_url && (
          <div className="relative h-[70%] w-full overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={translation.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              loading="lazy"
            />
            <div className={`absolute inset-0 ${
              isDark 
                ? 'bg-gradient-to-t from-zinc-900 via-transparent to-transparent' 
                : 'bg-gradient-to-t from-black via-transparent to-transparent'
            }`} />
            
            {/* Category Badge on Image */}
            <div className="absolute top-2 left-2">
              <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm ${
                isDark ? 'bg-black/70 text-white' : 'bg-white/30 text-white'
              }`}>
                {translation.category}
              </span>
            </div>
          </div>
        )}

        {/* Content Section (Bottom Half) */}
        <div className="relative flex h-[30%] flex-col justify-center p-2">
          <h3 className={`text-[11px] md:text-xs font-semibold leading-snug line-clamp-2 ${
            isDark ? 'text-white' : 'text-white'
          }`}>
            {translation.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}
