import { createClient } from './client'

/**
 * Ensure slug is unique for the given language
 * If slug exists, append a number (e.g., my-post-1, my-post-2)
 */
async function ensureUniqueSlug(
  baseSlug: string,
  language: string
): Promise<string> {
  const supabase = createClient()
  let slug = baseSlug
  let counter = 1

  while (true) {
    // Check if slug exists for this language
    const { data, error } = await supabase
      .from('post_translations')
      .select('slug')
      .eq('slug', slug)
      .eq('language', language)
      .single()

    // If no result found, slug is unique
    if (error && error.code === 'PGRST116') {
      return slug
    }

    // If slug exists, try next number
    if (data) {
      slug = `${baseSlug}-${counter}`
      counter++
    } else {
      return slug
    }
  }
}

/**
 * Upload post featured image to Supabase Storage
 * @param file - File object or base64 string
 * @param postId - Post ID for organizing files
 * @returns Public URL of uploaded image
 */
export async function uploadPostImage(
  file: File | string,
  postId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    let fileToUpload: File

    // If base64 string, convert to File
    if (typeof file === 'string') {
      const response = await fetch(file)
      const blob = await response.blob()
      // Use proper timestamp (in seconds, not milliseconds to avoid overflow)
      const timestamp = Math.floor(Date.now() / 1000)
      const filename = `${postId}-${timestamp}.jpg`
      fileToUpload = new File([blob], filename, { type: blob.type })
    } else {
      fileToUpload = file
    }

    // Generate unique filename with proper timestamp
    const fileExt = fileToUpload.name.split('.').pop()
    const timestamp = Math.floor(Date.now() / 1000)
    const fileName = `${postId}/${timestamp}.${fileExt}`

    // Upload to post-images bucket
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadPostImage:', error)
    return null
  }
}

/**
 * Delete post image from Supabase Storage
 * @param imageUrl - Public URL of the image
 */
export async function deletePostImage(imageUrl: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Extract path from public URL
    const path = imageUrl.split('/post-images/')[1]
    if (!path) return false

    const { error } = await supabase.storage
      .from('post-images')
      .remove([path])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deletePostImage:', error)
    return false
  }
}

/**
 * Upload OG image to Supabase Storage
 * @param file - File object
 * @param postId - Post ID for organizing files
 * @returns Public URL of uploaded image
 */
export async function uploadOgImage(
  file: File,
  postId: string
): Promise<string | null> {
  const supabase = createClient()

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Math.floor(Date.now() / 1000)
    const fileName = `og-images/${postId}-${timestamp}.${fileExt}`

    // Upload to post-images bucket in og-images subfolder
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading OG image:', error)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadOgImage:', error)
    return null
  }
}

interface Translation {
  title: string
  excerpt: string
  content: string
  slug: string
  category?: string
  meta_title?: string
  meta_description?: string
  keywords?: string
  og_title?: string
  og_description?: string
  og_image?: string | File
  social_hashtags?: string
  word_count?: number
  reading_time?: number
}

/**
 * Create a new post with translations
 */
