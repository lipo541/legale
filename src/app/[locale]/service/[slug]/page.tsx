import { createStaticClient } from '@/lib/supabase/static'
import { notFound, permanentRedirect } from 'next/navigation'
import ServiceCategoryClient from '@/components/service/ServiceCategoryClient'
import { siteConfig, getAssetUrl } from '@/lib/config'
import { Metadata } from 'next'

// Enable Incremental Static Regeneration - revalidate every 1 hour
export const revalidate = 3600

interface PageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

// Helper function to check slug ownership and get redirect info
async function getCategoryBySlug(slug: string, locale: string) {
  const supabase = createStaticClient()
  
  // Check if slug exists in ANY language
  const { data: slugCheck } = await supabase
    .from('service_category_translations')
    .select('category_id, language, slug')
    .eq('slug', slug)
    .single()
  
  if (!slugCheck) {
    return { shouldRedirect: false, categoryId: null }
  }
  
  // If slug's language doesn't match current locale, we need to redirect
  if (slugCheck.language !== locale) {
    return { 
      shouldRedirect: true, 
      redirectLocale: slugCheck.language,
      redirectSlug: slugCheck.slug,
      categoryId: slugCheck.category_id
    }
  }
  
  return { shouldRedirect: false, categoryId: slugCheck.category_id }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: encodedSlug } = await params
  const slug = decodeURIComponent(encodedSlug)
  const supabase = createStaticClient()

  // Fetch category translation
  const { data: categoryData } = await supabase
    .from('service_category_translations')
    .select(`
      *,
      category:service_categories!inner(id, parent_id, is_active)
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (!categoryData || !categoryData.category.is_active) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }

  // Fetch all translations for hreflang
  const { data: allTranslations } = await supabase
    .from('service_category_translations')
    .select('language, slug')
    .eq('category_id', categoryData.category.id)

  const languageAlternates: { [key: string]: string } = {}
  if (allTranslations) {
    allTranslations.forEach(trans => {
      languageAlternates[trans.language] = encodeURI(
        `${siteConfig.baseUrl}/${trans.language}/service/${trans.slug}`
      )
    })
  }

  const title = categoryData.meta_title || categoryData.name
  const description = categoryData.meta_description || `${categoryData.name} - სერვისების კატეგორია Legal.ge-ზე`
  const ogTitle = categoryData.og_title || title
  const ogDescription = categoryData.og_description || description
  const ogImage = categoryData.og_image_url || getAssetUrl(siteConfig.defaultOgImage)
  const canonicalUrl = encodeURI(`${siteConfig.baseUrl}/${locale}/service/${slug}`)

  // Breadcrumb labels by locale
  const breadcrumbLabels = {
    ka: { home: 'მთავარი', categories: 'კატეგორიები' },
    en: { home: 'Home', categories: 'Categories' },
    ru: { home: 'Главная', categories: 'Категории' },
  }
  const labels = breadcrumbLabels[locale as keyof typeof breadcrumbLabels] || breadcrumbLabels.ka

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.home,
        item: `${siteConfig.baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.categories,
        item: `${siteConfig.baseUrl}/${locale}/service`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryData.name,
        item: canonicalUrl,
      },
    ],
  }

  // CollectionPage Schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Legal.ge',
      url: siteConfig.baseUrl,
    },
  }

  return {
    title: `${title} | Legal.ge`,
    description,
    // TEMPORARY: Block indexing until service category content is ready
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'Legal.ge',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    other: {
      'application/ld+json': JSON.stringify([breadcrumbSchema, collectionSchema]),
    },
  }
}

