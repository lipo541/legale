import { createClient } from '@/lib/supabase/client'

/**
 * Get the translated URL for language switching
 * Handles both static and dynamic pages (specialists, companies, news, practices)
 */
export async function getTranslatedUrl(
  currentPath: string,
  newLocale: string,
  currentLocale: string,
): Promise<string> {
  // Remove leading slash and split path into segments
  const segments = currentPath.replace(/^\//, '').split('/')

  // Remove current locale from segments
  const pathWithoutLocale = segments.filter(seg => seg !== currentLocale)

  // If it's just the home page or a simple static page
  if (pathWithoutLocale.length === 0 || pathWithoutLocale.length === 1) {
    // Static pages: just replace locale
    const newPath = pathWithoutLocale.length === 0 
      ? `/${newLocale}` 
      : `/${newLocale}/${pathWithoutLocale[0]}`
    return newPath
  }

  // Extract page type and slug from dynamic URLs
  const [pageType, subType, slug] = pathWithoutLocale

  // If no slug (e.g., /specialists without specific specialist)
  if (!subType && !slug) {
    return `/${newLocale}/${pageType}`
  }

  // Handle dynamic pages that need slug translation
  const supabase = createClient()

  try {
    let translatedSlug: string | null = null

    // Handle news/category/[slug] route
    if (pageType === 'news' && subType === 'category' && slug) {
      // Find category_id from current slug
      const { data: currentData } = await supabase
        .from('post_category_translations')
        .select('category_id')
        .eq('slug', slug)
        .eq('language', currentLocale)
        .single()

      if (currentData?.category_id) {
        // Get translated slug
        const { data: translatedData } = await supabase
          .from('post_category_translations')
          .select('slug')
          .eq('category_id', currentData.category_id)
          .eq('language', newLocale)
          .single()

        if (translatedData?.slug) {
          return `/${newLocale}/news/category/${translatedData.slug}`
        }
      }
      // If translation not found, redirect to news home
      return `/${newLocale}/news`
    }

    // Use the slug from pathWithoutLocale for simple routes
    const simpleSlug = subType || slug

    switch (pageType) {
      case 'specialists': {
        // Find specialist_id from current slug
        const { data: currentData } = await supabase
          .from('specialist_translations')
          .select('specialist_id')
          .eq('slug', simpleSlug)
          .eq('language', currentLocale)
          .single()

        if (currentData?.specialist_id) {
          // Get translated slug
          const { data: translatedData } = await supabase
            .from('specialist_translations')
            .select('slug')
            .eq('specialist_id', currentData.specialist_id)
            .eq('language', newLocale)
            .single()

          translatedSlug = translatedData?.slug || null
        }
        break
      }

      case 'companies': {
        let companyId: string | null = null

        // If current locale is Georgian (ka), get company_id from profiles table
        if (currentLocale === 'ka') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_slug', simpleSlug)
            .eq('role', 'COMPANY')
            .single()

          companyId = profileData?.id || null
        } else {
          // Get company_id from company_translations for en/ru
          const { data: currentData } = await supabase
            .from('company_translations')
            .select('company_id')
            .eq('slug', simpleSlug)
            .eq('language', currentLocale)
            .single()

          companyId = currentData?.company_id || null
        }

        if (companyId) {
          // If new locale is Georgian, get slug from profiles table
          if (newLocale === 'ka') {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('company_slug')
              .eq('id', companyId)
              .single()

            translatedSlug = profileData?.company_slug || null
          } else {
            // Get translated slug from company_translations for en/ru
            const { data: translatedData } = await supabase
              .from('company_translations')
              .select('slug')
              .eq('company_id', companyId)
              .eq('language', newLocale)
              .single()

            translatedSlug = translatedData?.slug || null
          }
        }
        break
      }

      case 'news': {
        // Skip if it's a category route (already handled above)
        if (subType === 'category') {
          break
        }
        
        // Find post_id from current slug
        const { data: currentData } = await supabase
          .from('post_translations')
          .select('post_id')
          .eq('slug', simpleSlug)
          .eq('language', currentLocale)
          .single()

        if (currentData?.post_id) {
          // Get translated slug
          const { data: translatedData } = await supabase
            .from('post_translations')
            .select('slug')
            .eq('post_id', currentData.post_id)
            .eq('language', newLocale)
            .single()

          translatedSlug = translatedData?.slug || null
        }
        break
      }

      case 'practices': {
        // Find practice_id from current slug
        const { data: currentData } = await supabase
          .from('practice_translations')
          .select('practice_id')
          .eq('slug', simpleSlug)
          .eq('language', currentLocale)
          .single()

        if (currentData?.practice_id) {
          // Get translated slug
          const { data: translatedData } = await supabase
            .from('practice_translations')
            .select('slug')
            .eq('practice_id', currentData.practice_id)
            .eq('language', newLocale)
            .single()

          translatedSlug = translatedData?.slug || null
        }
        break
      }

      case 'services': {
        // Find service_id from current slug
        const { data: currentData } = await supabase
          .from('service_translations')
          .select('service_id')
          .eq('slug', simpleSlug)
          .eq('language', currentLocale)
          .single()

        if (currentData?.service_id) {
          // Get translated slug
          const { data: translatedData } = await supabase
            .from('service_translations')
            .select('slug')
            .eq('service_id', currentData.service_id)
            .eq('language', newLocale)
            .single()

          translatedSlug = translatedData?.slug || null
        }
        break
      }

      case 'teams': {
        // Find team_id from current slug
        const { data: currentData } = await supabase
          .from('team_translations')
          .select('team_id')
          .eq('slug', simpleSlug)
          .eq('language', currentLocale)
          .single()

        if (currentData?.team_id) {
          // Get translated slug
          const { data: translatedData } = await supabase
            .from('team_translations')
            .select('slug')
            .eq('team_id', currentData.team_id)
            .eq('language', newLocale)
            .single()

          translatedSlug = translatedData?.slug || null
        }
        break
      }

      default:
        // Unknown page type, just replace locale
        return `/${newLocale}/${pathWithoutLocale.join('/')}`
    }

    // If we found a translated slug, use it
    if (translatedSlug) {
      return `/${newLocale}/${pageType}/${translatedSlug}`
    }

    // If translation not found, redirect to the main page of that type
    // This prevents 404 errors
    return `/${newLocale}/${pageType}`
  } catch (error) {
    console.error('Error translating URL:', error)
    // On error, fallback to home page of new locale
    return `/${newLocale}`
  }
}