export async function createPost(data: {
  translations: {
    georgian: Translation
    english: Translation
    russian: Translation
  }
  displayPosition: number | null
  positionOrder: number
  status: 'draft' | 'pending' | 'published' | 'archived'
  publishedAt?: string | null
  featuredImageFile?: File | string
  ogImageFile?: File | null
  categoryId?: string | null
}) {
  const supabase = createClient()

  try {
    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // 2. Get user profile to check practice_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('practice_id')
      .eq('id', user.id)
      .single()

    // 3. Create post record
    // Determine published_at value:
    // 1. If custom publishedAt is provided, use it
    // 2. If status is 'published' and no custom date, use current time
    // 3. Otherwise, use null (draft/pending posts)
    let publishedAtValue: string | null = null
    if (data.publishedAt) {
      publishedAtValue = data.publishedAt
    } else if (data.status === 'published') {
      publishedAtValue = new Date().toISOString()
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        practice_id: profile?.practice_id || null,
        display_position: data.displayPosition,
        position_order: data.positionOrder,
        status: data.status,
        published_at: publishedAtValue,
        category_id: data.categoryId || null,
      })
      .select()
      .single()

    if (postError) {
      console.error('Post insert error:', postError)
      throw postError
    }

    // 3. Upload featured image if provided
    let featuredImageUrl: string | null = null
    if (data.featuredImageFile) {
      featuredImageUrl = await uploadPostImage(data.featuredImageFile, post.id)
      
      // Update post with image URL
      if (featuredImageUrl) {
        await supabase
          .from('posts')
          .update({ featured_image_url: featuredImageUrl })
          .eq('id', post.id)
      }
    }

    // 4. Upload OG image if provided
    let ogImageUrl: string | null = null
    if (data.ogImageFile) {
      ogImageUrl = await uploadOgImage(data.ogImageFile, post.id)
    }

    // 5. Create translations for all 3 languages
    console.log('Creating translations for post:', post.id)
    console.log('Georgian data:', {
      title: data.translations.georgian.title,
      slug: data.translations.georgian.slug,
      hasContent: !!data.translations.georgian.content
    })

    // Ensure unique slugs for each language
    const georgianSlug = await ensureUniqueSlug(data.translations.georgian.slug, 'ka')
    const englishSlug = await ensureUniqueSlug(data.translations.english.slug, 'en')
    const russianSlug = await ensureUniqueSlug(data.translations.russian.slug, 'ru')

    console.log('Unique slugs:', { georgianSlug, englishSlug, russianSlug })

    const translations = [
      {
        post_id: post.id,
        language: 'ka',
        title: data.translations.georgian.title,
        excerpt: data.translations.georgian.excerpt,
        content: data.translations.georgian.content,
        category: data.translations.georgian.category,
        slug: georgianSlug,
        meta_title: data.translations.georgian.meta_title,
        meta_description: data.translations.georgian.meta_description,
        keywords: data.translations.georgian.keywords,
        og_title: data.translations.georgian.og_title,
        og_description: data.translations.georgian.og_description,
        og_image: ogImageUrl || data.translations.georgian.og_image,
        social_hashtags: data.translations.georgian.social_hashtags,
        word_count: calculateWordCount(data.translations.georgian.content),
        reading_time: calculateReadingTime(data.translations.georgian.content, 'georgian'),
      },
      {
        post_id: post.id,
        language: 'en',
        title: data.translations.english.title,
        excerpt: data.translations.english.excerpt,
        content: data.translations.english.content,
        category: data.translations.english.category,
        slug: englishSlug,
        meta_title: data.translations.english.meta_title,
        meta_description: data.translations.english.meta_description,
        keywords: data.translations.english.keywords,
        og_title: data.translations.english.og_title,
        og_description: data.translations.english.og_description,
        og_image: ogImageUrl || data.translations.english.og_image,
        social_hashtags: data.translations.english.social_hashtags,
        word_count: calculateWordCount(data.translations.english.content),
        reading_time: calculateReadingTime(data.translations.english.content, 'english'),
      },
      {
        post_id: post.id,
        language: 'ru',
        title: data.translations.russian.title,
        excerpt: data.translations.russian.excerpt,
        content: data.translations.russian.content,
        category: data.translations.russian.category,
        slug: russianSlug,
        meta_title: data.translations.russian.meta_title,
        meta_description: data.translations.russian.meta_description,
        keywords: data.translations.russian.keywords,
        og_title: data.translations.russian.og_title,
        og_description: data.translations.russian.og_description,
        og_image: ogImageUrl || data.translations.russian.og_image,
        social_hashtags: data.translations.russian.social_hashtags,
        word_count: calculateWordCount(data.translations.russian.content),
        reading_time: calculateReadingTime(data.translations.russian.content, 'russian'),
      },
    ]

    const { error: translationsError } = await supabase
      .from('post_translations')
      .insert(translations)

    if (translationsError) {
      console.error('Translation insert error:', translationsError)
      throw translationsError
    }

    return { 
      success: true, 
      postId: post.id,
      slugs: {
        ka: georgianSlug,
        en: englishSlug,
        ru: russianSlug
      }
    }
  } catch (error) {
    console.error('Error creating post:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

/**
 * Update existing post
 */
export async function updatePost(
  postId: string,
  data: {
    translations: {
      georgian: Translation
      english: Translation
      russian: Translation
    }
    displayPosition: number | null
    positionOrder: number
    status: 'draft' | 'pending' | 'published' | 'archived'
    publishedAt?: string | null
    featuredImageFile?: File | string
    ogImageFile?: File | null
    categoryId?: string | null
  }
) {
  const supabase = createClient()

  try {
    // 1. Update post record
    interface PostUpdateData {
      display_position: number | null
      position_order: number
      status: string
      category_id: string | null
      published_at?: string
    }

    const updateData: PostUpdateData = {
      display_position: data.displayPosition,
      position_order: data.positionOrder,
      status: data.status,
      category_id: data.categoryId || null,
    }

    // Set published_at based on custom date or status:
    // 1. If custom publishedAt is provided, use it
    // 2. If status is 'published' and no custom date, use current time
    // 3. If status is not 'published', set to null
    if (data.publishedAt) {
      updateData.published_at = data.publishedAt
    } else if (data.status === 'published') {
      updateData.published_at = new Date().toISOString()
    } else {
      updateData.published_at = undefined // Don't update if draft/pending and no custom date
    }

    const { error: postError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)

    if (postError) throw postError

    // 2. Upload new featured image if provided
    if (data.featuredImageFile) {
      // First, get the old image URL to delete it
      const { data: existingPost } = await supabase
        .from('posts')
        .select('featured_image_url')
        .eq('id', postId)
        .single()

      // Delete old image from storage if exists
      if (existingPost?.featured_image_url) {
        const oldFilePath = existingPost.featured_image_url.split('/post-images/')[1]
        if (oldFilePath) {
          await supabase.storage
            .from('post-images')
            .remove([oldFilePath])
            .catch(err => console.error('Error deleting old image:', err))
        }
      }

      // Upload new image
      const featuredImageUrl = await uploadPostImage(data.featuredImageFile, postId)
      
      if (featuredImageUrl) {
        await supabase
          .from('posts')
          .update({ featured_image_url: featuredImageUrl })
          .eq('id', postId)
      }
    }

    // 2.5. Upload new OG image if provided
    let ogImageUrl: string | null = null
    if (data.ogImageFile) {
      // Get existing OG image from translations to delete it
      const { data: existingTranslations } = await supabase
        .from('post_translations')
        .select('og_image')
        .eq('post_id', postId)
        .limit(1)
        .single()

      // Delete old OG image from storage if exists
      if (existingTranslations?.og_image) {
        const oldFilePath = existingTranslations.og_image.split('/post-images/')[1]
        if (oldFilePath) {
          await supabase.storage
            .from('post-images')
            .remove([oldFilePath])
            .catch(err => console.error('Error deleting old OG image:', err))
        }
      }

      // Upload new OG image
      ogImageUrl = await uploadOgImage(data.ogImageFile, postId)
    }

    // 3. Update translations
    const languages = [
      { code: 'ka', data: data.translations.georgian, language: 'georgian' },
      { code: 'en', data: data.translations.english, language: 'english' },
      { code: 'ru', data: data.translations.russian, language: 'russian' },
    ]

    for (const lang of languages) {
      const { error: translationError } = await supabase
        .from('post_translations')
        .update({
          title: lang.data.title,
          excerpt: lang.data.excerpt,
          content: lang.data.content,
          category: lang.data.category,
          slug: lang.data.slug,
          meta_title: lang.data.meta_title,
          meta_description: lang.data.meta_description,
          keywords: lang.data.keywords,
          og_title: lang.data.og_title,
          og_description: lang.data.og_description,
          og_image: ogImageUrl || lang.data.og_image,
          social_hashtags: lang.data.social_hashtags,
          word_count: calculateWordCount(lang.data.content),
          reading_time: calculateReadingTime(lang.data.content, lang.language as 'georgian' | 'english' | 'russian'),
        })
        .eq('post_id', postId)
        .eq('language', lang.code)

      if (translationError) throw translationError
    }

    return { 
      success: true, 
      postId,
      slugs: {
        ka: data.translations.georgian.slug,
        en: data.translations.english.slug,
        ru: data.translations.russian.slug
      }
    }
  } catch (error) {
    console.error('Error updating post:', error)
    throw error
  }
}

/**
 * Delete post (cascades to translations)
 */
export async function deletePost(postId: string) {
  const supabase = createClient()

  try {
    // Delete post (translations will cascade)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deleting post:', error)
    throw error
  }
}

/**
 * Calculate word count from HTML content
 */
function calculateWordCount(htmlContent: string): number {
  const plainText = htmlContent.replace(/<[^>]*>/g, ' ')
  const words = plainText.trim().split(/\s+/).filter(Boolean)
  return words.length
}

/**
 * Calculate reading time based on language WPM
 */
function calculateReadingTime(
  htmlContent: string,
  language: 'georgian' | 'english' | 'russian'
): number {
  const wordCount = calculateWordCount(htmlContent)
  const wpm = language === 'georgian' ? 180 : language === 'english' ? 200 : 190
  return Math.ceil(wordCount / wpm)
}