export default async function ServiceCategoryPage({ params }: PageProps) {
  const { locale, slug: encodedSlug } = await params
  const slug = decodeURIComponent(encodedSlug)
  const supabase = createStaticClient()

  // Check if slug belongs to different language - server-side redirect (308 permanent)
  const { shouldRedirect, redirectLocale, redirectSlug } = await getCategoryBySlug(slug, locale)
  
  if (shouldRedirect && redirectLocale && redirectSlug) {
    permanentRedirect(`/${redirectLocale}/service/${encodeURIComponent(redirectSlug)}`)
  }

  // Fetch category by slug with parent_id
  const { data: categoryData, error: categoryError } = await supabase
    .from('service_category_translations')
    .select(`
      *,
      category:service_categories!inner(id, parent_id, is_active)
    `)
    .eq('slug', slug)
    .eq('language', locale)
    .single()

  if (categoryError || !categoryData || !categoryData.category.is_active) {
    notFound()
  }

  // Fetch all translations for this category
  const { data: translations } = await supabase
    .from('service_category_translations')
    .select('*')
    .eq('category_id', categoryData.category.id)

  // Fetch ALL categories with translations to build hierarchy and breadcrumbs
  const { data: allCategories } = await supabase
    .from('service_categories')
    .select('id, parent_id')
    .eq('is_active', true)
    
  // Fetch all category translations for breadcrumb names
  const { data: allCategoryTranslations } = await supabase
    .from('service_category_translations')
    .select('category_id, name, slug')
    .eq('language', locale)

  // Build parent hierarchy (breadcrumbs)
  const buildBreadcrumbs = (categoryId: string): Array<{ id: string; name: string; slug: string }> => {
    const breadcrumbs: Array<{ id: string; name: string; slug: string }> = []
    let currentId: string | null = categoryId
    
    const categoryMap = new Map<string, string | null>()
    allCategories?.forEach(cat => categoryMap.set(cat.id, cat.parent_id))
    
    const translationMap = new Map<string, { name: string; slug: string }>()
    allCategoryTranslations?.forEach(t => {
      translationMap.set(t.category_id, { name: t.name, slug: t.slug })
    })
    
    while (currentId) {
      const parentId = categoryMap.get(currentId)
      if (parentId) {
        const parentTranslation = translationMap.get(parentId)
        if (parentTranslation) {
          breadcrumbs.unshift({
            id: parentId,
            name: parentTranslation.name,
            slug: parentTranslation.slug
          })
        }
        currentId = parentId
      } else {
        break
      }
    }
    
    return breadcrumbs
  }

  const parentBreadcrumbs = buildBreadcrumbs(categoryData.category.id)

  // Build category hierarchy map
  const categoryHierarchyMap = new Map<string, string | null>()
  allCategories?.forEach((cat) => {
    categoryHierarchyMap.set(cat.id, cat.parent_id)
  })

  // Recursive function to find all descendant categories
  const findAllDescendants = (parentId: string): string[] => {
    const descendants: string[] = []
    
    categoryHierarchyMap.forEach((parent, categoryId) => {
      if (parent === parentId) {
        descendants.push(categoryId)
        descendants.push(...findAllDescendants(categoryId))
      }
    })
    
    return descendants
  }

  // Get sibling categories (same parent_id as current category)
  const currentParentId = categoryData.category.parent_id
  const siblingCategories = allCategories
    ?.filter(cat => cat.parent_id === currentParentId && cat.id !== categoryData.category.id)
    .map(cat => {
      const translation = allCategoryTranslations?.find(t => t.category_id === cat.id)
      return {
        id: cat.id,
        name: translation?.name || '',
        slug: translation?.slug || ''
      }
    })
    .filter(cat => cat.name) || []

  // Get all descendant IDs for this category
  const allDescendantIds = findAllDescendants(categoryData.category.id)

  // Build subcategory map for display
  const subcategoryMap = allDescendantIds.map(catId => {
    const translation = allCategoryTranslations?.find(t => t.category_id === catId)
    const categoryInfo = allCategories?.find(c => c.id === catId)
    return {
      id: catId,
      name: translation?.name || '',
      slug: translation?.slug || '',
      parent_id: categoryInfo?.parent_id || null
    }
  })

  // Get child categories (direct children only, for filter UI)
  const childCategories = allCategories
    ?.filter(cat => cat.parent_id === categoryData.category.id)
    .map(cat => {
      const translation = allCategoryTranslations?.find(t => t.category_id === cat.id)
      return {
        id: cat.id,
        name: translation?.name || '',
        slug: translation?.slug || ''
      }
    })
    .filter(cat => cat.name) || []

  // Create array of category IDs to search: main category + all descendants
  const categoryIdsToSearch = [
    categoryData.category.id,
    ...allDescendantIds
  ]

  // Fetch services in this category AND all its descendants
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select(`
      id,
      practice_id,
      category_id,
      image_url,
      status,
      created_at,
      updated_at,
      service_translations!inner(
        language,
        title,
        slug,
        description,
        image_alt,
        reading_time
      )
    `)
    .eq('status', 'published')
    .in('category_id', categoryIdsToSearch)
    .eq('service_translations.language', locale)
    .order('created_at', { ascending: false })

  if (servicesError) {
    console.error('Error fetching services:', servicesError)
  }

  // Deduplicate services
  const uniqueServices = services ? Array.from(
    new Map(services.map(service => [service.id, service])).values()
  ) : []

  // Fetch practice info for services
  const practiceIds = [...new Set(uniqueServices.map(s => s.practice_id).filter(Boolean))]
  const { data: practices } = await supabase
    .from('practices')
    .select(`
      id,
      practice_translations!inner(title, slug, language)
    `)
    .in('id', practiceIds)
    .eq('practice_translations.language', locale)

  // Create practice map
  const practiceMap: Record<string, { title: string; slug: string }> = {}
  practices?.forEach(practice => {
    const translation = practice.practice_translations[0]
    if (translation) {
      practiceMap[practice.id] = {
        title: translation.title,
        slug: translation.slug
      }
    }
  })

  return (
    <ServiceCategoryClient
      category={{
        id: categoryData.category.id,
        name: categoryData.name,
        description: categoryData.description,
        slug: categoryData.slug,
        parentId: categoryData.category.parent_id
      }}
      services={uniqueServices.map(service => ({
        id: service.id,
        title: service.service_translations[0]?.title || '',
        slug: service.service_translations[0]?.slug || '',
        description: service.service_translations[0]?.description || '',
        imageUrl: service.image_url,
        imageAlt: service.service_translations[0]?.image_alt || '',
        readingTime: service.service_translations[0]?.reading_time || 0,
        practiceId: service.practice_id,
        categoryId: service.category_id,
        createdAt: service.created_at
      }))}
      locale={locale}
      parentBreadcrumbs={parentBreadcrumbs}
      siblingCategories={siblingCategories}
      childCategories={childCategories}
      subcategoryMap={subcategoryMap}
      practiceMap={practiceMap}
      allTranslations={translations || []}
    />
  )
}

// Generate static params for all service categories
// Using ISR: pages generated on first request, cached for 1 hour (revalidate = 3600)
// This avoids 1500+ page generation at build time (516 categories × 3 locales)
export async function generateStaticParams() {
  return []
}

// Ensure dynamic pages are allowed (not strictly static)
export const dynamicParams = true
