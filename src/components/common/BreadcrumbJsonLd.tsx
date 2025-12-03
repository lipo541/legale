import { siteConfig } from '@/lib/config'

export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

/**
 * BreadcrumbList JSON-LD Schema Component
 * 
 * Generates structured data for breadcrumb navigation according to schema.org/BreadcrumbList
 * This helps search engines understand the site hierarchy and can enable breadcrumb display in search results.
 * 
 * @example
 * <BreadcrumbJsonLd
 *   items={[
 *     { name: 'Home', url: 'https://legal.ge/ka' },
 *     { name: 'Specialists', url: 'https://legal.ge/ka/specialists' },
 *     { name: 'John Doe', url: 'https://legal.ge/ka/specialists/john-doe' }
 *   ]}
 * />
 */
export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

/**
 * Helper function to generate breadcrumb items with proper URLs
 */
export function generateBreadcrumbItems(
  locale: string,
  path: { name: string; slug?: string }[]
): BreadcrumbItem[] {
  const baseUrl = siteConfig.baseUrl
  const items: BreadcrumbItem[] = [
    {
      name: locale === 'ka' ? 'მთავარი' : locale === 'ru' ? 'Главная' : 'Home',
      url: `${baseUrl}/${locale}`,
    },
  ]

  let currentPath = `${baseUrl}/${locale}`

  path.forEach((item) => {
    if (item.slug) {
      currentPath = `${currentPath}/${item.slug}`
    }
    items.push({
      name: item.name,
      url: currentPath,
    })
  })

  return items
}
